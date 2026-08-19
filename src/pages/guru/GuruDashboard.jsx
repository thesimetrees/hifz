import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  UserRound,
  Users,
  Video,
} from 'lucide-react'
import FormGuru from '../../components/FormGuru.jsx'
import { api } from '../../lib/api.js'
import { bacaProfilGuru, simpanProfilGuru } from '../../lib/guru.js'
import { HARI_URUT, daftarJadwal, formatTanggalPanjang, ringkasJadwal, sesiBerikutnya } from '../../lib/kalender.js'
import { absenHadir, bacaAbsensi, bacaPenilaian, bacaProgres, beriNilai, hitungProgres, ikutiProgram, pesertaProgram } from '../../lib/progres.js'
import { gambarKategori, inisial, labelTipe, formatJadwalSub } from '../admin/adminData.js'

const NAV = [
  { id: 'jadwal', label: 'Jadwal', icon: CalendarDays },
  { id: 'penilaian', label: 'Penilaian', icon: ClipboardCheck },
]

const NAMA_HARI = { Sen: 'Senin', Sel: 'Selasa', Rab: 'Rabu', Kam: 'Kamis', Jum: 'Jumat', Sab: 'Sabtu', Min: 'Ahad' }
const ikonSub = { video: Video, dokumen: FileText, 'sesi-online': Video, 'sesi-offline': Users }

// cocokkan nama akun guru dgn nama di program (abaikan gelar/tanda baca)
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const cocokGuru = (a, b) => {
  const x = norm(a)
  const y = norm(b)
  return Boolean(x && y && (x.includes(y) || y.includes(x)))
}
// nilai lama berupa angka polos, format baru { love, komentar }
const nilaiDari = (raw) =>
  typeof raw === 'number' ? { love: raw, komentar: '' } : { love: raw?.love ?? 0, komentar: raw?.komentar ?? '' }
const subTerbit = (p) => (p?.kurikulum ?? []).flatMap((t) => (t.sub ?? []).filter((s) => s.status === 'terbit'))

