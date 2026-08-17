import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Banknote, BookOpenCheck, CalendarClock, ClipboardCheck,
  GraduationCap, LayoutGrid, MicVocal, NotebookPen, ShieldCheck,
  Sparkles, UserRoundCheck, Users,
} from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CookieConsent from '../components/CookieConsent.jsx'
import { api } from '../lib/api.js'
import { ambilGuru } from '../lib/guru.js'

const keunggulan = [
  {
    ikon: Banknote,
    judul: 'Honorarium jelas dan tepat waktu',
    teks: 'Skema honor transparan sejak awal dan dicairkan rutin setiap tanggal 28, langsung ke rekening Anda.',
  },
  {
    ikon: CalendarClock,
    judul: 'Jadwal mengajar fleksibel',
    teks: 'Anda menentukan sendiri ketersediaan waktu. Kelas berlangsung daring sehingga dapat diampu dari mana saja.',
  },
  {
    ikon: BookOpenCheck,
    judul: 'Kurikulum disiapkan tim akademik',
    teks: 'Modul, silabus, dan materi kelas disusun tim kurikulum. Anda cukup fokus membimbing santri.',
  },
  {
    ikon: Sparkles,
    judul: 'Pengembangan diri berkelanjutan',
    teks: 'Daurah berkala, pembinaan metode mengajar, dan komunitas guru untuk menajamkan keilmuan.',
  },
]

const seleksi = [
  {
    ikon: NotebookPen,
    tahap: 'Tahap 1',
    judul: 'Pendaftaran dan verifikasi berkas',
    teks: 'Isi formulir pendaftaran, lampirkan riwayat pendidikan formal dan non-formal beserta sertifikasi yang dimiliki. Tim kami memverifikasi keaslian setiap berkas.',
    durasi: '1-3 hari kerja',
  },
  {
    ikon: MicVocal,
    tahap: 'Tahap 2',
    judul: 'Uji kelayakan dan microteaching',
    teks: 'Bacaan dan penguasaan bidang diuji langsung oleh tim kurikulum, dilanjutkan simulasi mengajar untuk menilai cara Anda membimbing santri.',
    durasi: '1 sesi daring, 60 menit',
  },
  {
    ikon: UserRoundCheck,
    tahap: 'Tahap 3',
    judul: 'Onboarding dan mulai mengajar',
    teks: 'Kenali standar layanan, alur kelas, dan dashboard guru Hifz. Setelah itu Anda mulai mendampingi Teman Hifz sesuai program yang diampu.',
    durasi: 'Pekan pertama bergabung',
  },
]

const standar = [
  { ikon: ShieldCheck, teks: 'Latar pendidikan terverifikasi' },
  { ikon: ClipboardCheck, teks: 'Lulus uji kelayakan bacaan' },
  { ikon: GraduationCap, teks: 'Pembinaan metode berkala' },
]

export default function Guru() {
  const [statistik, setStatistik] = useState(null)

  useEffect(() => {
    Promise.all([api('/programs', { auth: false }).catch(() => []), ambilGuru()]).then(
      ([programs, gurus]) => {
        const daftar = Array.isArray(programs) ? programs : []
        setStatistik({
          program: daftar.length,
          kategori: new Set(daftar.map((p) => p.kategori).filter(Boolean)).size,
          guru: gurus.length,
        })
      }
    )
  }, [])

  const naik = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.55, ease: 'easeOut' },
  }

  return (
    <>
      <Header />
      <main className="tutor-page">
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
              <ul className="tutor-hero-standar">
                {standar.map((s) => (
                  <li key={s.teks}>
                    <s.ikon size={15} strokeWidth={2} aria-hidden="true" />
                    {s.teks}
                  </li>
                ))}
              </ul>
            </motion.div>
            {statistik && (
              <motion.div
                className="tutor-hero-panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
              >
                <div className="tutor-hero-stat">
                  <span className="tutor-hero-stat-ikon"><Users size={17} strokeWidth={2} /></span>
                  <strong>{statistik.guru}</strong>
                  <span>Guru aktif mendampingi Teman Hifz</span>
                </div>
                <div className="tutor-hero-stat">
                  <span className="tutor-hero-stat-ikon"><GraduationCap size={17} strokeWidth={2} /></span>
                  <strong>{statistik.program}</strong>
                  <span>Program berjalan yang diampu</span>
                </div>
                <div className="tutor-hero-stat">
                  <span className="tutor-hero-stat-ikon"><LayoutGrid size={17} strokeWidth={2} /></span>
                  <strong>{statistik.kategori}</strong>
                  <span>Bidang keilmuan yang diajarkan</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        <section className="tutor-nilai">
          <div className="container">
            <motion.div className="tutor-sec-head" {...naik}>
              <span className="tutor-eyebrow">Mengapa mengajar di Hifz</span>
              <h2>Fokus membimbing, sisanya kami siapkan</h2>
              <p>
                Empat hal yang membuat para pengajar betah bertumbuh bersama Hifz, dari kepastian
                honor hingga pembinaan keilmuan.
              </p>
            </motion.div>
            <div className="tutor-nilai-grid">
              {keunggulan.map((k, i) => (
                <motion.div
                  className="tutor-nilai-card"
                  key={k.judul}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                >
                  <span className="tutor-nilai-ikon"><k.ikon size={19} strokeWidth={2} /></span>
                  <strong>{k.judul}</strong>
                  <p>{k.teks}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="tutor-seleksi" id="tutor-seleksi">
          <div className="container">
            <motion.div className="tutor-sec-head" {...naik}>
              <span className="tutor-eyebrow">Proses seleksi</span>
              <h2>Tiga tahap menjadi guru Hifz</h2>
              <p>
                Prosesnya jelas dan transparan dari awal. Sebagian besar pelamar menyelesaikan
                seluruh tahapan dalam dua pekan.
              </p>
            </motion.div>
            <ol className="tutor-seleksi-grid">
              {seleksi.map((s, i) => (
                <motion.li
                  key={s.judul}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                >
                  <div className="tutor-seleksi-top">
                    <span className="tutor-seleksi-ikon"><s.ikon size={18} strokeWidth={2} /></span>
                    <span className="tutor-seleksi-tahap">{s.tahap}</span>
                  </div>
                  <strong>{s.judul}</strong>
                  <p>{s.teks}</p>
                  <span className="tutor-seleksi-durasi">
                    <CalendarClock size={13} strokeWidth={2} aria-hidden="true" />
                    {s.durasi}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <section className="tutor-daftar">
          <div className="container">
            <motion.div className="tutor-daftar-box" {...naik}>
              <span className="tutor-eyebrow">Bergabung sekarang</span>
              <h3>Siap mendampingi Teman Hifz dari seluruh Indonesia?</h3>
              <p>
                Daftarkan diri Anda sekarang, ikuti proses seleksinya, dan jadilah bagian dari tim
                guru kami.
              </p>
              <Link className="btn tutor-btn-gold" to="/daftar-guru">
                Daftar sebagai guru
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
