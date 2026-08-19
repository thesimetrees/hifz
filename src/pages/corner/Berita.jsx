import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Newspaper, Search, SlidersHorizontal, X } from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { api } from '../../lib/api.js'

const formatTanggal = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

const KATEGORI_UMUM = ['Artikel', 'Pengumuman', 'Kisah', 'Kegiatan']

export default function Berita() {
  const [semua, setSemua] = useState([])
  const [kata, setKata] = useState('')
  const [kategori, setKategori] = useState('Semua')
  const [bukaFilter, setBukaFilter] = useState(false)

  useEffect(() => {
    api('/berita', { auth: false })
      .then((d) => setSemua((Array.isArray(d) ? d : []).filter((b) => KATEGORI_UMUM.includes(b.kategori))))
      .catch(() => setSemua([]))
  }, [])

  const kategoriBerita = useMemo(
    () => ['Semua', ...new Set(semua.map((b) => b.kategori))],
    [semua]
  )

  const tampil = useMemo(() => {
    const q = kata.trim().toLowerCase()
    return semua.filter((b) => {
      if (kategori !== 'Semua' && b.kategori !== kategori) return false
      if (!q) return true
      return [b.judul, b.ringkas, b.kategori, b.penulis]
        .filter(Boolean)
        .some((t) => t.toLowerCase().includes(q))
    })
  }, [semua, kata, kategori])

  return (
    <>
      <Header />
      <main className="pkat">
        <section className="pkat-hero" aria-hidden="true" />

        <div className="container pkat-cari-wrap">
          <div className={`pkat-cari ${bukaFilter ? 'is-filter-buka' : ''}`}>
            <input
              type="search"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              placeholder="Cari berita, artikel, atau penulis"
              aria-label="Cari berita"
            />
            {kata && (
              <button type="button" className="pkat-cari-hapus" onClick={() => setKata('')} aria-label="Bersihkan pencarian">
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
              <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
                {kategoriBerita.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="container pkat-isi">
          <div className="pkat-grid">
            {tampil.map((b, i) => (
              <motion.article
                key={b.id}
                className="phc-card bnc-kartu"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05, ease: 'easeOut' }}
              >
                <Link to={`/corner/berita/${b.id}`} className="phc-media">
                  <span className="phc-pita"><span>{b.kategori}</span></span>
                  {b.gambar ? (
                    <img src={b.gambar} alt={b.judul} loading="lazy" />
                  ) : (
                    <span className="bnc-media-kosong" aria-hidden="true">
                      <Newspaper size={30} strokeWidth={1.6} />
                    </span>
                  )}
                </Link>
                <div className="phc-body">
                  <span className="bnc-meta">{formatTanggal(b.createdAt)} &middot; {b.penulis || 'Tim Hifz'}</span>
                  <h3><Link to={`/corner/berita/${b.id}`}>{b.judul}</Link></h3>
                  {b.ringkas && <p className="phc-desc">{b.ringkas}</p>}
                  <div className="phc-hargabar">
                    <span className="phc-hb">
                      <strong>Baca artikel</strong>
                    </span>
                    <Link className="phc-go" to={`/corner/berita/${b.id}`} aria-label={`Baca ${b.judul}`}>
                      <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {tampil.length === 0 && (
            <div className="pkat-kosong">
              <p>
                {semua.length === 0
                  ? 'Belum ada berita terbit. Berita yang diterbitkan admin akan tampil di sini.'
                  : 'Tidak ada berita yang cocok dengan pencarianmu.'}
              </p>
              {semua.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setKata('')
                    setKategori('Semua')
                  }}
                >
                  Atur ulang pencarian
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
