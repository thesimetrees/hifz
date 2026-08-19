// Progres belajar per user (localStorage, dibaca dashboard user & admin)
import { daftarJadwal, jadwalAktif, sesiBerikutnya } from './kalender.js'

const KUNCI_PROGRES = 'hifzProgres' // { [email]: { [programId]: { selesai: [], terakhir } } }
const KUNCI_ENROLL = 'hifzEnroll' // { [email]: [programId] }
const KUNCI_INGATKAN = 'hifzIngatkan' // { [`${email}:${programId}`]: true }
const KUNCI_JADWAL = 'hifzJadwalPilihan' // { [email]: { [programId]: jadwalId } }
const KUNCI_ABSEN = 'hifzAbsensi' // { [email]: { [programId]: [subId] } }
const KUNCI_NILAI = 'hifzPenilaian' // { [email]: { [programId]: { [subId]: { love: 1-5, komentar } } } } — ditulis guru, dibaca murid

const baca = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? '{}') || {}
  } catch {
    return {}
  }
}
const tulis = (k, v) => localStorage.setItem(k, JSON.stringify(v))

/* ---- Enroll ---- */
export const bacaEnroll = (email) => (email ? baca(KUNCI_ENROLL)[email] ?? [] : [])

export function ikutiProgram(email, programId) {
  if (!email) return
  const semua = baca(KUNCI_ENROLL)
  const punya = new Set(semua[email] ?? [])
  punya.add(programId)
  semua[email] = [...punya]
  tulis(KUNCI_ENROLL, semua)
}

export const sudahIkut = (email, programId) => bacaEnroll(email).includes(programId)

/* ---- Pilihan jadwal per user ---- */
export const jadwalDipilih = (email, programId) => (email && baca(KUNCI_JADWAL)[email]?.[programId]) || null

export function pilihJadwal(email, programId, jadwalId) {
  if (!email) return
  const semua = baca(KUNCI_JADWAL)
  semua[email] = { ...(semua[email] ?? {}), [programId]: jadwalId }
  tulis(KUNCI_JADWAL, semua)
}

// jadwal efektif untuk user: pilihan tersimpan, fallback jadwal pertama program
export function jadwalUser(email, program) {
  const opsi = daftarJadwal(program?.jadwal)
  if (!opsi.length) return null
  const id = jadwalDipilih(email, program.id)
  return opsi.find((o) => o.id === id) ?? opsi[0]
}

/* ---- Absensi ---- */
export const bacaAbsensi = (email, programId) => (email && baca(KUNCI_ABSEN)[email]?.[programId]) || []

export function absenHadir(email, programId, subId, hadir = true) {
  if (!email) return
  const semua = baca(KUNCI_ABSEN)
  const punya = semua[email] ?? {}
  const daftar = new Set(punya[programId] ?? [])
  if (hadir) daftar.add(subId)
  else daftar.delete(subId)
  punya[programId] = [...daftar]
  semua[email] = punya
  tulis(KUNCI_ABSEN, semua)
}

/* ---- Penilaian guru: komentar + love 1-5 (guru menulis, murid membaca) ---- */
export const bacaPenilaian = (email, programId) => (email && baca(KUNCI_NILAI)[email]?.[programId]) || {}

export function beriNilai(email, programId, subId, love, komentar = '') {
  if (!email) return
  const semua = baca(KUNCI_NILAI)
  const punya = semua[email] ?? {}
  punya[programId] = {
    ...(punya[programId] ?? {}),
    [subId]: { love: Math.max(0, Math.min(5, Number(love) || 0)), komentar: String(komentar ?? '') },
  }
  semua[email] = punya
  tulis(KUNCI_NILAI, semua)
}

/* ---- Progres materi ---- */
export const bacaSemuaProgres = () => baca(KUNCI_PROGRES)

export const bacaProgres = (email, programId) =>
  (email && baca(KUNCI_PROGRES)[email]?.[programId]) || { selesai: [], terakhir: null }

export function tandaiMateri(email, programId, materiId, selesai) {
  if (!email) return
  const semua = baca(KUNCI_PROGRES)
  const punya = semua[email] ?? {}
  const prog = punya[programId] ?? { selesai: [], terakhir: null }
  const set = new Set(prog.selesai)
  if (selesai) set.add(materiId)
  else set.delete(materiId)
  punya[programId] = { selesai: [...set], terakhir: new Date().toISOString() }
  semua[email] = punya
  tulis(KUNCI_PROGRES, semua)
}

