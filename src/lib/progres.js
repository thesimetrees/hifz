// Progres belajar per user (localStorage sebagai cache + sinkron realtime Supabase)
import { daftarJadwal, jadwalAktif, sesiBerikutnya } from './kalender.js'
import { supabase } from './supabase.js'

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

// email dinormalkan agar tulisan guru & bacaan peserta selalu bertemu (beda kapital/spasi)
const surel = (e) => String(e ?? '').trim().toLowerCase()
const dataUser = (semua, email) => {
  const kunci = surel(email)
  if (semua[kunci] !== undefined) return semua[kunci]
  const lama = Object.keys(semua).find((k) => surel(k) === kunci)
  return lama === undefined ? undefined : semua[lama]
}
const idSama = (a, b) => String(a) === String(b)
const dataProgram = (peta, programId) => {
  if (!peta) return undefined
  if (peta[programId] !== undefined) return peta[programId]
  const kunci = Object.keys(peta).find((k) => idSama(k, programId))
  return kunci === undefined ? undefined : peta[kunci]
}

/* ---- Sinkron realtime Supabase (tabel belajar) ---- */
function kirimBelajar(email, programId) {
  const e = surel(email)
  const pid = String(programId)
  const baris = {
    email: e,
    program_id: pid,
    absen: bacaAbsensi(e, pid),
    nilai: bacaPenilaian(e, pid),
    selesai: bacaProgres(e, pid).selesai ?? [],
    jadwal: jadwalDipilih(e, pid),
    ingatkan: pengingatAktif(e, pid),
    terakhir: new Date().toISOString(),
  }
  supabase
    .from('belajar')
    .upsert(baris)
    .then(({ error }) => {
      if (error) console.warn('Sinkron belajar gagal:', error.message)
    })
}

function terapkanBaris(row) {
  if (!row?.email || !row?.program_id) return
  const pasang = (kunci, nilaiBaru) => {
    const semua = baca(kunci)
    const punya = dataUser(semua, row.email) ?? {}
    punya[row.program_id] = nilaiBaru
    semua[surel(row.email)] = punya
    tulis(kunci, semua)
  }
  pasang(KUNCI_ABSEN, row.absen ?? [])
  pasang(KUNCI_NILAI, row.nilai ?? {})
  pasang(KUNCI_PROGRES, { selesai: row.selesai ?? [], terakhir: row.terakhir ?? null })
  if (row.jadwal) pasang(KUNCI_JADWAL, row.jadwal)
  // baris belajar = bukti terdaftar → enroll lintas perangkat
  const enroll = baca(KUNCI_ENROLL)
  const daftar = dataUser(enroll, row.email) ?? []
  if (!daftar.some((id) => idSama(id, row.program_id))) {
    enroll[surel(row.email)] = [...daftar, row.program_id]
    tulis(KUNCI_ENROLL, enroll)
  }
  if (row.ingatkan !== undefined && row.ingatkan !== null) {
    const ingat = baca(KUNCI_INGATKAN)
    if (row.ingatkan) ingat[`${surel(row.email)}:${row.program_id}`] = true
    else delete ingat[`${surel(row.email)}:${row.program_id}`]
    tulis(KUNCI_INGATKAN, ingat)
  }
}

