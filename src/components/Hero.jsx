import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const urut = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const naik = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const pop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 20 } },
};

const melayang = {
  y: [0, -8, 0],
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
};

const fotoGuru = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ahmad&top=turban&facialHairProbability=100&facialHair=beardMedium&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=fatimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ridwan&top=turban&facialHairProbability=100&facialHair=beardLight&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=halimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
];

export default function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const pudar = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const turun = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section className="hero" id="beranda" ref={heroRef}>
      <motion.div className="hero-inner" style={{ opacity: pudar, y: turun }}>
        <motion.div className="hero-copy" variants={urut} initial="hidden" animate="show">
          <motion.h1 className="hero-title" variants={naik}>Perdalam Ilmu Agama Bersama Hifz</motion.h1>
          <motion.p className="hero-sub" variants={naik}>
            Ayo bergabung bersama kami untuk pengalaman belajar yang menyenangkan.
          </motion.p>
          <motion.a className="hero-cta" href="/#program" variants={naik}>
            Jelajahi program
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </motion.a>
          <motion.div className="hero-guru" variants={naik}>
            <motion.div className="hero-guru-foto" aria-hidden="true" variants={urut}>
              {fotoGuru.map((f) => (
                <motion.img key={f} src={f} alt="" loading="lazy" variants={pop} />
              ))}
            </motion.div>
            <div className="hero-guru-teks">
              <strong>Belajar Bersama Guru Hifz</strong>
              <span>Asatidz pilihan dengan pengalaman lebih 5 tahun</span>
            </div>
          </motion.div>
        </motion.div>
        <div className="hero-visual" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 3 }}
            style={{ transformOrigin: 'bottom right' }}
          >
          <motion.div className="hero-bubble" animate={melayang}>
            <span className="hero-bubble-salam">Assalamu&rsquo;alaikum, Teman Hifz!</span>
            <span className="hero-bubble-sapa">
              Semoga harimu penuh berkah. Yuk lanjutkan perjalanan ilmumu hari ini, dari
              Qur&rsquo;an, bahasa Arab, hingga kajian Islam bersama guru pilihan.
            </span>
            <span className="hero-bubble-dots" aria-hidden="true"><i /><i /><i /></span>
          </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.6 }}
            style={{ display: 'contents' }}
          >
            <motion.img
              className="hero-bubble-guru"
              src={fotoGuru[1]}
              alt=""
              loading="lazy"
              animate={{ y: [0, -6, 0], transition: { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
