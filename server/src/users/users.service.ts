import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type ProfilInput = {
  nama?: string;
  email?: string;
  password?: string;
  peran?: string;
  telepon?: string;
  alamat?: string;
  bio?: string;
  foto?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize<T extends { password?: string }>(user: T) {
    const { password: _password, ...rest } = user;
    return rest;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return this.sanitize(user);
  }

  async create(input: ProfilInput & { nama: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('Email sudah terdaftar');
    const user = await this.prisma.user.create({
      data: {
        nama: input.nama,
        email: input.email,
        password: await bcrypt.hash(input.password, 12),
        peran: input.peran ?? 'customer',
        telepon: input.telepon ?? null,
        alamat: input.alamat ?? null,
        bio: input.bio ?? null,
        foto: input.foto ?? null,
      },
    });
    return this.sanitize(user);
  }

  async update(id: string, input: ProfilInput) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    if (input.email && input.email !== user.email) {
      const dipakai = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (dipakai) throw new ConflictException('Email sudah terdaftar');
    }
    const data: Record<string, unknown> = {};
    for (const k of ['nama', 'email', 'peran', 'telepon', 'alamat', 'bio', 'foto'] as const) {
      if (input[k] !== undefined) data[k] = input[k];
    }
    if (input.password) data.password = await bcrypt.hash(input.password, 12);
    const updated = await this.prisma.user.update({ where: { id }, data });
    return this.sanitize(updated);
  }

  async updatePeran(id: string, peran: string) {
    const user = await this.prisma.user
      .update({ where: { id }, data: { peran } })
      .catch(() => {
        throw new NotFoundException('Pengguna tidak ditemukan');
      });
    return this.sanitize(user);
  }

  async toggleAktif(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { aktif: !user.aktif },
    });
    return this.sanitize(updated);
  }

  // Pelamar guru dari formulir publik — password acak, diganti saat diterima
  async createPelamar(input: {
    nama: string;
    email: string;
    telepon?: string;
    alamat?: string;
    bio?: string;
  }) {
    const profil = {
      telepon: input.telepon || null,
      alamat: input.alamat || null,
      bio: input.bio || null,
    };
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      // Sinkronkan profil dari formulir tanpa menimpa data yang sudah ada
      const data: Record<string, string> = {};
      for (const k of ['telepon', 'alamat', 'bio'] as const) {
        if (profil[k] && !existing[k]) data[k] = profil[k];
      }
      const user = Object.keys(data).length
        ? await this.prisma.user.update({ where: { id: existing.id }, data })
        : existing;
      return this.sanitize(user);
    }
    const user = await this.prisma.user.create({
      data: {
        nama: input.nama,
        email: input.email,
        peran: 'pelamar',
        password: await bcrypt.hash(randomBytes(16).toString('hex'), 12),
        ...profil,
      },
    });
    return this.sanitize(user);
  }
}
