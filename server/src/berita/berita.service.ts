import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class BeritaService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(post: Post) {
    return {
      ...post,
      tanggal: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(post.createdAt),
    };
  }

  async findPublished() {
    const posts = await this.prisma.post.findMany({
      where: { status: 'terbit' },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.serialize(p));
  }

  async findAllAdmin() {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.serialize(p));
  }

  async create(dto: CreatePostDto) {
    const post = await this.prisma.post.create({ data: dto });
    return this.serialize(post);
  }

  async update(id: string, dto: UpdatePostDto) {
    const post = await this.prisma.post
      .update({ where: { id }, data: dto })
      .catch(() => {
        throw new NotFoundException('Berita tidak ditemukan');
      });
    return this.serialize(post);
  }

  async remove(id: string) {
    await this.prisma.post.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Berita tidak ditemukan');
    });
    return { ok: true };
  }
}
