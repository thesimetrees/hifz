import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto, UpdateOrderAdminDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('toko/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Publik — checkout toko
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // Publik — peserta program per programId (dibaca dashboard guru)
  @Get('peserta/semua')
  peserta() {
    return this.ordersService.pesertaSemua();
  }

  // Publik — cek status pesanan (sinkron dashboard pembeli)
  @Get(':invoice')
  findOne(@Param('invoice') invoice: string) {
    return this.ordersService.findOne(invoice);
  }

  // ----- Admin -----

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.ordersService.findAll();
  }

  @Patch(':invoice/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('invoice') invoice: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(invoice, dto.status);
  }

  @Patch(':invoice/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAdmin(
    @Param('invoice') invoice: string,
    @Body() dto: UpdateOrderAdminDto,
  ) {
    return this.ordersService.updateAdmin(invoice, dto);
  }
}
