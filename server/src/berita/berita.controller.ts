import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BeritaService } from './berita.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Controller('berita')
export class BeritaController {
  constructor(private readonly beritaService: BeritaService) {}

  // Publik — berita terbit
  @Get()
  findPublished() {
    return this.beritaService.findPublished();
  }

  // ----- Admin -----

  @Get('admin/semua')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAllAdmin() {
    return this.beritaService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreatePostDto) {
    return this.beritaService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.beritaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.beritaService.remove(id);
  }
}
