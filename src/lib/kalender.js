// Util jadwal belajar: kalender, tautan Google Calendar, dan berkas ICS (Apple/Outlook)

export const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] // indeks = Date.getDay()
export const HARI_URUT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const BYDAY = { Min: 'SU', Sen: 'MO', Sel: 'TU', Rab: 'WE', Kam: 'TH', Jum: 'FR', Sab: 'SA' }

const dua = (n) => String(n).padStart(2, '0')

export const jadwalAktif = (j) => Boolean(j && Array.isArray(j.hari) && j.hari.length && j.mulai && j.selesai)

// jadwal program bisa objek tunggal (format lama) atau array (multi-jadwal); hasil selalu array bernorma
export function daftarJadwal(j) {
  const arr = Array.isArray(j) ? j : j && typeof j === 'object' ? [j] : []
  return arr.filter(jadwalAktif).map((x, i) => ({ ...x, id: x.id ?? `jw-${i}`, label: x.label || `Jadwal ${i + 1}` }))
}

export const ringkasJadwal = (j) =>
  jadwalAktif(j) ? `${HARI_URUT.filter((h) => j.hari.includes(h)).join(' · ')} · ${j.mulai}–${j.selesai} WIB` : ''

export function formatTanggalPanjang(d) {
  if (!d) return ''
  const tgl = typeof d === 'string' ? new Date(`${d}T00:00:00`) : d
  return tgl.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// sesi terdekat >= hari ini (dan >= tanggalMulai, <= tanggalSelesai bila diisi)
export function sesiBerikutnya(j) {
  if (!jadwalAktif(j)) return null
  const mulai = j.tanggalMulai ? new Date(`${j.tanggalMulai}T00:00:00`) : null
  const akhir = j.tanggalSelesai ? new Date(`${j.tanggalSelesai}T23:59:59`) : null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (mulai && d < mulai) d.setTime(mulai.getTime())
  for (let i = 0; i < 366; i++) {
    if (akhir && d > akhir) return null
    if (j.hari.includes(HARI[d.getDay()])) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
  return null
}

const stampLokal = (d, jam) =>
  `${d.getFullYear()}${dua(d.getMonth() + 1)}${dua(d.getDate())}T${jam.replace(':', '')}00`

const aturanUlang = (j) => {
  let r = `RRULE:FREQ=WEEKLY;BYDAY=${j.hari.map((h) => BYDAY[h]).join(',')}`
  if (j.tanggalSelesai) r += `;UNTIL=${j.tanggalSelesai.replaceAll('-', '')}T235959Z`
  return r
}

export function linkGoogleKalender(program, j) {
  const awal = sesiBerikutnya(j)
  if (!awal) return null
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Belajar ${program.nama} (Hifz)`,
    details: (program.deskripsi ?? '').slice(0, 200),
    location: program.mode ?? 'Online',
    dates: `${stampLokal(awal, j.mulai)}/${stampLokal(awal, j.selesai)}`,
    ctz: 'Asia/Jakarta',
    recur: aturanUlang(j),
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function unduhICS(program, j) {
  const awal = sesiBerikutnya(j)
  if (!awal) return
  const kini = new Date()
  const stampUtc = `${kini.getUTCFullYear()}${dua(kini.getUTCMonth() + 1)}${dua(kini.getUTCDate())}T${dua(kini.getUTCHours())}${dua(kini.getUTCMinutes())}00Z`
  const baris = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//Hifz//Jadwal Belajar//ID",
    'BEGIN:VEVENT',
    `UID:hifz-${program.id}@hifz.id`,
    `DTSTAMP:${stampUtc}`,
    `DTSTART;TZID=Asia/Jakarta:${stampLokal(awal, j.mulai)}`,
    `DTEND;TZID=Asia/Jakarta:${stampLokal(awal, j.selesai)}`,
    aturanUlang(j),
    `SUMMARY:Belajar ${program.nama} (Hifz)`,
    `DESCRIPTION:${(program.deskripsi ?? '').replace(/\n/g, ' ').slice(0, 200)}`,
    `LOCATION:${program.mode ?? 'Online'}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Sesi ${program.nama} dimulai 30 menit lagi`,
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([baris.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jadwal-${program.id}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
