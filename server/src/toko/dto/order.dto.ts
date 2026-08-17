import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  item: string;

  @IsString()
  @IsNotEmpty()
  metode: string;

  @IsInt()
  @Min(0)
  total: number;

  @IsIn(['toko', 'program'])
  @IsOptional()
  jenis?: string;

  @IsString()
  @IsNotEmpty()
  penerima: string;

  @IsString()
  @IsOptional()
  alamat?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(['Menunggu', 'Lunas', 'Dibatalkan'])
  status: string;
}
