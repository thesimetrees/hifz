-- Kolom detail alamat terstruktur (provinsi/kota/kecamatan/kelurahan/kode pos/jalan)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "alamatDetail" JSONB;
