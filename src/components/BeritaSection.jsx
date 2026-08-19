import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { api } from '../lib/api.js'
import { inisial } from '../pages/admin/adminData.js'

const formatTanggal = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

const KATEGORI_UMUM = ['Artikel', 'Pengumuman', 'Kisah', 'Kegiatan']

export default function BeritaSection() {
  const trackRef = useRef(null)
  const [berita, setBerita] = useState([])
  const [bisaKiri, setBisaKiri] = useState(false)

  useEffect(() => {
    api('/berita', { auth: false })
      .then((d) => setBerita((Array.isArray(d) ? d : []).filter((b) => KATEGORI_UMUM.includes(b.kategori))))
      .catch(() => setBerita([]))
  }, [])

  const geser = (arah) => {
    const el = trackRef.current
    el?.scrollBy({ left: arah * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (berita.length === 0) return null

  return (
    <section className="berita-home" id="berita">
      <div className="container">
        <motion.div
          className="phc-headrow"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="phc-headcopy">
            <h2 className="psec-title">Kabar Terbaru dari Hifz</h2>
            <p className="bnc-sub">Cerita, agenda, dan promo terhangat. Baca sekarang sebelum ketinggalan.</p>
          </div>
        </motion.div>

        <div className="bnc-viewport">
          <div className="bnc-track" ref={trackRef} onScroll={(e) => setBisaKiri(e.currentTarget.scrollLeft > 4)}>
            {berita.slice(0, 4).map((b, i) => (
              <motion.article
                key={b.id}
                className="bnc-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              >
                <Link className="bnc-media" to={`/corner/berita/${b.id}`} tabIndex={-1}>
                  {b.gambar ? (
                    <img src={b.gambar} alt={b.judul} loading="lazy" />
                  ) : (
                    <span className="bnc-media-kosong" aria-hidden="true">
                      <Newspaper size={30} strokeWidth={1.6} />
                    </span>
                  )}
                  <span className="bnc-pita" aria-hidden="true">
                    <span>{b.kategori}</span>
                  </span>
                  <span className="bnc-tanggal">
                    <CalendarDays size={13} strokeWidth={2.2} aria-hidden="true" />
                    {formatTanggal(b.createdAt)}
                  </span>
                </Link>
                <div className="bnc-body">
                  <span className="bnc-penulis">
                    <i className="bnc-penulis-ava" aria-hidden="true">{inisial(b.penulis || 'Tim Hifz')}</i>
                    {b.penulis || 'Tim Hifz'}
                  </span>
                  <h3>
                    <Link to={`/corner/berita/${b.id}`}>{b.judul}</Link>
                  </h3>
                  {b.ringkas && <p>{b.ringkas}</p>}
                </div>
              </motion.article>
            ))}
          </div>

          <div className="bnc-nav">
            <button
              type="button"
              className={bisaKiri ? undefined : 'is-sembunyi'}
              onClick={() => geser(-1)}
              aria-label="Geser ke kiri"
              aria-hidden={!bisaKiri}
              tabIndex={bisaKiri ? 0 : -1}
            >
              <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => geser(1)} aria-label="Geser ke kanan">
              <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
