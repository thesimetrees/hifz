import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.product.findMany({
      where: { aktif: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, stok: dto.stok ?? 0 },
    });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product
      .update({ where: { id }, data: dto })
      .catch(() => {
        throw new NotFoundException('Produk tidak ditemukan');
      });
  }

  async toggleAktif(id: string) {
    const produk = await this.prisma.product.findUnique({ where: { id } });
    if (!produk) throw new NotFoundException('Produk tidak ditemukan');
    return this.prisma.product.update({
      where: { id },
      data: { aktif: !produk.aktif },
    });
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Produk tidak ditemukan');
    });
    return { ok: true };
  }
}
