import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import DuniaSection from '../components/DuniaSection.jsx'

const fotoGuru = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ahmad&top=turban&facialHairProbability=100&facialHair=beardMedium&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=fatimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ridwan&top=turban&facialHairProbability=100&facialHair=beardLight&accessoriesProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=halimah&top=hijab&accessoriesProbability=0&facialHairProbability=0&eyes=default&mouth=smile&eyebrows=defaultNatural',
]

const muncul = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

const rangkai = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
}

const popAvatar = {
  hidden: { opacity: 0, scale: 0.4, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 18 } },
}

export default function Tentang() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const petaWrapRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: petaWrapRef,
    offset: ['start end', 'center 60%'],
  })
  const halus = useSpring(scrollYProgress, { stiffness: 90, damping: 22 })
  const petaScale = useTransform(halus, [0, 1], [0.88, 1])
  const petaY = useTransform(halus, [0, 1], [70, 0])
  const petaOpacity = useTransform(halus, [0, 1], [0.25, 1])

  return (
    <>
      <Header />
      <main className="corner-page">
        <section className="pkat-hero" aria-hidden="true" />

        <section className="tt-intro">
          <div className="container tt-intro-grid">
            <motion.div variants={rangkai} initial="hidden" animate="show">
              <motion.span className="tt-label" variants={muncul}>
                Selamat datang di Hifz
              </motion.span>
              <p className="tt-intro-narasi">
                <motion.span style={{ display: 'block' }} variants={muncul}>
                  Assalamu&rsquo;alaikum, teman Hifz.
                </motion.span>
                <motion.span style={{ display: 'block' }} variants={muncul}>
                  <strong>Hifz</strong> hadir menjaga dan menguatkan iman umat Muslim di tengah
                  derasnya arus digital, memadukan nilai keislaman dan kemodernan lewat cara
                  belajar yang seru, terarah, dan terukur. Mari tumbuh bersama.
                </motion.span>
              </p>
            </motion.div>
          </div>
        </section>

        <section className="tt-guru">
          <div className="container">
            <motion.div
              className="tt-guru-band"
              variants={rangkai}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
            >
              <motion.span className="tt-guru-avatars" variants={rangkai}>
                {fotoGuru.map((f) => (
                  <motion.img key={f} src={f} alt="" loading="lazy" variants={popAvatar} />
                ))}
              </motion.span>
              <motion.div className="tt-guru-teks" variants={muncul}>
                <strong>Belajar Bersama Guru Hifz</strong>
                <p>Asatidz pilihan dengan pengalaman lebih 5 tahun</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="tt-peta" ref={petaWrapRef}>
          <div className="container">
            <motion.div style={{ scale: petaScale, y: petaY, opacity: petaOpacity }}>
              <DuniaSection polos />
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
