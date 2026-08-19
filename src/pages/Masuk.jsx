import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, simpanToken } from '../lib/api.js'
import AuthLayout from './AuthLayout.jsx'

export default function Masuk() {
  const [show, setShow] = useState(false)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)
  const navigate = useNavigate()
  const { state } = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = e.currentTarget.email.value.trim()
    const password = e.currentTarget.password.value
    setGalat('')
    setProses(true)
    try {
      const { accessToken, user } = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      })
      simpanToken(accessToken)
      localStorage.setItem('hifzUser', JSON.stringify({ nama: user.nama, email: user.email, peran: user.peran }))
      if (user.peran === 'admin') navigate('/admin/dashboard')
      else if (user.peran === 'tutor') navigate('/guru/dashboard')
      else navigate(state?.dari ?? '/dashboard')
    } catch (err) {
      setGalat(err.message)
    } finally {
      setProses(false)
    }
  }

  return (
    <AuthLayout
      title="Masuk ke akunmu"
      subtitle="Lanjutkan perjalanan ilmumu bersama Hifz."
      footer={
        <>
          Belum punya akun? <Link to="/daftar">Daftar sekarang</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {galat && <p className="auth-galat" role="alert">{galat}</p>}
        <label className="auth-field">
          <span>Email</span>
          <input type="email" name="email" placeholder="nama@email.com" autoComplete="email" required />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <div className="auth-password">
            <input
              type={show ? 'text' : 'password'}
              name="password"
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShow((v) => !v)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {show ? (
                  <>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.9 17.9A10.6 10.6 0 0112 19.5c-6.5 0-10-7.5-10-7.5a17.9 17.9 0 014.1-5.4M9.9 4.7A10.4 10.4 0 0112 4.5c6.5 0 10 7.5 10 7.5a17.8 17.8 0 01-2.2 3.2" />
                    <path d="M3 3l18 18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </label>
        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" name="remember" />
            <span>Ingat saya</span>
          </label>
          <Link to="/lupa-password" className="auth-link">Lupa password?</Link>
        </div>
        <button className="btn auth-submit" type="submit" disabled={proses}>{proses ? 'Memproses…' : 'Masuk'}</button>
        <div className="auth-sep"><span>atau</span></div>
        <button
          type="button"
          className="auth-google"
          onClick={() => setGalat('Masuk dengan Google segera tersedia.')}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Masuk dengan Google
        </button>
      </form>
    </AuthLayout>
  )
}
