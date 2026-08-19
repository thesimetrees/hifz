import { api } from './api.js'
import { subTerbit } from '../pages/admin/adminData.js'

const KUNCI_PROFIL = 'hifzProfilGuru'

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

// dummy sementara untuk pratinjau desain kartu guru
const guruDummy = [
  {
    nama: 'Ahmad Fauzan',
    foto: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ahmad&top=turban&facialHairProbability=100&facialHair=beardMedium&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
    bidang: [],
    jumlahProgram: 1,
    bio: "Menekuni kajian tafsir Al-Qur'an lebih dari 8 tahun dengan penyampaian yang runtut dan mudah dipahami pemula. Aktif membina halaqah tadabbur di berbagai majelis.",
    pendidikan: [
      { jenis: 'Formal', nama: "S1 Ilmu Al-Qur'an & Tafsir — UIN Sunan Kalijaga" },
      { jenis: 'Non-formal', nama: "Daurah Qiraat — Ma'had Al-Azhar Kairo" },
    ],
    bahasa: ['Indonesia', 'Arab', 'Inggris', 'Turki'],
  },
  {
    nama: 'Fatimah Azzahra',
    foto: 'https://api.dicebear.com/9.x/avataaars/svg?seed=fatimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
    bidang: [],
    jumlahProgram: 1,
    bio: "Hafizhah 30 juz yang berpengalaman membimbing kelas bahasa Arab dari pemula hingga mahir. Telaten membersamai proses murajaah dan percaya semua orang bisa akrab dengan bahasa Al-Qur'an.",
    pendidikan: [
      { jenis: 'Formal', nama: 'S1 Pendidikan Bahasa Arab — LIPIA Jakarta' },
      { jenis: 'Non-formal', nama: 'Tahfizh 30 Juz — Pesantren Isy Karima' },
    ],
    bahasa: ['Indonesia', 'Arab', 'Inggris', 'Prancis'],
  },
  {
    nama: 'Muhammad Ridwan',
    foto: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ridwan&top=turban&facialHairProbability=100&facialHair=beardLight&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
    bidang: [],
    jumlahProgram: 1,
    bio: 'Fokus pada ilmu qiraat dan tilawah dengan sanad riwayat Hafs. Aktif mengajar tahsin daring dengan gaya yang tenang, detail, dan sabar mengoreksi bacaan.',
    pendidikan: [
      { jenis: 'Formal', nama: 'S2 Studi Islam — Universitas Islam Madinah' },
      { jenis: 'Non-formal', nama: 'Sanad Tilawah Riwayat Hafs' },
    ],
    bahasa: ['Indonesia', 'Arab', 'Inggris', 'Jerman'],
  },
  {
    nama: "Halimah Sa'diyah",
    foto: 'https://api.dicebear.com/9.x/avataaars/svg?seed=halimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
    bidang: [],
    jumlahProgram: 1,
    bio: 'Peneliti hadis muda yang gemar menghubungkan sunnah dengan keseharian. Berpengalaman mengisi kajian fikih wanita dan adab penuntut ilmu secara ringkas dan aplikatif.',
    pendidikan: [
      { jenis: 'Formal', nama: 'S1 Ilmu Hadis — UIN Syarif Hidayatullah' },
      { jenis: 'Non-formal', nama: 'Daurah Tahsin — Markaz Utrujah' },
    ],
    bahasa: ['Indonesia', 'Arab', 'Inggris', 'Mandarin'],
  },
]

// icon guru untuk nama yang belum punya foto profil
export function avatarGuru(nama) {
  const g = guruDummy.find((x) => cocokNama(x.nama, nama))
  if (g?.foto) return g.foto
  const pr = Object.values(bacaProfilGuru()).find((x) => cocokNama(x.nama, nama))
  if (pr?.foto) return pr.foto
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(norm(nama))}&top=turban&facialHairProbability=100&facialHair=beardMedium&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural`
}

// daftar guru nyata diturunkan dari program terbit (pengampu & pengajar sub materi)
export async function ambilGuru() {
  let daftar = []
  try {
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
  const hasil = [...peta.values()]
    .filter((g) => g.nama !== 'Nadia Rahmah')
    .map((g) => {
      const pr = profil.find((x) => cocokNama(x.nama, g.nama))
      return {
        ...g,
        bidang: [...g.bidang],
        foto: pr?.foto ?? avatarGuru(g.nama),
        bio: pr?.bio ?? "Guru Hifz yang aktif membimbing peserta lintas program. Menyampaikan materi secara terstruktur, aplikatif, dan siap membersamai proses belajar Anda dari dasar.",
        pendidikan: (pr?.pendidikan ?? []).filter((p) => p?.nama?.trim()),
        bahasa: pr?.bahasa?.length >= 4 ? pr.bahasa : [...new Set([...(pr?.bahasa ?? []), 'Indonesia', 'Arab', 'Inggris', 'Turki'])].slice(0, Math.max(4, pr?.bahasa?.length ?? 0)),
      }
    })
  return [...hasil, ...guruDummy]
}
