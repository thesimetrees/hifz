import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Banknote,
  Bell,
  BellOff,
  BellRing,
  BookOpen,
  CalendarDays,
  ChartColumn,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  CircleDashed,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Flame,
  FolderOpen,
  Globe,
  Goal,
  GraduationCap,
  HelpCircle,
  Hourglass,
  ImagePlus,
  Inbox,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  MapPin,
  MonitorPlay,
  Newspaper,
  Package,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  Power,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  SearchX,
  Shapes,
  ShoppingBag,
  Sparkles,
  SquarePen,
  SquarePlay,
  Store,
  Tag,
  Timer,
  Trash2,
  Type,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  UserX,
  Users,
  UsersRound,
  Video,
  Wallet,
  X,
} from 'lucide-react'
import {
  formatRupiah,
  inisial,
  jamSub,
  jamRentangSub,
  jenisProgram,
  jenisPembelajaran,
  kategoriProgram,
  KUNCI,
  labelTipe,
  modeProgram,
  muatData,
  semuaSub,
  simpanData,
  tanggalLengkap,
  tanggalSub,
  waktuLengkap,
  youtubeId,
} from './adminData.js'
import { daftarGambar } from '../toko/tokoData.js'
import PlayerTertutup from '../../components/PlayerTertutup.jsx'
import { adaSesi, api, hapusToken, kompresFoto, KUNCI_TOKEN } from '../../lib/api.js'
import { bacaAbsensi, bacaPenilaian, bacaProgres, hitungProgres, pesertaProgram, sinkronBelajar } from '../../lib/progres.js'

// Empty-state ringkas berbasis ikon
const Kosong = ({ icon: Ic, teks }) => (
  <div className="db-kosong-state">
    <span><Ic size={17} strokeWidth={1.8} /></span>
    <p>{teks}</p>
  </div>
)

const NAV = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'program', label: 'Program & Materi', icon: BookOpen },
  { id: 'pengguna', label: 'Pengguna', icon: Users },
  { id: 'transaksi', label: 'Transaksi', icon: ReceiptText },
  { id: 'toko', label: 'Toko', icon: Store },
  { id: 'berita', label: 'Berita', icon: Newspaper },
]

const ikonJenis = { video: Video, dokumen: FileText, kuis: HelpCircle, 'sesi-online': MonitorPlay, 'sesi-offline': MapPin }

// detail wilayah profil customer (tersimpan lokal oleh dashboard customer)
const detailWilayah = (email) => {
  if (!email) return {}
  try {
    return JSON.parse(localStorage.getItem('hifzProfilDetail') || '{}')[email] || {}
  } catch {
    return {}
  }
}

const ikonAktivitas = { transaksi: Wallet, materi: BookOpen, pengguna: UserRound, toko: ShoppingBag }
const warnaNotif = { transaksi: 'gold', materi: 'lime', pengguna: 'blue', toko: 'orange' }

const programKosong = {
  nama: '',
  kategori: kategoriProgram[0],
  jenis: 'Short Course',
  mode: 'Online',
  tutor: '',
  harga: '',
  deskripsi: '',
  gambar: '',
}
const temaKosong = { judul: '', narasi: '', indikator: '' }
const subKosong = { judul: '', narasi: '', jenis: 'video', konten: '', metode: 'Sinkron', pengajar: '', jadwal: '', durasi: '', tautan: '' }

function Avatar({ nama, besar }) {
  return <span className={`db-avatar-ini${besar ? ' db-avatar-ini--lg' : ''}`}>{inisial(nama)}</span>
}

const petaPengguna = (u) => ({
  id: u.id,
  nama: u.nama,
  email: u.email,
  peran: u.peran,
  status: u.aktif ? 'aktif' : 'nonaktif',
  telepon: u.telepon ?? '',
  alamat: u.alamat ?? '',
  bio: u.bio ?? '',
  foto: u.foto ?? '',
  bergabung: u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-',
})

const labelPeran = { admin: 'Admin', tutor: 'Guru', customer: 'Customer', pelamar: 'Pelamar guru' }
const userKosong = { nama: '', email: '', peran: 'customer', telepon: '', alamat: '', bio: '', foto: '', password: '' }

