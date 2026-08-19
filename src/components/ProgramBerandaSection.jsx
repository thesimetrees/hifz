import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, BadgePercent, BookMarked, Compass, Hourglass, Languages, Layers, Repeat, Rocket, UserRound } from 'lucide-react'
import { formatRupiah, inisial, subTerbit } from '../pages/admin/adminData.js'
import { avatarGuru } from '../lib/guru.js'
import { api } from '../lib/api.js'

const ikonKategori = {
  Semua: Compass,
  'Qur\u2019an Journey': BookMarked,
  'Islamic Deeper': Layers,
  'Arabic & TOAFL Prep': Languages,
}

const ikonJenis = {
  Daily: Repeat,
  'Short Course': Hourglass,
  Bootcamp: Rocket,
  Private: UserRound,
}

export default function ProgramBerandaSection() {
  const trackRef = useRef(null)
  const [daftar, setDaftar] = useState([])

  useEffect(() => {
    let hidup = true
    api('/programs', { auth: false })
      .then((data) => hidup && setDaftar(data))
      .catch(() => hidup && setDaftar([]))
    return () => {
      hidup = false
    }
  }, [])

  const tampil = daftar

  return (
    <section className="phc" id="program">
      <div className="container phc-main">
        <motion.div
          className="phc-headrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="phc-headcopy">
            <h2 className="psec-title">Promo Terbaik untuk Kamu</h2>
            <p className="phc-sub">
              Program unggulan dengan penawaran spesial. Mulai langkah belajarmu hari ini.
            </p>
          </div>
        </motion.div>

        <div className="phc-panel">
          <div className="phc-track" ref={trackRef}>
            {tampil.length === 0 && (
              <p className="phc-kosong">Katalog program sedang disiapkan oleh tim akademik. Nantikan program terbaru dari Hifz segera.</p>
            )}
            {tampil.slice(0, 4).map((p, i) => {
            const terbit = subTerbit(p)
            const tutor = [...new Set([p.tutor, ...terbit.map((m) => m.pengajar)].filter(Boolean))]
            return (
              <motion.article
                key={p.id}
                className="phc-card"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              >
                <Link to={`/program/${p.id}`} className="phc-media">
                  <img src={p.gambar} alt={p.nama} loading="lazy" />
                  <span className="phc-pita" aria-hidden="true"><span>{p.jenis}</span></span>
                  <span className="phc-media-badges">
                    <span className="phc-kategori" title={p.kategori} aria-label={p.kategori}>
                      {(() => {
                        const IkonKat = ikonKategori[p.kategori] ?? Compass
                        return <IkonKat size={13} strokeWidth={2.2} aria-hidden="true" />
                      })()}
                    </span>
                    <span className="phc-jenis" title={p.jenis} aria-label={p.jenis}>
                      {(() => {
                        const IkonJns = ikonJenis[p.jenis] ?? Rocket
                        return <IkonJns size={13} strokeWidth={2.2} aria-hidden="true" />
                      })()}
                    </span>
                  </span>
                </Link>
                <div className="phc-body">
                  <span className="phc-avatars">
                    {tutor.slice(0, 4).map((t) => (
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
              </motion.article>
            )
          })}
          </div>
          <div className="phc-lihat">
            <Link to="/program" className="phc-all">
              Lihat program selengkapnya
              <ArrowUpRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
