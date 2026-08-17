import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MonitorPlay, Sparkles } from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { api } from '../../lib/api.js'

export default function Pembelajaran() {
  const [daftar, setDaftar] = useState([])

  useEffect(() => {
    api('/berita', { auth: false })
      .then((d) => setDaftar((Array.isArray(d) ? d : []).filter((b) => b.kategori === 'Pembelajaran')))
      .catch(() => setDaftar([]))
  }, [])

  return (
    <>
      <Header />
      <main className="corner-page">
        <section className="corner-head">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="phc-label">
                <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
                Hifz Corner
              </span>
              <h1>Pembelajaran lainnya</h1>
              <p>
                Rekaman kajian, podcast, dan materi belajar mandiri untuk menemanimu di luar kelas
                reguler.
              </p>
            </motion.div>
          </div>
        </section>
        <section className="corner-isi">
          <div className="container">
            {daftar.length === 0 ? (
              <p className="pkat-kosong">Belum ada materi. Konten berkategori Pembelajaran yang diterbitkan admin akan tampil di sini.</p>
            ) : (
              <div className="corner-grid">
                {daftar.map((item) => (
                  <article key={item.id} className="corner-card">
                    <span className="corner-card-ikon">
                      <MonitorPlay size={18} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="bnc-kategori">{item.kategori}</span>
                    <h3>{item.judul}</h3>
                    {item.ringkas && <p>{item.ringkas}</p>}
                    {item.konten && <span className="corner-card-detail">{item.konten}</span>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
