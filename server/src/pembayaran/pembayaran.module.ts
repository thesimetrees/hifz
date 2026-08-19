import { Module } from '@nestjs/common';
import { AdminOrdersController } from './admin-orders.controller';
import { NotificationsController } from './notifications.controller';
import { NotifikasiService } from './notifikasi.service';
import { OrdersProgramController } from './orders-program.controller';
import { PembayaranService } from './pembayaran.service';

@Module({
  controllers: [
    OrdersProgramController,
    AdminOrdersController,
    NotificationsController,
  ],
  providers: [PembayaranService, NotifikasiService],
})
export class PembayaranModule {}
