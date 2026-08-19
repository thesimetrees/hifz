import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ProgramBerandaSection from './components/ProgramBerandaSection.jsx'
import PengajarSection from './components/PengajarSection.jsx'
import KurikulumSection from './components/KurikulumSection.jsx'
import JenisProgramSection from './components/JenisProgramSection.jsx'
import DuniaSection from './components/DuniaSection.jsx'
import BeritaSection from './components/BeritaSection.jsx'
import Footer from './components/Footer.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import Masuk from './pages/Masuk.jsx'
import Daftar from './pages/Daftar.jsx'
import LupaPassword from './pages/LupaPassword.jsx'
import ProgramDetail from './pages/program/ProgramDetail.jsx'
import ProgramKatalog from './pages/program/ProgramKatalog.jsx'
import CheckoutProgram from './pages/program/CheckoutProgram.jsx'
import Guru from './pages/Guru.jsx'
import DaftarGuru from './pages/DaftarGuru.jsx'
import Toko from './pages/toko/Toko.jsx'
import ProdukDetail from './pages/toko/ProdukDetail.jsx'
import Keranjang from './pages/toko/Keranjang.jsx'
import Checkout from './pages/toko/Checkout.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import GuruDashboard from './pages/guru/GuruDashboard.jsx'
import AdminDashboard from './pages/admin/Admin.jsx'
import Berita from './pages/corner/Berita.jsx'
import BeritaDetail from './pages/corner/BeritaDetail.jsx'
import Perpustakaan from './pages/corner/Perpustakaan.jsx'
import Pembelajaran from './pages/corner/Pembelajaran.jsx'
import HalamanSegera from './pages/HalamanSegera.jsx'
import Tentang from './pages/Tentang.jsx'

function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DuniaSection />
        <ProgramBerandaSection />
        <PengajarSection />
        <KurikulumSection />
        <JenisProgramSection />
        <BeritaSection />
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}

// Reveal ringan untuk section halaman yang belum punya animasi framer sendiri
const TANPA_REVEAL = ['/', '/tentang', '/admin', '/admin/dashboard', '/dashboard', '/guru/dashboard']

function RevealSeksi() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (TANPA_REVEAL.includes(pathname)) return
    const seksi = [...document.querySelectorAll('main section')].filter(
      (s) => !s.parentElement.closest('section'),
    )
    if (seksi.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('sec-tampil')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    seksi.forEach((s) => {
      s.classList.add('sec-anim')
      io.observe(s)
    })
    return () => {
      io.disconnect()
      seksi.forEach((s) => s.classList.remove('sec-anim', 'sec-tampil'))
    }
  }, [pathname])

  return null
}

// Arahkan /dashboard sesuai peran pengguna
function DashboardPeran() {
  let peran = ''
  try {
    peran = JSON.parse(localStorage.getItem('hifzUser') || '{}')?.peran || ''
  } catch {
    peran = ''
  }
  if (peran === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (peran === 'tutor') return <Navigate to="/guru/dashboard" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <RevealSeksi />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/program" element={<ProgramKatalog />} />
        <Route path="/program/:programId" element={<ProgramDetail />} />
        <Route path="/program/:programId/checkout" element={<CheckoutProgram />} />
        <Route path="/guru" element={<Guru />} />
        <Route path="/daftar-guru" element={<DaftarGuru />} />
        <Route path="/asesmen" element={<HalamanSegera jenis="asesmen" />} />
        <Route path="/komunitas" element={<HalamanSegera jenis="komunitas" />} />
        <Route path="/corner/berita" element={<Berita />} />
        <Route path="/corner/berita/:slug" element={<BeritaDetail />} />
        <Route path="/corner/perpustakaan" element={<Perpustakaan />} />
        <Route path="/corner/pembelajaran" element={<Pembelajaran />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="/toko" element={<Toko />} />
        <Route path="/toko/:produkId" element={<ProdukDetail />} />
        <Route path="/keranjang" element={<Keranjang />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<DashboardPeran />} />
        <Route path="/guru/dashboard" element={<GuruDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
