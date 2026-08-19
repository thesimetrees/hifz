import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { NotifikasiService } from './notifikasi.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifikasi: NotifikasiService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('unread') unread?: string) {
    return this.notifikasi.listMilik(user.sub, unread === 'true');
  }

  @Patch('read-all')
  readAll(@CurrentUser() user: JwtPayload) {
    return this.notifikasi.tandaiSemuaDibaca(user.sub);
  }

  @Patch(':id/read')
  read(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notifikasi.tandaiDibaca(user.sub, id);
  }
}
