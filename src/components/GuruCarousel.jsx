import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { avatarGuru } from '../lib/guru.js'
import { benderaBahasa } from './FormGuru.jsx'

export default function GuruCarousel({ pengajar }) {
  const trackRef = useRef(null)
  const jeda = useRef(false)
  const [bisaKiri, setBisaKiri] = useState(false)
  const geser = (arah) => {
    trackRef.current?.scrollBy({ left: arah * 266, behavior: 'smooth' })
  }

  useEffect(() => {
    const id = setInterval(() => {
      const el = trackRef.current
      if (!el || jeda.current) return
      const mentok = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      if (mentok) el.scrollTo({ left: 0, behavior: 'smooth' })
      else el.scrollBy({ left: 266, behavior: 'smooth' })
    }, 3800)
    return () => clearInterval(id)
  }, [])

  if (!pengajar?.length) return null

  return (
    <div
      className="kdetail-pengajar"
      onMouseEnter={() => { jeda.current = true }}
      onMouseLeave={() => { jeda.current = false }}
    >
      <div
        className="kdetail-pengajar-track"
        ref={trackRef}
        onScroll={(e) => setBisaKiri(e.currentTarget.scrollLeft > 4)}
      >
        {pengajar.map((g, i) => (
          <motion.article
            key={g.nama}
            className="kdetail-pengajar-card"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', stiffness: 110, damping: 17, delay: Math.min(i, 4) * 0.09 }}
          >
            <header className="kdetail-pengajar-head">
              <span className="kdetail-pengajar-ava" aria-hidden="true">
                {g.foto ? <img src={g.foto} alt="" /> : <img src={avatarGuru(g.nama)} alt="" />}
              </span>
              <div className="kdetail-pengajar-idn">
                <strong>
                  {g.nama}
                  <BadgeCheck size={22} strokeWidth={2.2} aria-label="Guru terstandarisasi" role="img" />
                </strong>
                <span className="kdetail-pengajar-gelar">Guru Hifz</span>
              </div>
              {g.bahasa?.length > 0 && (
                <div className="kdetail-pengajar-flags">
                  {g.bahasa.map((b) => (
                    <span key={b} title={b} role="img" aria-label={b}>{benderaBahasa[b] ?? b.slice(0, 2)}</span>
                  ))}
                </div>
              )}
            </header>
            <div className="kdetail-pengajar-body">
              {g.bio && <p className="kdetail-pengajar-bio">{g.bio}</p>}
              {g.pendidikan?.length > 0 && (
                <div className="kdetail-pengajar-sec">
                  <h4>Riwayat pendidikan</h4>
                  <ul className="kdetail-pendidikan">
                    {g.pendidikan.map((p) => {
                      const [gelar, ...sisa] = String(p.nama).split('—')
                      const univ = sisa.join('—').trim()
                      return (
                        <li key={`${p.jenis}-${p.nama}`} className={p.jenis === 'Formal' ? '' : 'is-nonformal'}>
                          <span className="kdetail-pendidikan-teks">
                            <em>{p.jenis}</em>
                            <span>{gelar.trim()}</span>
                            {univ && <small>{univ}</small>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
      <div className="kdetail-pengajar-nav">
        <button
          type="button"
          className={bisaKiri ? undefined : 'is-sembunyi'}
          onClick={() => geser(-1)}
          aria-label="Geser ke kiri"
          aria-hidden={!bisaKiri}
          tabIndex={bisaKiri ? 0 : -1}
        >
          <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => geser(1)} aria-label="Geser ke kanan">
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
