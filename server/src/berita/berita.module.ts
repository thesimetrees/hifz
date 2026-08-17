import { Module } from '@nestjs/common';
import { BeritaController } from './berita.controller';
import { BeritaService } from './berita.service';

@Module({
  controllers: [BeritaController],
  providers: [BeritaService],
})
export class BeritaModule {}
