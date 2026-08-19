import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, ProgramOrder } from '@prisma/client';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  BATAS_ATTEMPT,
  JAM_WINDOW_UPLOAD_ULANG,
  MENIT_EXPIRED_PENDING,
  MENIT_LOCK_ADMIN,
  ORDER_AKTIF,
  StatusOrder,
  TRANSISI,
} from './status-order';

export interface BerkasBukti {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_UKURAN_BUKTI = 5 * 1024 * 1024; // 5 MB

const DIREKTORI_BUKTI = resolve(process.cwd(), 'uploads', 'proofs');

const SYSTEM_ACTOR = 'system';

function cekMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return { mime: 'image/png', ext: 'png' };
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return { mime: 'image/webp', ext: 'webp' };
  return null;
}

@Injectable()
export class PembayaranService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PembayaranService.name);
  private sweeper?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.sweeper = setInterval(() => {
      this.jalankanSweeper().catch((e) =>
        this.logger.error('Sweeper gagal', e instanceof Error ? e.stack : e),
      );
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  // ---- Transisi terjaga (optimistic lock + guard state machine) ----
  private async transisi(
    tx: Prisma.TransactionClient,
    order: Pick<ProgramOrder, 'id' | 'status' | 'statusVersion'>,
    ke: StatusOrder,
    data: Prisma.ProgramOrderUpdateManyMutationInput = {},
  ) {
    if (!TRANSISI[order.status]?.includes(ke)) {
      throw new ConflictException(
        `Transisi ${order.status} -> ${ke} tidak diizinkan`,
      );
    }
    const hasil = await tx.programOrder.updateMany({
      where: {
        id: order.id,
        status: order.status,
        statusVersion: order.statusVersion,
      },
      data: { ...data, status: ke, statusVersion: { increment: 1 } },
    });
    if (hasil.count === 0) {
      throw new ConflictException(
        'Status order sudah berubah, silakan muat ulang',
      );
    }
  }

  private async catatAudit(
    tx: Prisma.TransactionClient,
    input: {
      actorId: string;
      orderId: string;
      action: string;
      fromState: string;
      toState: string;
      reason?: string;
    },
  ) {
    await tx.auditLog.create({ data: input });
  }

  private async notifikasiAdmin(
    tx: Prisma.TransactionClient,
    orderId: string,
    type: string,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    const admins = await tx.user.findMany({
      where: { peran: 'admin', aktif: true },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        orderId,
        type,
        message,
        meta: JSON.stringify(meta),
      })),
    });
  }

  private async notifikasiCustomer(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    type: string,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    await tx.notification.create({
      data: { userId, orderId, type, message, meta: JSON.stringify(meta) },
    });
  }

  private async ambilOrderMilik(orderId: string, userId: string) {
    const order = await this.prisma.programOrder.findUnique({
      where: { id: orderId },
      include: { program: { select: { id: true, nama: true, gambar: true } } },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.userId !== userId)
      throw new ForbiddenException('Bukan order Anda');
    return order;
  }

  // ================= CUSTOMER =================

  async checkout(userId: string, programId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program || program.status !== 'terbit')
      throw new NotFoundException('Program tidak ditemukan');
    if (program.harga <= 0)
      throw new BadRequestException('Program ini gratis, tidak perlu checkout');

    // Idempoten: pakai kembali order aktif untuk program yang sama
    const aktif = await this.prisma.programOrder.findFirst({
      where: { userId, programId, status: { in: ORDER_AKTIF } },
    });
    if (aktif) return this.ringkasOrder(aktif, program.nama);

    const sudahLunas = await this.prisma.programOrder.findFirst({
      where: { userId, programId, status: StatusOrder.CONFIRMED },
    });
    if (sudahLunas)
      throw new ConflictException('Anda sudah terdaftar di program ini');

    // Kode unik 1-999 yang tidak dipakai order pending lain
    const dipakai = new Set(
      (
        await this.prisma.programOrder.findMany({
          where: { status: { in: ORDER_AKTIF } },
          select: { amountUnique: true },
        })
      ).map((o) => o.amountUnique),
    );
    let amountUnique = 0;
    for (let i = 0; i < 25; i++) {
      const kandidat = Math.floor(Math.random() * 999) + 1;
      if (!dipakai.has(kandidat)) {
        amountUnique = kandidat;
        break;
      }
    }

    const tanggal = new Date();
    const ymd = `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, '0')}${String(tanggal.getDate()).padStart(2, '0')}`;
    const invoice = `INV-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const order = await this.prisma.programOrder.create({
      data: {
        invoice,
        userId,
        programId,
        amountBase: program.harga,
        amountUnique,
        amountTotal: program.harga + amountUnique,
        expiresAt: new Date(Date.now() + MENIT_EXPIRED_PENDING * 60_000),
      },
    });
    return this.ringkasOrder(order, program.nama);
  }

  private ringkasOrder(order: ProgramOrder, namaProgram?: string) {
    return {
      id: order.id,
      invoice: order.invoice,
      programId: order.programId,
      namaProgram,
      amountBase: order.amountBase,
      amountUnique: order.amountUnique,
      amountTotal: order.amountTotal,
      status: order.status,
      rejectReason: order.rejectReason,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    };
  }

  async qris(userId: string, orderId: string) {
    const order = await this.ambilOrderMilik(orderId, userId);
    if (order.status === StatusOrder.EXPIRED)
      throw new GoneException('Order sudah kedaluwarsa');
    if (order.status !== StatusOrder.PENDING_PAYMENT)
      throw new ConflictException(`Order berstatus ${order.status}`);
    if (order.expiresAt.getTime() < Date.now())
      throw new GoneException('Order sudah kedaluwarsa');
    return {
      invoice: order.invoice,
      namaProgram: order.program.nama,
      amountTotal: order.amountTotal,
      amountUnique: order.amountUnique,
      expiresAt: order.expiresAt,
      qrisImage: process.env.QRIS_IMAGE ?? '/pay/qris.svg',
      instruksi:
        'Scan QRIS lalu bayar tepat sebesar nominal total (termasuk kode unik) agar verifikasi cepat.',
    };
  }

  async status(userId: string, orderId: string) {
    const order = await this.ambilOrderMilik(orderId, userId);
    const jumlahAttempt = await this.prisma.paymentProof.count({
      where: { orderId },
    });
    return {
      ...this.ringkasOrder(order, order.program.nama),
      attempt: jumlahAttempt,
      sisaAttempt: Math.max(0, BATAS_ATTEMPT - jumlahAttempt),
      bolehUploadUlang:
        order.status === StatusOrder.REJECTED &&
        jumlahAttempt < BATAS_ATTEMPT &&
        order.expiresAt.getTime() > Date.now(),
    };
  }

  async daftarMilik(userId: string) {
    const orders = await this.prisma.programOrder.findMany({
      where: { userId },
      include: { program: { select: { nama: true, gambar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
      ...this.ringkasOrder(o, o.program.nama),
      gambarProgram: o.program.gambar,
    }));
  }

  async batalkan(userId: string, orderId: string) {
    const order = await this.ambilOrderMilik(orderId, userId);
    await this.prisma.$transaction(async (tx) => {
      await this.transisi(tx, order, StatusOrder.CANCELLED);
      await this.catatAudit(tx, {
        actorId: userId,
        orderId: order.id,
        action: 'cancel',
        fromState: order.status,
        toState: StatusOrder.CANCELLED,
      });
    });
    return { ok: true, status: StatusOrder.CANCELLED };
  }

  async uploadBukti(
    userId: string,
    orderId: string,
    senderName: string,
    senderBank: string | undefined,
    file: BerkasBukti | undefined,
  ) {
    if (!file) throw new BadRequestException('Gambar bukti wajib diunggah');
    if (file.size > MAX_UKURAN_BUKTI)
      throw new BadRequestException('Ukuran gambar maksimal 5 MB');
    const magic = cekMagicBytes(file.buffer);
    if (!magic)
      throw new UnprocessableEntityException(
        'File harus gambar JPG, PNG, atau WebP asli',
      );

    const order = await this.ambilOrderMilik(orderId, userId);
    const bolehUpload =
      order.status === StatusOrder.PENDING_PAYMENT ||
      order.status === StatusOrder.REJECTED;
    if (!bolehUpload)
      throw new ConflictException(`Order berstatus ${order.status}`);
    if (order.expiresAt.getTime() < Date.now())
      throw new GoneException('Order sudah kedaluwarsa');

    const jumlahAttempt = await this.prisma.paymentProof.count({
      where: { orderId: order.id },
    });
    if (jumlahAttempt >= BATAS_ATTEMPT)
      throw new ConflictException(
        'Batas upload bukti tercapai, silakan hubungi admin',
      );

    // Simpan file di direktori privat (di luar folder statis publik)
    if (!existsSync(DIREKTORI_BUKTI))
      await mkdir(DIREKTORI_BUKTI, { recursive: true });
    const namaFile = `${randomBytes(16).toString('hex')}.${magic.ext}`;
    await writeFile(join(DIREKTORI_BUKTI, namaFile), file.buffer);

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.updateMany({
        where: { orderId: order.id, status: 'active' },
        data: { status: 'superseded' },
      });
      // Unique (orderId, attempt) menolak double-submit paralel
      await tx.paymentProof.create({
        data: {
          orderId: order.id,
          attempt: jumlahAttempt + 1,
          senderName,
          senderBank,
          imagePath: namaFile,
          imageMime: magic.mime,
          imageSize: file.size,
        },
      });
      await this.transisi(tx, order, StatusOrder.WAITING_CONFIRMATION, {
        rejectReason: null,
      });
      await this.notifikasiAdmin(
        tx,
        order.id,
        'new_payment_proof',
        `Bukti bayar baru untuk ${order.invoice} (${order.program.nama}) a.n. ${senderName}.`,
        { invoice: order.invoice, attempt: jumlahAttempt + 1 },
      );
    });

    return { ok: true, status: StatusOrder.WAITING_CONFIRMATION };
  }

  // ================= ADMIN =================

  async adminList(status: string | undefined, page: number, limit: number) {
    const where = status ? { status } : {};
    const [total, data] = await this.prisma.$transaction([
      this.prisma.programOrder.count({ where }),
      this.prisma.programOrder.findMany({
        where,
        include: {
          user: { select: { id: true, nama: true, email: true } },
          program: { select: { id: true, nama: true } },
          proofs: {
            where: { status: 'active' },
            orderBy: { attempt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      total,
      page,
      limit,
      data: data.map((o) => ({
        id: o.id,
        invoice: o.invoice,
        customer: o.user,
        program: o.program,
        amountTotal: o.amountTotal,
        status: o.status,
        lockedById: o.lockedById,
        buktiTerbaru: o.proofs[0]
          ? {
              senderName: o.proofs[0].senderName,
              attempt: o.proofs[0].attempt,
              uploadedAt: o.proofs[0].createdAt,
            }
          : null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  }

  async adminDetail(orderId: string) {
    const order = await this.prisma.programOrder.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, nama: true, email: true, telepon: true } },
        program: { select: { id: true, nama: true, harga: true } },
        proofs: { orderBy: { attempt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    const audit = await this.prisma.auditLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return { ...order, audit };
  }

  async adminLock(adminId: string, orderId: string) {
    const order = await this.prisma.programOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.status === StatusOrder.PROCESSING) {
      if (order.lockedById === adminId) return { ok: true, lockedBy: adminId };
      throw new ConflictException('Order sedang diproses admin lain');
    }
    await this.prisma.$transaction(async (tx) => {
      await this.transisi(tx, order, StatusOrder.PROCESSING, {
        lockedById: adminId,
        lockedAt: new Date(),
      });
      await this.catatAudit(tx, {
        actorId: adminId,
        orderId: order.id,
        action: 'lock',
        fromState: order.status,
        toState: StatusOrder.PROCESSING,
      });
    });
    return { ok: true, lockedBy: adminId };
  }

  private async ambilOrderTerkunci(adminId: string, orderId: string) {
    const order = await this.prisma.programOrder.findUnique({
      where: { id: orderId },
      include: { program: { select: { id: true, nama: true } } },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.status !== StatusOrder.PROCESSING)
      throw new ConflictException('Order belum dikunci (lock) untuk diproses');
    if (order.lockedById !== adminId)
      throw new ForbiddenException('Order dikunci admin lain');
    return order;
  }

  async adminUnlock(adminId: string, orderId: string) {
    const order = await this.ambilOrderTerkunci(adminId, orderId);
    await this.prisma.$transaction(async (tx) => {
      await this.transisi(tx, order, StatusOrder.WAITING_CONFIRMATION, {
        lockedById: null,
        lockedAt: null,
      });
      await this.catatAudit(tx, {
        actorId: adminId,
        orderId: order.id,
        action: 'unlock',
        fromState: StatusOrder.PROCESSING,
        toState: StatusOrder.WAITING_CONFIRMATION,
      });
    });
    return { ok: true };
  }

  async adminApprove(adminId: string, orderId: string) {
    const order = await this.ambilOrderTerkunci(adminId, orderId);
    await this.prisma.$transaction(async (tx) => {
      await this.transisi(tx, order, StatusOrder.CONFIRMED, {
        confirmedAt: new Date(),
        lockedById: null,
        lockedAt: null,
      });
      // Aktivasi program dalam transaksi yang sama
      await tx.program.update({
        where: { id: order.programId },
        data: { peserta: { increment: 1 } },
      });
      await this.catatAudit(tx, {
        actorId: adminId,
        orderId: order.id,
        action: 'approve',
        fromState: StatusOrder.PROCESSING,
        toState: StatusOrder.CONFIRMED,
      });
      await this.notifikasiCustomer(
        tx,
        order.userId,
        order.id,
        'payment_confirmed',
        `Pembayaran ${order.invoice} dikonfirmasi. Program ${order.program.nama} sudah aktif.`,
        { invoice: order.invoice },
      );
    });
    return { ok: true, status: StatusOrder.CONFIRMED };
  }

  async adminReject(adminId: string, orderId: string, reason: string) {
    const order = await this.ambilOrderTerkunci(adminId, orderId);
    const jumlahAttempt = await this.prisma.paymentProof.count({
      where: { orderId: order.id },
    });
    const sisa = Math.max(0, BATAS_ATTEMPT - jumlahAttempt);
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.updateMany({
        where: { orderId: order.id, status: 'active' },
        data: { status: 'rejected' },
      });
      await this.transisi(tx, order, StatusOrder.REJECTED, {
        rejectReason: reason,
        lockedById: null,
        lockedAt: null,
        // Window upload ulang 24 jam
        expiresAt: new Date(
          Date.now() + JAM_WINDOW_UPLOAD_ULANG * 3_600_000,
        ),
      });
      await this.catatAudit(tx, {
        actorId: adminId,
        orderId: order.id,
        action: 'reject',
        fromState: StatusOrder.PROCESSING,
        toState: StatusOrder.REJECTED,
        reason,
      });
      await this.notifikasiCustomer(
        tx,
        order.userId,
        order.id,
        'payment_rejected',
        `Bukti pembayaran ${order.invoice} ditolak: ${reason}.` +
          (sisa > 0
            ? ` Silakan upload ulang (sisa ${sisa} kesempatan).`
            : ' Batas upload tercapai, silakan hubungi admin.'),
        { invoice: order.invoice, reason, sisaAttempt: sisa },
      );
    });
    return { ok: true, status: StatusOrder.REJECTED };
  }

  // Path absolut gambar bukti, setelah cek otorisasi (admin atau pemilik order)
  async pathGambarBukti(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.programOrder.findUnique({
      where: { id: orderId },
      include: {
        proofs: { where: { status: { not: 'superseded' } }, orderBy: { attempt: 'desc' }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (!isAdmin && order.userId !== userId)
      throw new ForbiddenException('Bukan order Anda');
    const proof = order.proofs[0];
    if (!proof) throw new NotFoundException('Belum ada bukti bayar');
    const path = join(DIREKTORI_BUKTI, proof.imagePath);
    if (!existsSync(path))
      throw new NotFoundException('File bukti tidak ditemukan');
    return { path, mime: proof.imageMime };
  }

  // ================= SWEEPER (cron ringan tiap 60 detik) =================

  private async jalankanSweeper() {
    const sekarang = new Date();

    // 1) PENDING_PAYMENT / REJECTED lewat expiresAt -> EXPIRED
    const kedaluwarsa = await this.prisma.programOrder.findMany({
      where: {
        status: { in: [StatusOrder.PENDING_PAYMENT, StatusOrder.REJECTED] },
        expiresAt: { lt: sekarang },
      },
      take: 100,
    });
    for (const order of kedaluwarsa) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await this.transisi(tx, order, StatusOrder.EXPIRED);
          await this.catatAudit(tx, {
            actorId: SYSTEM_ACTOR,
            orderId: order.id,
            action: 'auto_expire',
            fromState: order.status,
            toState: StatusOrder.EXPIRED,
          });
          await this.notifikasiCustomer(
            tx,
            order.userId,
            order.id,
            'order_expired',
            `Order ${order.invoice} kedaluwarsa. Silakan checkout ulang.`,
            { invoice: order.invoice },
          );
        });
      } catch {
        // kalah race dengan upload bukti — biarkan, guard atomik yang memutuskan
      }
    }

    // 2) PROCESSING dengan lock basi -> kembali WAITING_CONFIRMATION
    const lockBasi = await this.prisma.programOrder.findMany({
      where: {
        status: StatusOrder.PROCESSING,
        lockedAt: { lt: new Date(Date.now() - MENIT_LOCK_ADMIN * 60_000) },
      },
      take: 100,
    });
    for (const order of lockBasi) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await this.transisi(tx, order, StatusOrder.WAITING_CONFIRMATION, {
            lockedById: null,
            lockedAt: null,
          });
          await this.catatAudit(tx, {
            actorId: SYSTEM_ACTOR,
            orderId: order.id,
            action: 'auto_unlock',
            fromState: StatusOrder.PROCESSING,
            toState: StatusOrder.WAITING_CONFIRMATION,
          });
        });
      } catch {
        // sudah diproses admin — aman diabaikan
      }
    }
  }
}
