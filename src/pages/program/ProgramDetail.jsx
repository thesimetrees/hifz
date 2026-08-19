import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  BookOpenText,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Info,
  Languages,
  Layers,
  LibraryBig,
  Lock,
  MapPin,
  MessageCircleQuestion,
  MessagesSquare,
  MonitorPlay,
  Paperclip,

  SquarePlay,
  Target,
  Timer,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { formatRupiah, inisial, jamSub, semuaSub, subTerbit, tanggalSub } from '../admin/adminData.js'
import { avatarGuru } from '../../lib/guru.js'
import { api } from '../../lib/api.js'
import { daftarJadwal, formatTanggalPanjang, HARI_URUT, linkGoogleKalender, ringkasJadwal, sesiBerikutnya, unduhICS } from '../../lib/kalender.js'
import { ikutiProgram, jadwalDipilih, pilihJadwal, sudahIkut } from '../../lib/progres.js'

const faq = [
  { q: 'Bagaimana cara mengakses materi setelah mendaftar?', a: 'Masuk ke akunmu lalu buka menu Belajar Saya di dashboard. Seluruh sub materi yang sudah terbit langsung bisa dipelajari.' },
  { q: 'Apakah saya mendapat sertifikat?', a: 'Ya. Sertifikat penyelesaian terbit setelah seluruh sub materi selesai kamu pelajari.' },
  { q: 'Kapan saya bisa mulai belajar?', a: 'Kapan saja. Materi mandiri terbuka penuh sejak hari pertama, sedangkan sesi tatap muka mengikuti jadwal belajar program.' },
  { q: 'Apakah ada rekaman jika saya melewatkan sesi?', a: 'Ada. Setiap sesi online terekam dan bisa diputar ulang melalui menu Belajar Saya, jadi kamu tidak akan tertinggal materi.' },
  { q: 'Berapa lama saya bisa mengakses materi?', a: 'Tanpa batas waktu. Sekali terdaftar, seluruh materi program tetap bisa kamu akses selamanya, termasuk pembaruan materi berikutnya.' },
  { q: 'Perangkat apa yang saya butuhkan?', a: 'Cukup ponsel atau laptop dengan koneksi internet. Sesi online berjalan melalui Zoom dan seluruh materi bisa dibuka langsung dari peramban.' },
  { q: 'Bagaimana metode pembayarannya?', a: 'Pembayaran satu kali untuk akses penuh program. Kamu bisa membayar melalui transfer bank atau dompet digital pada halaman pendaftaran.' },
  { q: 'Ke mana saya bertanya jika mengalami kendala?', a: 'Tim Hifz siap membantu melalui fitur chat di pojok kanan bawah situs, atau kamu bisa bertanya langsung kepada guru pengampu di ruang kelas.' },
]

