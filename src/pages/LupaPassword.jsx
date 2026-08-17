import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'

export default function LupaPassword() {
  const [sent, setSent] = useState(false)

  return (
    <AuthLayout
      title="Lupa password?"
      subtitle="Masukkan email akunmu, kami kirimkan tautan untuk mengatur ulang password."
      footer={
        <>
          Ingat passwordmu? <Link to="/masuk">Kembali ke halaman masuk</Link>
        </>
      }
    >
      {sent ? (
        <div className="auth-success" role="status">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12.5l2.5 2.5 4.5-5" />
          </svg>
          <div>
            <b>Tautan terkirim!</b>
            <p>
              Periksa kotak masuk emailmu (termasuk folder spam) dan ikuti
              petunjuk untuk mengatur ulang password.
            </p>
          </div>
        </div>
      ) : (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <label className="auth-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="nama@email.com" autoComplete="email" required />
          </label>
          <button className="btn auth-submit" type="submit">Kirim Tautan Reset</button>
        </form>
      )}
    </AuthLayout>
  )
}
