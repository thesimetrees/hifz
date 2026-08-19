// Util toko — data produk kini dari API backend (/toko/products)

export const formatRupiah = (angka) => `Rp${Number(angka || 0).toLocaleString('id-ID')}`

// gambar produk disimpan sebagai daftar URL dipisah baris baru (maks 5)
export const daftarGambar = (g) =>
  String(g ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

export const gambarUtama = (g) => daftarGambar(g)[0] ?? null

export const bacaPengguna = () => {
  try {
    return JSON.parse(localStorage.getItem('hifzUser') || 'null')
  } catch {
    return null
  }
}

const KUNCI_KERANJANG = 'hifzKeranjang'

export const bacaKeranjang = () => {
  try {
    const isi = JSON.parse(localStorage.getItem(KUNCI_KERANJANG) || '[]')
    // hanya baris snapshot lengkap yang dipakai
    return isi.filter((i) => i && i.id && i.nama && typeof i.harga === 'number')
  } catch {
    return []
  }
}

export const simpanKeranjang = (isi) => {
  try {
    localStorage.setItem(KUNCI_KERANJANG, JSON.stringify(isi))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

// simpan snapshot produk agar keranjang tidak bergantung pada katalog lokal
export const tambahKeKeranjang = (produk, jumlah = 1) => {
  const isi = bacaKeranjang()
  const stok = Number(produk.stok) || 0
  const ada = isi.find((i) => i.id === produk.id)
  if (ada) {
    ada.jumlah = stok ? Math.min(ada.jumlah + jumlah, stok) : ada.jumlah + jumlah
    ada.harga = produk.harga
    ada.stok = stok
    ada.gambar = gambarUtama(produk.gambar)
  } else {
    isi.push({
      id: produk.id,
      nama: produk.nama,
      kategori: produk.kategori ?? '',
      harga: produk.harga,
      gambar: gambarUtama(produk.gambar),
      stok,
      jumlah: stok ? Math.min(jumlah, stok) : jumlah,
    })
  }
  simpanKeranjang(isi)
  return isi
}

export const simpanPesanan = (pesanan) => {
  try {
    const daftar = JSON.parse(localStorage.getItem('hifzPesananToko') || '[]')
    daftar.unshift(pesanan)
    localStorage.setItem('hifzPesananToko', JSON.stringify(daftar))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

export const bacaPesanan = () => {
  try {
    return JSON.parse(localStorage.getItem('hifzPesananToko') || '[]')
  } catch {
    return []
  }
}

/* ---- Alamat pengiriman ---- */
export const bacaAlamat = () => {
  try {
    return JSON.parse(localStorage.getItem('hifzAlamat') || '[]')
  } catch {
    return []
  }
}

export const simpanAlamat = (daftar) => {
  try {
    localStorage.setItem('hifzAlamat', JSON.stringify(daftar))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

export const alamatUtama = () => bacaAlamat().find((a) => a.utama) ?? bacaAlamat()[0] ?? null

/* ---- Ongkir berdasarkan zona kode pos (gudang: Jakarta Selatan) ---- */
export const GRATIS_ONGKIR_MIN = 250000

const ZONA_ONGKIR = [
  { cek: (kp) => /^1[0-7]/.test(kp), zona: 'Jabodetabek', tarif: 10000 },
  { cek: (kp) => /^[14]/.test(kp), zona: 'Jawa Barat & Banten', tarif: 14000 },
  { cek: (kp) => /^5/.test(kp), zona: 'Jawa Tengah & DIY', tarif: 16000 },
  { cek: (kp) => /^6/.test(kp), zona: 'Jawa Timur', tarif: 18000 },
  { cek: (kp) => /^3/.test(kp), zona: 'Sumatera bagian selatan', tarif: 22000 },
  { cek: (kp) => /^2/.test(kp), zona: 'Sumatera bagian utara', tarif: 24000 },
  { cek: (kp) => /^8/.test(kp), zona: 'Bali & Nusa Tenggara', tarif: 26000 },
  { cek: (kp) => /^7/.test(kp), zona: 'Kalimantan', tarif: 28000 },
  { cek: (kp) => /^9/.test(kp), zona: 'Sulawesi, Maluku & Papua', tarif: 34000 },
]

export const hitungOngkir = (kodePos, subtotal = 0) => {
  if (subtotal >= GRATIS_ONGKIR_MIN) return { tarif: 0, zona: 'Gratis ongkir' }
  const kp = String(kodePos || '').trim()
  if (!/^\d{5}$/.test(kp)) return { tarif: null, zona: null }
  const z = ZONA_ONGKIR.find((x) => x.cek(kp))
  return z ? { tarif: z.tarif, zona: z.zona } : { tarif: 20000, zona: 'Wilayah lainnya' }
}