function Bar({ value }) {
  return (
    <div className="db-bar">
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export default function GuruDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('ringkasan')
  const [kelasId, setKelasId] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [programs, setPrograms] = useState([])
  const [draft, setDraft] = useState({})
  const [versi, setVersi] = useState(0)
  const [openPop, setOpenPop] = useState(null)
  const [dibaca, setDibaca] = useState([])
  const [subNilaiBuka, setSubNilaiBuka] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('hifzUser')
    if (!raw) {
      navigate('/masuk', { replace: true })
      return
    }
    try {
      setUser(JSON.parse(raw))
    } catch {
      navigate('/masuk', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    api('/programs', { auth: false })
      .then(setPrograms)
      .catch(() => setPrograms([]))
  }, [])

  // tarik peserta lunas dari server lalu rekam lokal agar seluruh panel guru terisi
  useEffect(() => {
    let hidup = true
    const sinkron = async () => {
      try {
        const peta = await api('/toko/orders/peserta/semua', { auth: false })
        if (!hidup) return
        for (const [programId, emails] of Object.entries(peta ?? {}))
          for (const email of emails ?? []) ikutiProgram(email, programId)
      } catch {
        // server tidak terjangkau, coba lagi pada siklus berikutnya
      }
      if (hidup) setVersi((v) => v + 1)
    }
    sinkron()
    const id = setInterval(sinkron, 15000)
    return () => {
      hidup = false
      clearInterval(id)
    }
  }, [])

  const kelasSaya = useMemo(() => {
    if (!user) return []
    return programs.filter(
      (p) =>
        cocokGuru(p.tutor, user.nama) ||
        (p.kurikulum ?? []).some((t) => (t.sub ?? []).some((s) => cocokGuru(s.pengajar, user.nama))),
    )
  }, [programs, user])

  useEffect(() => {
    if (kelasSaya.length && !kelasSaya.some((k) => k.id === kelasId)) setKelasId(kelasSaya[0].id)
  }, [kelasSaya, kelasId])

  const kelas = kelasSaya.find((k) => k.id === kelasId)

  // penugasan mengajar (pengampu kelas atau pengajar sub materi) → notifikasi
  const penugasan = useMemo(() => {
    if (!user) return []
    const daftar = []
    for (const k of kelasSaya) {
      if (cocokGuru(k.tutor, user.nama))
        daftar.push({ id: `kelas-${k.id}`, kelasId: k.id, teks: `Anda ditetapkan sebagai pengampu ${k.nama}` })
      for (const t of k.kurikulum ?? [])
        for (const s of t.sub ?? [])
          if (cocokGuru(s.pengajar, user.nama))
            daftar.push({ id: `sub-${k.id}-${s.id}`, kelasId: k.id, teks: `Anda ditugaskan mengajar “${s.judul}” di ${k.nama}` })
    }
    return daftar
  }, [kelasSaya, user])

  useEffect(() => {
    if (!user) return
    try {
      setDibaca(JSON.parse(localStorage.getItem('hifzTugasBaca') ?? '{}')[user.email] ?? [])
    } catch {
      setDibaca([])
    }
  }, [user])

  const notifBaru = penugasan.filter((n) => !dibaca.includes(n.id)).length

  const bukaNotif = () => {
    setOpenPop((v) => (v === 'notif' ? null : 'notif'))
    if (openPop !== 'notif' && notifBaru > 0) {
      const semua = penugasan.map((n) => n.id)
      setDibaca(semua)
      try {
        const peta = JSON.parse(localStorage.getItem('hifzTugasBaca') ?? '{}')
        peta[user.email] = semua
        localStorage.setItem('hifzTugasBaca', JSON.stringify(peta))
      } catch {
        localStorage.setItem('hifzTugasBaca', JSON.stringify({ [user.email]: penugasan.map((n) => n.id) }))
      }
    }
  }

  const sesiMengajar = useMemo(
    () => kelasSaya.flatMap((k) => daftarJadwal(k.jadwal).map((j) => ({ kelas: k, j, berikut: sesiBerikutnya(j) }))),
    [kelasSaya],
  )
  const sesiTerdekat = sesiMengajar.filter((s) => s.berikut).sort((a, b) => a.berikut - b.berikut)[0]
  const sesiPekan = sesiMengajar.reduce((a, s) => a + (s.j.hari?.length ?? 0), 0)

  /* eslint-disable react-hooks/exhaustive-deps */
  const pesertaKelas = useMemo(() => (kelas ? pesertaProgram(kelas.id) : []), [kelas, versi])

  const semuaPeserta = useMemo(() => {
    const set = new Set()
    for (const k of kelasSaya) for (const email of pesertaProgram(k.id)) set.add(email)
    return [...set]
  }, [kelasSaya, versi])

  const belumDinilai = useMemo(() => {
    const hasil = []
    for (const k of kelasSaya)
      for (const email of pesertaProgram(k.id))
        for (const s of subTerbit(k))
          if (!nilaiDari(bacaPenilaian(email, k.id)[s.id]).love) hasil.push({ kelas: k, email, sub: s })
    return hasil
  }, [kelasSaya, versi])

  const totalDinilai = useMemo(() => {
    let n = 0
    for (const k of kelasSaya)
      for (const email of pesertaProgram(k.id))
        for (const s of subTerbit(k)) if (nilaiDari(bacaPenilaian(email, k.id)[s.id]).love) n += 1
    return n
  }, [kelasSaya, versi])
  /* eslint-enable react-hooks/exhaustive-deps */

  const bukaKelas = (id) => {
    setKelasId(id)
    setTab('kelas')
  }

  const keluar = () => {
    localStorage.removeItem('hifzUser')
    navigate('/', { replace: true })
  }

  const kunciNilai = (email, subId) => `${email}|${subId}`
  const ambilDraft = (email, programId, subId) =>
    draft[kunciNilai(email, subId)] ?? nilaiDari(bacaPenilaian(email, programId)[subId])
  const ubahDraft = (email, programId, subId, patch) => {
    const kini = ambilDraft(email, programId, subId)
    setDraft((prev) => ({ ...prev, [kunciNilai(email, subId)]: { ...kini, ...patch } }))
  }
  const simpanNilai = (email, programId, subId) => {
    const d = ambilDraft(email, programId, subId)
    beriNilai(email, programId, subId, d.love, d.komentar)
    setDraft((prev) => {
      const salinan = { ...prev }
      delete salinan[kunciNilai(email, subId)]
      return salinan
    })
    setVersi((v) => v + 1)
  }

  if (!user) return null

  const judulTab = {
    ringkasan: `Ahlan, ${user.nama.split(' ')[0]}!`,
    'kelas-saya': 'Kelas Saya',
    kelas: kelas?.nama,
    jadwal: 'Jadwal Mengajar',
    penilaian: 'Penilaian',
    profil: 'Profil Saya',
  }

  return (
    <div className={`db db--guru${collapsed ? ' is-collapsed' : ''}`}>
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

        <p className="db-nav-label">Menu guru</p>
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
            title="Kelas Saya"
            className={tab === 'kelas-saya' || tab === 'kelas' ? 'active' : ''}
            onClick={() => setTab('kelas-saya')}
          >
            <BookOpen size={17} strokeWidth={1.9} />
            <span>Kelas Saya</span>
          </button>

          {NAV.filter(({ id }) => id !== 'ringkasan').map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
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
              <button type="button" className="db-bell" aria-label="Notifikasi" onClick={bukaNotif}>
                <Bell size={18} strokeWidth={1.9} />
                {notifBaru > 0 && <i>{notifBaru}</i>}
              </button>
              {openPop === 'notif' && (
                <div className="db-pop-menu db-pop-menu--notif">
                  <header>
                    <h5>Penugasan mengajar</h5>
                    <span>{notifBaru} baru</span>
                  </header>
                  <ul>
                    {penugasan.length === 0 && (
                      <li>
                        <p>Belum ada penugasan.</p>
                      </li>
                    )}
                    {penugasan.map((n) => (
                      <li
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          bukaKelas(n.kelasId)
                          setOpenPop(null)
                        }}
                      >
                        <p>{n.teks}</p>
                        <span>{kelasSaya.find((k) => k.id === n.kelasId)?.kategori}</span>
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
            {tab === 'ringkasan' && (
              <div className="db-page">
                <div className="db-statbar">
                  <div className="db-statcell">
                    <span className="db-stat-ic"><GraduationCap size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{kelasSaya.length}</strong>
                      <p>Kelas diampu</p>
                      <em>{sesiPekan} sesi per pekan</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><Users size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{semuaPeserta.length}</strong>
                      <p>Peserta</p>
                      <em>di semua kelas</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic db-stat-ic--gold"><ClipboardCheck size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{belumDinilai.length}</strong>
                      <p>Belum dinilai</p>
                      <em>{totalDinilai} sudah dinilai</em>
                    </div>
                  </div>
                  <div className="db-statcell">
                    <span className="db-stat-ic"><CalendarDays size={17} strokeWidth={1.9} /></span>
                    <div>
                      <strong>{sesiTerdekat ? formatTanggalPanjang(sesiTerdekat.berikut) : '—'}</strong>
                      <p>Sesi terdekat</p>
                      <em>{sesiTerdekat ? sesiTerdekat.kelas.nama : 'belum ada jadwal'}</em>
                    </div>
                  </div>
                </div>

                {kelasSaya.length === 0 ? (
                  <p className="db-kosong">Belum ada kelas yang diampu.</p>
                ) : (
                  <div className="db-cols">
                    <div className="db-col-main">
                      <section className="db-block">
                        <header className="db-block-head">
                          <h4>Jadwal mengajar</h4>
                        </header>
                        <ul className="db-tenggat">
                          {sesiMengajar.map((s) => (
                            <li key={`${s.kelas.id}-${s.j.id}`}>
                              <span className="db-agenda-tipe is-sesi">
                                <Video size={11} strokeWidth={2} /> Sesi
                              </span>
                              <div>
                                <p>{s.kelas.nama}</p>
                                <span>
                                  {ringkasJadwal(s.j)}
                                  {s.berikut ? ` · berikutnya ${formatTanggalPanjang(s.berikut)}` : ''}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="db-block">
                        <header className="db-block-head">
                          <h4>Kelas saya</h4>
                        </header>
                        <div className="db-mini-grid">
                          {kelasSaya.map((k) => (
                            <article key={k.id} className="db-mini" role="button" tabIndex={0} onClick={() => bukaKelas(k.id)}>
                              <img src={k.gambar || gambarKategori(k.kategori)} alt="" />
                              <div>
                                <strong>{k.nama}</strong>
                                <span>{pesertaProgram(k.id).length} peserta · {subTerbit(k).length} sub materi</span>
                                {daftarJadwal(k.jadwal).length > 0 && (
                                  <span className="db-mini-sesi">
                                    <CalendarClock size={12} strokeWidth={1.9} /> {ringkasJadwal(daftarJadwal(k.jadwal)[0])}
                                  </span>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>

                    <aside className="db-col-side">
                      <section className="db-block">
                        <header className="db-block-head">
                          <h4>Belum dinilai</h4>
                        </header>
                        {belumDinilai.length === 0 ? (
                          <p className="db-kosong">Semua penilaian sudah diberikan.</p>
                        ) : (
                          <>
                            <ul className="db-activity">
                              {belumDinilai.slice(0, 6).map((b) => (
                                <li key={`${b.email}-${b.sub.id}`}>
                                  <div>
                                    <p>{b.sub.judul}</p>
                                    <span>{b.email} · {b.kelas.nama}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <button type="button" className="db-btn db-btn--sm db-btn-blockfoot" onClick={() => setTab('penilaian')}>
                              Beri penilaian
                            </button>
                          </>
                        )}
                      </section>
                    </aside>
                  </div>
                )}
              </div>
            )}

            {/* ================= KELAS SAYA (kartu penugasan) ================= */}
            {tab === 'kelas-saya' && (
              <div className="db-page">
                {kelasSaya.length === 0 ? (
                  <p className="db-kosong">Belum ada penugasan mengajar.</p>
                ) : (
                  <div className="db-guru-grid">
                    {kelasSaya.map((k) => {
                      const tugasSub = (k.kurikulum ?? []).flatMap((t) =>
                        (t.sub ?? []).filter((s) => cocokGuru(s.pengajar, user.nama)),
                      )
                      const j = daftarJadwal(k.jadwal)[0]
                      return (
                        <article key={k.id} className="db-guru-kartu" role="button" tabIndex={0} onClick={() => bukaKelas(k.id)}>
                          <img src={k.gambar || gambarKategori(k.kategori)} alt="" />
                          <div className="db-guru-kartu-isi">
                            <strong>{k.nama}</strong>
                            <span className="db-guru-tugas">
                              {cocokGuru(k.tutor, user.nama) ? 'Pengampu kelas' : 'Pengajar materi'}
                              {tugasSub.length ? ` · ${tugasSub.length} materi` : ''}
                            </span>
                            <span className="db-guru-meta">
                              {pesertaProgram(k.id).length} peserta · {subTerbit(k).length} sub materi
                            </span>
                            {j && (
                              <span className="db-mini-sesi">
                                <CalendarClock size={12} strokeWidth={1.9} /> {ringkasJadwal(j)}
                              </span>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= KELOLA KELAS ================= */}
            {tab === 'kelas' && kelas && (() => {
              const subs = subTerbit(kelas)
              const pengampu = cocokGuru(kelas.tutor, user.nama)
              const tugasSaya = subs.filter((s) => cocokGuru(s.pengajar, user.nama))
              const rerataProgres = pesertaKelas.length
                ? Math.round(
                    pesertaKelas.reduce((a, e) => a + hitungProgres(kelas, bacaProgres(e, kelas.id)).pct, 0) /
                      pesertaKelas.length,
                  )
                : 0
              const belumKelas = pesertaKelas.reduce((a, e) => {
                const nilai = bacaPenilaian(e, kelas.id)
                return a + subs.filter((s) => !nilaiDari(nilai[s.id]).love).length
              }, 0)
              const sesi = daftarJadwal(kelas.jadwal)
                .map((j) => ({ j, berikut: sesiBerikutnya(j) }))
                .filter((x) => x.berikut)
                .sort((a, b) => a.berikut - b.berikut)[0]
              const zoom = subs.find((s) => s.tautan)?.tautan
              return (
              <div className="db-page">
                <section className="db-block db-kelas-hero">
                  <img src={kelas.gambar || gambarKategori(kelas.kategori)} alt="" />
                  <div className="db-kelas-info">
                    <div className="db-kelas-chips">
                      {kelas.kategori && <span>{kelas.kategori}</span>}
                      {kelas.jenis && <span>{kelas.jenis}</span>}
                      {kelas.mode && <span>{kelas.mode}</span>}
                    </div>
                    <strong>{kelas.nama}</strong>
                    <span className="db-guru-tugas">
                      {pengampu ? 'Pengampu kelas' : 'Pengajar materi'}
                      {tugasSaya.length ? ` · ${tugasSaya.length} materi Anda` : ''}
                    </span>
                  </div>
                  <ul className="db-guru-stats">
                    <li><strong>{subs.length}</strong><span>sub materi</span></li>
                    <li><strong>{pesertaKelas.length}</strong><span>peserta</span></li>
                    <li><strong>{rerataProgres}%</strong><span>rerata progres</span></li>
                    <li><strong>{belumKelas}</strong><span>belum dinilai</span></li>
                  </ul>
                </section>

                {sesi && (
                  <section className="db-block db-kelas-sesi">
                    <span className="db-agenda-tipe is-sesi"><Video size={11} strokeWidth={2} /> Sesi berikutnya</span>
                    <div>
                      <p>{sesi.j.label || 'Sesi live'}</p>
                      <span>{formatTanggalPanjang(sesi.berikut)} · {sesi.j.mulai}–{sesi.j.selesai} WIB</span>
                    </div>
                    {zoom && (
                      <a className="db-btn db-btn--sm" href={zoom} target="_blank" rel="noreferrer">
                        <Video size={14} strokeWidth={1.9} /> Buka Zoom
                      </a>
                    )}
                  </section>
                )}

                <div className="db-prog">
                  <div className="db-prog-main">
                    {subs.length === 0 ? (
                      <section className="db-block">
                        <header className="db-block-head"><h4>Materi kelas</h4></header>
                        <p className="db-kosong">Belum ada materi terbit.</p>
                      </section>
                    ) : (
                      (kelas.kurikulum ?? []).map((t, ti) => {
                        const daftarSub = (t.sub ?? []).filter((s) => s.status === 'terbit')
                        if (!daftarSub.length) return null
                        return (
                          <section key={`${t.judul}-${ti}`} className="db-block">
                            <header className="db-block-head">
                              <h4>{t.judul}</h4>
                              <span className="db-block-sub">{daftarSub.length} sub materi</span>
                            </header>
                            <ul className="db-materi-list">
                              {daftarSub.map((s) => {
                                const Icon = ikonSub[s.jenis] ?? BookOpen
                                const saya = cocokGuru(s.pengajar, user.nama)
                                const dinilaiN = pesertaKelas.filter(
                                  (e) => nilaiDari(bacaPenilaian(e, kelas.id)[s.id]).love,
                                ).length
                                return (
                                  <li key={s.id}>
                                    <span className="db-sil-ic"><Icon size={15} strokeWidth={1.9} /></span>
                                    <div>
                                      <strong>{s.judul}</strong>
                                      {s.narasi && <p>{s.narasi}</p>}
                                      <span className="db-sub-chips">
                                        <em>{labelTipe(s.jenis)}</em>
                                        {s.metode && <em>{s.metode}</em>}
                                        {s.durasi ? <em>{s.durasi} menit</em> : null}
                                        {s.jadwal && (
                                          <em><CalendarClock size={11} strokeWidth={1.9} /> {formatJadwalSub(s.jadwal)}</em>
                                        )}
                                        {s.pengajar && (
                                          <em className={saya ? 'is-saya' : ''}>
                                            <GraduationCap size={11} strokeWidth={1.9} /> {saya ? 'Anda' : s.pengajar}
                                          </em>
                                        )}
                                        {pesertaKelas.length > 0 && (
                                          <em className={dinilaiN === pesertaKelas.length ? 'is-ok' : ''}>
                                            <Heart size={11} strokeWidth={1.9} /> {dinilaiN}/{pesertaKelas.length} dinilai
                                          </em>
                                        )}
                                      </span>
                                      {subNilaiBuka === s.id && (
                                        <ul className="db-sub-nilai">
                                          {pesertaKelas.length === 0 ? (
                                            <li className="db-sub-nilai-kosong">Belum ada peserta.</li>
                                          ) : (
                                            pesertaKelas.map((email) => {
                                              const d = ambilDraft(email, kelas.id, s.id)
                                              return (
                                                <li key={email}>
                                                  <span className="db-peserta-ava">{inisial(email)}</span>
                                                  <strong>{email}</strong>
                                                  <span className="db-love db-love--pilih">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                      <button
                                                        key={n}
                                                        type="button"
                                                        aria-label={`${n} dari 5`}
                                                        className={n <= d.love ? 'is-isi' : ''}
                                                        onClick={() => ubahDraft(email, kelas.id, s.id, { love: n })}
                                                      >
                                                        <Heart size={15} strokeWidth={1.9} />
                                                      </button>
                                                    ))}
                                                  </span>
                                                  <input
                                                    value={d.komentar}
                                                    placeholder="Komentar"
                                                    onChange={(e) => ubahDraft(email, kelas.id, s.id, { komentar: e.target.value })}
                                                  />
                                                  <button
                                                    type="button"
                                                    className="db-btn db-btn--sm"
                                                    onClick={() => simpanNilai(email, kelas.id, s.id)}
                                                  >
                                                    Simpan
                                                  </button>
                                                </li>
                                              )
                                            })
                                          )}
                                        </ul>
                                      )}
                                    </div>
                                    {s.tautan && (
                                      <a className="db-btn db-btn--ghost db-btn--sm" href={s.tautan} target="_blank" rel="noreferrer">
                                        <Video size={14} strokeWidth={1.9} /> Zoom
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      className="db-btn db-btn--sm"
                                      onClick={() => setSubNilaiBuka((v) => (v === s.id ? null : s.id))}
                                    >
                                      <ClipboardCheck size={14} strokeWidth={1.9} /> Nilai
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </section>
                        )
                      })
                    )}
                  </div>

                  <aside className="db-prog-side">
                    <section className="db-block">
                      <header className="db-block-head"><h4>Detail kelas</h4></header>
                      <ul className="db-prog-meta">
                        {daftarJadwal(kelas.jadwal).map((j) => (
                          <li key={j.id}>
                            <CalendarClock size={14} strokeWidth={1.9} /> {j.label ? `${j.label} · ` : ''}{ringkasJadwal(j)}
                          </li>
                        ))}
                        {kelas.tutor && <li><GraduationCap size={14} strokeWidth={1.9} /> {kelas.tutor}</li>}
                        {kelas.mode && <li><MapPin size={14} strokeWidth={1.9} /> {kelas.mode}</li>}
                        <li><Users size={14} strokeWidth={1.9} /> {pesertaKelas.length} peserta</li>
                      </ul>
                      <button type="button" className="db-btn db-btn--sm db-btn-blockfoot" onClick={() => setTab('penilaian')}>
                        Beri penilaian
                      </button>
                    </section>

                    {pesertaKelas.length > 0 && subs.length > 0 && (
                      <section className="db-block">
                        <header className="db-block-head"><h4>Rekap penilaian</h4></header>
                        <ul className="db-rekap-nilai">
                          {subs.map((s) => {
                            const skor = pesertaKelas
                              .map((e) => nilaiDari(bacaPenilaian(e, kelas.id)[s.id]).love)
                              .filter(Boolean)
                            const rerata = skor.length
                              ? Math.round((skor.reduce((a, b) => a + b, 0) / skor.length) * 10) / 10
                              : 0
                            return (
                              <li key={s.id}>
                                <span>{s.judul}</span>
                                <b>{rerata ? <><Heart size={12} strokeWidth={1.9} /> {rerata}</> : '—'}</b>
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                    )}

                    <section className="db-block">
                      <header className="db-block-head"><h4>Peserta</h4></header>
                      {pesertaKelas.length === 0 ? (
                        <p className="db-kosong">Belum ada peserta.</p>
                      ) : (
                        <ul className="db-peserta">
                          {pesertaKelas.map((email) => {
                            const prog = hitungProgres(kelas, bacaProgres(email, kelas.id))
                            const hadir = bacaAbsensi(email, kelas.id).filter((id) => subTerbit(kelas).some((s) => s.id === id))
                            const nilai = bacaPenilaian(email, kelas.id)
                            const dinilai = subTerbit(kelas).filter((s) => nilaiDari(nilai[s.id]).love).length
                            return (
                              <li key={email}>
                                <span className="db-peserta-ava">{inisial(email)}</span>
                                <div>
                                  <strong>{email}</strong>
                                  <Bar value={prog.pct} />
                                  <span>{prog.pct}% progres · hadir {hadir.length}/{prog.total} · dinilai {dinilai}/{prog.total}</span>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </section>
                  </aside>
                </div>
              </div>
              )
            })()}

            {/* ================= JADWAL MENGAJAR ================= */}
            {tab === 'jadwal' && (
              <div className="db-page">
                {sesiMengajar.length === 0 ? (
                  <p className="db-kosong">Belum ada jadwal mengajar.</p>
                ) : (
                  <>
                    <div className="db-gj-grid">
                      {HARI_URUT.map((h) => {
                        const item = sesiMengajar.filter((s) => (s.j.hari ?? []).includes(h))
                        if (!item.length) return null
                        return (
                          <section key={h} className="db-block db-gj-hari">
                            <header className="db-block-head"><h4>{NAMA_HARI[h] ?? h}</h4></header>
                            <ul>
                              {item.map((s) => (
                                <li key={`${s.kelas.id}-${s.j.id}`}>
                                  <strong>{s.kelas.nama}</strong>
                                  <span>{s.j.label ? `${s.j.label} · ` : ''}{s.j.mulai}–{s.j.selesai} WIB</span>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )
                      })}
                    </div>

                    <section className="db-block">
                      <header className="db-block-head"><h4>Sesi terdekat</h4></header>
                      <ul className="db-tenggat">
                        {sesiMengajar
                          .filter((s) => s.berikut)
                          .sort((a, b) => a.berikut - b.berikut)
                          .map((s) => (
                            <li key={`${s.kelas.id}-${s.j.id}`}>
                              <span className="db-agenda-tipe is-sesi">
                                <Video size={11} strokeWidth={2} /> Sesi
                              </span>
                              <div>
                                <p>{s.kelas.nama}</p>
                                <span>{formatTanggalPanjang(s.berikut)} · {s.j.mulai} WIB</span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </section>
                  </>
                )}
              </div>
            )}

            {/* ================= PENILAIAN ================= */}
            {tab === 'penilaian' && (
              <div className="db-page">
                {kelasSaya.length > 1 && (
                  <div className="db-nilai-pilih">
                    {kelasSaya.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        className={k.id === kelasId ? 'is-aktif' : ''}
                        onClick={() => setKelasId(k.id)}
                      >
                        {k.nama}
                      </button>
                    ))}
                  </div>
                )}
                {!kelas || pesertaKelas.length === 0 ? (
                  <p className="db-kosong">Belum ada peserta.</p>
                ) : (
                  <div className="db-nilai-daftar">
                    {pesertaKelas.map((email) => {
                      const prog = hitungProgres(kelas, bacaProgres(email, kelas.id))
                      const hadir = bacaAbsensi(email, kelas.id).filter((id) => subTerbit(kelas).some((s) => s.id === id))
                      return (
                        <section key={email} className="db-block">
                          <header className="db-block-head">
                            <h4>{email}</h4>
                            <span className="db-block-sub">{prog.pct}% progres · hadir {hadir.length}/{prog.total}</span>
                          </header>
                          <ul className="db-nilai-list">
                            {subTerbit(kelas).map((s) => {
                              const d = ambilDraft(email, kelas.id, s.id)
                              const sudahHadir = hadir.includes(s.id)
                              return (
                                <li key={s.id}>
                                  <strong>{s.judul}</strong>
                                  <button
                                    type="button"
                                    className={`db-hadir-toggle${sudahHadir ? ' is-hadir' : ''}`}
                                    onClick={() => {
                                      absenHadir(email, kelas.id, s.id, !sudahHadir)
                                      setVersi((v) => v + 1)
                                    }}
                                  >
                                    <UserCheck size={13} strokeWidth={2} /> {sudahHadir ? 'Hadir' : 'Absen'}
                                  </button>
                                  <span className="db-love db-love--pilih">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        type="button"
                                        aria-label={`${n} dari 5`}
                                        className={n <= d.love ? 'is-isi' : ''}
                                        onClick={() => ubahDraft(email, kelas.id, s.id, { love: n })}
                                      >
                                        <Heart size={15} strokeWidth={1.9} />
                                      </button>
                                    ))}
                                  </span>
                                  <input
                                    value={d.komentar}
                                    placeholder="Komentar"
                                    onChange={(e) => ubahDraft(email, kelas.id, s.id, { komentar: e.target.value })}
                                  />
                                  <button type="button" className="db-btn db-btn--sm" onClick={() => simpanNilai(email, kelas.id, s.id)}>
                                    Simpan
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </section>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= PROFIL ================= */}
            {tab === 'profil' && (
              <div className="db-page db-page--profil">
                <FormGuru
                  mode="profil"
                  awal={{ nama: user.nama, email: user.email, ...bacaProfilGuru()[user.email] }}
                  onKirim={(form) => simpanProfilGuru(user.email, form)}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
