import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(order: Order) {
    return {
      ...order,
      programIds: order.programIds
        ? (JSON.parse(order.programIds) as string[])
        : undefined,
      tanggal: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(order.createdAt),
    };
  }

  async create(dto: CreateOrderDto) {
    const invoice = `INV-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000),
    )}`;
    const { programIds, ...data } = dto;
    const order = await this.prisma.order.create({
      data: {
        ...data,
        invoice,
        programIds: programIds?.length ? JSON.stringify(programIds) : undefined,
      },
    });
    return this.serialize(order);
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.serialize(o));
  }

  async findOne(invoice: string) {
    const order = await this.prisma.order.findUnique({ where: { invoice } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return this.serialize(order);
  }

  async updateStatus(invoice: string, status: string) {
    const order = await this.prisma.order
      .update({ where: { invoice }, data: { status } })
      .catch(() => {
        throw new NotFoundException('Pesanan tidak ditemukan');
      });
    if (status === 'Lunas') await this.daftarkanPeserta(order);
    return this.serialize(order);
  }

  // rekam peserta program saat pembayaran dikonfirmasi lunas
  private async daftarkanPeserta(order: Order) {
    if (!order.email || !order.programIds) return;
    let ids: string[] = [];
    try {
      ids = JSON.parse(order.programIds) as string[];
    } catch {
      return;
    }
    for (const programId of ids) {
      await this.prisma.enrollment.upsert({
        where: { email_programId: { email: order.email, programId } },
        update: {},
        create: { email: order.email, programId },
      });
    }
  }

  // peta programId -> daftar email peserta (dibaca dashboard guru)
  async pesertaSemua() {
    const rows = await this.prisma.enrollment.findMany();
    const peta: Record<string, string[]> = {};
    for (const r of rows) (peta[r.programId] ??= []).push(r.email);
    return peta;
  }

  // Admin: lampirkan invoice (data URL) dan/atau keterangan untuk customer
  async updateAdmin(
    invoice: string,
    data: { invoiceFile?: string; keterangan?: string },
  ) {
    const order = await this.prisma.order
      .update({ where: { invoice }, data })
      .catch(() => {
        throw new NotFoundException('Pesanan tidak ditemukan');
      });
    return this.serialize(order);
  }
}
