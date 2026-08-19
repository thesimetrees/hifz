import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-ambient auth-ambient-green" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-gold" aria-hidden="true" />

      <main className="auth-main">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Link to="/" className="auth-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Kembali ke beranda
          </Link>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          {footer && <p className="auth-alt">{footer}</p>}
        </motion.div>
      </main>
    </div>
  )
}
