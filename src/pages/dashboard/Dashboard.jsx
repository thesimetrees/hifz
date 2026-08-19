import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bell,
  BellRing,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Camera,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Hourglass,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  MapPin,
  MapPinned,
  MessagesSquare,
  MonitorPlay,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Timer,
  UserCheck,
  UserRound,
  Video,
} from 'lucide-react'
import {
  formatRupiah,
} from './dashboardData.js'
import BayarModal from '../../components/BayarModal.jsx'
import PlayerTertutup from '../../components/PlayerTertutup.jsx'
import { bacaPesanan } from '../toko/tokoData.js'
import { gambarKategori, inisial, jamSub, labelTipe, tanggalSub, youtubeId } from '../admin/adminData.js'
import { api, kompresFoto } from '../../lib/api.js'
import { daftarJadwal, formatTanggalPanjang, linkGoogleKalender, ringkasJadwal, sesiBerikutnya, unduhICS } from '../../lib/kalender.js'
import { avatarGuru } from '../../lib/guru.js'
import { formatBerakhir, infoAkses } from '../../lib/langganan.js'
import { absenHadir, bacaAbsensi, bacaPenilaian, bacaProgres, hitungProgres, ikutiProgram, jadwalUser, jadwalkanPengingat, pengingatAktif, pilihJadwal, setPengingat, sudahIkut } from '../../lib/progres.js'

const API_WILAYAH = 'https://cdn.jsdelivr.net/gh/emsifa/api-wilayah-indonesia@gh-pages/api'
const KUNCI_PROFIL_DETAIL = 'hifzProfilDetail'

const rapiWilayah = (nama) =>
  nama
    .toLowerCase()
    .split(' ')
    .map((kata) => (['di', 'dki'].includes(kata) ? kata.toUpperCase() : kata.charAt(0).toUpperCase() + kata.slice(1)))
    .join(' ')

const ikonModul = { video: Video, dokumen: FileText, kuis: HelpCircle, 'sesi-online': MonitorPlay, 'sesi-offline': MapPin }

const NAV = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'riwayat', label: 'Riwayat', icon: ReceiptText },
  { id: 'rapot', label: 'Rapot Penilaian', icon: ClipboardList },
  { id: 'konsultasi', label: 'Konsultasi', icon: MessagesSquare },
]

const ikonAktivitas = {
  modul: BookOpenCheck,
  kuis: Sparkles,
  sesi: PlayCircle,
  sertifikat: Award,
}

