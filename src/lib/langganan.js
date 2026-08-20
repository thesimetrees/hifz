// masa akses program (model langganan) — dihitung dari pembayaran lunas terakhir
const MASA_HARI = { Daily: 30, 'Short Course': 90, Bootcamp: 180, Private: 30 }

export const masaHari = (jenis) => MASA_HARI[jenis] ?? 90

// durasi bulan yang dipilih saat checkout/perpanjangan tercantum pada nama item
const bulanOrder = (r) => {
  const m = /(\d+)\s*bulan/i.exec(String(r.item || ''))
  return m ? Number(m[1]) : 0
}

const waktuOrder = (r) => {
  const d = new Date(r.createdAt || r.tanggal || 0)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

// status: aktif | segera (≤7 hari) | habis | tunggu (perpanjangan menunggu konfirmasi, akses tetap terbuka)
export function infoAkses(program, riwayat) {
  const cocok = (r) => (r.jenis ?? 'toko') === 'program' && Array.isArray(r.programIds) && r.programIds.includes(program.id)
  const tunggu = riwayat.find((r) => cocok(r) && r.status === 'Menunggu' && String(r.item || '').startsWith('Perpanjangan')) ?? null
  const lunas = riwayat.filter((r) => cocok(r) && r.status === 'Lunas').sort((a, b) => waktuOrder(b) - waktuOrder(a))
  if (!lunas.length || !waktuOrder(lunas[0])) return { berakhir: null, sisaHari: null, status: 'aktif', tunggu }
  const bln = bulanOrder(lunas[0])
  const hari = bln ? bln * 30 : masaHari(program.jenis)
  const berakhir = new Date(waktuOrder(lunas[0]) + hari * 86400000)
  const sisaHari = Math.ceil((berakhir.getTime() - Date.now()) / 86400000)
  let status = 'aktif'
  if (sisaHari <= 0) status = tunggu ? 'tunggu' : 'habis'
  else if (sisaHari <= 14) status = tunggu ? 'tunggu' : 'segera'
  return { berakhir, sisaHari, status, tunggu }
}

export const formatBerakhir = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
