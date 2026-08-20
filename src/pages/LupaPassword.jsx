import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import AuthLayout from './AuthLayout.jsx'

export default function LupaPassword() {
  const [sent, setSent] = useState(false)
  const [galat, setGalat] = useState('')
  const [proses, setProses] = useState(false)
  // mode pemulihan: user datang dari link email reset
  const [recovery, setRecovery] = useState(false)
  const [selesai, setSelesai] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setRecovery(true)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const kirimTautan = async (e) => {
    e.preventDefault()
    const email = e.currentTarget.email.value.trim()
    setGalat('')
    setProses(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/lupa-password`,
    })
    setProses(false)
    if (error) return setGalat(error.message)
    setSent(true)
  }

  const simpanPasswordBaru = async (e) => {
    e.preventDefault()
    const password = e.currentTarget.password.value
    if (password.length < 6) return setGalat('Password minimal 6 karakter')
    setGalat('')
    setProses(true)
    const { error } = await supabase.auth.updateUser({ password })
    setProses(false)
    if (error) return setGalat(error.message)
    setSelesai(true)
    setTimeout(() => navigate('/masuk'), 2000)
  }

  if (recovery) {
    return (
      <AuthLayout
        title="Atur password baru"
        subtitle="Masukkan password baru untuk akunmu."
        footer={
          <>
            Ingat passwordmu? <Link to="/masuk">Kembali ke halaman masuk</Link>
          </>
        }
      >
        {selesai ? (
          <div className="auth-success" role="status">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 12.5l2.5 2.5 4.5-5" />
            </svg>
            <div>
              <b>Password diperbarui!</b>
              <p>Mengalihkan ke halaman masuk…</p>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={simpanPasswordBaru}>
            {galat && <p className="auth-galat" role="alert">{galat}</p>}
            <label className="auth-field">
              <span>Password baru</span>
              <input type="password" name="password" placeholder="Minimal 6 karakter" autoComplete="new-password" required />
            </label>
            <button className="btn auth-submit" type="submit" disabled={proses}>
              {proses ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </AuthLayout>
    )
  }

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
        <form className="auth-form" onSubmit={kirimTautan}>
          {galat && <p className="auth-galat" role="alert">{galat}</p>}
          <label className="auth-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="nama@email.com" autoComplete="email" required />
          </label>
          <button className="btn auth-submit" type="submit" disabled={proses}>
            {proses ? 'Mengirim…' : 'Kirim Tautan Reset'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
