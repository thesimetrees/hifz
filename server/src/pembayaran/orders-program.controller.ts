import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProgramOrderDto, SubmitProofDto } from './dto/pembayaran.dto';
import type { BerkasBukti } from './pembayaran.service';
import { PembayaranService } from './pembayaran.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersProgramController {
  constructor(private readonly pembayaran: PembayaranService) {}

  @Post()
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CreateProgramOrderDto) {
    return this.pembayaran.checkout(user.sub, dto.programId);
  }

  @Get()
  daftarMilik(@CurrentUser() user: JwtPayload) {
    return this.pembayaran.daftarMilik(user.sub);
  }

  @Get(':id/qris')
  qris(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.qris(user.sub, id);
  }

  @Get(':id/status')
  status(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.status(user.sub, id);
  }

  @Post(':id/cancel')
  batalkan(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.batalkan(user.sub, id);
  }

  @Post(':id/payment-proof')
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadBukti(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitProofDto,
    @UploadedFile() file?: BerkasBukti,
  ) {
    return this.pembayaran.uploadBukti(
      user.sub,
      id,
      dto.senderName,
      dto.senderBank,
      file,
    );
  }

  // Pemilik order melihat bukti bayarnya sendiri
  @Get(':id/proof-image')
  async gambarBukti(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
    @Query() _q: Record<string, never>,
  ) {
    const { path, mime } = await this.pembayaran.pathGambarBukti(
      id,
      user.sub,
      user.role === 'admin',
    );
    res.setHeader('Content-Type', mime);
    res.sendFile(path);
  }
}