function Bar({ value }) {
  return (
    <div className="db-bar">
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('ringkasan')
  const [openPop, setOpenPop] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [progId, setProgId] = useState(null)
  const [programs, setPrograms] = useState([])
  const [pengguna, setPengguna] = useState([])
  const [cariUser, setCariUser] = useState('')
  const [filterPeran, setFilterPeran] = useState('semua')
  const [userModal, setUserModal] = useState(null)
  const [formUser, setFormUser] = useState(null)
  const [userGalat, setUserGalat] = useState('')
  const [transaksi, setTransaksi] = useState([])
  const [invBuka, setInvBuka] = useState(null)
  const [produk, setProduk] = useState([])
  const [berita, setBerita] = useState([])
  const [galat, setGalat] = useState('')
  const [aktivitas, setAktivitas] = useState(() => muatData(KUNCI.aktivitas).map((a) => ({ ...a, dibaca: a.dibaca ?? false })))
  const [formProgram, setFormProgram] = useState({ ...programKosong })
  const [infoOk, setInfoOk] = useState(false)
  const [cariProgram, setCariProgram] = useState('')
  const [filterProg, setFilterProg] = useState('semua')
  const [formTema, setFormTema] = useState({ ...temaKosong })
  const [editTemaId, setEditTemaId] = useState(null)
  const [temaFormBuka, setTemaFormBuka] = useState(false)
  const [formSub, setFormSub] = useState({ ...subKosong })
  const [subTarget, setSubTarget] = useState(null)
  const [subGalat, setSubGalat] = useState('')
  const [editSubId, setEditSubId] = useState(null)
  const [blokBuka, setBlokBuka] = useState({ info: true, kur: true })
  const [temaTutup, setTemaTutup] = useState({})
  const [formProduk, setFormProduk] = useState({ nama: '', kategori: 'Umum', harga: '', hargaCoret: '', stok: '', gambar: ['', '', '', '', ''], deskripsi: '' })
  const [cariProduk, setCariProduk] = useState('')
  const [beritaGalat, setBeritaGalat] = useState({})
  const [formBerita, setFormBerita] = useState({ judul: '', kategori: 'Artikel', gambar: '', ringkas: '', konten: '' })

  useEffect(() => simpanData(KUNCI.aktivitas, aktivitas), [aktivitas])

  useEffect(() => {
    const raw = localStorage.getItem('hifzUser')
    const token = localStorage.getItem(KUNCI_TOKEN)
    let tersimpan = null
    try {
      tersimpan = raw ? JSON.parse(raw) : null
    } catch {
      tersimpan = null
    }
    if (!tersimpan || tersimpan.peran !== 'admin' || !token) {
      navigate('/masuk', { replace: true })
      return
    }
    setUser({ nama: tersimpan.nama ?? 'Admin', email: tersimpan.email ?? '' })
    // sesi Supabase bisa kadaluarsa walau localStorage masih ada — paksa masuk ulang
    adaSesi().then((ok) => {
      if (!ok) {
        localStorage.removeItem('hifzUser')
        hapusToken()
        navigate('/masuk', { replace: true })
      }
    })
  }, [navigate])

  useEffect(() => {
    let hidup = true
    Promise.all([
      api('/programs/admin/semua'),
      api('/users'),
      api('/toko/orders'),
      api('/toko/products/admin/semua'),
      api('/berita/admin/semua'),
    ])
      .then(([prog, us, trx, prd, brt]) => {
        if (!hidup) return
        setPrograms(prog)
        setPengguna(us.map(petaPengguna))
        setTransaksi(trx)
        setProduk(prd)
        setBerita(brt)
      })
      .catch((err) => {
        if (hidup) setGalat(`Gagal memuat data dari server: ${err.message}`)
      })
    return () => {
      hidup = false
    }
  }, [])

  // realtime: transaksi & pengguna disegarkan berkala + saat tab difokuskan
  useEffect(() => {
    let hidup = true
    const segarkan = async () => {
      try {
        const [trx, us] = await Promise.all([api('/toko/orders'), api('/users')])
        if (!hidup) return
        setTransaksi(trx)
        setPengguna(us.map(petaPengguna))
      } catch {
        // server tidak terjangkau, coba lagi pada siklus berikutnya
      }
    }
    const id = setInterval(segarkan, 15000)
    const onFokus = () => segarkan()
    window.addEventListener('focus', onFokus)
    return () => {
      hidup = false
      clearInterval(id)
      window.removeEventListener('focus', onFokus)
    }
  }, [])

  // realtime Supabase: progres/absensi/penilaian peserta ikut tampil di admin
  const [, setBelajarV] = useState(0)
  useEffect(() => sinkronBelajar(() => setBelajarV((v) => v + 1)), [])

  const program = programs.find((p) => p.id === progId)

  useEffect(() => {
    const p = programs.find((x) => x.id === progId)
    setBlokBuka({ info: true, kur: true })
    setTemaTutup({})
    setFormProgram(p
      ? {
          nama: p.nama,
          kategori: p.kategori,
          jenis: p.jenis,
          mode: p.mode ?? 'Online',
          tutor: p.tutor ?? '',
          harga: p.harga ? String(p.harga) : '',
          deskripsi: p.deskripsi ?? '',
          gambar: p.gambar ?? '',
        }
      : { ...programKosong })
    setInfoOk(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progId])

  const pendapatan = useMemo(() => transaksi.filter((t) => t.status === 'Lunas').reduce((a, t) => a + t.total, 0), [transaksi])
  const menunggu = transaksi.filter((t) => t.status === 'Menunggu')
  // kelompokkan transaksi per pembeli untuk tabel utama
  const grupPembeli = useMemo(() => {
    const peta = new Map()
    for (const t of transaksi) {
      if (!peta.has(t.penerima)) peta.set(t.penerima, [])
      peta.get(t.penerima).push(t)
    }
    return [...peta.entries()].map(([nama, daftar]) => ({ nama, daftar }))
  }, [transaksi])
  const totalPeserta = programs.reduce((a, p) => a + (p.peserta ?? 0), 0)
  const daftarGuru = useMemo(
    () => [...new Set(pengguna.filter((u) => u.peran === 'tutor').map((u) => u.nama))],
    [pengguna],
  )

  const catat = (teks, tipe) => {
    setAktivitas((prev) => [{ id: Date.now(), teks, waktu: new Date().toISOString(), tipe, dibaca: false }, ...prev].slice(0, 12))
  }

  const tandaiDibaca = (id) => {
    setAktivitas((prev) => prev.map((a) => (a.id === id ? { ...a, dibaca: true } : a)))
  }

  const tandaiSemuaDibaca = () => {
    setAktivitas((prev) => prev.map((a) => ({ ...a, dibaca: true })))
  }

  const hapusNotif = (id) => {
    setAktivitas((prev) => prev.filter((a) => a.id !== id))
  }

  const keluar = () => {
    localStorage.removeItem('hifzUser')
    hapusToken()
    navigate('/', { replace: true })
  }

  const buatProgram = async () => {
    try {
      const hasil = await api('/programs', {
        method: 'POST',
        body: {
          nama: 'Program baru',
          kategori: kategoriProgram[0],
          jenis: 'Short Course',
          mode: 'Online',
          tutor: 'Belum ditentukan',
          harga: 0,
          deskripsi: 'Narasi program belum ditulis.',
          gambar: '',
        },
      })
      setPrograms((prev) => [...prev, hasil])
      catat('Program baru dibuat sebagai draf', 'materi')
      tutupSemuaForm()
      setProgId(hasil.id)
    } catch (err) {
      setGalat(err.message)
    }
  }

  const ubahInfo = (patch) => {
    setInfoOk(false)
    setFormProgram((f) => ({ ...f, ...patch }))
  }

  const patchInfo = () => ({
    nama: formProgram.nama.trim(),
    kategori: formProgram.kategori,
    jenis: formProgram.jenis,
    mode: formProgram.mode,
    gambar: formProgram.gambar,
    tutor: formProgram.tutor.trim(),
    harga: Number(formProgram.harga) || 0,
    deskripsi: formProgram.deskripsi.trim(),
  })

  // simpan otomatis: perubahan form info dipatch dengan jeda singkat
  const infoInit = useRef(null)
  const [infoSimpan, setInfoSimpan] = useState(false)
  useEffect(() => {
    if (!progId) return
    if (infoInit.current !== progId) {
      infoInit.current = progId
      return
    }
    if (!formProgram.nama.trim()) return
    setInfoSimpan(true)
    const t = setTimeout(async () => {
      try {
        const hasil = await api(`/programs/${progId}`, { method: 'PATCH', body: patchInfo() })
        setPrograms((prev) => prev.map((p) => (p.id === progId ? hasil : p)))
        setInfoOk(true)
      } catch (err) {
        setGalat(err.message)
      } finally {
        setInfoSimpan(false)
      }
    }, 900)
    return () => {
      clearTimeout(t)
      setInfoSimpan(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formProgram, progId])

  const simpanInfo = async (e) => {
    e.preventDefault()
    if (!formProgram.nama.trim() || !formProgram.deskripsi.trim() || !formProgram.tutor.trim()) return
    try {
      const hasil = await api(`/programs/${progId}`, {
        method: 'PATCH',
        body: patchInfo(),
      })
      setPrograms((prev) => prev.map((p) => (p.id === progId ? hasil : p)))
      setInfoOk(true)
    } catch (err) {
      setGalat(err.message)
    }
  }

  const toggleProgram = async (id) => {
    const target = programs.find((p) => p.id === id)
    if (!target) return
    const status = target.status === 'terbit' ? 'draf' : 'terbit'
    try {
      const hasil = await api(`/programs/${id}`, { method: 'PATCH', body: { status } })
      setPrograms((prev) => prev.map((p) => (p.id === id ? hasil : p)))
      if (status === 'terbit') catat(`Program \u201c${target.nama}\u201d diterbitkan ke katalog`, 'materi')
    } catch (err) {
      setGalat(err.message)
    }
  }

  const pilihGambarProgram = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (img.width < 1200) {
          setGalat('Foto program minimal selebar 1200px agar tidak blur atau pecah saat ditampilkan.')
          return
        }
        const maxW = 1920
        const skala = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * skala)
        canvas.height = Math.round(img.height * skala)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setGalat('')
        setInfoOk(false)
        setFormProgram((f) => ({ ...f, gambar: canvas.toDataURL('image/jpeg', 0.9) }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const hapusProgram = async (id) => {
    const target = programs.find((p) => p.id === id)
    if (!window.confirm(`Hapus program "${target?.nama}" beserta seluruh kurikulumnya?`)) return
    try {
      await api(`/programs/${id}`, { method: 'DELETE' })
      setPrograms((prev) => prev.filter((p) => p.id !== id))
      if (progId === id) setProgId(null)
    } catch (err) {
      setGalat(err.message)
    }
  }

  /* ---- Kurikulum: tema -> sub-tema ---- */
  const ubahKurikulum = (fn) => {
    const target = programs.find((p) => p.id === progId)
    if (!target) return
    const kurikulum = fn(target.kurikulum ?? [])
    setPrograms((prev) => prev.map((p) => (p.id === progId ? { ...p, kurikulum } : p)))
    api(`/programs/${progId}`, { method: 'PATCH', body: { kurikulum } }).catch((err) => setGalat(err.message))
  }

  const tutupSemuaForm = () => {
    setEditTemaId(null)
    setFormTema({ ...temaKosong })
    setTemaFormBuka(false)
    setSubTarget(null)
    setEditSubId(null)
    setFormSub({ ...subKosong })
    setSubGalat('')
  }

  const simpanTema = (e) => {
    e.preventDefault()
    if (!formTema.judul.trim()) return
    const data = {
      judul: formTema.judul.trim(),
      narasi: formTema.narasi.trim(),
      indikator: formTema.indikator.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    ubahKurikulum((kur) =>
      editTemaId
        ? kur.map((t) => (t.id === editTemaId ? { ...t, ...data } : t))
        : [...kur, { id: `tema-${Date.now()}`, ...data, sub: [] }],
    )
    setEditTemaId(null)
    setFormTema({ ...temaKosong })
    setTemaFormBuka(false)
  }

  const mulaiEditTema = (t) => {
    setEditTemaId(t.id)
    setTemaFormBuka(true)
    setFormTema({ judul: t.judul, narasi: t.narasi ?? '', indikator: (t.indikator ?? []).join('\n') })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hapusTema = (t) => {
    if (!window.confirm(`Hapus materi "${t.judul}" beserta sub materinya?`)) return
    ubahKurikulum((kur) => kur.filter((x) => x.id !== t.id))
    if (editTemaId === t.id) {
      setEditTemaId(null)
      setFormTema({ ...temaKosong })
    }
  }

  const bukaFormSub = (temaId) => {
    setSubTarget(temaId)
    setEditSubId(null)
    setFormSub({ ...subKosong })
    setSubGalat('')
  }

  const ubahSub = (patch) => {
    setSubGalat('')
    setFormSub((f) => ({ ...f, ...patch }))
  }

  const simpanSub = (e) => {
    e.preventDefault()
    if (!subTarget) return
    if (!formSub.judul.trim()) {
      setSubGalat('Judul sub materi wajib diisi.')
      return
    }
    let konten = formSub.konten.trim()
    if (formSub.jenis === 'video') {
      if (!konten) {
        setSubGalat('Tempelkan tautan video YouTube terlebih dahulu.')
        return
      }
      const idVid = youtubeId(konten)
      if (!idVid) {
        setSubGalat('Tautan YouTube tidak dikenali, pakai format youtube.com/watch?v=… atau youtu.be/…')
        return
      }
      konten = `https://youtu.be/${idVid}`
    }
    const data = {
      judul: formSub.judul.trim(),
      narasi: formSub.narasi.trim(),
      jenis: formSub.jenis,
      konten,
      metode: formSub.jenis.startsWith('sesi') ? 'Sinkron' : 'Asinkron',
      pengajar: formSub.pengajar.trim(),
      jadwal: formSub.jadwal.trim(),
      durasi: formSub.durasi === '' ? '' : Math.max(0, Number(formSub.durasi) || 0),
      tautan: formSub.tautan.trim(),
    }
    ubahKurikulum((kur) =>
      kur.map((t) => {
        if (t.id !== subTarget) return t
        if (editSubId) return { ...t, sub: (t.sub ?? []).map((s) => (s.id === editSubId ? { ...s, ...data } : s)) }
        return { ...t, sub: [...(t.sub ?? []), { id: `sub-${Date.now()}`, status: 'draf', ...data }] }
      }),
    )
    setSubTarget(null)
    setEditSubId(null)
    setFormSub({ ...subKosong })
    setSubGalat('')
  }

  const mulaiEditSub = (temaId, s) => {
    setSubTarget(temaId)
    setEditSubId(s.id)
    setSubGalat('')
    setFormSub({
      judul: s.judul,
      narasi: s.narasi ?? '',
      jenis: s.jenis ?? 'video',
      konten: s.konten ?? '',
      metode: s.metode === 'Asinkron' ? 'Asinkron' : 'Sinkron',
      pengajar: s.pengajar ?? '',
      jadwal: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s.jadwal ?? '') ? s.jadwal : '',
      durasi: s.durasi ?? '',
      tautan: s.tautan ?? '',
    })
  }

  const toggleSub = (temaId, subId) => {
    ubahKurikulum((kur) =>
      kur.map((t) =>
        t.id === temaId
          ? { ...t, sub: (t.sub ?? []).map((s) => (s.id === subId ? { ...s, status: s.status === 'terbit' ? 'draf' : 'terbit' } : s)) }
          : t,
      ),
    )
  }

  const hapusSub = (temaId, s) => {
    if (!window.confirm(`Hapus sub materi "${s.judul}"?`)) return
    ubahKurikulum((kur) => kur.map((t) => (t.id === temaId ? { ...t, sub: (t.sub ?? []).filter((x) => x.id !== s.id) } : t)))
    if (editSubId === s.id) {
      setSubTarget(null)
      setEditSubId(null)
      setFormSub({ ...subKosong })
    }
  }

  const toggleBlok = (k) => setBlokBuka((b) => ({ ...b, [k]: !b[k] }))

  const toggleTema = (id) => setTemaTutup((m) => ({ ...m, [id]: !m[id] }))

  const geserItem = (arr, id, arah) => {
    const i = arr.findIndex((x) => x.id === id)
    const j = i + arah
    if (i < 0 || j < 0 || j >= arr.length) return arr
    const salin = [...arr]
    ;[salin[i], salin[j]] = [salin[j], salin[i]]
    return salin
  }

  const geserTema = (id, arah) => ubahKurikulum((kur) => geserItem(kur, id, arah))

  const geserSub = (temaId, subId, arah) =>
    ubahKurikulum((kur) => kur.map((t) => (t.id === temaId ? { ...t, sub: geserItem(t.sub ?? [], subId, arah) } : t)))

  const ubahPeran = async (id, peran) => {
    try {
      const hasil = await api(`/users/${id}/peran`, { method: 'PATCH', body: { peran } })
      setPengguna((prev) => prev.map((u) => (u.id === id ? petaPengguna(hasil) : u)))
    } catch (err) {
      setGalat(err.message)
    }
  }

  const toggleStatusPengguna = async (id) => {
    try {
      const hasil = await api(`/users/${id}/status`, { method: 'PATCH' })
      setPengguna((prev) => prev.map((u) => (u.id === id ? petaPengguna(hasil) : u)))
    } catch (err) {
      setGalat(err.message)
    }
  }

  const bukaEditUser = (u) => {
    setUserGalat('')
    setFormUser(u ? { ...userKosong, ...u, password: '' } : { ...userKosong })
    setUserModal({ mode: u ? 'edit' : 'baru', id: u?.id })
  }

  const tutupUserModal = () => {
    setUserModal(null)
    setFormUser(null)
    setUserGalat('')
  }

  const simpanUser = async (e) => {
    e.preventDefault()
    const f = formUser
    if (!f.nama.trim() || !f.email.trim()) {
      setUserGalat('Nama dan email wajib diisi')
      return
    }
    const body = {
      nama: f.nama.trim(),
      email: f.email.trim(),
      peran: f.peran,
      telepon: f.telepon.trim(),
      alamat: f.alamat.trim(),
      bio: f.bio.trim(),
      foto: f.foto.trim(),
    }
    const sandi = f.password.trim()
    if (userModal?.mode === 'baru' && sandi.length < 6) {
      setUserGalat('Password wajib, minimal 6 karakter')
      return
    }
    if (sandi) {
      if (sandi.length < 6) {
        setUserGalat('Password minimal 6 karakter')
        return
      }
      body.password = sandi
    }
    try {
      if (userModal?.mode === 'baru') {
        const hasil = await api('/users', { method: 'POST', body })
        setPengguna((prev) => [petaPengguna(hasil), ...prev])
        catat(`Pengguna baru ${hasil.nama} ditambahkan`, 'pengguna')
        setUserModal({ mode: 'lihat', id: hasil.id })
      } else {
        const hasil = await api(`/users/${f.id}`, { method: 'PATCH', body })
        setPengguna((prev) => prev.map((u) => (u.id === f.id ? petaPengguna(hasil) : u)))
        catat(`Profil ${hasil.nama} diperbarui${body.password ? ', password direset' : ''}`, 'pengguna')
        setUserModal({ mode: 'lihat', id: f.id })
      }
      setFormUser(null)
      setUserGalat('')
    } catch (err) {
      setUserGalat(err.message)
    }
  }

  const ubahStatusTransaksi = async (invoice, status) => {
    try {
      const hasil = await api(`/toko/orders/${invoice}/status`, { method: 'PATCH', body: { status } })
      setTransaksi((prev) => prev.map((x) => (x.invoice === invoice ? hasil : x)))
      if (status === 'Lunas') catat(`Pembayaran ${hasil.invoice} (${formatRupiah(hasil.total)}) dikonfirmasi lunas`, 'transaksi')
    } catch (err) {
      setGalat(err.message)
    }
  }

  const tandaiLunas = (id) => ubahStatusTransaksi(id, 'Lunas')

  const batalkan = (id) => ubahStatusTransaksi(id, 'Dibatalkan')

  const ubahOrderAdmin = async (invoice, body, pesan) => {
    try {
      const hasil = await api(`/toko/orders/${invoice}/admin`, { method: 'PATCH', body })
      setTransaksi((prev) => prev.map((x) => (x.invoice === invoice ? hasil : x)))
      if (pesan) catat(pesan, 'transaksi')
      return true
    } catch (err) {
      setGalat(err.message)
      return false
    }
  }

  const uploadInvoiceOrder = async (invoice, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await kompresFoto(file, 1100)
      await ubahOrderAdmin(invoice, { invoiceFile: dataUrl }, `Invoice ${invoice} diunggah dan tampil di akun customer`)
    } catch {
      setGalat('File invoice tidak bisa dibaca. Gunakan gambar JPG/PNG.')
    }
  }

  const tambahProduk = async (e) => {
    e.preventDefault()
    if (!formProduk.nama.trim()) return
    const body = {
      nama: formProduk.nama.trim(),
      kategori: formProduk.kategori.trim() || 'Umum',
      harga: Number(formProduk.harga) || 0,
      hargaCoret: Number(formProduk.hargaCoret) || 0,
      stok: Number(formProduk.stok) || 0,
    }
    if (formProduk.gambar.some((g) => g.trim())) body.gambar = formProduk.gambar.map((g) => g.trim()).filter(Boolean).slice(0, 5).join('\n')
    if (formProduk.deskripsi.trim()) body.deskripsi = formProduk.deskripsi.trim()
    try {
      const hasil = await api('/toko/products', { method: 'POST', body })
      setProduk((prev) => [...prev, hasil])
      catat(`Produk \u201c${hasil.nama}\u201d ditambahkan ke toko`, 'toko')
      setFormProduk({ nama: '', kategori: 'Umum', harga: '', hargaCoret: '', stok: '', gambar: ['', '', '', '', ''], deskripsi: '' })
    } catch (err) {
      setGalat(err.message)
    }
  }

  // unggah foto produk → dikompresi ke data URL
  const pilihGambarProduk = (i, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxW = 1200
        const skala = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * skala)
        canvas.height = Math.round(img.height * skala)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = canvas.toDataURL('image/jpeg', 0.85)
        setFormProduk((f) => ({ ...f, gambar: f.gambar.map((x, j) => (j === i ? data : x)) }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleProduk = async (id) => {
    try {
      const hasil = await api(`/toko/products/${id}/aktif`, { method: 'PATCH' })
      setProduk((prev) => prev.map((p) => (p.id === id ? hasil : p)))
    } catch (err) {
      setGalat(err.message)
    }
  }

  const tambahBerita = async (e) => {
    e.preventDefault()
    const galatBaru = {}
    if (formBerita.judul.trim().length < 10) galatBaru.judul = 'Judul wajib diisi, minimal 10 karakter.'
    if (!formBerita.gambar) galatBaru.gambar = 'Gambar sampul wajib diunggah.'
    if (formBerita.ringkas.trim().length < 20) galatBaru.ringkas = 'Ringkasan wajib diisi, minimal 20 karakter.'
    if (formBerita.konten.trim().length < 100) galatBaru.konten = 'Isi berita wajib diisi, minimal 100 karakter.'
    setBeritaGalat(galatBaru)
    if (Object.keys(galatBaru).length) return
    const body = {
      judul: formBerita.judul.trim(),
      kategori: formBerita.kategori,
      penulis: user?.nama || 'Admin Hifz',
      gambar: formBerita.gambar,
      ringkas: formBerita.ringkas.trim(),
      konten: formBerita.konten.trim(),
    }
    try {
      const hasil = await api('/berita', { method: 'POST', body })
      setBerita((prev) => [hasil, ...prev])
      catat(`Berita “${hasil.judul}” disimpan sebagai draf`, 'materi')
      setFormBerita({ judul: '', kategori: 'Artikel', gambar: '', ringkas: '', konten: '' })
      setBeritaGalat({})
    } catch (err) {
      setGalat(err.message)
    }
  }

  // unggah sampul berita → dikompresi ke data URL
  const pilihGambarBerita = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxW = 1600
        const skala = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * skala)
        canvas.height = Math.round(img.height * skala)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setBeritaGalat((g) => ({ ...g, gambar: undefined }))
        setFormBerita((f) => ({ ...f, gambar: canvas.toDataURL('image/jpeg', 0.85) }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleBerita = async (id) => {
    const target = berita.find((b) => b.id === id)
    if (!target) return
    try {
      const hasil = await api(`/berita/${id}`, {
        method: 'PATCH',
        body: { status: target.status === 'terbit' ? 'draf' : 'terbit' },
      })
      setBerita((prev) => prev.map((b) => (b.id === id ? hasil : b)))
    } catch (err) {
      setGalat(err.message)
    }
  }

  if (!user) return null

  const judulTab = {
    ringkasan: 'Dasbor Utama',
    program: progId ? program?.nama : 'Program & Materi',
    pengguna: 'Kelola Pengguna',
    transaksi: 'Transaksi',
    toko: 'Toko Hifz\u2019',
    berita: 'Berita & Artikel',
  }

  return (
    <div className={`db db--admin${collapsed ? ' is-collapsed' : ''}`}>
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

        <p className="db-nav-label">Menu admin</p>
        <nav className="db-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id)
                if (id !== 'program') setProgId(null)
              }}
            >
              <Icon size={17} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="db-side-foot">
          <button type="button" className="db-logout" title="Keluar" onClick={keluar}>
            <LogOut size={17} strokeWidth={1.9} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ------- Konten ------- */}
      <main className="db-main">
        <header className="db-top">
          <div className="db-top-kiri">
            <Link className="db-bell db-top-back" to="/" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ArrowLeft size={17} strokeWidth={1.9} />
            </Link>
            <div>
              <h1>{judulTab[tab]}</h1>
            </div>
          </div>
          <div className="db-top-actions">
            {openPop && <button type="button" className="db-pop-overlay" aria-label="Tutup" onClick={() => setOpenPop(null)} />}

            <div className="db-pop">
              <button
                type="button"
                className="db-bell"
                aria-label="Notifikasi"
                onClick={() => setOpenPop((v) => (v === 'notif' ? null : 'notif'))}
              >
                <Bell size={18} strokeWidth={1.9} />
                {(menunggu.length + aktivitas.filter((a) => !a.dibaca).length) > 0 && (
                  <i>{menunggu.length + aktivitas.filter((a) => !a.dibaca).length}</i>
                )}
              </button>
              {openPop === 'notif' && (
                <div className="db-pop-menu db-pop-menu--notif">
                  <header>
                    <h5>Notifikasi</h5>
                    <span>{menunggu.length + aktivitas.filter((a) => !a.dibaca).length} baru</span>
                  </header>
                  <ul>
                    {menunggu.length === 0 && aktivitas.length === 0 && (
                      <li>
                        <p>Belum ada notifikasi.</p>
                      </li>
                    )}
                    {menunggu.map((t) => (
                      <li key={t.invoice} className="is-baru">
                        <button
                          type="button"
                          className="db-notif-klik"
                          onClick={() => {
                            setTab('transaksi')
                            setOpenPop(null)
                          }}
                        >
                          <p>Pembayaran {t.invoice} ({t.item}) menunggu konfirmasi.</p>
                          <span>{waktuLengkap(t.createdAt) || t.tanggal}</span>
                        </button>
                      </li>
                    ))}
                    {aktivitas.map((a) => (
                      <li key={a.id} className={a.dibaca ? '' : 'is-baru'}>
                        <button
                          type="button"
                          className="db-notif-klik"
                          onClick={() => {
                            tandaiDibaca(a.id)
                            setOpenPop(null)
                          }}
                        >
                          <p>{a.teks}</p>
                          <span>{waktuLengkap(a.waktu)}</span>
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
                <Avatar nama={user.nama} besar />
              </button>
              {openPop === 'profil' && (
                <div className="db-pop-menu db-pop-menu--profil">
                  <div className="db-pop-user">
                    <strong>{user.nama}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button type="button" className="is-keluar" onClick={keluar}>
                    <LogOut size={15} strokeWidth={1.9} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {galat && (
          <p className="db-galat" role="alert">
            {galat}
            <button type="button" onClick={() => setGalat('')} aria-label="Tutup pesan">&times;</button>
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${progId ?? ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* ================= RINGKASAN ================= */}
            {tab === 'ringkasan' && (
              <div className="db-page">
                <div className="db-statbar">
                  <div className="db-statcell">
                    <span className="db-stat-ic"><Banknote size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{formatRupiah(pendapatan)}</strong>
                      <p>Pendapatan</p>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><GraduationCap size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{programs.filter((p) => p.status === 'terbit').length}</strong>
                      <p>Program terbit</p>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><UsersRound size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{totalPeserta}</strong>
                      <p>Peserta</p>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic db-stat-ic--gold"><CreditCard size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{menunggu.length}</strong>
                      <p>Pembayaran tertunda</p>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><UserCheck size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{pengguna.length}</strong>
                      <p>Pengguna</p>
                    </div>
                  </div>
                </div>

                <div className="db-cols">
                  <div className="db-col-main">
                    <section className="db-block">
                      <header className="db-block-head">
                        <h4><CircleCheckBig size={15} strokeWidth={2} /> Transaksi Terkonfirmasi</h4>
                        <span className="db-block-sub">{transaksi.filter((t) => t.status === 'Lunas').length} transaksi</span>
                      </header>
                      {transaksi.filter((t) => t.status === 'Lunas').length === 0 ? (
                        <div className="db-kosong"><Kosong icon={Inbox} teks="Belum ada transaksi terkonfirmasi" /></div>
                      ) : (
                        <ul className="db-tenggat">
                          {transaksi.filter((t) => t.status === 'Lunas').slice(0, 5).map((t) => (
                            <li key={t.invoice} onClick={() => setTab('transaksi')}>
                              <span className="db-agenda-tipe is-tugas"><Banknote size={11} strokeWidth={2} /> {t.metode}</span>
                              <div>
                                <p>{t.item}</p>
                                <span>{t.penerima} · {t.invoice} · {formatRupiah(t.total)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4><Timer size={15} strokeWidth={2} /> Menunggu Konfirmasi</h4>
                        <span className="db-block-sub">{menunggu.length} transaksi</span>
                      </header>
                      {menunggu.length === 0 ? (
                        <div className="db-kosong"><Kosong icon={Hourglass} teks="Tidak ada pembayaran tertunda" /></div>
                      ) : (
                        <ul className="db-tenggat">
                          {menunggu.map((t) => (
                            <li key={t.invoice} onClick={() => setTab('transaksi')}>
                              <span className="db-agenda-tipe is-tugas"><CreditCard size={11} strokeWidth={2} /> {t.metode}</span>
                              <div>
                                <p>{t.item}</p>
                                <span>{t.penerima} · {t.invoice} · {formatRupiah(t.total)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4><Flame size={15} strokeWidth={2} /> Program Terlaris</h4>
                        <span className="db-block-sub">{programs.length} program aktif</span>
                      </header>
                      {programs.length === 0 ? (
                        <div className="db-kosong"><Kosong icon={FolderOpen} teks="Belum ada program" /></div>
                      ) : (
                        <ul className="db-peserta">
                          {[...programs].sort((a, b) => (b.peserta ?? 0) - (a.peserta ?? 0)).slice(0, 5).map((p) => (
                            <li key={p.id}>
                              <img src={p.gambar} alt="" style={{ borderRadius: 10 }} />
                              <div>
                                <strong>{p.nama}</strong>
                                <Bar value={Math.min((p.peserta ?? 0) * 2, 100)} />
                                <span>{p.peserta ?? 0} peserta · {formatRupiah(p.harga)} · {p.kategori}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  <aside className="db-col-side">
                    <section className="db-block db-notif">
                      <header className="db-block-head">
                        <h4><BellRing size={15} strokeWidth={2} /> Notifikasi</h4>
                        <div className="db-notif-head-aksi">
                          {aktivitas.some((a) => !a.dibaca) && (
                            <button type="button" className="db-notif-tandai" onClick={tandaiSemuaDibaca}>
                              <CheckCheck size={12} strokeWidth={2} /> Tandai semua
                            </button>
                          )}
                          <span className="db-block-sub">{aktivitas.filter((a) => !a.dibaca).length} belum dibaca</span>
                        </div>
                      </header>
                      {aktivitas.length === 0 ? (
                        <div className="db-kosong"><Kosong icon={BellOff} teks="Tidak ada notifikasi" /></div>
                      ) : (
                        <div className="db-notif-scroll">
                          <ul className="db-notif-list">
                            {aktivitas.map((a) => {
                              const Icon = ikonAktivitas[a.tipe] ?? Sparkles
                              const warna = warnaNotif[a.tipe] ?? 'lime'
                              return (
                                <li key={a.id} className={`db-notif-item${a.dibaca ? ' is-dibaca' : ''} db-notif-${warna}`}>
                                  <span className="db-notif-ic"><Icon size={14} strokeWidth={2} /></span>
                                  <div className="db-notif-body">
                                    <p>{a.teks}</p>
                                    <span><Clock size={10} strokeWidth={2} /> {waktuLengkap(a.waktu)}</span>
                                  </div>
                                  <div className="db-notif-aksi">
                                    {!a.dibaca && (
                                      <button
                                        type="button"
                                        className="db-notif-btn"
                                        title="Tandai telah dibaca"
                                        aria-label="Tandai telah dibaca"
                                        onClick={() => tandaiDibaca(a.id)}
                                      >
                                        <Check size={12} strokeWidth={2.1} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="db-notif-btn db-notif-btn--hapus"
                                      title="Hapus notifikasi"
                                      aria-label="Hapus notifikasi"
                                      onClick={() => hapusNotif(a.id)}
                                    >
                                      <X size={12} strokeWidth={2.1} />
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4><ChartColumn size={15} strokeWidth={2} /> Statistik Ringkas</h4>
                      </header>
                      <ul className="db-stat-mini">
                        <li>
                          <span className="db-stat-mini-ic"><BookOpen size={12} strokeWidth={2.1} /></span>
                          <div>
                            <strong>{programs.reduce((a, p) => a + (semuaSub(p).length), 0)}</strong>
                            <span>Materi Terdaftar</span>
                          </div>
                        </li>
                        <li>
                          <span className="db-stat-mini-ic"><Newspaper size={12} strokeWidth={2.1} /></span>
                          <div>
                            <strong>{berita.length}</strong>
                            <span>Artikel Terbit</span>
                          </div>
                        </li>
                        <li>
                          <span className="db-stat-mini-ic"><Package size={12} strokeWidth={2.1} /></span>
                          <div>
                            <strong>{produk.length}</strong>
                            <span>Produk Toko</span>
                          </div>
                        </li>
                        <li>
                          <span className="db-stat-mini-ic"><Goal size={12} strokeWidth={2.1} /></span>
                          <div>
                            <strong>{menunggu.length + aktivitas.filter((a) => !a.dibaca).length}</strong>
                            <span>Perlu Tindak Lanjut</span>
                          </div>
                        </li>
                      </ul>
                    </section>
                  </aside>
                </div>
              </div>
            )}

            {/* ================= PROGRAM: DAFTAR ================= */}
            {tab === 'program' && !progId && (
              <div className="db-page">
                <div className="db-prog-toolbar">
                  <div className="db-prog-cari">
                    <Search size={16} strokeWidth={2} aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Cari program, kategori, atau tutor…"
                      value={cariProgram}
                      onChange={(e) => setCariProgram(e.target.value)}
                      aria-label="Cari program"
                    />
                    {cariProgram && (
                      <button type="button" className="db-prog-cari-clear" onClick={() => setCariProgram('')} aria-label="Bersihkan pencarian">
                        <X size={13} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  <div className="db-prog-kanan">
                    <div className="db-prog-seg" role="tablist" aria-label="Filter status program">
                      {[
                        { id: 'semua', label: 'Semua', count: programs.length },
                        { id: 'terbit', label: 'Terbit', count: programs.filter((p) => p.status === 'terbit').length },
                        { id: 'draf', label: 'Draf', count: programs.filter((p) => p.status === 'draf').length },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          role="tab"
                          aria-selected={filterProg === f.id}
                          className={filterProg === f.id ? 'is-aktif' : ''}
                          onClick={() => setFilterProg(f.id)}
                        >
                          {f.label}
                          <span className="db-prog-seg-count">{f.count}</span>
                        </button>
                      ))}
                    </div>
                    <button type="button" className="db-btn db-btn--sm" onClick={buatProgram}>
                      <Plus size={14} strokeWidth={2.1} /> Program baru
                    </button>
                  </div>
                </div>

                {programs.length === 0 ? (
                  <div className="db-prog-kosong">
                    <span className="db-prog-kosong-ic"><BookOpen size={28} strokeWidth={1.6} /></span>
                    <strong>Belum ada program</strong>
                    <p>Buat program pertama untuk mulai mengelola materi.</p>
                    <button type="button" className="db-btn db-btn--sm" onClick={buatProgram}>
                      <Plus size={14} strokeWidth={2.1} /> Buat program
                    </button>
                  </div>
                ) : (
                  <div className="db-prog-grid">
                    {programs
                      .filter((p) => (filterProg === 'semua' ? true : p.status === filterProg))
                      .filter((p) => `${p.nama} ${p.kategori} ${p.tutor}`.toLowerCase().includes(cariProgram.toLowerCase()))
                      .map((p) => {
                      const daftarSub = semuaSub(p)
                      const jmlSub = daftarSub.length
                      const jmlTerbit = daftarSub.filter((m) => m.status === 'terbit').length
                      const pct = jmlSub ? Math.round((jmlTerbit / jmlSub) * 100) : 0
                      return (
                      <article
                        key={p.id}
                        className={`db-prog-kartu db-prog-kartu--${p.status === 'terbit' ? 'live' : 'draft'}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setProgId(p.id); tutupSemuaForm() }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProgId(p.id); tutupSemuaForm() } }}
                      >
                        <div className="db-prog-kartu-media">
                          <img src={p.gambar} alt="" />
                          <span className={`db-prog-badge is-${p.status}`}>
                            {p.status === 'terbit' ? 'Terbit' : 'Draf'}
                          </span>
                        </div>
                        <div className="db-prog-kartu-body">
                          <strong className="db-prog-kartu-judul">{p.nama}</strong>
                          <div className="db-prog-kartu-meta">
                            <span>{p.kategori}</span>
                            <span className="db-prog-kartu-dot" />
                            <span>{p.jenis}</span>
                            <span className="db-prog-kartu-dot" />
                            <span>{p.mode ?? 'Online'}</span>
                          </div>
                          <div className="db-prog-kartu-info">
                            <span><UserRound size={11} strokeWidth={2} /> {p.tutor || 'Tanpa tutor'}</span>
                            <span><Banknote size={11} strokeWidth={2} /> {formatRupiah(p.harga)}</span>
                          </div>
                          <div className="db-prog-kartu-progress">
                            <span className="db-progres"><i style={{ width: `${pct}%` }} /></span>
                            <em>{pct}%</em>
                          </div>
                          <div className="db-prog-kartu-foot">
                            <div className="db-prog-kartu-stat">
                              <span><BookOpen size={11} strokeWidth={2} /> {jmlSub}</span>
                              <span><CheckCircle2 size={11} strokeWidth={2} /> {jmlTerbit}</span>
                            </div>
                            <div className="db-mini-aksi" onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="db-ikon-btn" title={p.status === 'terbit' ? 'Tarik ke draf' : 'Terbitkan'} onClick={() => toggleProgram(p.id)}>
                                {p.status === 'terbit' ? <EyeOff size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
                              </button>
                              <button type="button" className="db-ikon-btn" title="Edit" onClick={() => { setProgId(p.id); tutupSemuaForm() }}>
                                <SquarePen size={12} strokeWidth={2} />
                              </button>
                              <button type="button" className="db-ikon-btn db-ikon-btn--hapus" title="Hapus" onClick={() => hapusProgram(p.id)}>
                                <Trash2 size={12} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                      )
                    })}
                  </div>
                )}
                {programs.length > 0 && programs.filter((p) => (filterProg === 'semua' ? true : p.status === filterProg)).filter((p) => `${p.nama} ${p.kategori} ${p.tutor}`.toLowerCase().includes(cariProgram.toLowerCase())).length === 0 && (
                  <div className="db-kosong"><Kosong icon={SearchX} teks="Tidak ditemukan program yang sesuai" /></div>
                )}
              </div>
            )}

            {/* ================= PROGRAM: EDITOR MATERI ================= */}
            {tab === 'program' && progId && program && (
              <div className="db-page">
                <button type="button" className="db-btn db-btn--ghost db-btn--sm db-kembali" onClick={() => { setProgId(null); tutupSemuaForm() }}>
                  <ArrowLeft size={14} strokeWidth={2} /> Semua program
                </button>

                <div className="db-prog">
                  <div className="db-prog-main">
                    <section className="db-block">
                      <header
                        className={`db-block-head db-block-head--klik db-blok-head${blokBuka.info ? '' : ' is-tutup'}`}
                        role="button"
                        tabIndex={0}
                        aria-expanded={blokBuka.info}
                        onClick={() => toggleBlok('info')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBlok('info') } }}
                      >
                        <span className="db-blok-no">1</span>
                        <div className="db-blok-teks">
                          <h4>Informasi program</h4>
                        </div>
                        {program.nama && program.deskripsi && program.tutor ? (
                          <span className="db-blok-status is-ok"><CheckCircle2 size={12} strokeWidth={2.1} /> Lengkap</span>
                        ) : (
                          <span className="db-blok-status"><CircleDashed size={12} strokeWidth={2.1} /> Perlu dilengkapi</span>
                        )}
                        <ChevronDown size={16} strokeWidth={2} className={`db-blok-caret${blokBuka.info ? ' is-buka' : ''}`} aria-hidden="true" />
                      </header>
                      {blokBuka.info && (
                      <form className="db-form-program" onSubmit={simpanInfo}>
                        <div className="db-form-program-grid db-form-program-grid--rata">
                          <label className="db-form-program-full">
                            <span title="Nama program"><Type size={13} strokeWidth={2} /></span>
                            <input
                              type="text"
                              placeholder="Nama program"
                              value={formProgram.nama}
                              onChange={(e) => ubahInfo({ nama: e.target.value })}
                            />
                          </label>
                          <label>
                            <span title="Kategori"><Tag size={13} strokeWidth={2} /></span>
                            <select value={formProgram.kategori} onChange={(e) => ubahInfo({ kategori: e.target.value })}>
                              {kategoriProgram.map((k) => <option key={k}>{k}</option>)}
                            </select>
                          </label>
                          <label>
                            <span title="Jenis program"><Shapes size={13} strokeWidth={2} /></span>
                            <select value={formProgram.jenis} onChange={(e) => ubahInfo({ jenis: e.target.value })}>
                              {jenisProgram.map((j) => <option key={j}>{j}</option>)}
                            </select>
                          </label>
                          <label>
                            <span title="Mode belajar"><Globe size={13} strokeWidth={2} /></span>
                            <select value={formProgram.mode} onChange={(e) => ubahInfo({ mode: e.target.value })}>
                              {modeProgram.map((m) => <option key={m}>{m}</option>)}
                            </select>
                          </label>
                          <label className="db-span-3">
                            <span title="Guru pengampu"><GraduationCap size={13} strokeWidth={2} /></span>
                            <select value={formProgram.tutor} onChange={(e) => ubahInfo({ tutor: e.target.value })}>
                              <option value="">Pilih guru</option>
                              {formProgram.tutor && !daftarGuru.includes(formProgram.tutor) && (
                                <option value={formProgram.tutor}>{formProgram.tutor}</option>
                              )}
                              {daftarGuru.map((g) => <option key={g}>{g}</option>)}
                            </select>
                          </label>
                          <label className="db-span-3">
                            <span title="Harga"><Wallet size={13} strokeWidth={2} /></span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Harga (0 = gratis)"
                              value={formProgram.harga}
                              onChange={(e) => ubahInfo({ harga: e.target.value })}
                            />
                          </label>
                        </div>

                        <label className="db-form-program-full">
                          <span title="Deskripsi"><AlignLeft size={13} strokeWidth={2} /></span>
                          <textarea
                            rows={3}
                            placeholder="Deskripsi singkat."
                            value={formProgram.deskripsi}
                            onChange={(e) => ubahInfo({ deskripsi: e.target.value })}
                          />
                        </label>

                        <div className="db-form-program-full db-form-gambar">
                          <div className="db-gambar-row">
                            <label className="db-gambar-drop">
                              {formProgram.gambar ? (
                                <img src={formProgram.gambar} alt="Pratinjau gambar program" />
                              ) : (
                                <span className="db-gambar-plh">
                                  <ImagePlus size={22} strokeWidth={1.8} aria-hidden="true" />
                                  Unggah gambar
                                </span>
                              )}
                              <input type="file" accept="image/*" onChange={pilihGambarProgram} />
                            </label>
                            {formProgram.gambar && (
                              <button
                                type="button"
                                className="db-btn db-btn--ghost db-btn--sm"
                                onClick={() => ubahInfo({ gambar: '' })}
                              >
                                <Trash2 size={14} strokeWidth={2} /> Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="db-modul-form-btns">
                          {infoSimpan ? (
                            <em className="db-jadwal-ok is-proses"><RefreshCw size={13} strokeWidth={2.1} /> Menyimpan…</em>
                          ) : infoOk ? (
                            <em className="db-jadwal-ok"><CheckCircle2 size={13} strokeWidth={2.1} /> Tersimpan otomatis</em>
                          ) : null}
                        </div>
                      </form>
                      )}
                    </section>

                    <section className="db-block">
                      <header
                        className={`db-block-head db-block-head--klik db-blok-head${blokBuka.kur ? '' : ' is-tutup'}`}
                        role="button"
                        tabIndex={0}
                        aria-expanded={blokBuka.kur}
                        onClick={() => toggleBlok('kur')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBlok('kur') } }}
                      >
                        <span className="db-blok-no">2</span>
                        <div className="db-blok-teks">
                          <h4>Struktur kurikulum</h4>
                        </div>
                        <div className="db-kur-stats">
                          <span><Layers3 size={12} strokeWidth={2.1} /> {(program.kurikulum ?? []).length} materi</span>
                          <span className="is-terbit"><CircleCheckBig size={12} strokeWidth={2.1} /> {semuaSub(program).filter((m) => m.status === 'terbit').length} terbit</span>
                          <span className="is-draf"><CircleDashed size={12} strokeWidth={2.1} /> {semuaSub(program).filter((m) => m.status === 'draf').length} draf</span>
                        </div>
                        <ChevronDown size={16} strokeWidth={2} className={`db-blok-caret${blokBuka.kur ? ' is-buka' : ''}`} aria-hidden="true" />
                      </header>
                      {blokBuka.kur && (<>

                      {temaFormBuka || editTemaId ? (
                        <form className="db-form-tema" onSubmit={simpanTema}>
                        <div className="db-form-bagian">
                          <div className="db-form-tema-grid">
                            <label className="db-f db-f--full">
                              <span title="Judul materi"><Type size={13} strokeWidth={2} /></span>
                              <input
                                type="text"
                                placeholder="Judul materi"
                                value={formTema.judul}
                                onChange={(e) => setFormTema((f) => ({ ...f, judul: e.target.value }))}
                              />
                            </label>
                            <label className="db-f">
                              <span title="Narasi materi"><AlignLeft size={13} strokeWidth={2} /></span>
                              <textarea
                                rows={3}
                                placeholder="Narasi materi"
                                value={formTema.narasi}
                                onChange={(e) => setFormTema((f) => ({ ...f, narasi: e.target.value }))}
                              />
                            </label>
                            <label className="db-f">
                              <span title="Indikator capaian"><Goal size={13} strokeWidth={2} /></span>
                              <textarea
                                rows={3}
                                placeholder="Indikator capaian"
                                value={formTema.indikator}
                                onChange={(e) => setFormTema((f) => ({ ...f, indikator: e.target.value }))}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="db-modul-form-btns">
                          <button type="button" className="db-btn db-btn--ghost db-btn--sm" onClick={() => { setEditTemaId(null); setFormTema({ ...temaKosong }); setTemaFormBuka(false) }}>
                            <X size={13} strokeWidth={2.1} /> Batal
                          </button>
                          <button type="submit" className="db-btn db-btn--sm">
                            {editTemaId ? <Save size={14} strokeWidth={2.1} /> : <Plus size={14} strokeWidth={2.1} />}
                            {editTemaId ? ' Simpan materi' : ' Tambah materi'}
                          </button>
                        </div>
                      </form>
                      ) : (
                        <button type="button" className="db-tambah db-tambah--tema" onClick={() => setTemaFormBuka(true)}>
                          <Plus size={13} strokeWidth={2} /> Tambah materi
                        </button>
                      )}

                      <ol className="db-kur">
                        {(program.kurikulum ?? []).map((t, ti) => {
                          const terbitN = (t.sub ?? []).filter((s) => s.status === 'terbit').length
                          return (
                          <li key={t.id} className="db-tema">
                            <header className="db-tema-head">
                              <span className="db-tema-idx">{String(ti + 1).padStart(2, '0')}</span>
                              <div className="db-tema-info">
                                <strong>{t.judul}</strong>
                                <em>{(t.sub ?? []).length} sub materi{terbitN > 0 ? ` · ${terbitN} terbit` : ''}</em>
                              </div>
                              <div className="db-mini-aksi">
                                <button type="button" className="db-ikon-btn" title="Naikkan urutan" disabled={ti === 0} onClick={() => geserTema(t.id, -1)}>
                                  <ArrowUp size={14} strokeWidth={1.9} />
                                </button>
                                <button type="button" className="db-ikon-btn" title="Turunkan urutan" disabled={ti === (program.kurikulum ?? []).length - 1} onClick={() => geserTema(t.id, 1)}>
                                  <ArrowDown size={14} strokeWidth={1.9} />
                                </button>
                                <button type="button" className="db-ikon-btn" title="Edit materi" onClick={() => mulaiEditTema(t)}>
                                  <SquarePen size={14} strokeWidth={1.9} />
                                </button>
                                <button type="button" className="db-ikon-btn db-ikon-btn--hapus" title="Hapus materi" onClick={() => hapusTema(t)}>
                                  <Trash2 size={14} strokeWidth={1.9} />
                                </button>
                                <button type="button" className="db-ikon-btn" title={temaTutup[t.id] ? 'Buka materi' : 'Tutup materi'} onClick={() => toggleTema(t.id)}>
                                  {temaTutup[t.id] ? <ChevronDown size={14} strokeWidth={1.9} /> : <ChevronUp size={14} strokeWidth={1.9} />}
                                </button>
                              </div>
                            </header>

                            {!temaTutup[t.id] && (<>

                            {t.narasi && <p className="db-tema-narasi">{t.narasi}</p>}

                            {(t.indikator ?? []).length > 0 && (
                              <div className="db-indikator">
                                <span className="db-indikator-judul">Indikator capaian</span>
                                <ul>
                                  {t.indikator.map((ind, i) => (
                                    <li key={i}>{ind}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(t.sub ?? []).length > 0 && (
                            <div className="db-sub-list">
                            {(t.sub ?? []).map((s, si) => {
                              const IkonSub = ikonJenis[s.jenis] ?? FileText
                              return (
                                <div key={s.id} className="db-subtema">
                                  <span className="db-subtema-ic"><IkonSub size={15} strokeWidth={1.8} /></span>
                                  <div className="db-subtema-isi">
                                    <div className="db-subtema-judul">
                                      <em>{ti + 1}.{si + 1}</em>
                                      <strong>{s.judul}</strong>
                                      <span className={`db-subtema-status ${s.status === 'terbit' ? 'is-terbit' : 'is-draf'}`}>
                                        {s.status === 'terbit' ? 'Terbit' : 'Draf'}
                                      </span>
                                    </div>
                                    {s.narasi && <p>{s.narasi}</p>}
                                    <ul className="db-subtema-meta">
                                      <li><IkonSub size={12} strokeWidth={1.9} /> {labelTipe(s.jenis ?? 'video')}</li>
                                      {s.pengajar && <li><UserRound size={12} strokeWidth={1.9} /> {s.pengajar}</li>}
                                      {s.jadwal && <li><CalendarDays size={12} strokeWidth={1.9} /> {tanggalSub(s.jadwal)}</li>}
                                      {jamRentangSub(s.jadwal, s.durasi) && <li><Clock size={12} strokeWidth={1.9} /> {jamRentangSub(s.jadwal, s.durasi)}</li>}
                                      {s.tautan && <li><Video size={12} strokeWidth={1.9} /> Zoom tersedia</li>}
                                      {s.konten && (s.jenis === 'video'
                                        ? <li><SquarePlay size={12} strokeWidth={1.9} /> Video YouTube (tertutup)</li>
                                        : <li><FileText size={12} strokeWidth={1.9} /> {s.konten}</li>)}
                                    </ul>
                                  </div>
                                  <div className="db-mini-aksi">
                                    <button type="button" className="db-ikon-btn" title="Naikkan urutan" disabled={si === 0} onClick={() => geserSub(t.id, s.id, -1)}>
                                      <ArrowUp size={14} strokeWidth={1.9} />
                                    </button>
                                    <button type="button" className="db-ikon-btn" title="Turunkan urutan" disabled={si === (t.sub ?? []).length - 1} onClick={() => geserSub(t.id, s.id, 1)}>
                                      <ArrowDown size={14} strokeWidth={1.9} />
                                    </button>
                                    <button type="button" className="db-ikon-btn" title={s.status === 'terbit' ? 'Tarik ke draf' : 'Terbitkan'} onClick={() => toggleSub(t.id, s.id)}>
                                      {s.status === 'terbit' ? <EyeOff size={14} strokeWidth={1.9} /> : <Eye size={14} strokeWidth={1.9} />}
                                    </button>
                                    <button type="button" className="db-ikon-btn" title="Edit sub materi" onClick={() => mulaiEditSub(t.id, s)}>
                                      <SquarePen size={14} strokeWidth={1.9} />
                                    </button>
                                    <button type="button" className="db-ikon-btn db-ikon-btn--hapus" title="Hapus sub materi" onClick={() => hapusSub(t.id, s)}>
                                      <Trash2 size={14} strokeWidth={1.9} />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            </div>
                            )}

                            {subTarget === t.id ? (
                              <form className="db-form-sub" onSubmit={simpanSub}>
                                <div className="db-form-bagian">
                                  <label className="db-f db-f--full">
                                    <span title="Judul sub materi"><Type size={13} strokeWidth={2} /></span>
                                    <input
                                      type="text"
                                      placeholder="Judul sub materi"
                                      value={formSub.judul}
                                      onChange={(e) => ubahSub({ judul: e.target.value })}
                                    />
                                  </label>
                                  <label className="db-f db-f--full">
                                    <span title="Narasi (opsional)"><AlignLeft size={13} strokeWidth={2} /></span>
                                    <textarea
                                      rows={2}
                                      placeholder="Narasi (opsional)"
                                      value={formSub.narasi}
                                      onChange={(e) => ubahSub({ narasi: e.target.value })}
                                    />
                                  </label>
                                </div>

                                {/* ===== Bagian 2: Bentuk & Konten ===== */}
                                <div className="db-form-bagian">
                                  <div className="db-f db-f--full">
                                    <span title="Bentuk pembelajaran"><Shapes size={13} strokeWidth={2} /></span>
                                    <div className="db-jenis-pilih" role="radiogroup">
                                      {jenisPembelajaran.map((tp) => {
                                        const Ik = ikonJenis[tp.id] ?? FileText
                                        return (
                                          <button
                                            key={tp.id}
                                            type="button"
                                            className={formSub.jenis === tp.id ? 'is-aktif' : ''}
                                            onClick={() => ubahSub({ jenis: tp.id, konten: '' })}
                                          >
                                            <Ik size={13} strokeWidth={2} /> {tp.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                  {formSub.jenis === 'video' && (
                                    <label className="db-f db-f--full">
                                      <span title="Tautan video YouTube"><Video size={13} strokeWidth={2} /></span>
                                      <input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=…"
                                        value={formSub.konten}
                                        onChange={(e) => ubahSub({ konten: e.target.value })}
                                      />
                                      {youtubeId(formSub.konten) && (
                                        <div className="db-sub-pratinjau">
                                          <PlayerTertutup videoId={youtubeId(formSub.konten)} judul="Pratinjau video" />
                                        </div>
                                      )}
                                    </label>
                                  )}
                                  {formSub.jenis === 'dokumen' && (
                                    <label className="db-upload db-f--full">
                                      <Upload size={14} strokeWidth={1.9} />
                                      <span>{formSub.konten || 'Unggah dokumen (pdf, docx, pptx)'}</span>
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        onChange={(e) => ubahSub({ konten: e.target.files?.[0]?.name ?? '' })}
                                      />
                                    </label>
                                  )}
                                  {formSub.jenis === 'kuis' && (
                                    <label className="db-f db-f--full">
                                      <span title="Rincian kuis"><HelpCircle size={13} strokeWidth={2} /></span>
                                      <input
                                        type="text"
                                        placeholder="Rincian kuis"
                                        value={formSub.konten}
                                        onChange={(e) => ubahSub({ konten: e.target.value })}
                                      />
                                    </label>
                                  )}
                                  {formSub.jenis === 'sesi-online' && (
                                    <label className="db-f db-f--full">
                                      <span title="Agenda sesi (opsional)"><SquarePen size={13} strokeWidth={2} /></span>
                                      <input
                                        type="text"
                                        placeholder="Agenda sesi (opsional)"
                                        value={formSub.konten}
                                        onChange={(e) => ubahSub({ konten: e.target.value })}
                                      />
                                    </label>
                                  )}
                                  {formSub.jenis === 'sesi-offline' && (
                                    <label className="db-f db-f--full">
                                      <span title="Lokasi kelas"><MapPin size={13} strokeWidth={2} /></span>
                                      <input
                                        type="text"
                                        placeholder="Lokasi kelas"
                                        value={formSub.konten}
                                        onChange={(e) => ubahSub({ konten: e.target.value })}
                                      />
                                    </label>
                                  )}
                                </div>

                                {/* ===== Bagian 3: Pengampu & Jadwal ===== */}
                                <div className="db-form-bagian">
                                  <div className="db-form-materi-grid">
                                    <label className="db-f">
                                      <span title="Guru pengampu"><GraduationCap size={13} strokeWidth={2} /></span>
                                      <select value={formSub.pengajar} onChange={(e) => ubahSub({ pengajar: e.target.value })}>
                                        <option value="">Pilih guru</option>
                                        {formSub.pengajar && !daftarGuru.includes(formSub.pengajar) && (
                                          <option value={formSub.pengajar}>{formSub.pengajar}</option>
                                        )}
                                        {daftarGuru.map((g) => <option key={g}>{g}</option>)}
                                      </select>
                                    </label>
                                    <label className="db-f">
                                      <span title="Durasi (menit)"><Timer size={13} strokeWidth={2} /></span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="5"
                                        placeholder="Durasi (menit)"
                                        value={formSub.durasi}
                                        onChange={(e) => ubahSub({ durasi: e.target.value })}
                                      />
                                    </label>
                                    {(formSub.jenis === 'sesi-online' || formSub.jenis === 'sesi-offline') && (
                                      <label className="db-f">
                                        <span title="Jadwal sesi"><CalendarDays size={13} strokeWidth={2} /></span>
                                        <input
                                          type="datetime-local"
                                          value={formSub.jadwal}
                                          onChange={(e) => ubahSub({ jadwal: e.target.value })}
                                        />
                                      </label>
                                    )}
                                    {formSub.jenis === 'sesi-online' && (
                                      <label className="db-f db-f--full">
                                        <span title="Tautan Zoom / meeting"><Link2 size={13} strokeWidth={2} /></span>
                                        <input
                                          type="url"
                                          placeholder="https://zoom.us/j/…"
                                          value={formSub.tautan}
                                          onChange={(e) => ubahSub({ tautan: e.target.value })}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>

                                {subGalat && <p className="db-f-galat" role="alert">{subGalat}</p>}
                                <div className="db-modul-form-btns">
                                  <button type="button" className="db-btn db-btn--ghost db-btn--sm" onClick={() => { setSubTarget(null); setEditSubId(null); setFormSub({ ...subKosong }); setSubGalat('') }}>
                                    <X size={13} strokeWidth={2.1} /> Batal
                                  </button>
                                  <button type="submit" className="db-btn db-btn--sm">
                                    {editSubId ? <Save size={14} strokeWidth={2.1} /> : <Plus size={14} strokeWidth={2.1} />}
                                    {editSubId ? ' Simpan sub materi' : ' Tambah sub materi'}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button type="button" className="db-tambah db-tambah--sub" onClick={() => bukaFormSub(t.id)}>
                                <Plus size={13} strokeWidth={2} /> Tambah sub materi
                              </button>
                            )}

                            </>)}
                          </li>
                          )
                        })}
                      </ol>
                      </>)}
                    </section>
                  </div>

                  <aside className="db-prog-side">
                    <section className="db-block">
                      <header className="db-block-head"><h4>Detail program</h4></header>
                      {(() => {
                        const semua = semuaSub(program)
                        const terbit = semua.filter((m) => m.status === 'terbit').length
                        const gurus = [...new Set(semua.map((m) => m.pengajar).filter(Boolean))]
                        return (
                          <ul className="db-prog-rinci">
                            <li><span>Kategori</span><strong>{program.kategori}</strong></li>
                            <li><span>Jenis program</span><strong>{program.jenis}</strong></li>
                            <li><span>Mode belajar</span><strong>{program.mode ?? 'Online'}</strong></li>
                            <li><span>Tutor pengampu</span><strong>{program.tutor || 'Belum ditentukan'}</strong></li>
                            <li><span>Guru terlibat</span><strong>{gurus.length ? `${gurus.length} guru` : 'Belum ada'}</strong></li>
                            <li><span>Harga</span><strong>{Number(program.harga) > 0 ? formatRupiah(program.harga) : 'Gratis'}</strong></li>
                            <li><span>Peserta terdaftar</span><strong>{Math.max(program.peserta ?? 0, pesertaProgram(program.id).length)} orang</strong></li>
                            <li><span>Materi</span><strong>{(program.kurikulum ?? []).length}</strong></li>
                            <li><span>Sub materi</span><strong>{semua.length} · {terbit} terbit</strong></li>
                          </ul>
                        )
                      })()}
                      <div className="db-prog-btns">
                        <button type="button" className={`db-btn ${program.status === 'terbit' ? 'db-btn--ghost' : ''}`} onClick={() => toggleProgram(program.id)}>
                          {program.status === 'terbit' ? 'Tarik dari katalog' : 'Terbitkan program'}
                        </button>
                      </div>
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Guru</h4>
                      </header>
                      {(() => {
                        const daftarSub = semuaSub(program)
                        const gurus = [...new Set(daftarSub.map((m) => m.pengajar).filter(Boolean))]
                        if (gurus.length === 0) return <div className="db-kosong"><Kosong icon={UserX} teks="Belum ada guru terdaftar" /></div>
                        return (
                          <ul className="db-peserta">
                            {gurus.map((g) => (
                              <li key={g}>
                                <Avatar nama={g} besar />
                                <div>
                                  <strong>{g}</strong>
                                  <span>{daftarSub.filter((m) => m.pengajar === g).length} sub materi diampu</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )
                      })()}
                    </section>

                    <section className="db-block">
                      <header className="db-block-head">
                        <h4>Peserta</h4>
                      </header>
                      {(() => {
                        const daftar = pesertaProgram(program.id)
                        if (daftar.length === 0) return <div className="db-kosong"><Kosong icon={UserX} teks="Belum ada peserta" /></div>
                        const totalSub = semuaSub(program).filter((m) => m.status === 'terbit').length
                        return (
                          <ul className="db-peserta">
                            {daftar.map((email) => {
                              const prog = hitungProgres(program, bacaProgres(email, program.id))
                              const hadirN = bacaAbsensi(email, program.id).length
                              const nilaiMap = bacaPenilaian(email, program.id)
                              const dinilaiN = Object.values(nilaiMap).filter((r) => (typeof r === 'number' ? r : r?.love ?? 0) > 0).length
                              return (
                                <li key={email}>
                                  <Avatar nama={email} besar />
                                  <div>
                                    <strong>{email}</strong>
                                    <span>{prog.pct}% progres · hadir {Math.min(hadirN, totalSub)}/{totalSub} · dinilai {Math.min(dinilaiN, totalSub)}/{totalSub}</span>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )
                      })()}
                    </section>
                  </aside>
                </div>
              </div>
            )}

            {/* ================= PENGGUNA ================= */}
            {tab === 'pengguna' && (
              <div className="db-page">
                <div className="db-user-alat">
                  <div className="db-user-cari">
                    <Search size={15} strokeWidth={2} aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Cari pengguna..."
                      value={cariUser}
                      onChange={(e) => setCariUser(e.target.value)}
                    />
                  </div>
                  <div className="db-user-stat">
                    {[
                      ['semua', 'Semua', pengguna.length],
                      ['admin', 'Admin', pengguna.filter((x) => x.peran === 'admin').length],
                      ['tutor', 'Guru', pengguna.filter((x) => x.peran === 'tutor').length],
                      ['customer', 'Customer', pengguna.filter((x) => x.peran === 'customer').length],
                      ['pelamar', 'Pelamar', pengguna.filter((x) => x.peran === 'pelamar').length],
                    ].map(([nilai, label, jml]) => (
                      <button
                        key={nilai}
                        type="button"
                        className={`db-user-chip db-user-chip--${nilai}${filterPeran === nilai ? ' is-aktif' : ''}`}
                        onClick={() => setFilterPeran(nilai)}
                      >
                        {label} <strong>{jml}</strong>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="db-btn" onClick={() => bukaEditUser(null)}>
                    <UserPlus size={15} strokeWidth={2.1} aria-hidden="true" /> Tambah
                  </button>
                </div>
                {(() => {
                  const tampil = pengguna.filter(
                    (u) =>
                      (filterPeran === 'semua' || u.peran === filterPeran) &&
                      `${u.nama} ${u.email}`.toLowerCase().includes(cariUser.toLowerCase()),
                  )
                  if (pengguna.length === 0) return <div className="db-kosong"><Kosong icon={UsersRound} teks="Belum ada pengguna terdaftar" /></div>
                  if (tampil.length === 0) return <div className="db-kosong"><Kosong icon={SearchX} teks="Tidak ditemukan pengguna yang sesuai" /></div>
                  return (
                <div className="db-table-card">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Pengguna</th>
                        <th>Kontak</th>
                        <th>Bergabung</th>
                        <th>Peran</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tampil.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className={`db-td-user db-td-user--${u.peran}`}>
                              {u.foto ? <img src={u.foto} alt="" /> : <Avatar nama={u.nama} besar />}
                              <div>
                                <strong>{u.nama}</strong>
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>{u.telepon || <span className="db-um-kosong">-</span>}</td>
                          <td>{u.bergabung}</td>
                          <td>
                            <select className="db-peran" value={u.peran} onChange={(e) => ubahPeran(u.id, e.target.value)}>
                              <option value="pelamar">Pelamar guru</option>
                              <option value="customer">Customer</option>
                              <option value="tutor">Guru</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`db-status ${u.status === 'aktif' ? 'is-lunas' : 'is-tunggu'}`}>
                              {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td>
                            <div className="db-um-aksi-td">
                              <button type="button" className="db-um-ic" title="Lihat profil" aria-label="Lihat profil" onClick={() => setUserModal({ mode: 'lihat', id: u.id })}>
                                <Eye size={15} strokeWidth={2} />
                              </button>
                              <button type="button" className="db-um-ic" title="Edit profil" aria-label="Edit profil" onClick={() => bukaEditUser(u)}>
                                <SquarePen size={15} strokeWidth={2} />
                              </button>
                              <button type="button" className={`db-um-ic${u.status === 'aktif' ? '' : ' db-um-ic--mati'}`} title={u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} aria-label={u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => toggleStatusPengguna(u.id)}>
                                <Power size={15} strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  )
                })()}

                {userModal && (() => {
                  const u = pengguna.find((x) => x.id === userModal.id)
                  const modeLihat = userModal.mode === 'lihat'
                  if (modeLihat && !u) return null
                  const isi = modeLihat ? u : formUser
                  const lengkap = modeLihat
                    ? ['telepon', 'alamat', 'bio', 'foto'].filter((k) => u[k]).length
                    : 0
                  return (
                    <div className="db-um-overlay" onClick={tutupUserModal}>
                      <div className="db-um-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        {modeLihat ? (
                          <>
                            <div className="db-um-head">
                              {u.foto ? <img className="db-um-foto" src={u.foto} alt="" /> : <span className="db-um-foto db-um-foto--ini">{inisial(u.nama)}</span>}
                              <div className="db-um-head-teks">
                                <strong>{u.nama}</strong>
                                <span>{u.email}</span>
                                <div className="db-um-badges">
                                  <span className="db-um-badge">{labelPeran[u.peran] ?? u.peran}</span>
                                  <span className={`db-status ${u.status === 'aktif' ? 'is-lunas' : 'is-tunggu'}`}>
                                    {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </div>
                              </div>
                              <button type="button" className="db-um-tutup" onClick={tutupUserModal} aria-label="Tutup"><X size={16} strokeWidth={2.2} /></button>
                            </div>
                            <div className="db-um-lengkap">
                              <div className="db-um-lengkap-teks">
                                <span>Kelengkapan profil</span>
                                <strong>{Math.round(((2 + lengkap) / 6) * 100)}%</strong>
                              </div>
                              <div className="db-bar"><span style={{ width: `${((2 + lengkap) / 6) * 100}%` }} /></div>
                            </div>
                            <dl className="db-um-grid">
                              <div><dt><Phone size={13} strokeWidth={2.1} aria-hidden="true" /> Telepon</dt><dd>{u.telepon || <span className="db-um-kosong">-</span>}</dd></div>
                              <div><dt><CalendarDays size={13} strokeWidth={2.1} aria-hidden="true" /> Bergabung</dt><dd>{u.bergabung}</dd></div>
                              <div className="db-um-full"><dt><MapPin size={13} strokeWidth={2.1} aria-hidden="true" /> Alamat</dt><dd>{u.alamat || <span className="db-um-kosong">-</span>}</dd></div>
                              <div className="db-um-full"><dt><FileText size={13} strokeWidth={2.1} aria-hidden="true" /> Bio</dt><dd>{u.bio || <span className="db-um-kosong">-</span>}</dd></div>
                            </dl>
                            <div className="db-um-aksi">
                              <button type="button" className="db-btn" onClick={() => bukaEditUser(u)}>
                                <SquarePen size={15} strokeWidth={2.1} aria-hidden="true" /> Edit profil
                              </button>
                              <button type="button" className="db-btn db-btn--ghost" onClick={() => toggleStatusPengguna(u.id)}>
                                <Power size={15} strokeWidth={2.1} aria-hidden="true" /> {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <form onSubmit={simpanUser}>
                            <div className="db-um-head">
                              <div className="db-um-head-teks">
                                <strong>{userModal.mode === 'baru' ? 'Tambah pengguna' : `Edit profil ${isi.nama || ''}`}</strong>
                                <span>{userModal.mode === 'baru' ? 'Lengkapi data dan tentukan password awal.' : 'Perbarui data profil, kosongkan password jika tidak diganti.'}</span>
                              </div>
                              <button type="button" className="db-um-tutup" onClick={tutupUserModal} aria-label="Tutup"><X size={16} strokeWidth={2.2} /></button>
                            </div>
                            <div className="db-um-form">
                              <label><span><UserRound size={13} strokeWidth={2.1} aria-hidden="true" /> Nama</span>
                                <input value={isi.nama} onChange={(e) => setFormUser((f) => ({ ...f, nama: e.target.value }))} placeholder="Nama pengguna" required />
                              </label>
                              <label><span><Mail size={13} strokeWidth={2.1} aria-hidden="true" /> Email</span>
                                <input type="email" value={isi.email} onChange={(e) => setFormUser((f) => ({ ...f, email: e.target.value }))} placeholder="nama@email.com" required />
                              </label>
                              <label><span><Phone size={13} strokeWidth={2.1} aria-hidden="true" /> Telepon</span>
                                <input value={isi.telepon} onChange={(e) => setFormUser((f) => ({ ...f, telepon: e.target.value }))} placeholder="08xxxxxxxxxx" />
                              </label>
                              <label><span><UserCheck size={13} strokeWidth={2.1} aria-hidden="true" /> Peran</span>
                                <select value={isi.peran} onChange={(e) => setFormUser((f) => ({ ...f, peran: e.target.value }))}>
                                  <option value="customer">Customer</option>
                                  <option value="tutor">Guru</option>
                                  <option value="pelamar">Pelamar guru</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </label>
                              <label className="db-um-full"><span><ImagePlus size={13} strokeWidth={2.1} aria-hidden="true" /> Foto (URL)</span>
                                <input value={isi.foto} onChange={(e) => setFormUser((f) => ({ ...f, foto: e.target.value }))} placeholder="https://..." />
                              </label>
                              <label className="db-um-full"><span><MapPin size={13} strokeWidth={2.1} aria-hidden="true" /> Alamat</span>
                                <input value={isi.alamat} onChange={(e) => setFormUser((f) => ({ ...f, alamat: e.target.value }))} placeholder="Alamat domisili" />
                              </label>
                              <label className="db-um-full"><span><FileText size={13} strokeWidth={2.1} aria-hidden="true" /> Bio</span>
                                <textarea rows={3} value={isi.bio} onChange={(e) => setFormUser((f) => ({ ...f, bio: e.target.value }))} placeholder="Catatan singkat" />
                              </label>
                              <label className="db-um-full"><span><KeyRound size={13} strokeWidth={2.1} aria-hidden="true" /> {userModal.mode === 'baru' ? 'Password awal' : 'Password baru'}</span>
                                <input type="password" value={isi.password} onChange={(e) => setFormUser((f) => ({ ...f, password: e.target.value }))} placeholder={userModal.mode === 'baru' ? 'Minimal 6 karakter' : 'Kosongkan jika tidak diganti'} autoComplete="new-password" />
                              </label>
                            </div>
                            {userGalat && <p className="db-um-galat">{userGalat}</p>}
                            <div className="db-um-aksi">
                              <button type="submit" className="db-btn">
                                <Save size={15} strokeWidth={2.1} aria-hidden="true" /> {userModal.mode === 'baru' ? 'Tambah' : 'Simpan'}
                              </button>
                              <button type="button" className="db-btn db-btn--ghost" onClick={userModal.mode === 'baru' ? tutupUserModal : () => setUserModal({ mode: 'lihat', id: userModal.id })}>
                                Batal
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ================= TRANSAKSI ================= */}
            {tab === 'transaksi' && (
              <div className="db-page">
                {transaksi.length === 0 ? (
                  <div className="db-kosong"><Kosong icon={ReceiptText} teks="Belum ada transaksi tercatat" /></div>
                ) : (
                <div className="db-table-card db-table-card--polos">
                  <div className="db-table-head">
                    <h4>Data Pelanggan &amp; Riwayat Transaksi</h4>
                    <span>{grupPembeli.length} pelanggan · {transaksi.length} transaksi tercatat</span>
                  </div>
                  <div className="db-table-scroll">
                  <table className="db-table db-table--rapat">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Nama Pelanggan</th>
                        <th>Nomor HP</th>
                        <th>Email</th>
                        <th>Provinsi</th>
                        <th>Kota/Kabupaten</th>
                        <th>Kecamatan</th>
                        <th>Kelurahan/Desa</th>
                        <th aria-label="Riwayat transaksi" />
                      </tr>
                    </thead>
                    <tbody>
                      {grupPembeli.map((g, idx) => {
                        const buka = invBuka === g.nama
                        const akun = pengguna.find((u) => u.nama === g.nama)
                        const det = detailWilayah(akun?.email)
                        const totalBelanja = g.daftar.filter((x) => x.status === 'Lunas').reduce((a, x) => a + x.total, 0)
                        return (
                        <Fragment key={g.nama}>
                        <tr className={buka ? 'is-buka' : ''} onClick={() => setInvBuka(buka ? null : g.nama)} style={{ cursor: 'pointer' }}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="db-td-user">
                              {akun?.foto ? <img src={akun.foto} alt="" /> : <Avatar nama={g.nama} besar />}
                              <div>
                                <strong>{g.nama}</strong>
                                <span>{g.daftar.length} transaksi · Total lunas {formatRupiah(totalBelanja)}</span>
                              </div>
                            </div>
                          </td>
                          <td>{akun?.telepon || '-'}</td>
                          <td>{akun?.email || '-'}</td>
                          <td>{det.provinsi?.nama || '-'}</td>
                          <td>{det.kota?.nama || '-'}</td>
                          <td>{det.kecamatan?.nama || '-'}</td>
                          <td>{det.kelurahan?.nama || '-'}</td>
                          <td className="db-trx-caret-td">
                            <button type="button" className="db-um-ic" title={buka ? 'Tutup riwayat transaksi' : 'Lihat riwayat transaksi'} aria-expanded={buka} onClick={(e) => { e.stopPropagation(); setInvBuka(buka ? null : g.nama) }}>
                              <ChevronDown size={15} strokeWidth={2.1} className={`db-inv-caret${buka ? ' is-buka' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        {buka && (
                          <tr className="db-inv-drop-row">
                            <td colSpan={9}>
                              <div className="db-inv-drop">
                                <ul className="db-sub-list">
                                  <li className="db-sub-item db-sub-item--head" aria-hidden="true">
                                    <span>No.</span>
                                    <span>Item &amp; Keterangan</span>
                                    <span>Waktu Transaksi</span>
                                    <span>Jenis</span>
                                    <span>Metode</span>
                                    <span>Total</span>
                                    <span>Status &amp; Konfirmasi</span>
                                    <span>Dokumen</span>
                                  </li>
                                  {g.daftar.map((x, i) => {
                                    const jenis = (x.jenis ?? 'toko') === 'program' ? 'program' : 'toko'
                                    return (
                                      <li key={x.invoice} className={`db-sub-item db-sub-item--${jenis}`}>
                                        <span>{i + 1}</span>
                                        <span className="db-sub-judul">
                                          <strong>{x.item}</strong>
                                          {String(x.item || '').startsWith('Perpanjangan') && <small className="db-sub-perpanjang">Permintaan perpanjangan akses program</small>}
                                          <small>{x.invoice}{x.atasNama ? ` · Pengirim a.n. ${x.atasNama}` : ''}</small>
                                        </span>
                                        <span>{waktuLengkap(x.createdAt) || x.tanggal}</span>
                                        <span className={`db-sub-jenis is-${jenis}`}>
                                          {jenis === 'program' ? <GraduationCap size={13} strokeWidth={2.1} /> : <ShoppingBag size={13} strokeWidth={2.1} />}
                                          {jenis === 'program' ? 'Program' : 'Produk'}
                                        </span>
                                        <span>{x.metode}</span>
                                        <strong>{formatRupiah(x.total)}</strong>
                                        <span className="db-sub-status">
                                          <span className={`db-sub-stat ${x.status === 'Lunas' ? 'is-lunas' : x.status === 'Menunggu' ? 'is-tunggu' : 'is-batal'}`}>{x.status}</span>
                                          <button type="button" className="db-um-ic is-ok" title={x.status !== 'Menunggu' ? (x.status === 'Lunas' ? 'Pembayaran sudah lunas' : 'Transaksi dibatalkan') : !x.invoiceFile ? 'Unggah invoice terlebih dahulu' : 'Tandai lunas — konfirmasi pembayaran customer'} disabled={x.status !== 'Menunggu' || !x.invoiceFile} onClick={() => tandaiLunas(x.invoice)}><Check size={14} strokeWidth={2.2} /></button>
                                          <button type="button" className="db-um-ic db-um-ic--mati" title={x.status !== 'Menunggu' ? 'Hanya transaksi menunggu yang bisa dibatalkan' : !x.invoiceFile ? 'Unggah invoice terlebih dahulu' : 'Batalkan transaksi'} disabled={x.status !== 'Menunggu' || !x.invoiceFile} onClick={() => batalkan(x.invoice)}><X size={14} strokeWidth={2.2} /></button>
                                        </span>
                                        <span className="db-td-aksi db-td-aksi--ikon">
                                          {x.buktiBayar && (
                                            <button type="button" className="db-proof-link" onClick={() => window.open(x.buktiBayar, '_blank', 'noopener,noreferrer')}>Bukti bayar</button>
                                          )}
                                          <label className={`db-um-ic${x.invoiceFile ? ' is-ok' : ''}`} title={x.invoiceFile ? 'Perbarui invoice untuk pelanggan' : 'Unggah invoice untuk pelanggan'}>
                                            <FileUp size={14} strokeWidth={2} />
                                            <input type="file" accept="image/*" hidden onChange={(e) => uploadInvoiceOrder(x.invoice, e)} />
                                          </label>
                                          <button type="button" className="db-um-ic" title={x.invoiceFile ? 'Lihat invoice terunggah' : 'Belum ada invoice terunggah'} disabled={!x.invoiceFile} onClick={() => x.invoiceFile && window.open(x.invoiceFile, '_blank', 'noopener,noreferrer')}>
                                            <Eye size={14} strokeWidth={2} />
                                          </button>
                                          <button type="button" className="db-um-ic db-um-ic--mati" title={x.invoiceFile ? 'Hapus invoice terunggah' : 'Belum ada invoice terunggah'} disabled={!x.invoiceFile} onClick={() => { if (window.confirm(`Hapus invoice terunggah untuk ${x.invoice}?`)) ubahOrderAdmin(x.invoice, { invoiceFile: null }, `Invoice ${x.invoice} dihapus dari akun customer`) }}>
                                            <Trash2 size={14} strokeWidth={2} />
                                          </button>
                                        </span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* ================= TOKO ================= */}
            {tab === 'toko' && (
              <div className="db-page">

                <div className="db-toko-stats">
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic"><Package size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{produk.length}</strong>
                      <span>Total produk &middot; {produk.filter((p) => p.aktif).length} aktif</span>
                    </div>
                  </article>
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic is-merah"><ShoppingBag size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{produk.filter((p) => p.stok <= 5).length}</strong>
                      <span>Stok menipis &middot; {produk.filter((p) => p.stok === 0).length} habis</span>
                    </div>
                  </article>
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic is-biru"><Wallet size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{produk.reduce((a, p) => a + (p.terjual || 0), 0)}</strong>
                      <span>Item terjual</span>
                    </div>
                  </article>
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic is-hijau"><Banknote size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{formatRupiah(produk.reduce((a, p) => a + (p.terjual || 0) * (p.harga || 0), 0))}</strong>
                      <span>Estimasi pendapatan produk</span>
                    </div>
                  </article>
                </div>

                <section className="db-block">
                  <header className="db-block-head">
                    <h4><Plus size={15} strokeWidth={2} /> Tambah produk</h4>
                    <span className="db-toko-hint">Gambar pertama menjadi sampul di katalog</span>
                  </header>
                  <form className="db-toko-form" onSubmit={tambahProduk}>
                    <div className="db-toko-galeri">
                      <span className="db-toko-galeri-label">
                        <ImagePlus size={14} strokeWidth={2} /> Foto produk (maksimal 5)
                      </span>
                      <div className="db-toko-upload">
                        {formProduk.gambar.map((g, i) => (
                          <label key={i} className="db-toko-upload-tile" title={i === 0 ? 'Foto sampul' : `Foto ${i + 1}`}>
                            <input type="file" accept="image/*" onChange={(e) => pilihGambarProduk(i, e)} />
                            {g ? (
                              <>
                                <img src={g} alt="" />
                                <button
                                  type="button"
                                  className="db-toko-upload-hapus"
                                  title="Hapus foto"
                                  onClick={(ev) => {
                                    ev.preventDefault()
                                    setFormProduk((f) => ({ ...f, gambar: f.gambar.map((x, j) => (j === i ? '' : x)) }))
                                  }}
                                >
                                  <X size={11} strokeWidth={2.4} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Upload size={15} strokeWidth={1.9} />
                                <span>{i === 0 ? 'Sampul' : `Foto ${i + 1}`}</span>
                              </>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="db-toko-form-grid">
                      <label className="db-tf is-lebar">
                        <span>Nama produk</span>
                        <input
                          type="text"
                          placeholder="cth. Mushaf Hifz Custom A5"
                          value={formProduk.nama}
                          onChange={(e) => setFormProduk((f) => ({ ...f, nama: e.target.value }))}
                        />
                      </label>
                      <label className="db-tf">
                        <span>Kategori</span>
                        <input
                          type="text"
                          list="db-toko-kategori"
                          placeholder="Umum"
                          value={formProduk.kategori}
                          onChange={(e) => setFormProduk((f) => ({ ...f, kategori: e.target.value }))}
                        />
                        <datalist id="db-toko-kategori">
                          {[...new Set(['Umum', 'Buku', 'Busana', 'Aksesoris', ...produk.map((p) => p.kategori)])].filter(Boolean).map((k) => (
                            <option key={k} value={k} />
                          ))}
                        </datalist>
                      </label>
                      <label className="db-tf">
                        <span>Stok awal</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formProduk.stok}
                          onChange={(e) => setFormProduk((f) => ({ ...f, stok: e.target.value }))}
                        />
                      </label>
                      <label className="db-tf is-lebar">
                        <span>Harga (Rp)</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="cth. 85000"
                          value={formProduk.harga}
                          onChange={(e) => setFormProduk((f) => ({ ...f, harga: e.target.value }))}
                        />
                      </label>
                      <label className="db-tf is-lebar">
                        <span>Harga coret</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="cth. 120000"
                          value={formProduk.hargaCoret}
                          onChange={(e) => setFormProduk((f) => ({ ...f, hargaCoret: e.target.value }))}
                        />
                      </label>
                      <label className="db-tf is-luas">
                        <span>Deskripsi produk</span>
                        <textarea
                          rows="3"
                          placeholder="Detail bahan, ukuran, isi paket, dan keunggulan produk"
                          value={formProduk.deskripsi}
                          onChange={(e) => setFormProduk((f) => ({ ...f, deskripsi: e.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="db-toko-form-aksi">
                      <button type="submit" className="db-btn db-btn--sm">
                        <Plus size={14} strokeWidth={2} /> Tambah produk
                      </button>
                    </div>
                  </form>
                </section>

                <section className="db-block">
                  <header className="db-block-head">
                    <h4><Store size={15} strokeWidth={2} /> Daftar produk</h4>
                    <label className="db-toko-cari">
                      <Search size={13} strokeWidth={2} aria-hidden="true" />
                      <input
                        type="search"
                        placeholder="Cari nama atau kategori&hellip;"
                        value={cariProduk}
                        onChange={(e) => setCariProduk(e.target.value)}
                      />
                    </label>
                  </header>
                  {(() => {
                    const q = cariProduk.trim().toLowerCase()
                    const tampil = produk.filter((p) => !q || `${p.nama} ${p.kategori}`.toLowerCase().includes(q))
                    if (produk.length === 0)
                      return <div className="db-kosong"><Kosong icon={PackageOpen} teks="Belum ada produk" /></div>
                    if (tampil.length === 0)
                      return <div className="db-kosong"><Kosong icon={SearchX} teks={`Tidak ditemukan produk untuk \u201c${cariProduk}\u201d`} /></div>
                    return (
                      <div className="db-table-card">
                        <table className="db-table db-table--toko">
                          <thead>
                            <tr>
                              <th>Produk</th>
                              <th>Kategori</th>
                              <th>Harga</th>
                              <th>Stok</th>
                              <th>Terjual</th>
                              <th>Pendapatan</th>
                              <th>Status</th>
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tampil.map((p) => {
                              const gbr = daftarGambar(p.gambar)
                              return (
                                <tr key={p.id}>
                                  <td>
                                    <div className="db-toko-prod">
                                      <span className="db-toko-prod-thumb" aria-hidden="true">
                                        {gbr[0] ? <img src={gbr[0]} alt="" loading="lazy" /> : <Package size={15} strokeWidth={1.8} />}
                                      </span>
                                      <div>
                                        <strong className="db-td-inv">{p.nama}</strong>
                                        <small>{gbr.length > 0 ? `${gbr.length} gambar` : 'Tanpa gambar'}{p.ringkas ? ` \u00b7 ${p.ringkas}` : ''}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td><span className="db-toko-kat">{p.kategori || 'Umum'}</span></td>
                                  <td>
                                    <strong className="db-toko-harga">{formatRupiah(p.harga)}</strong>
                                    {p.hargaCoret > 0 && <small className="db-toko-coret">{formatRupiah(p.hargaCoret)}</small>}
                                  </td>
                                  <td>
                                    {p.stok === 0 ? (
                                      <span className="db-status is-batal">Habis</span>
                                    ) : p.stok <= 5 ? (
                                      <span className="db-status is-tunggu">{p.stok} &middot; menipis</span>
                                    ) : (
                                      p.stok
                                    )}
                                  </td>
                                  <td>{p.terjual}</td>
                                  <td>{formatRupiah((p.terjual || 0) * (p.harga || 0))}</td>
                                  <td>
                                    <span className={`db-status ${p.aktif ? 'is-lunas' : 'is-tunggu'}`}>{p.aktif ? 'Aktif' : 'Disembunyikan'}</span>
                                  </td>
                                  <td>
                                    <button type="button" className="db-ikon-btn" title={p.aktif ? 'Sembunyikan dari toko' : 'Tampilkan di toko'} onClick={() => toggleProduk(p.id)}>
                                      {p.aktif ? <EyeOff size={14} strokeWidth={1.9} /> : <Eye size={14} strokeWidth={1.9} />}
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </section>
              </div>
            )}

            {/* ================= BERITA ================= */}
            {tab === 'berita' && (
              <div className="db-page">

                <div className="db-toko-stats db-toko-stats--tiga">
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic"><Newspaper size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{berita.length}</strong>
                      <span>Total berita</span>
                    </div>
                  </article>
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic is-hijau"><CheckCircle2 size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{berita.filter((b) => b.status === 'terbit').length}</strong>
                      <span>Terbit &amp; tampil di beranda</span>
                    </div>
                  </article>
                  <article className="db-toko-stat">
                    <span className="db-toko-stat-ic is-biru"><FileText size={17} strokeWidth={2} /></span>
                    <div>
                      <strong>{berita.filter((b) => b.status !== 'terbit').length}</strong>
                      <span>Draf menunggu terbit</span>
                    </div>
                  </article>
                </div>

                <section className="db-block">
                  <header className="db-block-head">
                    <h4><SquarePen size={15} strokeWidth={2} /> Tulis berita</h4>
                  </header>
                  <form className="db-toko-form" onSubmit={tambahBerita} noValidate>
                    <div className="db-berita-atas">
                      <div className="db-tf">
                        <span>Gambar sampul</span>
                        <label className={`db-berita-upload${beritaGalat.gambar ? ' is-galat' : ''}`}>
                          <input type="file" accept="image/*" onChange={pilihGambarBerita} />
                          {formBerita.gambar ? (
                            <>
                              <img src={formBerita.gambar} alt="" />
                              <button
                                type="button"
                                className="db-toko-upload-hapus"
                                title="Hapus sampul"
                                onClick={(ev) => {
                                  ev.preventDefault()
                                  setFormBerita((f) => ({ ...f, gambar: '' }))
                                }}
                              >
                                <X size={11} strokeWidth={2.4} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload size={17} strokeWidth={1.9} />
                              <span>Unggah sampul</span>
                            </>
                          )}
                        </label>
                        {beritaGalat.gambar && <em className="db-tf-galat">{beritaGalat.gambar}</em>}
                      </div>
                      <div className="db-berita-kolom">
                        <label className="db-tf">
                          <span>Judul</span>
                          <input
                            type="text"
                            placeholder="Judul berita"
                            value={formBerita.judul}
                            onChange={(e) => setFormBerita((f) => ({ ...f, judul: e.target.value }))}
                          />
                          {beritaGalat.judul && <em className="db-tf-galat">{beritaGalat.judul}</em>}
                        </label>
                        <label className="db-tf">
                          <span>Kategori</span>
                          <select value={formBerita.kategori} onChange={(e) => setFormBerita((f) => ({ ...f, kategori: e.target.value }))}>
                            <option>Artikel</option>
                            <option>Pengumuman</option>
                            <option>Kisah</option>
                            <option>Kegiatan</option>
                            <option>Perpustakaan</option>
                            <option>Pembelajaran</option>
                          </select>
                        </label>
                        <label className="db-tf">
                          <span>Ringkasan <i className="db-tf-count">{formBerita.ringkas.trim().length}/20</i></span>
                          <input
                            type="text"
                            placeholder="Ringkasan singkat"
                            value={formBerita.ringkas}
                            onChange={(e) => setFormBerita((f) => ({ ...f, ringkas: e.target.value }))}
                          />
                          {beritaGalat.ringkas && <em className="db-tf-galat">{beritaGalat.ringkas}</em>}
                        </label>
                      </div>
                    </div>
                    <label className="db-tf">
                      <span>Isi <i className="db-tf-count">{formBerita.konten.trim().length}/100</i></span>
                      <textarea
                        rows="8"
                        placeholder="Isi berita…"
                        value={formBerita.konten}
                        onChange={(e) => setFormBerita((f) => ({ ...f, konten: e.target.value }))}
                      />
                      {beritaGalat.konten && <em className="db-tf-galat">{beritaGalat.konten}</em>}
                    </label>
                    <div className="db-toko-form-aksi">
                      <button type="submit" className="db-btn db-btn--sm">
                        <Save size={14} strokeWidth={2} /> Simpan draf
                      </button>
                    </div>
                  </form>
                </section>

                <section className="db-block">
                  <header className="db-block-head">
                    <h4><Newspaper size={15} strokeWidth={2} /> Daftar berita</h4>
                  </header>
                  {berita.length === 0 ? (
                    <div className="db-kosong"><Kosong icon={FileText} teks="Belum ada artikel" /></div>
                  ) : (
                    <div className="db-berita-list">
                      {berita.map((b) => (
                        <article key={b.id} className="db-berita-item">
                          <span className="db-berita-thumb" aria-hidden="true">
                            {b.gambar ? <img src={b.gambar} alt="" loading="lazy" /> : <Newspaper size={18} strokeWidth={1.7} />}
                          </span>
                          <div className="db-berita-isi">
                            <div className="db-berita-meta">
                              <span className={`db-status ${b.status === 'terbit' ? 'is-lunas' : 'is-tunggu'}`}>
                                {b.status === 'terbit' ? 'Terbit' : 'Draf'}
                              </span>
                              <span className="db-toko-kat">{b.kategori}</span>
                              <small>{b.penulis} &middot; {b.tanggal}</small>
                            </div>
                            <h4>{b.judul}</h4>
                            {b.ringkas && <p>{b.ringkas}</p>}
                          </div>
                          <div className="db-td-aksi">
                            <button type="button" className="db-ikon-btn" title={b.status === 'terbit' ? 'Tarik ke draf' : 'Terbitkan'} onClick={() => toggleBerita(b.id)}>
                              {b.status === 'terbit' ? <EyeOff size={14} strokeWidth={1.9} /> : <Eye size={14} strokeWidth={1.9} />}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
