import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, ClipboardCheck, UsersRound } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const konten = {
  asesmen: {
    ikon: ClipboardCheck,
    badge: 'Asesmen Hifz',
    judul: 'Asesmen penempatan',
    teks:
      'Ukur kemampuan bacaanmu bersama guru Hifz dan mulailah belajar dari jenjang yang tepat. Asesmen awal gratis dan berlangsung sekitar 15 menit.',
    cta: { label: 'Ikuti asesmen gratis', href: '/daftar' },
  },
  komunitas: {
    ikon: UsersRound,
    badge: 'Komunitas Hifz',
    judul: 'Tumbuh bersama komunitas',
    teks:
      'Bergabung dengan ribuan Teman Hifz di grup belajar, simaan rutin, dan kopdar bulanan di berbagai kota. Belajar agama terasa lebih ringan saat berjamaah.',
    cta: { label: 'Gabung sekarang', href: '/daftar' },
  },
}

export default function HalamanSegera({ jenis }) {
  const k = konten[jenis]
  return (
    <>
      <Header solid />
      <main className="corner-page">
        <section className="corner-head corner-head--tunggal">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="phc-label">
                <k.ikon size={14} strokeWidth={2.2} aria-hidden="true" />
                {k.badge}
              </span>
              <h1>{k.judul}</h1>
              <p>{k.teks}</p>
              <Link className="phc-all" to={k.cta.href}>
                {k.cta.label}
                <ArrowUpRight size={15} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
