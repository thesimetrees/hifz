import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CookieConsent from '../components/CookieConsent.jsx'

export default function Guru() {
  return (
    <>
      <Header />
      <main className="tutor-page">
        <section className="pkat-hero" aria-hidden="true" />

        <section className="tutor-hero">
          <div className="container tutor-hero-grid">
            <motion.div
              className="tutor-hero-copy"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <span className="tutor-eyebrow">Guru Hifz</span>
              <h1>Tersebar di penjuru negeri, terstandar satu kualitas</h1>
              <p>
                Setiap guru Hifz melalui proses seleksi yang sama ketatnya: verifikasi latar
                pendidikan, uji kelayakan bacaan, dan praktik mengajar langsung. Di mana pun Anda
                berada, kualitas pendampingannya tidak berubah.
              </p>
              <div className="tutor-hero-cta">
                <Link className="btn tutor-btn-gold" to="/daftar-guru">
                  Daftar sebagai guru
                  <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
