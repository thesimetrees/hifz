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
    const order = await this.prisma.order.create({
      data: { ...dto, invoice },
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
    return this.serialize(order);
  }
}
