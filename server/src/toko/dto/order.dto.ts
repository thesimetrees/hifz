import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
  email?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  programIds?: string[];

  @IsString()
  @IsOptional()
  alamat?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(['Menunggu', 'Lunas', 'Dibatalkan'])
  status: string;
}

export class UpdateOrderAdminDto {
  @IsString()
  @IsOptional()
  invoiceFile?: string;

  @IsString()
  @IsOptional()
  keterangan?: string;
}