// tarik semua data awal + langganan perubahan; return fungsi berhenti
export function sinkronBelajar(onUbah) {
  let hidup = true
  supabase
    .from('belajar')
    .select('*')
    .then(({ data }) => {
      if (!hidup || !Array.isArray(data)) return
      for (const r of data) terapkanBaris(r)
      if (data.length) onUbah?.()
    })
  const kanal = supabase
    .channel(`belajar-sync-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'belajar' }, (p) => {
      terapkanBaris(p.new)
      onUbah?.()
    })
    .subscribe()
  return () => {
    hidup = false
    supabase.removeChannel(kanal)
  }
}

/* ---- Enroll ---- */
export const bacaEnroll = (email) => (email ? dataUser(baca(KUNCI_ENROLL), email) ?? [] : [])

export function ikutiProgram(email, programId) {
  if (!email) return
  const semua = baca(KUNCI_ENROLL)
  const punya = new Set(dataUser(semua, email) ?? [])
  punya.add(programId)
  semua[surel(email)] = [...punya]
  tulis(KUNCI_ENROLL, semua)
  kirimBelajar(email, programId)
}

export const sudahIkut = (email, programId) => bacaEnroll(email).some((id) => idSama(id, programId))

/* ---- Pilihan jadwal per user ---- */
export const jadwalDipilih = (email, programId) => (email && dataProgram(dataUser(baca(KUNCI_JADWAL), email), programId)) || null

export function pilihJadwal(email, programId, jadwalId) {
  if (!email) return
  const semua = baca(KUNCI_JADWAL)
  semua[surel(email)] = { ...(dataUser(semua, email) ?? {}), [programId]: jadwalId }
  tulis(KUNCI_JADWAL, semua)
  kirimBelajar(email, programId)
}

// jadwal efektif untuk user: pilihan tersimpan, fallback jadwal pertama program
export function jadwalUser(email, program) {
  const opsi = daftarJadwal(program?.jadwal)
  if (!opsi.length) return null
  const id = jadwalDipilih(email, program.id)
  return opsi.find((o) => o.id === id) ?? opsi[0]
}

/* ---- Absensi ---- */
export const bacaAbsensi = (email, programId) => (email && dataProgram(dataUser(baca(KUNCI_ABSEN), email), programId)) || []

export function absenHadir(email, programId, subId, hadir = true) {
  if (!email) return
  const semua = baca(KUNCI_ABSEN)
  const punya = dataUser(semua, email) ?? {}
  const daftar = new Set(dataProgram(punya, programId) ?? [])
  if (hadir) daftar.add(subId)
  else daftar.delete(subId)
  punya[programId] = [...daftar]
  semua[surel(email)] = punya
  tulis(KUNCI_ABSEN, semua)
  kirimBelajar(email, programId)
}

/* ---- Penilaian guru: komentar + love 1-5 (guru menulis, murid membaca) ---- */
export const bacaPenilaian = (email, programId) => (email && dataProgram(dataUser(baca(KUNCI_NILAI), email), programId)) || {}

export function beriNilai(email, programId, subId, love, komentar = '') {
  if (!email) return
  const semua = baca(KUNCI_NILAI)
  const punya = dataUser(semua, email) ?? {}
  punya[programId] = {
    ...(dataProgram(punya, programId) ?? {}),
    [subId]: { love: Math.max(0, Math.min(5, Number(love) || 0)), komentar: String(komentar ?? '') },
  }
  semua[surel(email)] = punya
  tulis(KUNCI_NILAI, semua)
  kirimBelajar(email, programId)
}

/* ---- Progres materi ---- */
export const bacaSemuaProgres = () => baca(KUNCI_PROGRES)

export const bacaProgres = (email, programId) =>
  (email && dataProgram(dataUser(baca(KUNCI_PROGRES), email), programId)) || { selesai: [], terakhir: null }

export function tandaiMateri(email, programId, materiId, selesai) {
  if (!email) return
  const semua = baca(KUNCI_PROGRES)
  const punya = dataUser(semua, email) ?? {}
  const prog = dataProgram(punya, programId) ?? { selesai: [], terakhir: null }
  const set = new Set(prog.selesai)
  if (selesai) set.add(materiId)
  else set.delete(materiId)
  punya[programId] = { selesai: [...set], terakhir: new Date().toISOString() }
  semua[surel(email)] = punya
  tulis(KUNCI_PROGRES, semua)
  kirimBelajar(email, programId)
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
  for (const [email, daftar] of Object.entries(enroll)) if ((daftar ?? []).some((id) => idSama(id, programId))) hasil.add(surel(email))
  for (const kunci of [KUNCI_PROGRES, KUNCI_ABSEN, KUNCI_NILAI]) {
    const semua = baca(kunci)
    for (const [email, peta] of Object.entries(semua)) if (dataProgram(peta, programId)) hasil.add(surel(email))
  }
  // pesanan program yang sudah lunas ikut terhitung agar peserta langsung terekam di guru/admin
  try {
    for (const p of JSON.parse(localStorage.getItem('hifzPesananToko') ?? '[]')) {
      if (
        p?.status === 'Lunas' &&
        (p.jenis ?? 'toko') === 'program' &&
        p.email &&
        Array.isArray(p.programIds) &&
        p.programIds.some((id) => idSama(id, programId))
      )
        hasil.add(surel(p.email))
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

/* ---- Pengingat H-1 hari & H-1 jam sebelum sesi ---- */
export const pengingatAktif = (email, programId) => {
  const peta = baca(KUNCI_INGATKAN)
  return Boolean(peta[`${surel(email)}:${programId}`] ?? peta[`${email}:${programId}`])
}

export function setPengingat(email, programId, aktif) {
  const semua = baca(KUNCI_INGATKAN)
  delete semua[`${email}:${programId}`]
  if (aktif) semua[`${surel(email)}:${programId}`] = true
  else delete semua[`${surel(email)}:${programId}`]
  tulis(KUNCI_INGATKAN, semua)
  kirimBelajar(email, programId)
}

// sesi terdekat dari jadwal per-materi (ISO datetime di kurikulum)
const sesiDariSub = (program) => {
  const depan = (program.kurikulum ?? [])
    .flatMap((t) => t.sub ?? [])
    .filter((s) => (s.status ?? 'terbit') === 'terbit' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s.jadwal ?? ''))
    .map((s) => new Date(s.jadwal))
    .filter((d) => d.getTime() > Date.now())
    .sort((a, b) => a - b)
  return depan[0] ?? null
}

// jadwalkan Notification H-1 hari & H-1 jam sebelum sesi berikutnya; kembalikan fungsi pembersih
export function jadwalkanPengingat(program, jadwalPilihan = null) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return () => {}
  const j = jadwalPilihan ?? daftarJadwal(program.jadwal)[0]
  let mulai = null
  if (jadwalAktif(j)) {
    const sesi = sesiBerikutnya(j)
    if (sesi) {
      const [jam, menit] = j.mulai.split(':').map(Number)
      mulai = new Date(sesi)
      mulai.setHours(jam, menit, 0, 0)
    }
  }
  if (!mulai) mulai = sesiDariSub(program)
  if (!mulai || mulai.getTime() <= Date.now()) return () => {}
  const jamMulai = `${String(mulai.getHours()).padStart(2, '0')}:${String(mulai.getMinutes()).padStart(2, '0')}`
  const timer = []
  // selisihMs sebelum mulai; batasTampil = titik terakhir pengingat masih relevan
  const pasang = (selisihMs, label, judul, badan) => {
    const target = mulai.getTime() - selisihMs
    const batasTampil = selisihMs > 60 * 60 * 1000 ? mulai.getTime() - 60 * 60 * 1000 : mulai.getTime()
    const jeda = target - Date.now()
    const kunci = `hifzTayang-${program.id}-${label}-${mulai.toDateString()}`
    const tampil = () => {
      if (localStorage.getItem(kunci)) return
      localStorage.setItem(kunci, '1')
      new Notification(judul, { body: badan })
    }
    if (jeda <= 0 && Date.now() < batasTampil) tampil()
    else if (jeda > 0 && jeda < 48 * 60 * 60 * 1000) timer.push(setTimeout(tampil, jeda))
  }
  pasang(
    24 * 60 * 60 * 1000,
    'h1hari',
    `Besok: ${program.nama}`,
    `Sesi belajar besok pukul ${jamMulai} WIB. Jangan lupa siapkan waktumu.`,
  )
  pasang(
    60 * 60 * 1000,
    'h1jam',
    `1 jam lagi: ${program.nama}`,
    `Sesi belajar dimulai pukul ${jamMulai} WIB. Siapkan mushaf dan catatanmu.`,
  )
  return () => timer.forEach(clearTimeout)
}