export default function ProgramDetail() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [ingat, setIngat] = useState(false)
  const [akun, setAkun] = useState(null)
  const [bukaMateri, setBukaMateri] = useState(0)
  const [seksiTutup, setSeksiTutup] = useState({ kuasai: true, metode: true, detail: true, kurikulum: true, guru: true, damping: true, faq: true })
  const [lainnya, setLainnya] = useState([])
  const [jadwalPilihan, setJadwalPilihan] = useState(null)
  const toggleSeksi = (id) => setSeksiTutup((s) => ({ ...s, [id]: !s[id] }))
  const kelasSeksi = (id, extra = '') => `prg-blok${extra ? ` ${extra}` : ''}${seksiTutup[id] ? ' prg-blok--tutup' : ''}`

  useEffect(() => {
    setIngat(localStorage.getItem(`hifzIngat-${programId}`) === '1')
    try {
      const u = JSON.parse(localStorage.getItem('hifzUser'))
      setAkun(u)
      setJadwalPilihan(jadwalDipilih(u?.email, programId))
    } catch {
      setAkun(null)
    }
  }, [programId])

  useEffect(() => {
    let hidup = true
    api('/programs', { auth: false })
      .then((data) => hidup && setLainnya(data.filter((p) => p.id !== programId)))
      .catch(() => hidup && setLainnya([]))
    return () => {
      hidup = false
    }
  }, [programId])

  const jadwalSaya = () => {
    const opsi = daftarJadwal(program?.jadwal)
    return opsi.find((o) => o.id === jadwalPilihan) ?? opsi[0] ?? null
  }

  const gantiJadwal = (id) => {
    setJadwalPilihan(id)
    if (akun?.email && program) pilihJadwal(akun.email, program.id, id)
  }

  const aktifkanPengingat = async () => {
    if (!program) return
    const j = jadwalSaya()
    if (!('Notification' in window)) {
      unduhICS(program, j)
      return
    }
    const izin = await Notification.requestPermission()
    if (izin !== 'granted') return
    localStorage.setItem(`hifzIngat-${programId}`, '1')
    setIngat(true)
    const sesi = j ? sesiBerikutnya(j) : null
    new Notification(`Pengingat belajar: ${program.nama}`, {
      body: sesi
        ? `Sesi berikutnya ${formatTanggalPanjang(sesi)} pukul ${j.mulai} WIB.`
        : 'Pengingat aktif untuk jadwal belajar program ini.',
    })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    let hidup = true
    setMemuat(true)
    api(`/programs/${programId}`, { auth: false })
      .then((data) => {
        if (!hidup) return
        setProgram(data)
        setMemuat(false)
      })
      .catch(() => {
        if (!hidup) return
        setProgram(null)
        setMemuat(false)
      })
    return () => {
      hidup = false
    }
  }, [programId])

  if (memuat) {
    return (
      <>
        <Header />
        <main className="prg">
          <section className="prg-kosong">
            <div className="container">
              <h1>Memuat program…</h1>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  if (!program || program.status !== 'terbit') {
    return (
      <>
        <Header />
        <main className="prg">
          <section className="prg-kosong">
            <div className="container">
              <h1>Program segera hadir</h1>
              <p>Kurikulum program ini sedang disiapkan.</p>
              <Link to="/#program" className="btn btn-hero-primary">
                <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Lihat program lain
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  const kurikulum = program.kurikulum ?? []
  const semua = semuaSub(program)
  const terbit = subTerbit(program)
  const draf = semua.length - terbit.length
  const video = semua.filter((m) => m.jenis === 'video').length
  const dokumen = semua.filter((m) => m.jenis === 'dokumen').length
  const kuis = semua.filter((m) => m.jenis === 'kuis').length
  const sesiOnline = semua.filter((m) => m.jenis === 'sesi-online').length
  const sesiOffline = semua.filter((m) => m.jenis === 'sesi-offline').length
  const pertemuan = sesiOnline + sesiOffline
  const tutorList = [...new Set([program.tutor, ...terbit.map((m) => m.pengajar)].filter(Boolean))]
  const masuk = Boolean(akun)
  const ikonSub = { video: SquarePlay, dokumen: FileText, kuis: CircleHelp, 'sesi-online': MonitorPlay, 'sesi-offline': MapPin }

  const durasiSesi = (j) => {
    const [h1, m1] = j.mulai.split(':').map(Number)
    const [h2, m2] = j.selesai.split(':').map(Number)
    return h2 * 60 + m2 - (h1 * 60 + m1)
  }
  const durasiPekan = (j) =>
    j.tanggalMulai && j.tanggalSelesai
      ? Math.max(1, Math.round((new Date(j.tanggalSelesai) - new Date(j.tanggalMulai)) / (7 * 864e5)))
      : null

  const indikatorSemua = kurikulum.flatMap((t) => t.indikator ?? [])
  const jadwal = jadwalSaya()

  return (
    <>
      <Header />
      <main className="prg">
        <section className="prg-hero">
          <span className="prg-hero-ornamen" aria-hidden="true" />
          <div className="container prg-hero-in">
            <div className="prg-hero-panel">
            <motion.div
              className="prg-hero-copy"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Link to="/#program" className="prg-back">
                <ArrowLeft size={14} strokeWidth={2.2} aria-hidden="true" /> Semua program
              </Link>
              <h1>{program.nama}</h1>
              <div className="prg-hero-guru">
                <span className="prg-hero-avatars">
                  {tutorList.slice(0, 4).map((t) => (
                    <span className="prg-avatar-ini" key={t}><img src={avatarGuru(t)} alt="" loading="lazy" /></span>
                  ))}
                </span>
                <p>
                  <strong>{program.tutor}</strong>
                  {tutorList.length > 1 ? ` bersama ${tutorList.length - 1} guru lainnya` : ''}
                </p>
              </div>
              {program.peserta > 0 && (
                <p className="prg-hero-daftar">
                  <strong>{Number(program.peserta).toLocaleString('id-ID')}</strong> peserta sudah bergabung
                </p>
              )}
            </motion.div>
            </div>
          </div>
        </section>

        <section className="prg-body">
          <div className="container prg-cols">
            <div className="prg-main">
              {program.gambar && (
                <div className="prg-cover">
                  <img src={program.gambar} alt={program.nama} loading="lazy" />
                </div>
              )}
              {program.deskripsi && (
                <div className="prg-narasi-wrap">
                  <p className="prg-narasi">{program.deskripsi}</p>
                </div>
              )}
              {indikatorSemua.length > 0 && (
                <section className={kelasSeksi('kuasai')}>
                  <h2 onClick={() => toggleSeksi('kuasai')}><span className="prg-h2-ic"><Trophy size={16} strokeWidth={2} aria-hidden="true" /></span> Capaian pembelajaran <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                  <ul className="prg-belajar">
                    {indikatorSemua.slice(0, 8).map((ind) => (
                      <li key={ind}>
                        <span className="prg-belajar-ic"><BadgeCheck size={16} strokeWidth={1.9} aria-hidden="true" /></span> {ind}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section className={kelasSeksi('metode')}>
                <h2 onClick={() => toggleSeksi('metode')}><span className="prg-h2-ic"><Layers size={16} strokeWidth={2} aria-hidden="true" /></span> Metode pembelajaran <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                <div className="prg-damping-grid">
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><SquarePlay size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Belajar mandiri</h3>
                    <p>Materi video dan bacaan terbuka penuh sejak hari pertama dan bisa diulang kapan saja.</p>
                  </article>
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><MonitorPlay size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Sesi live bersama guru</h3>
                    <p>Tatap muka online terjadwal dengan koreksi bacaan langsung dan rekaman yang bisa diputar ulang.</p>
                  </article>
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><BadgeCheck size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Evaluasi terukur</h3>
                    <p>Kuis dan tugas menilai pemahaman di setiap tahap sebelum lanjut ke materi berikutnya.</p>
                  </article>
                </div>
              </section>
                <section className={kelasSeksi('detail')}>
                <h2 onClick={() => toggleSeksi('detail')}><span className="prg-h2-ic"><ClipboardList size={16} strokeWidth={2} aria-hidden="true" /></span> Fasilitas program <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                <div className="prg-info-grid">
                  <div className="prg-info">
                    <span className="prg-info-ic"><BadgeCheck size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <div><strong>Sertifikat resmi</strong></div>
                  </div>
                  <div className="prg-info">
                    <span className="prg-info-ic"><MessagesSquare size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <div><strong>Konsultasi 1-on-1</strong></div>
                  </div>
                  <div className="prg-info">
                    <span className="prg-info-ic"><UsersRound size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <div><strong>Grup diskusi</strong></div>
                  </div>
                  <div className="prg-info">
                    <span className="prg-info-ic"><ClipboardCheck size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <div><strong>Laporan harian &amp; bulanan</strong></div>
                  </div>
                  <div className="prg-info">
                    <span className="prg-info-ic"><Languages size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                    <div><strong>3 bahasa pengantar</strong></div>
                  </div>
                  {jadwal?.tanggalMulai && (
                    <div className="prg-info">
                      <span className="prg-info-ic"><CalendarDays size={16} strokeWidth={1.9} aria-hidden="true" /></span>
                      <div><strong>Mulai {formatTanggalPanjang(jadwal.tanggalMulai)}</strong></div>
                    </div>
                  )}
                </div>
              </section>
              <section className={kelasSeksi('kurikulum', 'prg-blok--kurikulum')}>
                <h2 onClick={() => toggleSeksi('kurikulum')}><span className="prg-h2-ic"><BookOpenText size={16} strokeWidth={2} aria-hidden="true" /></span> Kurikulum <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
              {kurikulum.length === 0 && (
                <p className="prg-draf-note">
                  <Lock size={13} strokeWidth={2} aria-hidden="true" />
                  Kurikulum sedang disusun.
                </p>
              )}
              <div className="prg-kur-card">
                {kurikulum.map((t, i) => {
                  const subT = t.sub ?? []
                  const buka = bukaMateri === i
                  return (
                    <article className={`prg-kur-item${buka ? ' prg-kur-item--buka' : ''}`} key={t.id}>
                      <button
                        type="button"
                        className="prg-kur-head"
                        aria-expanded={buka}
                        onClick={() => setBukaMateri(buka ? null : i)}
                      >
                        <span className="prg-kur-no">{String(i + 1).padStart(2, '0')}</span>
                        <span className="prg-kur-titel">
                          <h3>{t.judul}</h3>
                        </span>
                        <span className="prg-kur-toggle">
                          <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      </button>
                      {buka && (
                        <div className="prg-kur-body">
                          {t.narasi && <p className="prg-kur-narasi">{t.narasi}</p>}
                          {(subT.length > 0 || (t.indikator ?? []).length > 0) && (
                            <div className="prg-kur-rinci">
                              {(t.indikator ?? []).length > 0 && (
                                <ul className="prg-indikator">
                                  {t.indikator.map((ind) => (
                                    <li key={ind}>
                                      <BadgeCheck size={13} strokeWidth={2.1} aria-hidden="true" />
                                      {ind}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {subT.map((s) => {
                                const IkonS = ikonSub[s.jenis] ?? FileText
                                return (
                                  <div className="prg-sub" key={s.id}>
                                    <span className="prg-sub-ic"><IkonS size={15} strokeWidth={1.9} aria-hidden="true" /></span>
                                    <div className="prg-sub-info">
                                      <h4>
                                        {s.judul}
                                        {s.status !== 'terbit' && (
                                          <span className="prg-sub-segera"><Lock size={11} strokeWidth={2.2} aria-hidden="true" /> segera terbit</span>
                                        )}
                                      </h4>
                                      {s.narasi && <p className="prg-sub-narasi">{s.narasi}</p>}
                                      {masuk && (
                                        <ul className="prg-sub-rinci">
                                          {s.jadwal && <li><CalendarDays size={12} strokeWidth={2} aria-hidden="true" /> {tanggalSub(s.jadwal)}</li>}
                                          {jamSub(s.jadwal) && <li><Clock size={12} strokeWidth={2} aria-hidden="true" /> {jamSub(s.jadwal)}</li>}
                                          {Number(s.durasi) > 0 && <li><Timer size={12} strokeWidth={2} aria-hidden="true" /> {s.durasi} menit</li>}
                                          {s.konten && (s.jenis === 'video'
                                            ? <li><SquarePlay size={12} strokeWidth={2} aria-hidden="true" /> Video pembelajaran</li>
                                            : <li><Paperclip size={12} strokeWidth={2} aria-hidden="true" /> {s.konten}</li>)}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
              {draf > 0 && (
                <p className="prg-draf-note">
                  <Lock size={13} strokeWidth={2} aria-hidden="true" />
                  {draf} sub materi lagi akan terbit bertahap.
                </p>
              )}
              </section>
              <section className={kelasSeksi('guru')}>
                <h2 onClick={() => toggleSeksi('guru')}><span className="prg-h2-ic"><GraduationCap size={16} strokeWidth={2} aria-hidden="true" /></span> Guru <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                <div className="prg-guru-grid">
                  {tutorList.map((t) => (
                    <article className="prg-guru" key={t}>
                      <span className="prg-avatar-ini prg-avatar-ini--lg"><img src={avatarGuru(t)} alt="" loading="lazy" /></span>
                      <div>
                        <strong>{t}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className={kelasSeksi('damping')}>
                <h2 onClick={() => toggleSeksi('damping')}><span className="prg-h2-ic"><ClipboardCheck size={16} strokeWidth={2} aria-hidden="true" /></span> Penilaian <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                <div className="prg-damping-grid">
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><ClipboardList size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Rapor perkembangan</h3>
                    <p>Guru menilai setiap capaian dan memberi catatan perkembangan yang bisa dipantau dari dashboard.</p>
                  </article>
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><CalendarDays size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Presensi tercatat</h3>
                    <p>Kehadiran di setiap sesi terekam otomatis sebagai bagian dari laporan belajar.</p>
                  </article>
                  <article className="prg-damping">
                    <span className="prg-damping-ic"><MessagesSquare size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                    <h3>Ruang diskusi kelas</h3>
                    <p>Bertanya langsung kepada guru dan berdiskusi dengan sesama peserta di grup kelas.</p>
                  </article>
                </div>
              </section>
              <section className={kelasSeksi('faq')}>
                <h2 onClick={() => toggleSeksi('faq')}><span className="prg-h2-ic"><MessageCircleQuestion size={16} strokeWidth={2} aria-hidden="true" /></span> Pertanyaan umum <ChevronDown size={18} strokeWidth={2.2} aria-hidden="true" className="prg-blok-chev" /></h2>
                <div className="prg-faq">
                  {faq.map(({ q, a }) => (
                    <details key={q}>
                      <summary>
                        {q}
                        <ChevronDown size={15} strokeWidth={2.1} aria-hidden="true" />
                      </summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <aside className="prg-side">
              <div className="prg-card prg-card--beli">
                <div className="prg-beli-head">
                  <span className="prg-beli-label">Biaya program</span>
                  <strong className="prg-card-harga">{formatRupiah(program.harga)}</strong>
                  <div className="prg-beli-fakta">
                    <span><MonitorPlay size={13} strokeWidth={1.9} aria-hidden="true" /> {program.mode}</span>
                    <span><Layers size={13} strokeWidth={1.9} aria-hidden="true" /> {program.jenis}</span>
                    {jadwal?.tanggalMulai && (
                      <span><CalendarDays size={13} strokeWidth={1.9} aria-hidden="true" /> Mulai {formatTanggalPanjang(jadwal.tanggalMulai)}</span>
                    )}
                  </div>
                  {akun && akun.peran !== 'admin' ? (
                    <button
                      type="button"
                      className="btn btn-hero-primary prg-card-btn"
                      onClick={() => {
                        if (sudahIkut(akun.email, program.id)) {
                          navigate('/dashboard')
                        } else if (Number(program.harga) > 0) {
                          navigate(`/program/${program.id}/checkout`)
                        } else {
                          ikutiProgram(akun.email, program.id)
                          navigate('/dashboard')
                        }
                      }}
                    >
                      {sudahIkut(akun.email, program.id) ? 'Lanjut belajar di dashboard' : 'Ikuti program ini'}
                    </button>
                  ) : (
                    <Link to="/daftar" state={{ dari: `/program/${program.id}` }} className="btn btn-hero-primary prg-card-btn">Daftar sekarang</Link>
                  )}
                </div>
                <div className="prg-beli-isi">
                  <ul className="prg-card-list">
                    <li><span className="prg-beli-ic"><LibraryBig size={15} strokeWidth={1.9} aria-hidden="true" /></span> {kurikulum.length} materi &middot; {semua.length} sub materi</li>
                    {pertemuan > 0 && (
                      <li><span className="prg-beli-ic"><CalendarDays size={15} strokeWidth={1.9} aria-hidden="true" /></span> {pertemuan} pertemuan {sesiOnline > 0 && sesiOffline > 0 ? `(${sesiOnline} online, ${sesiOffline} offline)` : sesiOnline > 0 ? 'online' : 'offline'}</li>
                    )}
                    <li><span className="prg-beli-ic"><Languages size={15} strokeWidth={1.9} aria-hidden="true" /></span> Bahasa Indonesia, Inggris &amp; Arab</li>
                    {masuk && (
                      <>
                        {video > 0 && <li><span className="prg-beli-ic"><SquarePlay size={15} strokeWidth={1.9} aria-hidden="true" /></span> {video} video pembelajaran</li>}
                        {dokumen > 0 && <li><span className="prg-beli-ic"><FileText size={15} strokeWidth={1.9} aria-hidden="true" /></span> {dokumen} dokumen pendamping</li>}
                        {kuis > 0 && <li><span className="prg-beli-ic"><CircleHelp size={15} strokeWidth={1.9} aria-hidden="true" /></span> {kuis} kuis evaluasi</li>}
                      </>
                    )}
                    <li><span className="prg-beli-ic"><BadgeCheck size={15} strokeWidth={1.9} aria-hidden="true" /></span> Sertifikat penyelesaian</li>
                  </ul>
                  {!(akun && akun.peran !== 'admin') && (
                    <Link to="/masuk" state={{ dari: `/program/${program.id}` }} className="prg-card-masuk">Sudah punya akun? Masuk</Link>
                  )}
                </div>
              </div>

              {(() => {
                const opsi = daftarJadwal(program.jadwal)
                const j = jadwalSaya()
                if (!j) return null
                const sesi = sesiBerikutnya(j)
                const menit = durasiSesi(j)
                const pekan = durasiPekan(j)
                return (
                  <div className="prg-card prg-card--jadwal">
                    <h3 className="prg-card-judul"><CalendarDays size={15} strokeWidth={2} aria-hidden="true" /> Jadwal belajar</h3>
                    {opsi.length > 1 && masuk && (
                      <div className="prg-jadwal-opsi" role="radiogroup" aria-label="Pilih jadwal belajar">
                        {opsi.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            className={o.id === j.id ? 'is-aktif' : ''}
                            aria-pressed={o.id === j.id}
                            onClick={() => gantiJadwal(o.id)}
                          >
                            <strong>{o.label}</strong>
                            <span>{ringkasJadwal(o)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {masuk && (
                      <div className="prg-jadwal-hari">
                        {HARI_URUT.filter((h) => j.hari.includes(h)).map((h) => <span key={h}>{h}</span>)}
                      </div>
                    )}
                    <ul className="prg-card-list">
                      {opsi.length > 1 && !masuk && (
                        <li><CalendarDays size={14} strokeWidth={1.9} aria-hidden="true" /> {opsi.length} pilihan jadwal, masuk untuk memilih</li>
                      )}
                      <li><Clock size={14} strokeWidth={1.9} aria-hidden="true" /> {j.mulai}–{j.selesai} WIB</li>
                      <li><Timer size={14} strokeWidth={1.9} aria-hidden="true" /> {menit} menit per sesi{pekan ? ` · ${pekan} pekan` : ''}</li>
                      {j.tanggalMulai && (
                        <li><CalendarDays size={14} strokeWidth={1.9} aria-hidden="true" /> {formatTanggalPanjang(j.tanggalMulai)}{j.tanggalSelesai ? ` s.d. ${formatTanggalPanjang(j.tanggalSelesai)}` : ''}</li>
                      )}
                      {masuk && sesi && <li><BellRing size={14} strokeWidth={1.9} aria-hidden="true" /> Sesi berikutnya: {formatTanggalPanjang(sesi)}</li>}
                    </ul>
                    {masuk && (
                      <div className="prg-jadwal-sync">
                        <a className="prg-jadwal-btn" href={linkGoogleKalender(program, j)} target="_blank" rel="noreferrer">
                          <CalendarPlus size={14} strokeWidth={2} aria-hidden="true" /> Google Calendar
                        </a>
                        <button type="button" className="prg-jadwal-btn" onClick={() => unduhICS(program, j)}>
                          <Download size={14} strokeWidth={2} aria-hidden="true" /> Apple / Outlook (.ics)
                        </button>
                        <button type="button" className={`prg-jadwal-btn${ingat ? ' is-aktif' : ''}`} onClick={aktifkanPengingat}>
                          <BellRing size={14} strokeWidth={2} aria-hidden="true" /> {ingat ? 'Pengingat aktif' : 'Aktifkan pengingat'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </aside>
          </div>
        </section>

        {lainnya.length > 0 && (
          <section className="prg-lain">
            <div className="container">
              <h2>Program lainnya</h2>
              <div className="prg-lain-track">
                {lainnya.map((p) => {
                  const terbitLain = subTerbit(p)
                  const tutorLain = [...new Set([p.tutor, ...terbitLain.map((m) => m.pengajar)].filter(Boolean))]
                  return (
                    <article key={p.id} className="phc-card">
                      <Link to={`/program/${p.id}`} className="phc-media">
                        <img src={p.gambar} alt={p.nama} loading="lazy" />
                        <span className="phc-pita" aria-hidden="true"><span>{p.jenis}</span></span>
                      </Link>
                      <div className="phc-body">
                        <span className="phc-avatars">
                          {tutorLain.slice(0, 4).map((t) => (
                            <span key={t} className="phc-avatar-ini" title={t}><img src={avatarGuru(t)} alt="" loading="lazy" /></span>
                          ))}
                        </span>
                        <h3><Link to={`/program/${p.id}`}>{p.nama}</Link></h3>
                        <p className="phc-desc">{p.deskripsi}</p>
                        <div className="phc-hargabar">
                          <span className="phc-hb">
                            <strong>{formatRupiah(p.harga)}</strong>
                          </span>
                          <Link className="phc-go" to={`/program/${p.id}`} title="Lihat program" aria-label={`Lihat kurikulum ${p.nama}`}>
                            <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
