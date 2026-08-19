import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookMarked, Library } from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { api } from '../../lib/api.js'

export default function Perpustakaan() {
  const [koleksi, setKoleksi] = useState([])

  useEffect(() => {
    api('/berita', { auth: false })
      .then((d) => setKoleksi((Array.isArray(d) ? d : []).filter((b) => b.kategori === 'Perpustakaan')))
      .catch(() => setKoleksi([]))
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
                <Library size={14} strokeWidth={2.2} aria-hidden="true" />
                Hifz Corner
              </span>
              <h1>Perpustakaan digital</h1>
              <p>
                Koleksi e-book, kitab digital, dan lembar kerja pilihan yang bisa diakses gratis
                oleh seluruh Teman Hifz.
              </p>
            </motion.div>
          </div>
        </section>
        <section className="corner-isi">
          <div className="container">
            {koleksi.length === 0 ? (
              <p className="pkat-kosong">Belum ada koleksi. Materi berkategori Perpustakaan yang diterbitkan admin akan tampil di sini.</p>
            ) : (
              <div className="corner-grid">
                {koleksi.map((item) => (
                  <article key={item.id} className="corner-card">
                    <span className="corner-card-ikon">
                      <BookMarked size={18} strokeWidth={2} aria-hidden="true" />
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
