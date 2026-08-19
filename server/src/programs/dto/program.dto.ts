import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  nama: string;

  @IsString()
  @IsNotEmpty()
  kategori: string;

  @IsString()
  @IsNotEmpty()
  jenis: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsNotEmpty()
  tutor: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  harga?: number;

  @IsString()
  @IsNotEmpty()
  deskripsi: string;

  @IsString()
  @IsOptional()
  gambar?: string;
}

export class UpdateProgramDto {
  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsString()
  @IsOptional()
  jenis?: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  tutor?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  harga?: number;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsString()
  @IsOptional()
  gambar?: string;

  @IsIn(['draf', 'terbit'])
  @IsOptional()
  status?: string;

  // struktur tema -> sub-tema -> materi, disimpan sebagai JSON
  @IsOptional()
  kurikulum?: unknown;

  // jadwal belajar: { hari[], mulai, selesai, tanggalMulai, tanggalSelesai }
  @IsOptional()
  jadwal?: unknown;
}
