import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import { formatRupiah, inisial, subTerbit } from '../admin/adminData.js'
import { avatarGuru } from '../../lib/guru.js'
import { api } from '../../lib/api.js'

// Label tampilan filter; nilai filter tetap memakai nama kategori asli dari API
const labelKategori = {
  'Arabic & TOAFL Prep': 'TOAFL Prep',
}

export default function ProgramKatalog() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [kat, setKat] = useState('Semua')
  const [jenis, setJenis] = useState('Semua')
  const [bukaFilter, setBukaFilter] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    let hidup = true
    api('/programs', { auth: false })
      .then((data) => {
        if (!hidup) return
        setDaftar(data)
        setMemuat(false)
      })
      .catch(() => {
        if (!hidup) return
        setDaftar([])
        setMemuat(false)
      })
    return () => {
      hidup = false
    }
  }, [])

  const kategoriList = ['Semua', ...new Set(daftar.map((p) => p.kategori).filter(Boolean))]
  const jenisList = ['Semua', ...new Set(daftar.map((p) => p.jenis).filter(Boolean))]

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return daftar.filter((p) => {
      if (kat !== 'Semua' && p.kategori !== kat) return false
      if (jenis !== 'Semua' && p.jenis !== jenis) return false
      if (!q) return true
      return [p.nama, p.deskripsi, p.kategori, p.jenis, p.tutor]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(q))
    })
  }, [daftar, cari, kat, jenis])

  return (
    <>
      <Header />
      <main className="pkat">
        <section className="pkat-hero" aria-hidden="true" />

        <div className="container pkat-cari-wrap">
          <div className={`pkat-cari ${bukaFilter ? 'is-filter-buka' : ''}`}>
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari program, materi, atau guru"
              aria-label="Cari program"
            />
            {cari && (
              <button type="button" className="pkat-cari-hapus" onClick={() => setCari('')} aria-label="Bersihkan pencarian">
                <X size={14} strokeWidth={2.2} />
              </button>
            )}
            <Search size={19} strokeWidth={2.1} aria-hidden="true" />
            <button
              type="button"
              className={`pkat-cari-toggle ${bukaFilter ? 'is-aktif' : ''}`}
              onClick={() => setBukaFilter((v) => !v)}
              aria-label="Tampilkan filter"
              aria-expanded={bukaFilter}
            >
              <SlidersHorizontal size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="pkat-cari-sep" aria-hidden="true" />
            <label className="pkat-cari-urut">
              Kategori
              <select value={kat} onChange={(e) => setKat(e.target.value)}>
                {kategoriList.map((k) => (
                  <option key={k} value={k}>{labelKategori[k] ?? k}</option>
                ))}
              </select>
            </label>
            <span className="pkat-cari-sep" aria-hidden="true" />
            <label className="pkat-cari-urut">
              Jenis
              <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                {jenisList.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="container pkat-isi">
          <div className="pkat-grid">
            {tampil.map((p, i) => {
              const terbit = subTerbit(p)
              const tutor = [...new Set([p.tutor, ...terbit.map((m) => m.pengajar)].filter(Boolean))]
              return (
                <motion.article
                  key={p.id}
                  className="phc-card"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05, ease: 'easeOut' }}
                >
                  <Link to={`/program/${p.id}`} className="phc-media">
                    <img src={p.gambar} alt={p.nama} loading="lazy" />
                  </Link>
                  <div className="phc-body">
                    <span className="phc-avatars">
                      {tutor.slice(0, 4).map((t) => (
                        <span key={t} className="phc-avatar-ini" title={t}>{inisial(t)}</span>
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
                </motion.article>
              )
            })}
          </div>

          {!memuat && tampil.length === 0 && (
            <div className="pkat-kosong">
              <p>Tidak ada program yang cocok dengan pencarianmu.</p>
              <button
                type="button"
                onClick={() => {
                  setCari('')
                  setKat('Semua')
                  setJenis('Semua')
                }}
              >
                Reset pencarian &amp; filter
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
