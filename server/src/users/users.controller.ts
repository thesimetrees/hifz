import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';

class UpdatePeranDto {
  @IsIn(['admin', 'tutor', 'customer', 'pelamar'])
  peran: string;
}

class CreatePelamarDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telepon?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsIn(['admin', 'tutor', 'customer', 'pelamar'])
  peran?: string;

  @IsOptional()
  @IsString()
  telepon?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  foto?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nama?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['admin', 'tutor', 'customer', 'pelamar'])
  peran?: string;

  @IsOptional()
  @IsString()
  telepon?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  foto?: string;
}

class FotoDto {
  @IsString()
  @IsNotEmpty()
  foto: string;
}

class ProfilSayaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nama?: string;

  @IsOptional()
  @IsString()
  telepon?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Publik — pendaftaran pelamar guru
  @Post('pelamar')
  createPelamar(@Body() dto: CreatePelamarDto) {
    return this.usersService.createPelamar(dto);
  }

  // Semua pengguna login — ubah foto profil sendiri
  @Patch('me/foto')
  @UseGuards(JwtAuthGuard)
  updateFotoSendiri(@CurrentUser() user: JwtPayload, @Body() dto: FotoDto) {
    return this.usersService.update(user.sub, { foto: dto.foto });
  }

  // Semua pengguna login — lengkapi profil sendiri
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfilSendiri(@CurrentUser() user: JwtPayload, @Body() dto: ProfilSayaDto) {
    return this.usersService.update(user.sub, dto);
  }

  // ----- Admin -----

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/peran')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updatePeran(@Param('id') id: string, @Body() dto: UpdatePeranDto) {
    return this.usersService.updatePeran(id, dto.peran);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  toggleAktif(@Param('id') id: string) {
    return this.usersService.toggleAktif(id);
  }
}
