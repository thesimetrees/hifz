import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotifikasiService {
  constructor(private readonly prisma: PrismaService) {}

  async listMilik(userId: string, hanyaBelumDibaca: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(hanyaBelumDibaca ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async tandaiDibaca(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notifikasi tidak ditemukan');
    if (notif.userId !== userId)
      throw new ForbiddenException('Bukan notifikasi Anda');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async tandaiSemuaDibaca(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
