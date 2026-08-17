import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  judul: string;

  @IsString()
  @IsNotEmpty()
  kategori: string;

  @IsString()
  @IsOptional()
  gambar?: string;

  @IsString()
  @IsOptional()
  ringkas?: string;

  @IsString()
  @IsOptional()
  penulis?: string;

  @IsString()
  @IsOptional()
  konten?: string;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  judul?: string;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsString()
  @IsOptional()
  gambar?: string;

  @IsString()
  @IsOptional()
  ringkas?: string;

  @IsString()
  @IsOptional()
  penulis?: string;

  @IsString()
  @IsOptional()
  konten?: string;

  @IsIn(['draf', 'terbit'])
  @IsOptional()
  status?: string;
}
