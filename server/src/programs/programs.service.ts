import { Injectable, NotFoundException } from '@nestjs/common';
import { Program } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(program: Program) {
    let kurikulum: unknown = [];
    try {
      kurikulum = JSON.parse(program.kurikulum);
    } catch {
      kurikulum = [];
    }
    let jadwal: unknown = null;
    try {
      jadwal = JSON.parse(program.jadwal);
    } catch {
      jadwal = null;
    }
    return { ...program, kurikulum, jadwal };
  }

  async findPublished() {
    const list = await this.prisma.program.findMany({
      where: { status: 'terbit' },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => this.serialize(p));
  }

  async findAllAdmin() {
    const list = await this.prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => this.serialize(p));
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program tidak ditemukan');
    return this.serialize(program);
  }

  async create(dto: CreateProgramDto) {
    const program = await this.prisma.program.create({
      data: { ...dto, harga: dto.harga ?? 0 },
    });
    return this.serialize(program);
  }

  async update(id: string, dto: UpdateProgramDto) {
    const { kurikulum, jadwal, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (kurikulum !== undefined) data.kurikulum = JSON.stringify(kurikulum);
    if (jadwal !== undefined) data.jadwal = JSON.stringify(jadwal);
    const program = await this.prisma.program
      .update({ where: { id }, data })
      .catch(() => {
        throw new NotFoundException('Program tidak ditemukan');
      });
    return this.serialize(program);
  }

  async remove(id: string) {
    await this.prisma.program.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Program tidak ditemukan');
    });
    return { ok: true };
  }
}
