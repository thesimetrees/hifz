import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import GuruCarousel from './GuruCarousel.jsx'
import { ambilGuru } from '../lib/guru.js'

export default function PengajarSection() {
  const [pengajar, setPengajar] = useState([])

  useEffect(() => {
    ambilGuru().then(setPengajar)
  }, [])

  if (pengajar.length === 0) return null

  return (
    <section className="pengajar-home" id="pengajar">
      <div className="container">
        <motion.div
          className="phc-headrow"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="phc-headcopy">
            <h2 className="psec-title">Belajar Nyaman Bersama Guru Pilihan</h2>
            <p className="bnc-sub">
              Guru bersanad yang profesional dan sabar membimbing, siap menemani setiap
              tahap belajarmu.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
        >
          <GuruCarousel pengajar={pengajar} />
        </motion.div>
      </div>
    </section>
  )
}