export function hitungProgres(program, data) {
  const semua = []
  for (const t of program.kurikulum ?? [])
    for (const s of t.sub ?? []) if (s.status === 'terbit') semua.push(s)
  const selesai = semua.filter((m) => (data?.selesai ?? []).includes(m.id)).length
  return { selesai, total: semua.length, pct: semua.length ? Math.round((selesai / semua.length) * 100) : 0 }
}

// murid terdaftar/aktif di satu program (dipakai dashboard guru & admin):
// gabungan enroll + progres + absensi + penilaian agar peserta tetap muncul
export function pesertaProgram(programId) {
  const hasil = new Set()
  const enroll = baca(KUNCI_ENROLL)
  for (const [email, daftar] of Object.entries(enroll)) if ((daftar ?? []).includes(programId)) hasil.add(email)
  for (const kunci of [KUNCI_PROGRES, KUNCI_ABSEN, KUNCI_NILAI]) {
    const semua = baca(kunci)
    for (const [email, peta] of Object.entries(semua)) if (peta?.[programId]) hasil.add(email)
  }
  // pesanan program yang sudah lunas ikut terhitung agar peserta langsung terekam di guru/admin
  try {
    for (const p of JSON.parse(localStorage.getItem('hifzPesananToko') ?? '[]')) {
      if (
        p?.status === 'Lunas' &&
        (p.jenis ?? 'toko') === 'program' &&
        p.email &&
        Array.isArray(p.programIds) &&
        p.programIds.includes(programId)
      )
        hasil.add(p.email)
    }
  } catch {
    // penyimpanan lokal tidak tersedia
  }
  return [...hasil]
}

// progres seluruh user untuk satu program (dipakai admin)
export function progresPeserta(program) {
  const semua = bacaSemuaProgres()
  return Object.entries(semua)
    .filter(([, prog]) => prog[program.id])
    .map(([email, prog]) => ({ email, ...hitungProgres(program, prog[program.id]), terakhir: prog[program.id].terakhir }))
    .sort((a, b) => b.pct - a.pct)
}

/* ---- Pengingat 1 jam sebelum sesi ---- */
export const pengingatAktif = (email, programId) => Boolean(baca(KUNCI_INGATKAN)[`${email}:${programId}`])

export function setPengingat(email, programId, aktif) {
  const semua = baca(KUNCI_INGATKAN)
  if (aktif) semua[`${email}:${programId}`] = true
  else delete semua[`${email}:${programId}`]
  tulis(KUNCI_INGATKAN, semua)
}

// jadwalkan Notification 1 jam sebelum sesi berikutnya; kembalikan fungsi pembersih
export function jadwalkanPengingat(program, jadwalPilihan = null) {
  const j = jadwalPilihan ?? daftarJadwal(program.jadwal)[0]
  if (!jadwalAktif(j) || !('Notification' in window) || Notification.permission !== 'granted') return () => {}
  const sesi = sesiBerikutnya(j)
  if (!sesi) return () => {}
  const [jam, menit] = j.mulai.split(':').map(Number)
  const mulai = new Date(sesi)
  mulai.setHours(jam, menit, 0, 0)
  const pengingat = mulai.getTime() - 60 * 60 * 1000
  const jeda = pengingat - Date.now()
  const kunciTayang = `hifzTayang-${program.id}-${mulai.toDateString()}`
  const tampilkan = () => {
    if (localStorage.getItem(kunciTayang)) return
    localStorage.setItem(kunciTayang, '1')
    new Notification(`1 jam lagi: ${program.nama}`, {
      body: `Sesi belajar dimulai pukul ${j.mulai} WIB. Siapkan mushaf dan catatanmu.`,
    })
  }
  // sudah masuk jendela 1 jam sebelum mulai
  if (jeda <= 0 && Date.now() < mulai.getTime()) {
    tampilkan()
    return () => {}
  }
  if (jeda > 0 && jeda < 24 * 60 * 60 * 1000) {
    const id = setTimeout(tampilkan, jeda)
    return () => clearTimeout(id)
  }
  return () => {}
}
