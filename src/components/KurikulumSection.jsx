import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function KurikulumSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const videoY = useTransform(scrollYProgress, [0, 1], [46, -46])

  return (
    <section className="kurikulum-home" id="kurikulum" ref={ref}>
      <div className="container">
        <div className="kurikulum-home-grid">
          <motion.div
            className="kurikulum-home-copy"
            initial={{ opacity: 0, x: -56 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          >
            <h2>Mengapa Hifz?</h2>
            <p>
              Suasana belajar Al-Qur&rsquo;an yang hangat, menyenangkan, dan penuh cinta.
              Lihat sendiri bagaimana kami membersamai setiap Teman Hifz.
            </p>
          </motion.div>
          <motion.div style={{ y: videoY }}>
            <motion.div
              className="kurikulum-home-video"
              initial={{ opacity: 0, x: 64, rotate: 2.5, scale: 0.94 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ type: 'spring', stiffness: 80, damping: 17, delay: 0.1 }}
            >
              <iframe
                src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
                title="Kurikulum Hifz"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
