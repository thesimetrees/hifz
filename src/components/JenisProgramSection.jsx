import { Link } from 'react-router-dom'
import { CalendarDays, Timer, Rocket, UserRound, ArrowRight, BadgeCheck } from 'lucide-react'
import { motion } from 'framer-motion'

const wadah = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
}

const kartuNaik = {
  hidden: { opacity: 0, y: 64, rotateX: 10, scale: 0.93 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 16 },
  },
}

const jenis = [
  {
    ikon: CalendarDays,
    label: 'Daily Class',
    narasi: 'Belajar setiap hari secara singkat namun konsisten, dengan progres yang mudah dipantau dari waktu ke waktu.',
    poin: [
      '30-90 menit per hari',
      'Laporan harian, perkembangan terlihat setiap saat',
      'Ditemani pengajar secara langsung, bukan belajar mandiri',
    ],
  },
  {
    ikon: Timer,
    label: 'Short Course',
    narasi: 'Program singkat dengan fokus pada satu tema tertentu, dirancang agar pemahaman lebih menyeluruh dalam waktu yang efisien.',
    poin: [
      '2-4 minggu fokus satu tema',
      'Materi tersusun rapi dari dasar hingga tuntas',
      'Evaluasi di akhir program untuk memastikan pemahaman',
    ],
  },
  {
    ikon: Rocket,
    label: 'Bootcamp',
    narasi: 'Program paling intensif, dirancang bagi Anda yang menargetkan capaian besar dan ingin pendampingan lebih personal.',
    poin: [
      '3-6 bulan dengan kurikulum berjenjang',
      'Sesi konsultasi one-on-one bersama pengajar',
      'Sertifikat kelulusan di akhir program',
    ],
  },
  {
    ikon: UserRound,
    label: 'Private',
    narasi: 'Pendampingan personal bersama pengajar yang berfokus penuh pada Anda, dengan jadwal fleksibel dan materi yang disesuaikan dengan kebutuhan.',
    poin: [
      'Sesi personal bersama pengajar pilihan',
      'Jadwal fleksibel menyesuaikan waktu Anda',
      'Materi dirancang khusus sesuai target pribadi',
    ],
  },
]

export default function JenisProgramSection() {
  return (
    <section className="jp" id="jenis-program">
      <div className="container">
        <motion.div
          className="jp-head"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        >
          <h2>Satu Tujuan, Empat Jalan Belajar</h2>
          <p>
            Pilih jalur yang paling pas dengan kesibukan dan targetmu, semuanya tetap
            dibersamai guru pilihan Hifz.
          </p>
        </motion.div>

        <motion.div
          className="jp-grid"
          style={{ perspective: 900 }}
          variants={wadah}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {jenis.map(({ ikon: Ikon, label, narasi, poin }) => (
            <motion.article key={label} className="jp-kartu" variants={kartuNaik}>
              <header className="jp-atas">
                <div className="jp-baris">
                  <span className="jp-ikon"><Ikon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
                  <h3>{label}</h3>
                </div>
                <p>{narasi}</p>
              </header>
              <ul>
                {poin.map((p) => (
                  <li key={p}><BadgeCheck size={15} strokeWidth={2.1} aria-hidden="true" /> {p}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="jp-aksi"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ type: 'spring', stiffness: 130, damping: 15, delay: 0.35 }}
        >
          <Link className="jp-cta" to="/program">
            Jelajahi semua program <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
