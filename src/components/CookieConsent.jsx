import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'hifz-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const choose = (value) => {
    localStorage.setItem(STORAGE_KEY, value)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cookie-banner"
          role="dialog"
          aria-live="polite"
          aria-label="Persetujuan cookie"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cookie-inner">
            <div className="cookie-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.9 10.9c-1.1.4-2.4.2-3.3-.6-.4-.4-.7-.8-.9-1.3-.1-.3-.4-.5-.7-.5-1 .1-2-.3-2.7-1-.7-.7-1.1-1.7-1-2.7 0-.3-.2-.6-.5-.7-.5-.2-.9-.5-1.3-.9-.8-.9-1-2.2-.6-3.3.1-.3-.1-.6-.4-.7C10.2-.1 10-.1 9.8 0 4.4 1 .5 5.8.5 11.4c0 6.4 5.2 11.6 11.6 11.6 5.6 0 10.4-3.9 11.4-9.3.1-.2 0-.4-.1-.6-.2-.3-.5-.4-.8-.3zM8 16.5A1.5 1.5 0 118 13.5a1.5 1.5 0 010 3zm1-6A1.5 1.5 0 119 7.5a1.5 1.5 0 010 3zm5.5 7A1.5 1.5 0 1114.5 14.5a1.5 1.5 0 010 3z" />
            </svg>
            </div>
            <div className="cookie-text">
              <b>Kami menghargai privasi Anda</b>
              <p>
                Situs ini menyimpan cookie di perangkat Anda untuk mengumpulkan informasi
                tentang cara Anda berinteraksi dengan situs kami dan membantu kami
                mengingat Anda. Informasi ini kami gunakan untuk meningkatkan serta
                menyesuaikan pengalaman belajar Anda, juga untuk analitik pengunjung.
                Selengkapnya, baca{' '}
                <a href="#kebijakan-cookie">Kebijakan Cookie</a> kami.
              </p>
            </div>
            <div className="cookie-actions">
              <button className="btn cookie-decline" onClick={() => choose('declined')}>
                Tolak
              </button>
              <button className="btn cookie-accept" onClick={() => choose('accepted')}>
                Terima Semua
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
