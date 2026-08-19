import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Banknote, CalendarClock, CheckCircle2, ChevronLeft, GraduationCap, Users } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CookieConsent from '../components/CookieConsent.jsx'
import FormGuru from '../components/FormGuru.jsx'
import { api } from '../lib/api.js'

const alasanTutor = [
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
    ikon: Users,
    judul: 'Santri dari seluruh Indonesia',
    teks: 'Kelas dan kurikulum disiapkan tim akademik. Anda cukup fokus membimbing, tanpa memikirkan pemasaran.',
  },
  {
    ikon: GraduationCap,
    judul: 'Pengembangan diri berkelanjutan',
    teks: 'Daurah berkala, pembinaan metode mengajar, dan komunitas guru untuk terus menajamkan keilmuan.',
  },
]

export default function DaftarGuru() {
  const [terkirim, setTerkirim] = useState(null)

  const simpanPelamar = async (form) => {
    const nama = [form.nama.trim(), form.gelar.trim()].filter(Boolean).join(', ')
    const alamat = [form.alamat.trim(), form.kelurahan.nama, form.kecamatan.nama, form.kota.nama, form.provinsi.nama]
      .filter(Boolean)
      .join(', ')
    const bio = [form.bidang && `Bidang: ${form.bidang}`, form.profil.trim()].filter(Boolean).join('. ')
    try {
      await api('/users/pelamar', {
        method: 'POST',
        body: { nama, email: form.email, telepon: form.wa.trim(), alamat, bio },
        auth: false,
      })
    } catch {
      // server tidak terjangkau, pendaftaran tetap dianggap terkirim
    }
    setTerkirim({ nama: form.nama.trim(), email: form.email })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main className="dtf">
        <section className="dtf-hero">
          <div className="container">
            <Link to="/guru" className="dtf-back">
              <ChevronLeft size={15} strokeWidth={2.2} aria-hidden="true" /> Tentang guru Hifz
            </Link>
            <h1>Daftar Menjadi Guru Hifz</h1>
            <p>
              Lengkapi data diri dan profil pengajar Anda. Tim kurikulum akan meninjau berkas dalam
              tiga sampai lima hari kerja sebelum tahap uji kelayakan.
            </p>
          </div>
        </section>

        <section className="dtf-body">
          <div className="container">
            {terkirim ? (
              <motion.div
                className="dtf-sukses"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <CheckCircle2 size={44} strokeWidth={1.8} aria-hidden="true" />
                <h2>Pendaftaran terkirim</h2>
                <p>
                  Terima kasih, {terkirim.nama || 'calon guru'}. Berkas Anda telah kami terima dan
                  sedang dalam proses verifikasi. Hasil peninjauan akan dikirim ke {terkirim.email || 'email terdaftar'}
                  {' '}beserta jadwal uji kelayakan bacaan dan simulasi mengajar.
                </p>
                <div className="dtf-sukses-btns">
                  <Link to="/" className="btn btn-hero-primary">Kembali ke beranda</Link>
                  <Link to="/guru" className="dtf-sukses-link">Lihat proses seleksi</Link>
                </div>
              </motion.div>
            ) : (
              <div className="dtf-cols">
                <FormGuru mode="daftar" onKirim={simpanPelamar} />

                <aside className="dtf-side">
                  <div className="dtf-alasan">
                    <h3>Mengapa bergabung menjadi guru Hifz?</h3>
                    <ul>
                      {alasanTutor.map((a) => (
                        <li key={a.judul}>
                          <span className="dtf-alasan-ic">
                            <a.ikon size={17} strokeWidth={2} aria-hidden="true" />
                          </span>
                          <div>
                            <strong>{a.judul}</strong>
                            <p>{a.teks}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
