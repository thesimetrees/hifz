import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsInt()
  @Min(0)
  harga: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  hargaCoret?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stok?: number;

  @IsString()
  @IsOptional()
  gambar?: string;

  @IsString()
  @IsOptional()
  ringkas?: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  harga?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  hargaCoret?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stok?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  terjual?: number;

  @IsString()
  @IsOptional()
  gambar?: string;

  @IsString()
  @IsOptional()
  ringkas?: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;
}