function Bar({ value }) {
  return (
    <div className="db-bar">
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

const waktuRelatif = (iso) => {
  if (!iso) return 'belum dibuka'
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (menit < 1) return 'baru saja'
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  return `${Math.floor(jam / 24)} hari lalu`
}

// tanggal + jam:menit:detik untuk notifikasi; nilai non-tanggal ditampilkan apa adanya
const waktuNotif = (nilai) => {
  if (!nilai) return ''
  const d = new Date(nilai)
  if (Number.isNaN(d.getTime())) return nilai
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `${tgl} · ${jam}`
}

// tanggal & jam:menit:detik terpisah untuk tabel riwayat
const pecahWaktu = (nilai) => {
  if (!nilai) return null
  const d = new Date(nilai)
  if (Number.isNaN(d.getTime())) return null
  return {
    tgl: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
    jam: `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} WIB`,
  }
}

// data URL tidak bisa dibuka langsung di tab baru (diblokir browser) — konversi ke blob dulu
const bukaInvoice = async (r) => {
  try {
    const blob = await (await fetch(r.invoiceFile)).blob()
    window.open(URL.createObjectURL(blob), '_blank', 'noopener')
  } catch { /* file rusak — abaikan */ }
}

const unduhInvoice = (r) => {
  const a = document.createElement('a')
  a.href = r.invoiceFile
  a.download = `${r.invoice}.jpg`
  a.click()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    return ['ringkasan', 'program', 'riwayat', 'enroll', 'rapot', 'konsultasi', 'profil'].includes(t) ? t : 'ringkasan'
  })
  const [programId, setProgramId] = useState(null)
  const [bayarProgram, setBayarProgram] = useState(null)
  const [bukaSub, setBukaSub] = useState(null)
  const [temaTutup, setTemaTutup] = useState({})
  const [user, setUser] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [openPop, setOpenPop] = useState(null)
  const [notifTampil, setNotifTampil] = useState(false)
  const [programApi, setProgramApi] = useState([])
  const [versi, setVersi] = useState(0)
  const [nilaiBaca, setNilaiBaca] = useState([])

  useEffect(() => {
    if (!user?.email) return
    try {
      setNilaiBaca(JSON.parse(localStorage.getItem('hifzNilaiBaca') ?? '{}')[user.email] ?? [])
    } catch {
      setNilaiBaca([])
    }
  }, [user])

  useEffect(() => {
    const raw = localStorage.getItem('hifzUser')
    if (!raw) {
      navigate('/masuk', { replace: true })
      return
    }
    try {
      const akun = JSON.parse(raw)
      if (akun.peran === 'tutor') {
        navigate('/guru/dashboard', { replace: true })
        return
      }
      if (akun.peran === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }
      setUser({ telepon: '', kota: '', ...akun })
    } catch {
      navigate('/masuk', { replace: true })
    }
  }, [navigate])

  const [profilForm, setProfilForm] = useState(null)
  const [profilStatus, setProfilStatus] = useState('')
  const [notifBayar, setNotifBayar] = useState([])

  // sinkron status pesanan dengan server; buka akses program saat admin konfirmasi Lunas
  useEffect(() => {
    if (!user) return
    let hidup = true
    const sinkron = async () => {
      let daftar = []
      try {
        daftar = JSON.parse(localStorage.getItem('hifzPesananToko') || '[]')
      } catch {
        daftar = []
      }
      let berubah = false
      const hasil = await Promise.all(daftar.map(async (p) => {
        if (!p.invoice || p.status === 'Dibatalkan') return p
        try {
          const server = await api(`/toko/orders/${p.invoice}`, { auth: false })
          const invBaru = server.invoiceFile ?? null
          const ketBaru = server.keterangan ?? null
          if (server.status !== p.status || invBaru !== (p.invoiceFile ?? null) || ketBaru !== (p.keterangan ?? null)) {
            berubah = true
            return { ...p, status: server.status, invoiceFile: invBaru, keterangan: ketBaru }
          }
        } catch {
          // server tidak terjangkau, biarkan status lokal
        }
        return p
      }))
      if (!hidup) return
      const notifBaruBayar = []
      const final = hasil.map((asal) => {
        let p = asal
        if (p.status === 'Lunas' && p.jenis === 'program' && Array.isArray(p.programIds) && !p.aksesDibuka) {
          p.programIds.forEach((id) => ikutiProgram(user.email, id))
          berubah = true
          p = { ...p, aksesDibuka: true }
        }
        if (p.status === 'Lunas' && !p.notifKonfirmasi) {
          notifBaruBayar.push({
            id: `bayar-${p.invoice}`,
            judul: `Pembayaran ${p.invoice} Anda telah dikonfirmasi admin.${p.jenis === 'program' ? ' Akses program telah dibuka, selamat belajar!' : ' Terima kasih!'}`,
            waktu: new Date().toISOString(),
            tab: p.jenis === 'program' ? 'ringkasan' : 'riwayat',
            baru: true,
          })
          berubah = true
          p = { ...p, notifKonfirmasi: true }
        }
        return p
      })
      try {
        if (berubah) localStorage.setItem('hifzPesananToko', JSON.stringify(final))
        if (notifBaruBayar.length) {
          const simpan = JSON.parse(localStorage.getItem('hifzNotifBayar') || '{}')
          const lama = simpan[user.email] || []
          simpan[user.email] = [...notifBaruBayar.filter((n) => !lama.some((l) => l.id === n.id)), ...lama]
          localStorage.setItem('hifzNotifBayar', JSON.stringify(simpan))
        }
        setNotifBayar(JSON.parse(localStorage.getItem('hifzNotifBayar') || '{}')[user.email] || [])
      } catch {
        // penyimpanan lokal tidak tersedia
      }
      if (berubah) setVersi((v) => v + 1)
    }
    sinkron()
    const timer = setInterval(sinkron, 15000)
    return () => {
      hidup = false
      clearInterval(timer)
    }
  }, [user?.email])

  const tandaiBayarBaca = () => {
    if (!notifBayar.some((n) => n.baru)) return
    const semua = notifBayar.map((n) => ({ ...n, baru: false }))
    setNotifBayar(semua)
    try {
      const simpan = JSON.parse(localStorage.getItem('hifzNotifBayar') || '{}')
      simpan[user.email] = semua
      localStorage.setItem('hifzNotifBayar', JSON.stringify(simpan))
    } catch {
      // penyimpanan lokal tidak tersedia
    }
  }
  const [wilayah, setWilayah] = useState({ provinsi: [], kota: [], kecamatan: [], kelurahan: [] })
  const [lokasiStatus, setLokasiStatus] = useState('')

  useEffect(() => {
    fetch(`${API_WILAYAH}/provinces.json`)
      .then((r) => r.json())
      .then((d) => setWilayah((w) => ({ ...w, provinsi: d })))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    let detail = {}
    try {
      detail = JSON.parse(localStorage.getItem(KUNCI_PROFIL_DETAIL) || '{}')[user.email] || {}
    } catch {
      detail = {}
    }
    const kosong = { id: '', nama: '' }
    setProfilForm({
      nama: user.nama || '',
      telepon: user.telepon || '',
      jalan: detail.jalan ?? user.alamat ?? '',
      provinsi: detail.provinsi || kosong,
      kota: detail.kota || kosong,
      kecamatan: detail.kecamatan || kosong,
      kelurahan: detail.kelurahan || kosong,
      kodePos: detail.kodePos || '',
      lat: detail.lat || '',
      lng: detail.lng || '',
    })
    const sumber = {
      kota: detail.provinsi?.id && `regencies/${detail.provinsi.id}`,
      kecamatan: detail.kota?.id && `districts/${detail.kota.id}`,
      kelurahan: detail.kecamatan?.id && `villages/${detail.kecamatan.id}`,
    }
    Object.entries(sumber).forEach(([tujuan, path]) => {
      if (!path) return
      fetch(`${API_WILAYAH}/${path}.json`)
        .then((r) => r.json())
        .then((d) => setWilayah((w) => ({ ...w, [tujuan]: d })))
        .catch(() => {})
    })
  }, [user?.email])

  const pilihWilayah = (tingkat, e) => {
    const opt = e.target.selectedOptions[0]
    const val = { id: e.target.value, nama: opt?.dataset.nama ?? '' }
    const urutan = ['provinsi', 'kota', 'kecamatan', 'kelurahan']
    const mulai = urutan.indexOf(tingkat)
    setProfilForm((f) => {
      const baru = { ...f, [tingkat]: val }
      urutan.slice(mulai + 1).forEach((t) => { baru[t] = { id: '', nama: '' } })
      return baru
    })
    setWilayah((w) => {
      const baru = { ...w }
      urutan.slice(mulai + 1).forEach((t) => { baru[t] = [] })
      return baru
    })
    if (!val.id) return
    const sumber = { provinsi: `regencies/${val.id}`, kota: `districts/${val.id}`, kecamatan: `villages/${val.id}` }[tingkat]
    const tujuan = urutan[mulai + 1]
    if (!sumber || !tujuan) return
    fetch(`${API_WILAYAH}/${sumber}.json`)
      .then((r) => r.json())
      .then((d) => setWilayah((w) => ({ ...w, [tujuan]: d })))
      .catch(() => {})
  }

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setLokasiStatus('Peramban tidak mendukung geolokasi.')
      return
    }
    setLokasiStatus('Mengambil lokasi...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfilForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
        setLokasiStatus('Koordinat berhasil diisi.')
      },
      () => setLokasiStatus('Izin lokasi ditolak. Silakan isi koordinat secara manual.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const gantiFoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProfilStatus('')
    try {
      const foto = await kompresFoto(file)
      await api('/users/me/foto', { method: 'PATCH', body: { foto } })
      setUser((u) => ({ ...u, foto }))
      try {
        const raw = JSON.parse(localStorage.getItem('hifzUser') || '{}')
        localStorage.setItem('hifzUser', JSON.stringify({ ...raw, foto }))
      } catch {
        // penyimpanan lokal tidak tersedia
      }
      setProfilStatus('Foto profil diperbarui.')
    } catch (err) {
      setProfilStatus(`Gagal mengunggah foto: ${err.message}`)
    }
  }

  const simpanProfil = async (e) => {
    e.preventDefault()
    if (!profilForm) return
    setProfilStatus('')
    const alamat = [
      profilForm.jalan.trim(),
      profilForm.kelurahan.nama,
      profilForm.kecamatan.nama,
      profilForm.kota.nama,
      profilForm.provinsi.nama,
      profilForm.kodePos.trim(),
    ].filter(Boolean).join(', ')
    try {
      const hasil = await api('/users/me', {
        method: 'PATCH',
        body: {
          nama: profilForm.nama.trim(),
          telepon: profilForm.telepon.trim(),
          alamat,
        },
      })
      const baru = { ...user, nama: hasil.nama, telepon: hasil.telepon ?? '', alamat: hasil.alamat ?? '' }
      setUser(baru)
      try {
        const raw = JSON.parse(localStorage.getItem('hifzUser') || '{}')
        localStorage.setItem('hifzUser', JSON.stringify({ ...raw, nama: baru.nama, telepon: baru.telepon, alamat: baru.alamat }))
        const semua = JSON.parse(localStorage.getItem(KUNCI_PROFIL_DETAIL) || '{}')
        semua[user.email] = {
          jalan: profilForm.jalan.trim(),
          provinsi: profilForm.provinsi,
          kota: profilForm.kota,
          kecamatan: profilForm.kecamatan,
          kelurahan: profilForm.kelurahan,
          kodePos: profilForm.kodePos.trim(),
          lat: profilForm.lat,
          lng: profilForm.lng,
        }
        localStorage.setItem(KUNCI_PROFIL_DETAIL, JSON.stringify(semua))
      } catch {
        // penyimpanan lokal tidak tersedia
      }
      setProfilStatus('Perubahan tersimpan.')
    } catch (err) {
      setProfilStatus(`Gagal menyimpan: ${err.message}`)
    }
  }

  useEffect(() => {
    let hidup = true
    api('/programs', { auth: false })
      .then((data) => hidup && setProgramApi(data))
      .catch(() => {})
    return () => {
      hidup = false
    }
  }, [])

  // pengingat 1 jam sebelum sesi untuk program yang diikuti
  useEffect(() => {
    if (!user?.email) return undefined
    const bersih = programApi
      .filter((p) => sudahIkut(user.email, p.id) && pengingatAktif(user.email, p.id))
      .map((p) => jadwalkanPengingat(p, jadwalUser(user.email, p)))
    return () => bersih.forEach((fn) => fn())
  }, [programApi, user, versi])

  const togglePengingat = async (p) => {
    const aktifkan = !pengingatAktif(user.email, p.id)
    if (aktifkan && 'Notification' in window && Notification.permission !== 'granted') {
      const izin = await Notification.requestPermission()
      if (izin !== 'granted') return
    }
    setPengingat(user.email, p.id, aktifkan)
    setVersi((v) => v + 1)
  }

  // buka otomatis pertemuan yang sedang berjalan
  useEffect(() => {
    if (tab !== 'program' || !programId || !user?.email) return
    const praw = programApi.find((x) => x.id === programId)
    if (!praw) return
    const data = bacaProgres(user.email, programId)
    const next = (praw.kurikulum ?? [])
      .flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit'))
      .find((s) => !(data.selesai ?? []).includes(s.id))
    setBukaSub(next?.id ?? null)
    setTemaTutup({})
  }, [tab, programId, programApi, user])

  // program yang diikuti, diturunkan dari data backend + progres lokal
  const programSaya = useMemo(() => {
    if (!user?.email) return []
    return programApi
      .filter((p) => (p.status ?? 'terbit') === 'terbit' && sudahIkut(user.email, p.id))
      .map((p) => {
        const data = bacaProgres(user.email, p.id)
        const { selesai: modulSelesai, total: totalModul, pct } = hitungProgres(p, data)
        const j = jadwalUser(user.email, p)
        const sesi = j ? sesiBerikutnya(j) : null
        const silabus = (p.kurikulum ?? [])
          .flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit'))
          .map((s) => ({ judul: s.judul, status: (data.selesai ?? []).includes(s.id) ? 'selesai' : 'terkunci' }))
        const idxJalan = silabus.findIndex((s) => s.status !== 'selesai')
        if (idxJalan >= 0) silabus[idxJalan] = { ...silabus[idxJalan], status: 'berjalan' }
        const hadirIds = bacaAbsensi(user.email, p.id)
        const nilaiMap = bacaPenilaian(user.email, p.id)
        const subIdTerbit = (p.kurikulum ?? []).flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit').map((s) => s.id))
        const hadirN = subIdTerbit.filter((id) => hadirIds.includes(id)).length
        const dinilaiN = subIdTerbit.filter((id) => {
          const raw = nilaiMap[id]
          return (typeof raw === 'number' ? raw : raw?.love ?? 0) > 0
        }).length
        const sesiBerikut = sesi ? `${formatTanggalPanjang(sesi)} \u00b7 ${j.mulai} WIB` : ''
        const kini = Date.now()
        const agendaSub = (p.kurikulum ?? [])
          .map((t) => {
            const subs = (t.sub ?? [])
              .filter((s) => s.status === 'terbit' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s.jadwal ?? '') && new Date(s.jadwal).getTime() >= kini)
              .sort((a, b) => new Date(a.jadwal) - new Date(b.jadwal))
            if (subs.length === 0) return null
            const awal = subs[0]
            const totalMenit = subs.reduce((a, s) => a + (Number(s.durasi) > 0 ? Number(s.durasi) : 45), 0)
            const akhirMs = Math.max(...subs.map((s) => new Date(s.jadwal).getTime() + (Number(s.durasi) > 0 ? Number(s.durasi) : 45) * 60000))
            const akhir = new Date(akhirMs)
            const jamAkhir = `${String(akhir.getHours()).padStart(2, '0')}:${String(akhir.getMinutes()).padStart(2, '0')}`
            return {
              jadwal: awal.jadwal,
              items: [
                {
                  id: awal.id,
                  tipe: 'sesi',
                  judul: t.judul,
                  tenggat: `${tanggalSub(awal.jadwal)} \u00b7 ${jamSub(awal.jadwal).replace(' WIB', '')}\u2013${jamAkhir} WIB`,
                  durasi: `${totalMenit} menit`,
                  tautan: awal.tautan || '',
                  aksi: awal.tautan ? 'Gabung Zoom' : 'Buka materi',
                },
                ...subs.map((s) => ({
                  id: s.id,
                  tipe: s.jenis === 'kuis' ? 'tugas' : 'sesi',
                  judul: s.judul,
                  tenggat: '',
                  durasi: Number(s.durasi) > 0 ? `${s.durasi} menit` : '45 menit',
                  lanjutan: true,
                  tautan: '',
                  aksi: 'Buka materi',
                })),
              ],
            }
          })
          .filter(Boolean)
          .sort((a, b) => new Date(a.jadwal) - new Date(b.jadwal))
          .flatMap((g) => g.items)
        return {
          id: p.id,
          nama: p.nama,
          kategori: p.kategori,
          gambar: p.gambar || gambarKategori(p.kategori),
          tutor: p.tutor,
          progres: pct,
          modulSelesai,
          totalModul,
          sesiBerikut,
          materiBerikut: idxJalan >= 0 ? silabus[idxJalan].judul : 'Semua materi selesai',
          terakhirDiakses: waktuRelatif(data.terakhir),
          status: totalModul > 0 && pct === 100 ? 'selesai' : 'berjalan',
          periode: j?.tanggalMulai
            ? `${formatTanggalPanjang(j.tanggalMulai)}${j.tanggalSelesai ? ` s.d. ${formatTanggalPanjang(j.tanggalSelesai)}` : ''}`
            : 'Belajar mandiri',
          kehadiran: { hadir: hadirN, absen: Math.max(0, modulSelesai - hadirN), sisa: Math.max(0, totalModul - modulSelesai) },
          tugasStat: { tepat: dinilaiN, terlambat: 0 },
          agenda: [
            ...agendaSub,
            ...(sesi ? [{ id: '', tipe: 'sesi', judul: `Sesi live: ${p.nama}`, tenggat: sesiBerikut, durasi: '45 menit', tautan: '', aksi: 'Buka materi' }] : []),
          ],
          silabus,
        }
      })
  }, [programApi, user, versi])

  const aktif = useMemo(() => programSaya.filter((p) => p.status === 'berjalan'), [programSaya])
  const selesai = useMemo(() => programSaya.filter((p) => p.status === 'selesai'), [programSaya])
  const unggulan = aktif[0]
  const rataProgres = programSaya.length
    ? Math.round(programSaya.reduce((a, p) => a + p.progres, 0) / programSaya.length)
    : 0
  const programTerpilih = programSaya.find((p) => p.id === programId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const semuaRiwayat = useMemo(() => bacaPesanan(), [versi])
  const tagihanTunggu = semuaRiwayat.filter((r) => r.status !== 'Lunas')

  // masa akses tiap program (model langganan) dari pembayaran lunas terakhir
  const aksesProgram = useMemo(() => {
    const peta = new Map()
    if (!user?.email) return peta
    for (const p of programApi)
      if ((p.status ?? 'terbit') === 'terbit' && sudahIkut(user.email, p.id)) peta.set(p.id, infoAkses(p, semuaRiwayat))
    return peta
  }, [programApi, user, semuaRiwayat])

  const notifAkses = useMemo(() => {
    const daftar = []
    for (const p of programApi) {
      const a = aksesProgram.get(p.id)
      if (!a || !a.berakhir) continue
      if (a.status === 'segera')
        daftar.push({ id: `akses-${p.id}`, judul: `Masa akses ${p.nama} berakhir pada ${formatBerakhir(a.berakhir)}. Lakukan perpanjangan agar pembelajaran tidak terputus.`, waktu: a.berakhir.toISOString(), baru: true, tab: 'program' })
      else if (a.status === 'habis')
        daftar.push({ id: `akses-${p.id}`, judul: `Masa akses ${p.nama} telah berakhir. Lakukan perpanjangan untuk melanjutkan pembelajaran.`, waktu: a.berakhir.toISOString(), baru: true, tab: 'program' })
      else if (a.status === 'tunggu' && a.tunggu)
        daftar.push({ id: `akses-${p.id}`, judul: `Perpanjangan ${p.nama} (${a.tunggu.invoice}) sedang menunggu konfirmasi admin. Akses belajar tetap terbuka.`, waktu: a.tunggu.createdAt || a.tunggu.tanggal, baru: false, tab: 'riwayat' })
    }
    return daftar
  }, [programApi, aksesProgram])

  const [filterRiwayat, setFilterRiwayat] = useState('semua')
  const jumlahProgram = semuaRiwayat.filter((r) => (r.jenis ?? 'toko') === 'program').length
  const jumlahToko = semuaRiwayat.length - jumlahProgram
  const riwayatTampil =
    filterRiwayat === 'semua' ? semuaRiwayat : semuaRiwayat.filter((r) => (r.jenis ?? 'toko') === filterRiwayat)

  // katalog enroll: program terbit yang belum diikuti
  const katalog = useMemo(
    () => programApi.filter((p) => (p.status ?? 'terbit') === 'terbit' && user?.email && !sudahIkut(user.email, p.id)),
    [programApi, user, versi],
  )

  // rapot: penilaian dari guru per sub materi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rapotSaya = useMemo(() => {
    if (!user?.email) return []
    return programApi
      .filter((p) => (p.status ?? 'terbit') === 'terbit' && sudahIkut(user.email, p.id))
      .map((p) => {
        const nilaiMap = bacaPenilaian(user.email, p.id)
        const item = (p.kurikulum ?? [])
          .flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit'))
          .map((s) => {
            const raw = nilaiMap[s.id]
            const love = typeof raw === 'number' ? raw : raw?.love ?? 0
            const komentar = typeof raw === 'object' ? raw?.komentar ?? '' : ''
            return { id: s.id, judul: s.judul, love, komentar }
          })
        const dinilai = item.filter((x) => x.love > 0)
        const rerata = dinilai.length
          ? Math.round((dinilai.reduce((a, x) => a + x.love, 0) / dinilai.length) * 10) / 10
          : 0
        return { id: p.id, nama: p.nama, tutor: p.tutor, item, dinilai: dinilai.length, total: item.length, rerata }
      })
      .filter((r) => r.total > 0)
  }, [programApi, user, versi])

  const notifNilai = useMemo(() => {
    const daftar = []
    for (const r of rapotSaya)
      for (const x of r.item)
        if (x.love > 0)
          daftar.push({
            id: `nilai-${r.id}-${x.id}`,
            judul: `Guru memberi nilai ${x.love}/5 untuk “${x.judul}”${x.komentar ? `: “${x.komentar}”` : ''}`,
            waktu: r.nama,
          })
    return daftar
  }, [rapotSaya])

  const tandaiNilaiBaca = () => {
    const semua = notifNilai.map((n) => n.id)
    if (!semua.length || semua.every((id) => nilaiBaca.includes(id))) return
    setNilaiBaca(semua)
    try {
      const peta = JSON.parse(localStorage.getItem('hifzNilaiBaca') ?? '{}')
      peta[user.email] = semua
      localStorage.setItem('hifzNilaiBaca', JSON.stringify(peta))
    } catch {
      localStorage.setItem('hifzNilaiBaca', JSON.stringify({ [user.email]: semua }))
    }
  }

  // notifikasi: konfirmasi pembayaran + masa akses + tagihan menunggu + penilaian baru dari guru
  const notifikasi = [
    ...notifBayar,
    ...notifAkses,
    ...notifNilai.map((n) => ({ ...n, baru: !nilaiBaca.includes(n.id), tab: 'rapot' })),
    ...tagihanTunggu.map((t) =>
      t.buktiBayar || t.atasNama
        ? {
            id: t.invoice,
            judul: `Pembayaran ${t.invoice} (${t.item}) sedang menunggu konfirmasi admin.${(t.jenis ?? 'toko') === 'program' ? ' Pelajaran terbuka setelah pembayaran dikonfirmasi lunas.' : ''}`,
            waktu: t.buktiWaktu || t.createdAt || t.tanggal,
            baru: true,
            tab: 'riwayat',
          }
        : {
            id: t.invoice,
            judul: `Selesaikan pembayaran ${t.invoice} (${t.item})${t.metode ? ` via ${t.metode}` : ''}`,
            waktu: t.createdAt || t.tanggal,
            baru: true,
            tab: 'riwayat',
          },
    ),
  ]

  const aktivitasTerbaru = programSaya
    .filter((p) => p.modulSelesai > 0)
    .map((p) => ({
      id: p.id,
      tipe: 'modul',
      teks: `Menyelesaikan ${p.modulSelesai} dari ${p.totalModul} sub materi`,
      program: p.nama,
      waktu: p.terakhirDiakses,
    }))

  const jmlKeranjang = useMemo(() => {
    try {
      const isi = JSON.parse(localStorage.getItem('hifzKeranjang') || '[]')
      return isi.reduce((t, i) => t + (i.jumlah || 0), 0)
    } catch {
      return 0
    }
  }, [])

  const bukaProgram = (id) => {
    setProgramId(id)
    setTab('program')
  }

  const keluar = () => {
    localStorage.removeItem('hifzUser')
    navigate('/', { replace: true })
  }

  if (!user) return null

  const notifBaru = notifikasi.filter((n) => n.baru).length

  return (
    <div className={`db db--user${collapsed ? ' is-collapsed' : ''}`}>
      {/* ------- Sidebar ------- */}
      <aside className="db-side">
        <button
          type="button"
          className="db-collapse"
          aria-label={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <PanelLeftOpen size={15} strokeWidth={1.9} /> : <PanelLeftClose size={15} strokeWidth={1.9} />}
        </button>

        <Link to="/" className="db-logo">
          <img src="/logo/logo-mark.png" alt="Hifz" />
          <span className="db-logo-teks">Hifz</span>
        </Link>

        <p className="db-nav-label">Menu</p>
        <nav className="db-nav">
          <button
            type="button"
            title="Ringkasan"
            className={tab === 'ringkasan' ? 'active' : ''}
            onClick={() => setTab('ringkasan')}
          >
            <LayoutDashboard size={17} strokeWidth={1.9} />
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            title="Program"
            className={tab === 'program' ? 'active' : ''}
            onClick={() => {
              setProgramId(null)
              setTab('program')
            }}
          >
            <BookOpen size={17} strokeWidth={1.9} />
            <span>Program</span>
          </button>

          <button
            type="button"
            title="Profil"
            className={`db-nav-profil${tab === 'profil' ? ' active' : ''}`}
            onClick={() => setTab('profil')}
          >
            {user.foto
              ? <img className="db-nav-foto" src={user.foto} alt="" />
              : <span className="db-nav-foto">{inisial(user.nama)}</span>}
            <span>Profil</span>
          </button>

          {NAV.filter(({ id }) => id !== 'ringkasan').map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              className={`db-nav-desk${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="db-side-foot">
          <button type="button" className="db-logout" title="Keluar" onClick={keluar}>
            <LogOut size={16} strokeWidth={1.9} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ------- Konten ------- */}
      <div className="db-main">
        <header className="db-top">
          <div className="db-top-kiri">
            <Link className="db-bell db-top-back" to="/" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ArrowLeft size={17} strokeWidth={1.9} />
            </Link>
            <div>
              <h1>
                {tab === 'ringkasan' && <>Ahlan, <em>{user.nama.split(' ')[0]}</em>!</>}
                {tab === 'program' && (programTerpilih?.nama ?? 'Program')}
                {tab === 'riwayat' && 'Riwayat Pembelian'}
                {tab === 'enroll' && 'Enroll Program'}
                {tab === 'rapot' && 'Rapot Penilaian'}
                {tab === 'konsultasi' && 'Konsultasi'}
                {tab === 'profil' && 'Profil Saya'}
              </h1>
            </div>
          </div>
          <div className="db-top-actions">
            {openPop && <button type="button" className="db-pop-overlay" aria-label="Tutup" onClick={() => setOpenPop(null)} />}

            <Link className="db-bell" to="/keranjang" aria-label="Keranjang">
              <ShoppingCart size={18} strokeWidth={1.9} />
              {jmlKeranjang > 0 && <i>{jmlKeranjang}</i>}
            </Link>

            <div className="db-pop">
              <button
                type="button"
                className="db-bell"
                aria-label="Notifikasi"
                onClick={() => {
                  setOpenPop((v) => (v === 'notif' ? null : 'notif'))
                  tandaiNilaiBaca()
                  tandaiBayarBaca()
                }}
              >
                <Bell size={18} strokeWidth={1.9} />
                {notifBaru > 0 && <i>{notifBaru}</i>}
              </button>
              {openPop === 'notif' && (
                <div className="db-pop-menu db-pop-menu--notif">
                  <header>
                    <h5>Notifikasi</h5>
                    <span>{notifBaru} baru</span>
                  </header>
                  <ul>
                    {notifikasi.length === 0 && (
                      <li>
                        <p>Belum ada notifikasi.</p>
                      </li>
                    )}
                    {notifikasi.map((n) => (
                      <li key={n.id} className={n.baru ? 'is-baru' : ''}>
                        <button
                          type="button"
                          className="db-notif-klik"
                          onClick={() => {
                            if (n.tab) setTab(n.tab)
                            setOpenPop(null)
                          }}
                        >
                          <p>{n.judul}</p>
                          <span>{waktuNotif(n.waktu)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="db-pop">
              <button
                type="button"
                className="db-top-profile"
                aria-label="Menu profil"
                onClick={() => setOpenPop((v) => (v === 'profil' ? null : 'profil'))}
              >
                {user.foto
                  ? <img className="db-top-ava" src={user.foto} alt="" />
                  : <span className="db-top-ava db-ava-ini">{inisial(user.nama)}</span>}
              </button>
              {openPop === 'profil' && (
                <div className="db-pop-menu db-pop-menu--profil">
                  <div className="db-pop-user">
                    <strong>{user.nama}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('profil')
                      setOpenPop(null)
                    }}
                  >
                    <UserRound size={15} strokeWidth={1.9} /> Profil saya
                  </button>
                  <button type="button" className="is-keluar" onClick={keluar}>
                    <LogOut size={15} strokeWidth={1.9} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* ================= RINGKASAN ================= */}
            {tab === 'ringkasan' && (() => {
              const totalModul = programSaya.reduce((a, p) => a + p.totalModul, 0)
              const totalSelesai = programSaya.reduce((a, p) => a + p.modulSelesai, 0)
              const totalHadir = programSaya.reduce((a, p) => a + p.kehadiran.hadir, 0)
              const totalSesi = programSaya.reduce((a, p) => a + p.kehadiran.hadir + p.kehadiran.absen, 0)
              const nominalTagihan = tagihanTunggu.reduce((a, t) => a + t.total, 0)
              const kehadiranPct = totalSesi > 0 ? Math.round((totalHadir / totalSesi) * 100) : 0
              const nilaiPeta = new Map(rapotSaya.map((r) => [r.id, r]))
              const dinilaiTotal = rapotSaya.reduce((a, r) => a + r.dinilai, 0)
              const rerataNilai = dinilaiTotal > 0
                ? Math.round((rapotSaya.reduce((a, r) => a + r.rerata * r.dinilai, 0) / dinilaiTotal) * 10) / 10
                : 0
              const agendaSemua = aktif.flatMap((p) => p.agenda.filter((a) => !a.lanjutan).map((a) => ({ ...a, program: p.nama, programId: p.id })))
              return (
              <div className="db-page">
                <div className="db-statbar">
                  <div className="db-statcell">
                    <span className="db-stat-ic"><GraduationCap size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{aktif.length}</strong>
                      <p>Program berjalan</p>
                      <em>{selesai.length} program selesai</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><BookOpenCheck size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{totalSelesai}</strong>
                      <p>Modul diselesaikan</p>
                      <em>dari {totalModul} modul total</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><UserCheck size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{totalSesi > 0 ? `${kehadiranPct}%` : '–'}</strong>
                      <p>Kehadiran sesi</p>
                      <em>{totalSesi > 0 ? `${totalHadir} hadir dari ${totalSesi} sesi` : 'belum ada sesi tercatat'}</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic db-stat-ic--gold"><ReceiptText size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{tagihanTunggu.length}</strong>
                      <p>Tagihan menunggu</p>
                      <em>{tagihanTunggu.length > 0 ? `senilai ${formatRupiah(nominalTagihan)}` : 'semua lunas'}</em>
                    </div>
                  </div>
                </div>

                <div className="db-cols">
                  <div className="db-col-main">
                    {unggulan && (
                      <article className="db-continue">
                        <div className="db-continue-media">
                          <img src={unggulan.gambar} alt={unggulan.nama} />
                          <span className="db-chip">{unggulan.kategori}</span>
                        </div>
                        <div className="db-continue-body">
                          <p className="db-eyebrow">Lanjutkan belajar</p>
                          <h3>{unggulan.nama}</h3>
                          <p className="db-continue-materi">
                            <PlayCircle size={15} strokeWidth={1.9} /> {unggulan.materiBerikut}
                          </p>
                          <div className="db-continue-meta">
                            <span>{unggulan.modulSelesai}/{unggulan.totalModul} modul</span>
                            <span>{unggulan.progres}%</span>
                          </div>
                          <Bar value={unggulan.progres} />
                          <div className="db-continue-foot">
                            <span className="db-jadwal">
                              <CalendarClock size={14} strokeWidth={1.9} /> {unggulan.sesiBerikut ? `Sesi berikutnya ${unggulan.sesiBerikut}` : 'Belajar mandiri'}
                            </span>
                            <button type="button" className="db-btn db-btn--lg" onClick={() => bukaProgram(unggulan.id)}>
                              Lanjutkan <ArrowUpRight size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </article>
                    )}

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Analitik program</h4>
                        <span className="db-block-sub">{programSaya.length} program diikuti</span>
                      </header>
                      <div className="db-ana-list db-gulir">
                        {programSaya.length === 0 && <p className="db-kosong">Belum ada program diikuti.</p>}
                        {programSaya.map((p) => {
                          const rapot = nilaiPeta.get(p.id)
                          const sesiProg = p.kehadiran.hadir + p.kehadiran.absen
                          const hadirPct = sesiProg > 0 ? Math.round((p.kehadiran.hadir / sesiProg) * 100) : 0
                          const nilaiPct = rapot && rapot.dinilai > 0 ? Math.round((rapot.rerata / 5) * 100) : 0
                          return (
                            <article
                              key={p.id}
                              className="db-ana"
                              role="button"
                              tabIndex={0}
                              onClick={() => bukaProgram(p.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') bukaProgram(p.id)
                              }}
                            >
                              <div className="db-ana-head">
                                <img src={p.gambar} alt="" />
                                <div>
                                  <strong>{p.nama}</strong>
                                  <span>{p.kategori} · {p.terakhirDiakses === 'belum dibuka' ? 'belum dibuka' : `dibuka ${p.terakhirDiakses}`}</span>
                                </div>
                                <em className={`db-ana-status${p.status === 'selesai' ? ' is-selesai' : ''}`}>
                                  {p.status === 'selesai' ? 'Selesai' : 'Berjalan'}
                                </em>
                              </div>
                              <div className="db-ana-metrik">
                                <div>
                                  <span>Progres modul</span>
                                  <Bar value={p.progres} />
                                  <b>{p.modulSelesai}/{p.totalModul} · {p.progres}%</b>
                                </div>
                                <div>
                                  <span>Kehadiran</span>
                                  <Bar value={hadirPct} />
                                  <b>{sesiProg > 0 ? `${p.kehadiran.hadir}/${sesiProg} · ${hadirPct}%` : 'belum ada sesi'}</b>
                                </div>
                                <div>
                                  <span>Nilai guru</span>
                                  <Bar value={nilaiPct} />
                                  <b>{rapot && rapot.dinilai > 0 ? `${rapot.rerata}/5 · ${rapot.dinilai} dinilai` : 'belum dinilai'}</b>
                                </div>
                              </div>
                              <footer className="db-ana-foot">
                                <span><CalendarClock size={12} strokeWidth={1.9} /> {p.sesiBerikut ? `Sesi berikutnya ${p.sesiBerikut}` : 'Belajar mandiri'}</span>
                                <span><PlayCircle size={12} strokeWidth={1.9} /> {p.materiBerikut}</span>
                              </footer>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  </div>

                  <aside className="db-col-side">
                    <section className="db-block db-ring-card">
                      <header className="db-block-head"><h4>Progres keseluruhan</h4></header>
                      <div className="db-donut-wrap">
                        <div
                          className="db-donut"
                          role="img"
                          aria-label={`Rata-rata progres ${rataProgres} persen`}
                          style={{ background: `conic-gradient(var(--green, #92c841) ${rataProgres * 3.6}deg, #edf2e4 0)` }}
                        >
                          <span><strong>{rataProgres}%</strong><small>rata-rata</small></span>
                        </div>
                        <ul className="db-donut-info">
                          <li><i className="is-hijau" /> Modul selesai <b>{totalSelesai}</b></li>
                          <li><i className="is-abu" /> Modul tersisa <b>{Math.max(0, totalModul - totalSelesai)}</b></li>
                          <li><i className="is-emas" /> Nilai rerata <b>{dinilaiTotal > 0 ? `${rerataNilai}/5` : '–'}</b></li>
                        </ul>
                      </div>
                      <div className="db-stack" aria-hidden="true">
                        <i style={{ width: `${totalModul > 0 ? (totalSelesai / totalModul) * 100 : 0}%` }} />
                      </div>
                      <p className="db-stack-ket">{totalSelesai} dari {totalModul} modul terbit telah diselesaikan.</p>
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Tenggat terdekat</h4>
                        <span className="db-block-sub">{agendaSemua.length} agenda</span>
                      </header>
                      <ul className="db-tenggat db-gulir">
                        {agendaSemua.length === 0 && <li><div><p>Belum ada agenda terdekat.</p></div></li>}
                        {agendaSemua.map((a, i) => (
                          <li key={`${a.programId}-${i}-${a.judul}`} role="button" tabIndex={0} onClick={() => bukaProgram(a.programId)}>
                            <span className={`db-agenda-tipe ${a.tipe === 'sesi' ? 'is-sesi' : 'is-tugas'}`}>
                              {a.tipe === 'sesi' ? <Video size={11} strokeWidth={2} /> : <ClipboardList size={11} strokeWidth={2} />}
                              {a.tipe === 'sesi' ? 'Sesi' : 'Tugas'}
                            </span>
                            <div>
                              <p>{a.judul}</p>
                              <span>{a.program} · {a.tenggat}{a.durasi ? ` · ${a.durasi}` : ''}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {tagihanTunggu.length > 0 && (
                      <section className="db-alert">
                        <div>
                          <strong>{tagihanTunggu[0].invoice} {tagihanTunggu[0].buktiBayar ? 'menunggu konfirmasi admin' : 'menunggu pembayaran'}</strong>
                          <span>{tagihanTunggu[0].item}</span>
                          <span>{formatRupiah(tagihanTunggu[0].total)} · dipesan {tagihanTunggu[0].tanggal}</span>
                        </div>
                        <button type="button" className="db-btn db-btn--sm" onClick={() => setTab('riwayat')}>
                          {tagihanTunggu[0].buktiBayar ? 'Riwayat' : 'Bayar'}
                        </button>
                      </section>
                    )}

                    {(() => {
                      const seg = programApi.find((p) => ['segera', 'habis'].includes(aksesProgram.get(p.id)?.status))
                      if (!seg) return null
                      const a = aksesProgram.get(seg.id)
                      return (
                        <section className="db-alert">
                          <div>
                            <strong>Masa akses {seg.nama} {a.status === 'habis' ? 'telah berakhir' : `berakhir ${a.sisaHari} hari lagi`}</strong>
                            <span>berlaku hingga {formatBerakhir(a.berakhir)}</span>
                            <span>{formatRupiah(seg.harga ?? 0)} · perpanjangan</span>
                          </div>
                          <button type="button" className="db-btn db-btn--sm" onClick={() => setBayarProgram({ id: seg.id, nama: seg.nama, harga: seg.harga ?? 0, perpanjang: true })}>
                            Perpanjang
                          </button>
                        </section>
                      )
                    })()}

                    <section className="db-block">
                      <header className="db-block-head"><h4>Aktivitas terbaru</h4></header>
                      <ul className="db-activity db-gulir">
                        {aktivitasTerbaru.length === 0 && (
                          <li>
                            <span className="db-act-ic"><Sparkles size={15} strokeWidth={1.9} /></span>
                            <div>
                              <p>Belum ada aktivitas.</p>
                            </div>
                          </li>
                        )}
                        {aktivitasTerbaru.map((a) => {
                          const Icon = ikonAktivitas[a.tipe] ?? Sparkles
                          return (
                            <li key={a.id}>
                              <span className="db-act-ic"><Icon size={15} strokeWidth={1.9} /></span>
                              <div>
                                <p>{a.teks}</p>
                                <span>{a.program} · {a.waktu}</span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  </aside>
                </div>
              </div>
              )
            })()}

            {/* ================= DAFTAR KELAS ================= */}
            {tab === 'program' && !programTerpilih && (
              <div className="db-page">
                <div className="db-kelas-atas">
                  <div>
                    <h4>Kelas saya</h4>
                    <p className="db-kelas-mini">
                      <span title="Kelas berjalan"><PlayCircle size={13} strokeWidth={2} /> {aktif.length}</span>
                      <span title="Kelas selesai"><BadgeCheck size={13} strokeWidth={2} /> {selesai.length}</span>
                    </p>
                  </div>
                  <button type="button" className="db-btn db-btn--sm" onClick={() => navigate('/program')}>
                    Jelajahi program <ArrowUpRight size={14} strokeWidth={2} />
                  </button>
                </div>
                {programSaya.length === 0 && (
                  <p className="db-kosong">Belum ada kelas yang diikuti.</p>
                )}
                <div className="db-kelas-grid">
                  {programSaya.map((p) => (
                    <article
                      key={p.id}
                      className="db-kelas-kartu"
                      role="button"
                      tabIndex={0}
                      onClick={() => bukaProgram(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          bukaProgram(p.id)
                        }
                      }}
                    >
                      <div className="db-kelas-media">
                        <img src={p.gambar} alt={p.nama} loading="lazy" />
                        <span>{p.kategori}</span>
                        <em className={`db-kelas-pct${p.status === 'selesai' ? ' is-selesai' : ''}${aksesProgram.get(p.id)?.status === 'habis' ? ' is-habis' : ''}`}>
                          {aksesProgram.get(p.id)?.status === 'habis'
                            ? <><Lock size={12} strokeWidth={2} /> Berakhir</>
                            : p.status === 'selesai' ? <><BadgeCheck size={12} strokeWidth={2} /> Selesai</> : `${p.progres}%`}
                        </em>
                      </div>
                      <div className="db-kelas-isi">
                        <strong>{p.nama}</strong>
                        {(() => {
                          const namaTutor = p.tutor && p.tutor !== 'Belum ditentukan' ? p.tutor : 'Tim Pengajar Hifz'
                          return (
                            <span className="db-kelas-guru">
                              <img src={avatarGuru(namaTutor)} alt={namaTutor} loading="lazy" />
                              {namaTutor}
                            </span>
                          )
                        })()}
                        <div className="db-kelas-progres">
                          <span className="db-tema-bar" aria-hidden="true"><i style={{ width: `${p.progres}%` }} /></span>
                          <em>{p.modulSelesai}/{p.totalModul}</em>
                        </div>
                        <span className="db-kelas-lanjut" title={p.status === 'selesai' ? 'Lihat kelas' : 'Lanjutkan belajar'}>
                          <ArrowUpRight size={14} strokeWidth={2} />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* ================= PROGRAM SAYA ================= */}
            {tab === 'program' && programTerpilih && (() => {
              const praw = programApi.find((x) => x.id === programTerpilih.id)
              const data = bacaProgres(user.email, programTerpilih.id)
              const opsiJadwal = praw ? daftarJadwal(praw.jadwal) : []
              const j = praw ? jadwalUser(user.email, praw) : null
              const ingat = pengingatAktif(user.email, programTerpilih.id)
              const subDaftar = (praw?.kurikulum ?? []).flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit'))
              const idxJalan = subDaftar.findIndex((s) => !(data.selesai ?? []).includes(s.id))
              const statusSub = (id) => {
                if ((data.selesai ?? []).includes(id)) return 'selesai'
                return subDaftar.findIndex((s) => s.id === id) === idxJalan ? 'berjalan' : 'terjadwal'
              }
              const hadir = bacaAbsensi(user.email, programTerpilih.id).filter((id) => subDaftar.some((s) => s.id === id))
              const subJalan = idxJalan >= 0 ? subDaftar[idxJalan] : null
              const penilaianKelas = bacaPenilaian(user.email, programTerpilih.id)
              const rapotKelas = rapotSaya.find((r) => r.id === programTerpilih.id)
              const akses = aksesProgram.get(programTerpilih.id)
              return (
              <div className="db-page">
                <button type="button" className="db-btn db-btn--sm db-btn--ghost db-kembali" onClick={() => setProgramId(null)}>
                  <ArrowLeft size={14} strokeWidth={2} /> Semua kelas
                </button>
                <div className="db-prog">
                  <div className="db-prog-main">
                    <section className="db-kelas-stats">
                      <article>
                        <span className="db-kelas-ic"><BadgeCheck size={16} strokeWidth={1.9} /></span>
                        <div>
                          <strong>{programTerpilih.progres}%</strong>
                          <span>Progres kelas</span>
                        </div>
                        <span className="db-kelas-bar" aria-hidden="true"><i style={{ width: `${programTerpilih.progres}%` }} /></span>
                      </article>
                      <article>
                        <span className="db-kelas-ic"><BookOpenCheck size={16} strokeWidth={1.9} /></span>
                        <div>
                          <strong>{programTerpilih.modulSelesai}/{programTerpilih.totalModul}</strong>
                          <span>Materi selesai</span>
                        </div>
                      </article>
                      <article>
                        <span className="db-kelas-ic"><UserCheck size={16} strokeWidth={1.9} /></span>
                        <div>
                          <strong>{hadir.length}/{subDaftar.length}</strong>
                          <span>Kehadiran</span>
                        </div>
                      </article>
                      <article>
                        <span className="db-kelas-ic"><Award size={16} strokeWidth={1.9} /></span>
                        <div>
                          <strong>{rapotKelas && rapotKelas.dinilai > 0 ? `${rapotKelas.rerata}/5` : 'Belum dinilai'}</strong>
                          <span>Nilai guru</span>
                        </div>
                      </article>
                    </section>

                    {akses?.status === 'habis' ? (
                      <section className="db-block db-akses-habis">
                        <span className="db-akses-ic"><Lock size={19} strokeWidth={1.9} /></span>
                        <h4>Masa akses berakhir</h4>
                        <p>Berakhir pada {formatBerakhir(akses.berakhir)}. Lakukan perpanjangan untuk melanjutkan pembelajaran.</p>
                        {praw && (
                          <button type="button" className="db-btn db-btn--sm" onClick={() => setBayarProgram({ id: praw.id, nama: praw.nama, harga: praw.harga ?? 0, perpanjang: true })}>
                            <RefreshCw size={14} strokeWidth={2} /> Perpanjang
                          </button>
                        )}
                      </section>
                    ) : (
                    <>
                    {akses?.status === 'tunggu' && akses.tunggu && (
                      <p className="db-akses-note">
                        <Hourglass size={13} strokeWidth={2} /> Perpanjangan {akses.tunggu.invoice} menunggu konfirmasi admin
                      </p>
                    )}
                    {programTerpilih.status === 'berjalan' ? (
                      <section className="db-block">
                        <header className="db-block-head">
                          <h4>Agenda terdekat</h4>
                        </header>
                        {(() => {
                          const stop = programTerpilih.agenda.findIndex((a, i) => i > 0 && !a.lanjutan)
                          const grup = stop > 0 ? programTerpilih.agenda.slice(0, stop) : programTerpilih.agenda
                          const induk = grup[0]
                          const subs = grup.slice(1)
                          if (!induk) return <p className="db-agenda-kosong">Belum ada agenda terdekat.</p>
                          return (
                            <div className="db-agenda-card">
                              <header>
                                <span className="db-agenda-ic is-sesi"><Video size={15} strokeWidth={1.9} /></span>
                                <div className="db-agenda-isi">
                                  <strong>{induk.judul}</strong>
                                  <span>{['Sesi Live', induk.tenggat, induk.durasi].filter(Boolean).join(' · ')}</span>
                                </div>
                                {induk.tautan ? (
                                  <a className="db-btn db-btn--sm" href={induk.tautan} target="_blank" rel="noreferrer">
                                    <Video size={13} strokeWidth={2} /> {induk.aksi}
                                  </a>
                                ) : (
                                  <button type="button" className="db-btn db-btn--sm db-btn--ghost" onClick={() => induk.id && setBukaSub(induk.id)}>{induk.aksi}</button>
                                )}
                              </header>
                              {subs.length > 0 && (
                                <ul>
                                  {subs.map((a, i) => (
                                    <li key={`${i}-${a.judul}`}>
                                      <span className={`db-agenda-ic is-${a.tipe}`}>
                                        {a.tipe === 'sesi' ? <Video size={15} strokeWidth={1.9} /> : <ClipboardList size={15} strokeWidth={1.9} />}
                                      </span>
                                      <div className="db-agenda-isi">
                                        <strong>{a.judul}</strong>
                                        <span>{[a.tipe === 'sesi' ? 'Sesi Live' : 'Tugas', a.tenggat, a.durasi].filter(Boolean).join(' · ')}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })()}
                      </section>
                    ) : (() => {
                      const perp = semuaRiwayat.find((r) => (r.jenis ?? 'toko') === 'program' && String(r.item || '').startsWith('Perpanjangan') && Array.isArray(r.programIds) && r.programIds.includes(programTerpilih.id) && r.status !== 'Dibatalkan')
                      return (
                      <section className="db-prog-done">
                        <CheckCircle2 size={22} strokeWidth={1.9} />
                        <div>
                          <h4>Program telah selesai</h4>
                          {perp?.status === 'Menunggu' && <p>Menunggu konfirmasi · {perp.invoice}</p>}
                          {perp?.status === 'Lunas' && <p>Perpanjangan aktif</p>}
                        </div>
                        {!perp && praw && (
                          <button type="button" className="db-btn db-btn--sm db-btn--ghost" onClick={() => setBayarProgram({ id: praw.id, nama: praw.nama, harga: praw.harga ?? 0, perpanjang: true })}>
                            <RefreshCw size={14} strokeWidth={2} /> Perpanjang
                          </button>
                        )}
                        <button type="button" className="db-btn db-btn--sm">
                          <Download size={14} strokeWidth={2} /> Sertifikat
                        </button>
                      </section>
                      )
                    })()}

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Materi pembelajaran</h4>
                      </header>
                      {(praw?.kurikulum ?? []).map((t, ti) => {
                        const items = (t.sub ?? []).filter((s) => s.status === 'terbit')
                        if (items.length === 0) return null
                        const tutup = !!temaTutup[t.id]
                        const toggleTemaBelajar = () => setTemaTutup((o) => ({ ...o, [t.id]: !o[t.id] }))
                        return (
                          <div key={t.id} className="db-belajar-tema">
                            <div
                              className="db-tema-head"
                              role="button"
                              tabIndex={0}
                              aria-expanded={!tutup}
                              onClick={toggleTemaBelajar}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  toggleTemaBelajar()
                                }
                              }}
                            >
                              <span className="db-tema-no">{String(ti + 1).padStart(2, '0')}</span>
                              <span className="db-tema-teks">
                                <strong>{t.judul}</strong>
                                <em>{items.length} sub materi</em>
                              </span>
                              <ChevronDown size={15} strokeWidth={2} className={`db-tema-caret${tutup ? '' : ' is-buka'}`} />
                            </div>
                            {!tutup && (
                            <ul className="db-ceklist">
                              {items.map((m) => {
                                const Ic = ikonModul[m.jenis] ?? FileText
                                const st = statusSub(m.id)
                                const terbuka = bukaSub === m.id
                                const ringkas = [tanggalSub(m.jadwal), jamSub(m.jadwal), Number(m.durasi) > 0 ? `${m.durasi} menit` : '45 menit'].filter(Boolean).join(' · ')
                                return (
                                  <li key={m.id} className={`is-${st}${terbuka ? ' is-buka' : ''}`}>
                                    <div
                                      className="db-cek-baris"
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => setBukaSub(terbuka ? null : m.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault()
                                          setBukaSub(terbuka ? null : m.id)
                                        }
                                      }}
                                    >
                                      <span className={`db-cek-num is-${st}`}>
                                        {st === 'selesai' ? <CheckCircle2 size={15} strokeWidth={2} /> : <Ic size={14} strokeWidth={1.9} />}
                                      </span>
                                      <span className="db-cek-isi">
                                        <strong>{m.judul}</strong>
                                        <span>{[labelTipe(m.jenis ?? 'video'), ringkas || 'Materi mandiri'].join(' · ')}</span>
                                      </span>
                                      {st === 'berjalan' && m.tautan && (
                                        <a className="db-btn db-btn--sm db-cek-zoom" href={m.tautan} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                          <Video size={13} strokeWidth={2} /> Zoom
                                        </a>
                                      )}
                                      <ChevronDown size={15} strokeWidth={2} className="db-cek-caret" />
                                    </div>
                                    {terbuka && (() => {
                                      const nilaiGuru = penilaianKelas[m.id]
                                      const love = typeof nilaiGuru === 'number' ? nilaiGuru : nilaiGuru?.love ?? 0
                                      const komentarGuru = typeof nilaiGuru === 'object' ? nilaiGuru?.komentar ?? '' : ''
                                      return (
                                      <div className="db-cek-detail">
                                        {m.narasi && <p className="db-cek-narasi">{m.narasi}</p>}
                                        {m.jenis === 'video' && youtubeId(m.konten) && (
                                          <div className="db-cek-video">
                                            <PlayerTertutup videoId={youtubeId(m.konten)} judul={m.judul} />
                                          </div>
                                        )}
                                        <div className="db-cek-aksi">
                                          <span className="db-cek-file"><GraduationCap size={13} strokeWidth={2} /> {m.pengajar || programTerpilih.tutor}</span>
                                          {m.konten && m.jenis !== 'video' && <span className="db-cek-file"><Paperclip size={13} strokeWidth={2} /> {m.konten}</span>}
                                        </div>
                                        <div className="db-cek-lapor">
                                          <div className="db-cek-lapor-head">
                                            <ClipboardList size={14} strokeWidth={1.9} />
                                            <strong>Penilaian</strong>
                                            <span className="db-love" role="img" aria-label={`${love} dari 5`}>
                                              {[1, 2, 3, 4, 5].map((n) => (
                                                <Heart key={n} size={15} strokeWidth={1.9} className={n <= love ? 'is-isi' : ''} />
                                              ))}
                                            </span>
                                          </div>
                                          {komentarGuru && <p className="db-cek-komentar">{komentarGuru}</p>}
                                          {st === 'selesai' && (
                                            <button type="button" className="db-btn db-btn--ghost db-btn--sm" onClick={() => setTab('rapot')}>
                                              Lihat rapot
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      )
                                    })()}
                                  </li>
                                )
                              })}
                            </ul>
                            )}
                          </div>
                        )
                      })}
                    </section>
                    </>
                    )}
                  </div>

                  <aside className="db-prog-side">
                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Detail program</h4>
                        <span className="db-prog-pct">{programTerpilih.progres}%</span>
                      </header>
                      <Bar value={programTerpilih.progres} />
                      <ul className="db-prog-meta">
                        <li><GraduationCap size={14} strokeWidth={1.9} /> {programTerpilih.tutor}</li>
                        <li><Timer size={14} strokeWidth={1.9} /> 45 menit/pertemuan</li>
                        <li><CalendarClock size={14} strokeWidth={1.9} /> {akses?.berakhir ? `Akses hingga ${formatBerakhir(akses.berakhir)}` : 'Akses aktif'}</li>
                        <li><BadgeCheck size={14} strokeWidth={1.9} /> {programTerpilih.modulSelesai}/{programTerpilih.totalModul} dinilai guru</li>
                      </ul>
                      <div className="db-prog-btns">
                        <button type="button" className="db-btn db-btn--sm" onClick={() => setTab('rapot')}>
                          <Award size={14} strokeWidth={2} /> Rapot
                        </button>
                        <button type="button" className="db-btn db-btn--sm db-btn--ghost">
                          <MessagesSquare size={14} strokeWidth={2} /> Grup
                        </button>
                      </div>
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Absensi</h4>
                      </header>
                      <div className="db-absen-grid">
                        {subDaftar.map((s, i) => (
                          <span
                            key={s.id}
                            className={`db-absen-dot${hadir.includes(s.id) ? ' is-hadir' : statusSub(s.id) === 'berjalan' ? ' is-jalan' : ''}`}
                            title={s.judul}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                      {subJalan && hadir.includes(subJalan.id) && (
                        <p className="db-absen-ok"><CheckCircle2 size={14} strokeWidth={2} /> Hadir</p>
                      )}
                    </section>

                    {j && praw && (
                      <section className="db-block">
                        <header className="db-block-head"><h4>Sinkron jadwal</h4></header>
                        {opsiJadwal.length > 1 && (
                          <label className="db-jadwal-pilihan">
                            <span>Jadwal</span>
                            <select
                              value={j.id}
                              onChange={(e) => {
                                pilihJadwal(user.email, praw.id, e.target.value)
                                setVersi((v) => v + 1)
                              }}
                            >
                              {opsiJadwal.map((o) => (
                                <option key={o.id} value={o.id}>{o.label} · {ringkasJadwal(o)}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        <div className="db-sync-ikon">
                          <a className="db-td-btn" title="Google Calendar" aria-label="Google Calendar" href={linkGoogleKalender(praw, j)} target="_blank" rel="noreferrer">
                            <CalendarPlus size={15} strokeWidth={2} />
                          </a>
                          <button type="button" className="db-td-btn" title="Simpan .ics" aria-label="Simpan .ics" onClick={() => unduhICS(praw, j)}>
                            <Download size={15} strokeWidth={2} />
                          </button>
                          <button type="button" className={`db-td-btn${ingat ? ' is-aktif' : ''}`} title={ingat ? 'Pengingat aktif' : 'Pengingat'} aria-label="Pengingat" onClick={() => togglePengingat(praw)}>
                            <BellRing size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </section>
                    )}
                  </aside>
                </div>
              </div>
              )
            })()}

            {tab === 'riwayat' && (
              <div className="db-page">
                <div className="db-table-card">
                  <div className="db-table-head db-table-head--riwayat">
                    <div className="db-riw-judul">
                      <h4>Semua transaksi</h4>
                      <span>{riwayatTampil.length} transaksi</span>
                    </div>
                    <div className="db-riw-filter db-riw-filter--ikon" role="tablist" aria-label="Filter riwayat">
                      <button type="button" className={filterRiwayat === 'semua' ? 'is-active' : ''} title={`Semua (${semuaRiwayat.length})`} aria-label="Semua" onClick={() => setFilterRiwayat('semua')}>
                        <LayoutGrid size={15} strokeWidth={2} />
                      </button>
                      <button type="button" className={filterRiwayat === 'program' ? 'is-active is-program' : ''} title={`Program (${jumlahProgram})`} aria-label="Program" onClick={() => setFilterRiwayat('program')}>
                        <GraduationCap size={15} strokeWidth={2} />
                      </button>
                      <button type="button" className={filterRiwayat === 'toko' ? 'is-active is-toko' : ''} title={`Toko (${jumlahToko})`} aria-label="Toko" onClick={() => setFilterRiwayat('toko')}>
                        <ShoppingCart size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="db-table-scroll">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Jenis</th>
                          <th>Tanggal</th>
                          <th>Jam</th>
                          <th>Item</th>
                          <th>Metode</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th aria-label="Aksi" />
                        </tr>
                      </thead>
                      <tbody>
                        {riwayatTampil.length === 0 && (
                          <tr>
                            <td colSpan={9} className="db-kosong">
                              {filterRiwayat === 'semua' ? 'Belum ada transaksi.' : `Belum ada transaksi ${filterRiwayat === 'program' ? 'program' : 'toko'}.`}
                            </td>
                          </tr>
                        )}
                        {riwayatTampil.map((r) => {
                          const jenis = (r.jenis ?? 'toko') === 'program' ? 'program' : 'toko'
                          const waktu = pecahWaktu(r.createdAt)
                          return (
                          <tr key={r.invoice} className={`db-row--${jenis}`}>
                            <td className="db-td-inv">{r.invoice}</td>
                            <td>
                              <span className={`db-riw-jenis is-${jenis}`}>
                                {jenis === 'program' ? <GraduationCap size={13} strokeWidth={2} /> : <ShoppingCart size={13} strokeWidth={2} />}
                                {jenis === 'program' ? 'Program' : 'Toko'}
                              </span>
                            </td>
                            <td className="db-td-tanggal">{waktu ? waktu.tgl : r.tanggal || 'Belum tercatat'}</td>
                            <td className="db-td-jam">{waktu ? waktu.jam : '\u2014'}</td>
                            <td className="db-td-item">
                              <strong>{r.item}</strong>
                            </td>
                            <td><span className="db-metode"><CreditCard size={13} strokeWidth={1.9} /> {r.metode}</span></td>
                            <td className="db-td-total">{formatRupiah(r.total)}</td>
                            <td>
                              <span className={`db-riw-stat ${r.status === 'Lunas' ? 'is-lunas' : r.status === 'Dibatalkan' ? 'is-batal' : 'is-tunggu'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <div className="db-td-aksi">
                                <button type="button" className="db-td-btn" disabled={!r.invoiceFile} title={r.invoiceFile ? 'Buka invoice' : 'Invoice belum tersedia'} onClick={() => bukaInvoice(r)}>
                                  <Eye size={14} strokeWidth={1.9} />
                                </button>
                                <button type="button" className="db-td-btn" disabled={!r.invoiceFile} title={r.invoiceFile ? 'Unduh invoice' : 'Invoice belum tersedia'} onClick={() => unduhInvoice(r)}>
                                  <Download size={14} strokeWidth={1.9} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ENROLL ================= */}
            {tab === 'enroll' && (
              <div className="db-page">
                <div className="db-katalog">
                  {katalog.length === 0 && (
                    <section className="db-block">
                      <p className="db-kosong">Semua program terbit sudah kamu ikuti.</p>
                    </section>
                  )}
                  {katalog.map((k) => (
                    <article key={k.id} className="db-kat">
                      <div className="db-kat-media">
                        <img src={k.gambar || gambarKategori(k.kategori)} alt={k.nama} />
                        <span className="db-chip">{k.kategori}</span>
                      </div>
                      <div className="db-kat-body">
                        <h3>{k.nama}</h3>
                        <p>{k.deskripsi}</p>
                        <span className="db-kat-durasi"><CalendarClock size={13} strokeWidth={1.9} /> {[k.jenis, k.mode ?? 'Online'].filter(Boolean).join(' \u00b7 ')}</span>
                        <div className="db-kat-foot">
                          <strong>{formatRupiah(k.harga)}</strong>
                          <button
                            type="button"
                            className="db-btn"
                            onClick={() => {
                              if (Number(k.harga) > 0) {
                                setBayarProgram(k)
                              } else {
                                ikutiProgram(user.email, k.id)
                                setVersi((v) => v + 1)
                              }
                            }}
                          >
                            Enroll sekarang
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* ================= RAPOT PENILAIAN ================= */}
            {tab === 'rapot' && (
              <div className="db-page">
                {rapotSaya.filter((r) => r.dinilai > 0).length === 0 ? (
                  <section className="db-block">
                    <p className="db-kosong">Belum ada rapot penilaian.</p>
                  </section>
                ) : (
                  <div className="db-rapot-grid">
                    {rapotSaya.filter((r) => r.dinilai > 0).map((r) => (
                      <section key={r.id} className="db-block">
                        <header className="db-rapot-head">
                          <div>
                            <h4>{r.nama}</h4>
                            <span>{r.tutor} · {r.dinilai}/{r.total} dinilai</span>
                          </div>
                          <div className="db-rapot-nilai">
                            <strong>{r.rerata}</strong>
                            <em>dari 5</em>
                          </div>
                        </header>
                        <ul className="db-rapot-aspek">
                          {r.item.map((x) => (
                            <li key={x.id}>
                              <span>{x.judul}</span>
                              <span className="db-love" role="img" aria-label={`${x.love} dari 5`}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Heart key={n} size={14} strokeWidth={1.9} className={n <= x.love ? 'is-isi' : ''} />
                                ))}
                              </span>
                              <b>{x.love > 0 ? x.love : '—'}</b>
                            </li>
                          ))}
                        </ul>
                        {r.item.filter((x) => x.komentar).map((x) => (
                          <p key={`k-${x.id}`} className="db-rapot-catatan">
                            <MessagesSquare size={14} strokeWidth={1.9} /> {x.komentar}
                          </p>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= KONSULTASI ================= */}
            {tab === 'konsultasi' && (
              <div className="db-page">
                <div className="db-konsul">
                  <div className="db-konsul-list">
                    <section className="db-block">
                      <p className="db-kosong">
                        Belum ada sesi konsultasi terjadwal.
                      </p>
                    </section>
                  </div>

                  <aside className="db-block db-konsul-form">
                    <header className="db-block-head"><h4>Ajukan konsultasi</h4></header>
                    <form className="db-form db-form--satu" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        <span>Program</span>
                        <select defaultValue={aktif[0]?.id}>
                          {programSaya.map((p) => (
                            <option key={p.id} value={p.id}>{p.nama}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Topik konsultasi</span>
                        <input type="text" />
                      </label>
                      <label>
                        <span>Usulan jadwal</span>
                        <input type="text" />
                      </label>
                      <div className="db-form-foot">
                        <button type="submit" className="db-btn">Kirim pengajuan</button>
                      </div>
                    </form>
                  </aside>
                </div>
              </div>
            )}

            {/* ================= PROFIL ================= */}
            {tab === 'profil' && (
              <div className="db-page">
                <section className="db-profil-hp">
                  <button type="button" onClick={() => {
                    setNotifTampil((v) => !v)
                    tandaiNilaiBaca()
                    tandaiBayarBaca()
                  }}>
                    <span className="db-hp-ic"><BellRing size={16} strokeWidth={1.9} /></span>
                    Notifikasi
                    {notifBaru > 0 && <i>{notifBaru}</i>}
                    <ChevronDown size={15} strokeWidth={2} className={`db-hp-caret${notifTampil ? ' is-buka' : ''}`} />
                  </button>
                  {notifTampil && (
                    <ul className="db-hp-notif">
                      {notifikasi.length === 0 && (
                        <li>
                          <p>Belum ada notifikasi.</p>
                        </li>
                      )}
                      {notifikasi.map((n) => (
                        <li key={n.id} className={n.baru ? 'is-baru' : ''}>
                          <button
                            type="button"
                            className="db-notif-klik"
                            onClick={() => {
                              if (n.tab) setTab(n.tab)
                              setNotifTampil(false)
                            }}
                          >
                            <p>{n.judul}</p>
                            <span>{waktuNotif(n.waktu)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link to="/keranjang">
                    <span className="db-hp-ic"><ShoppingCart size={16} strokeWidth={1.9} /></span>
                    Keranjang
                    {jmlKeranjang > 0 && <i>{jmlKeranjang}</i>}
                  </Link>
                  <button type="button" onClick={() => setTab('riwayat')}>
                    <span className="db-hp-ic"><ReceiptText size={16} strokeWidth={1.9} /></span>
                    Riwayat pembelian
                    {tagihanTunggu.length > 0 && <i>{tagihanTunggu.length}</i>}
                  </button>
                  <button type="button" onClick={() => setTab('rapot')}>
                    <span className="db-hp-ic"><ClipboardList size={16} strokeWidth={1.9} /></span>
                    Rapot penilaian
                  </button>
                  <button type="button" onClick={() => setTab('konsultasi')}>
                    <span className="db-hp-ic"><MessagesSquare size={16} strokeWidth={1.9} /></span>
                    Konsultasi
                  </button>
                  <button type="button" className="is-keluar" onClick={keluar}>
                    <span className="db-hp-ic"><LogOut size={16} strokeWidth={1.9} /></span>
                    Keluar
                  </button>
                </section>

                <div className="db-profil">
                  <aside className="db-profil-card">
                    <span className="db-profil-ava-wrap">
                      {user.foto
                        ? <img src={user.foto} alt={user.nama} />
                        : <span className="db-profil-ava">{inisial(user.nama)}</span>}
                      <label className="db-profil-ava-edit" title="Ganti foto profil">
                        <Camera size={13} strokeWidth={2} aria-hidden="true" />
                        <input type="file" accept="image/*" onChange={gantiFoto} />
                      </label>
                    </span>
                    <h3>{user.nama}</h3>
                    <p>{user.email}</p>
                    <span className="db-profil-paket"><BadgeCheck size={14} strokeWidth={2} /> Peserta Hifz</span>
                    <ul>
                      {user.telepon && <li><UserCheck size={14} strokeWidth={1.9} /> {user.telepon}</li>}
                      {user.alamat && <li><MapPin size={14} strokeWidth={1.9} /> {user.alamat}</li>}
                      <li><GraduationCap size={14} strokeWidth={1.9} /> {programSaya.length} program diikuti</li>
                      <li><Award size={14} strokeWidth={1.9} /> {selesai.length} program selesai</li>
                    </ul>
                  </aside>

                  <div className="db-profil-main">
                    <section className="db-block">
                      <header className="db-block-head"><h4>Data diri</h4></header>
                      <form className="db-form" onSubmit={simpanProfil}>
                        <label>
                          <span>Nama lengkap</span>
                          <input type="text" value={profilForm?.nama ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, nama: e.target.value }))} />
                        </label>
                        <label>
                          <span>Email</span>
                          <input type="email" value={user.email} readOnly />
                        </label>
                        <label>
                          <span>Nomor WhatsApp</span>
                          <input type="tel" value={profilForm?.telepon ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, telepon: e.target.value }))} placeholder="Contoh: 0812 3456 7890" />
                        </label>
                        <label>
                          <span>Provinsi</span>
                          <select value={profilForm?.provinsi.id ?? ''} onChange={(e) => pilihWilayah('provinsi', e)}>
                            <option value="">Pilih provinsi</option>
                            {wilayah.provinsi.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Kota / Kabupaten</span>
                          <select value={profilForm?.kota.id ?? ''} onChange={(e) => pilihWilayah('kota', e)} disabled={!profilForm?.provinsi.id}>
                            <option value="">Pilih kota / kabupaten</option>
                            {wilayah.kota.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Kecamatan</span>
                          <select value={profilForm?.kecamatan.id ?? ''} onChange={(e) => pilihWilayah('kecamatan', e)} disabled={!profilForm?.kota.id}>
                            <option value="">Pilih kecamatan</option>
                            {wilayah.kecamatan.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Kelurahan / Desa</span>
                          <select value={profilForm?.kelurahan.id ?? ''} onChange={(e) => pilihWilayah('kelurahan', e)} disabled={!profilForm?.kecamatan.id}>
                            <option value="">Pilih kelurahan / desa</option>
                            {wilayah.kelurahan.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Kode pos</span>
                          <input type="text" inputMode="numeric" maxLength={5} value={profilForm?.kodePos ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, kodePos: e.target.value.replace(/\D/g, '') }))} placeholder="Contoh: 55281" />
                        </label>
                        <label className="db-form-penuh">
                          <span>Alamat jalan</span>
                          <input type="text" value={profilForm?.jalan ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, jalan: e.target.value }))} placeholder="Nama jalan, nomor rumah, RT/RW" />
                        </label>
                        <div className="db-form-penuh">
                          <span className="db-form-label">Titik lokasi</span>
                          <div className="dtf-lokasi">
                            <input type="text" placeholder="Latitude" value={profilForm?.lat ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, lat: e.target.value }))} />
                            <input type="text" placeholder="Longitude" value={profilForm?.lng ?? ''} onChange={(e) => setProfilForm((f) => ({ ...f, lng: e.target.value }))} />
                            <button type="button" onClick={ambilLokasi}>
                              <MapPinned size={14} strokeWidth={2} aria-hidden="true" /> Ambil lokasi saat ini
                            </button>
                          </div>
                          {lokasiStatus && <em className="dtf-lokasi-status">{lokasiStatus}</em>}
                        </div>
                        <div className="db-form-foot">
                          {profilStatus && <span className="db-profil-status">{profilStatus}</span>}
                          <button type="submit" className="db-btn">Simpan perubahan</button>
                        </div>
                      </form>
                    </section>

                    <section className="db-block">
                      <header className="db-block-head"><h4>Keamanan akun</h4></header>
                      <div className="db-secure">
                        <div>
                          <span className="db-act-ic"><ShieldCheck size={15} strokeWidth={1.9} /></span>
                          <div>
                            <p>Password</p>
                          </div>
                        </div>
                        <button type="button" className="db-btn db-btn--ghost">Ganti password</button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {bayarProgram && (
        <BayarModal
          buka={Boolean(bayarProgram)}
          item={bayarProgram.perpanjang ? `Perpanjangan — ${bayarProgram.nama}` : bayarProgram.nama}
          total={bayarProgram.harga}
          penerima={user.nama}
          email={user.email}
          programIds={[bayarProgram.id]}
          onTutup={() => setBayarProgram(null)}
          onSelesai={(pesanan) => {
            // akses pelajaran dibuka oleh efek sinkron saat admin konfirmasi Lunas
            try {
              const daftar = JSON.parse(localStorage.getItem('hifzPesananToko') || '[]')
              const i = daftar.findIndex((p) => p.invoice === pesanan?.invoice)
              if (i > -1) {
                daftar[i] = { ...daftar[i], email: user.email, programIds: [bayarProgram.id] }
                localStorage.setItem('hifzPesananToko', JSON.stringify(daftar))
              }
            } catch {
              // penyimpanan lokal tidak tersedia
            }
            setBayarProgram(null)
            setVersi((v) => v + 1)
          }}
        />
      )}
    </div>
  )
}
