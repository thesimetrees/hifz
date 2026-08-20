// Konfigurasi & lapisan data Hifz — tanpa data contoh.
// Seluruh data nyata dikelola di Supabase lewat dashboard super admin.

export const kategoriProgram = ['Qur\u2019an Journey', 'Islamic Deeper', 'Turats', 'Arabic & TOAFL Prep']
export const jenisProgram = ['Daily', 'Short Course', 'Bootcamp', 'Private']
export const modeProgram = ['Online', 'Offline', 'Hibrida']
export const tingkatProgram = ['Pemula', 'Menengah', 'Lanjut']
export const statusProgram = ['Draf', 'Terbit']

export const jenisPembelajaran = [
  { id: 'video', label: 'Video' },
  { id: 'dokumen', label: 'Dokumen' },
  { id: 'kuis', label: 'Kuis' },
  { id: 'sesi-online', label: 'Sesi online' },
  { id: 'sesi-offline', label: 'Sesi offline' },
]

export const labelTipe = (id) => jenisPembelajaran.find((t) => t.id === id)?.label ?? id

/* Ambil ID video dari berbagai bentuk tautan YouTube; '' bila tidak dikenali. */
export const youtubeId = (url = '') => {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url.trim())
  return m ? m[1] : ''
}

export const formatJadwalSub = (v) => {
  if (!v) return ''
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(v)
  if (!m) return v
  const tgl = new Date(`${m[1]}T${m[2]}:00`)
  return `${tgl.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} \u00b7 ${m[2]} WIB`
}

export const tanggalSub = (v) => {
  if (!v) return ''
  const m = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/.exec(v)
  if (!m) return v
  return new Date(`${m[1]}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
}

export const jamSub = (v) => {
  const m = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(v ?? '')
  return m ? `${m[1]} WIB` : ''
}

export const jamRentangSub = (v, durasi) => {
  const m = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(v ?? '')
  if (!m) return ''
  const menit = Number(durasi) > 0 ? Number(durasi) : 45
  const total = Number(m[1]) * 60 + Number(m[2]) + menit
  const jj = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${m[1]}:${m[2]}\u2013${jj}:${mm} WIB`
}

export const gambarKategori = (kategori) =>
  ({
    'Qur\u2019an Journey': '/programs/tilawah.jpg',
    'Islamic Deeper': '/programs/deeper.jpg',
    Turats: '/programs/turats.jpg',
    'Arabic & TOAFL Prep': '/programs/arabic.jpg',
  })[kategori] ?? '/programs/tilawah.jpg'

/* ---- Penyimpanan lokal ---- */
export const KUNCI = {
  program: 'hifzProgram',
  pengguna: 'hifzPengguna',
  transaksi: 'hifzPesananToko',
  produk: 'hifzProdukAdmin',
  berita: 'hifzBeritaAdmin',
  aktivitas: 'hifzAktivitas',
}

export const muatData = (kunci, awal = []) => {
  try {
    const raw = localStorage.getItem(kunci)
    return raw ? JSON.parse(raw) : awal
  } catch {
    return awal
  }
}

export const simpanData = (kunci, nilai) => {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

export const muatProgram = () => muatData(KUNCI.program)
export const programTerbit = () => muatProgram().filter((p) => p.status === 'terbit')

/* Kurikulum berjenjang: tema -> sub-tema (unit pembelajaran) */
export const semuaSub = (p) => (p?.kurikulum ?? []).flatMap((t) => t.sub ?? [])
export const subTerbit = (p) => semuaSub(p).filter((s) => s.status === 'terbit')

/* ---- Util tampilan ---- */
export const formatRupiah = (n) => `Rp${Number(n || 0).toLocaleString('id-ID')}`

export const tanggalLengkap = () =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

export const tanggalPendek = () =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

// tanggal + jam:menit:detik; string non-tanggal (data lama) ditampilkan apa adanya
export const waktuLengkap = (nilai) => {
  if (!nilai) return ''
  const d = new Date(nilai)
  if (Number.isNaN(d.getTime())) return String(nilai)
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `${tgl} · ${jam}`
}

export const inisial = (nama = '') =>
  nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join('') || 'I'
