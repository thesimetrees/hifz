import { api } from './api.js'
import { supabase } from './supabase.js'
import { subTerbit } from '../pages/admin/adminData.js'

const KUNCI_PROFIL = 'hifzProfilGuru'
const KUNCI_FOTO = 'hifzFotoGuru'

export function bacaProfilGuru() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_PROFIL)) ?? {}
  } catch {
    return {}
  }
}

export function simpanProfilGuru(email, data) {
  const peta = bacaProfilGuru()
  peta[email] = { ...peta[email], ...data }
  localStorage.setItem(KUNCI_PROFIL, JSON.stringify(peta))
  // terekam juga di Supabase agar profil ikut lintas perangkat
  supabase
    .from('profil_guru')
    .upsert({ email: String(email).trim().toLowerCase(), data: peta[email], updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.warn('Sinkron profil guru gagal:', error.message)
    })
}

// tarik profil guru dari Supabase ke cache lokal
export async function muatProfilGuru() {
  try {
    const { data, error } = await supabase.from('profil_guru').select('email,data')
    if (error || !Array.isArray(data)) return bacaProfilGuru()
    const peta = bacaProfilGuru()
    for (const r of data) if (r?.email) peta[r.email] = { ...peta[r.email], ...(r.data ?? {}) }
    localStorage.setItem(KUNCI_PROFIL, JSON.stringify(peta))
    return peta
  } catch {
    return bacaProfilGuru()
  }
}

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const cocokNama = (a, b) => {
  const x = norm(a)
  const y = norm(b)
  return Boolean(x && y && (x.includes(y) || y.includes(x)))
}

// foto asli guru dari database (nama -> foto), di-cache di localStorage
function bacaFotoGuru() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_FOTO)) ?? {}
  } catch {
    return {}
  }
}

export async function muatFotoGuru() {
  try {
    const { data, error } = await supabase.rpc('foto_guru')
    if (error || !Array.isArray(data)) return bacaFotoGuru()
    const peta = {}
    for (const g of data) if (g?.nama && g?.foto) peta[g.nama] = g.foto
    localStorage.setItem(KUNCI_FOTO, JSON.stringify(peta))
    return peta
  } catch {
    return bacaFotoGuru()
  }
}

// avatar default seragam — satu gambar per jenis kelamin
const AVATAR_IKHWAN =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=guru-hifz-ikhwan&top=turban&facialHairProbability=100&facialHair=beardMedium&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural'
const AVATAR_AKHWAT =
  'https://api.dicebear.com/9.x/avataaars/svg?seed=guru-hifz-akhwat&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural'

// foto profil guru; utamakan foto asli dari database, lalu profil lokal, lalu avatar default
export function avatarGuru(nama) {
  const fotoDb = Object.entries(bacaFotoGuru()).find(([n]) => cocokNama(n, nama))?.[1]
  if (fotoDb) return fotoDb
  const pr = Object.values(bacaProfilGuru()).find((x) => cocokNama(x.nama, nama))
  if (pr?.foto) return pr.foto
  return pr?.gender === 'Perempuan' ? AVATAR_AKHWAT : AVATAR_IKHWAN
}

// daftar guru nyata diturunkan dari program terbit (pengampu & pengajar sub materi)
export async function ambilGuru() {
  let daftar = []
  try {
    await muatFotoGuru()
    daftar = await api('/programs', { auth: false })
  } catch {
    return []
  }
  const peta = new Map()
  for (const p of Array.isArray(daftar) ? daftar : []) {
    const nama2 = new Set([p.tutor, ...subTerbit(p).map((s) => s.pengajar)].filter(Boolean))
    for (const nama of nama2) {
      const g = peta.get(nama) ?? { nama, bidang: new Set(), jumlahProgram: 0 }
      g.bidang.add(p.kategori)
      g.jumlahProgram += 1
      peta.set(nama, g)
    }
  }
  const profil = Object.values(bacaProfilGuru())
  return [...peta.values()].map((g) => {
    const pr = profil.find((x) => cocokNama(x.nama, g.nama))
    return {
      ...g,
      bidang: [...g.bidang],
      foto: avatarGuru(g.nama),
      bio: pr?.bio ?? '',
      pendidikan: (pr?.pendidikan ?? []).filter((p) => p?.nama?.trim()),
      bahasa: pr?.bahasa ?? [],
    }
  })
}
