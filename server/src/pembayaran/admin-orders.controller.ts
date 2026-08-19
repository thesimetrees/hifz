import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AdminListOrdersDto, RejectOrderDto } from './dto/pembayaran.dto';
import { PembayaranService } from './pembayaran.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly pembayaran: PembayaranService) {}

  @Get()
  list(@Query() q: AdminListOrdersDto) {
    return this.pembayaran.adminList(q.status, q.page ?? 1, q.limit ?? 20);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.pembayaran.adminDetail(id);
  }

  @Get(':id/proof-image')
  async gambarBukti(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { path, mime } = await this.pembayaran.pathGambarBukti(
      id,
      user.sub,
      true,
    );
    res.setHeader('Content-Type', mime);
    res.sendFile(path);
  }

  @Post(':id/lock')
  lock(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.adminLock(user.sub, id);
  }

  @Post(':id/unlock')
  unlock(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.adminUnlock(user.sub, id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.pembayaran.adminApprove(user.sub, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
  ) {
    return this.pembayaran.adminReject(user.sub, id, dto.reason);
  }
}
