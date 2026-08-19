import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, simpanToken } from '../lib/api.js'
import AuthLayout from './AuthLayout.jsx'

export default function Daftar() {
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)
  const navigate = useNavigate()
  const { state } = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    setGalat('')
    setProses(true)
    try {
      const { accessToken, user } = await api('/auth/register', {
        method: 'POST',
        body: {
          nama: form.name.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
        },
        auth: false,
      })
      simpanToken(accessToken)
      localStorage.setItem('hifzUser', JSON.stringify({ nama: user.nama, email: user.email, peran: user.peran, hp: form.hp.value.trim() }))
      navigate(state?.dari ?? '/dashboard')
    } catch (err) {
      setGalat(err.message)
    } finally {
      setProses(false)
    }
  }

  return (
    <AuthLayout
      title="Buat akun baru"
      subtitle="Gratis dan hanya butuh beberapa menit."
      footer={
        <>
          Sudah punya akun? <Link to="/masuk">Masuk di sini</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {galat && <p className="auth-galat" role="alert">{galat}</p>}
        <label className="auth-field">
          <span>Nama lengkap</span>
          <input type="text" name="name" placeholder="Nama lengkapmu" autoComplete="name" required />
        </label>
        <label className="auth-field">
          <span>Email</span>
          <input type="email" name="email" placeholder="nama@email.com" autoComplete="email" required />
        </label>
        <label className="auth-field">
          <span>Nomor HP</span>
          <input
            type="tel"
            name="hp"
            placeholder="08xxxxxxxxxx"
            autoComplete="tel"
            inputMode="tel"
            pattern="^(\+62|62|0)8[0-9]{7,12}$"
            title="Gunakan format 08xx, 628xx, atau +628xx"
            required
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="auth-check auth-agree">
          <input type="checkbox" name="agree" required />
          <span>
            Saya menyetujui <a href="#syarat">Syarat &amp; Ketentuan</a> dan{' '}
            <a href="#privasi">Kebijakan Privasi</a> Hifz.
          </span>
        </label>
        <button className="btn auth-submit" type="submit" disabled={proses}>{proses ? 'Memproses…' : 'Daftar'}</button>
        <div className="auth-sep"><span>atau</span></div>
        <button
          type="button"
          className="auth-google"
          onClick={() => setGalat('Daftar dengan Google segera tersedia.')}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Daftar dengan Google
        </button>
      </form>
    </AuthLayout>
  )
}
