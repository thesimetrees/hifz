import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ChevronRight, GraduationCap, Info, LayoutDashboard, LogIn, MessageCircle, Newspaper, ShoppingBag, UsersRound } from 'lucide-react'
import { bacaKeranjang, bacaPesanan, formatRupiah } from '../pages/toko/tokoData.js'

const links = [
  { label: 'Program', href: '/program', icon: GraduationCap, desc: 'Kelas Qur\u2019an, bahasa Arab & kajian' },
  { label: 'Guru', href: '/guru', icon: UsersRound, desc: 'Bergabung menjadi pengajar Hifz' },
  { label: 'Toko', href: '/toko', icon: ShoppingBag, desc: 'Buku, mushaf & perlengkapan belajar' },
  { label: 'Corner', href: '/corner/berita', icon: Newspaper, desc: 'Berita, artikel & perpustakaan' },
  { label: 'Tentang', href: '/tentang', icon: Info, desc: 'Kenali Hifz lebih dekat' },
]

const navMenus = {}

export default function Header({ solid = false }) {
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [openSub, setOpenSub] = useState(null)
  const [logoError, setLogoError] = useState(false)
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [openPop, setOpenPop] = useState(null)
  const navRef = useRef(null)
  const popRef = useRef(null)
  const dropTimer = useRef(null)
  // Semua halaman mulai transparan; glass hanya saat scroll / menu terbuka (atau dipaksa solid)
  const headerStyleState = solid || scrolled || openMenu

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const bukaDrop = (label) => {
    clearTimeout(dropTimer.current)
    if (openMenu !== label) setOpenSub(null)
    setOpenMenu(label)
  }

  const tundaTutupDrop = () => {
    clearTimeout(dropTimer.current)
    dropTimer.current = setTimeout(() => {
      setOpenMenu(null)
      setOpenSub(null)
    }, 180)
  }

  const tutupDrop = () => {
    clearTimeout(dropTimer.current)
    setOpenMenu(null)
    setOpenSub(null)
  }

  useEffect(() => () => clearTimeout(dropTimer.current), [])

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('hifzUser') || 'null'))
    } catch {
      setUser(null)
    }
  }, [])

  const dashboardHref =
    user?.peran === 'admin' ? '/admin' : user?.peran === 'tutor' ? '/guru/dashboard' : '/dashboard'

  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null)
        setOpenSub(null)
      }
      if (popRef.current && !popRef.current.contains(e.target)) {
        setOpenPop(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const barisKeranjang = user ? bacaKeranjang() : []
  const totalItem = barisKeranjang.reduce((t, i) => t + i.jumlah, 0)
  const subtotalKeranjang = barisKeranjang.reduce((t, i) => t + i.harga * i.jumlah, 0)
  const daftarPesanan = user ? bacaPesanan() : []
  const notifMenunggu = daftarPesanan.filter((p) => p.status === 'Menunggu').length

  return (
    <motion.header
      className={`header ${headerStyleState ? 'scrolled' : ''} ${openMenu ? 'menu-open' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="header-promo">
        <div className="container header-promo-inner">
          <span className="header-promo-teks">Temukan kelas terbaik untuk perjalanan belajarmu, promo spesial untuk pendaftar baru.</span>
          <Link className="header-promo-cta" to="/program">Jelajahi program</Link>
        </div>
      </div>
      <div className="header-shell">
        <div className="container header-inner">
          <a className="brand" href="/">
            {!logoError && (
              <img
                className="brand-logo"
                src="/logo/logo-mark.png"
                alt="Hifz"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="brand-name">Hifz</span>
          </a>

          <nav className="nav" aria-label="Navigasi utama" ref={navRef}>
            {links.map((l) =>
              navMenus[l.label] ? (
                <div
                  className="nav-drop"
                  key={l.href}
                  onMouseEnter={() => bukaDrop(l.label)}
                  onMouseLeave={tundaTutupDrop}
                >
                  <button
                    type="button"
                    className="nav-drop-trigger"
                    aria-expanded={openMenu === l.label}
                    onClick={() => (openMenu === l.label ? tutupDrop() : bukaDrop(l.label))}
                  >
                    {l.label}
                    <svg className="chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openMenu === l.label && (
                    <div
                      className="acad-menu"
                      onMouseEnter={() => bukaDrop(l.label)}
                      onMouseLeave={tundaTutupDrop}
                    >
                      <div className="container acad-grid">
                        {navMenus[l.label].map((item) =>
                        item.sub ? (
                          <div
                            key={item.title}
                            className={`acad-item acad-item-sub ${openSub === item.title ? 'is-open' : ''}`}
                          >
                            <button
                              type="button"
                              className="acad-sub-head"
                              aria-expanded={openSub === item.title}
                              onClick={() => setOpenSub(openSub === item.title ? null : item.title)}
                            >
                              <span className="acad-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  {item.icon}
                                </svg>
                              </span>
                              <span className="acad-body">
                                <span className="acad-title">
                                  {item.title}
                                  <svg className="acad-sub-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" />
                                  </svg>
                                </span>
                                {item.desc && <span className="acad-desc">{item.desc}</span>}
                              </span>
                            </button>
                            {openSub === item.title && (
                              <div className="acad-sublist">
                                {item.sub.map((s, i) => (
                                  <Link
                                    key={s.label}
                                    className="acad-sub-link"
                                    to={s.href}
                                    onClick={tutupDrop}
                                  >
                                    <span className="acad-num">{String(i + 1).padStart(2, '0')}.</span>
                                    {s.label}
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M5 12h14M13 6l6 6-6 6" />
                                    </svg>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : !item.href.startsWith('/#') ? (
                          <Link
                            key={item.title}
                            className="acad-item"
                            to={item.href}
                            onClick={tutupDrop}
                          >
                            <span className="acad-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {item.icon}
                              </svg>
                            </span>
                            <span className="acad-body">
                              <span className="acad-title">
                                {item.title}
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                              </span>
                              {item.desc && <span className="acad-desc">{item.desc}</span>}
                            </span>
                          </Link>
                        ) : (
                          <a
                            key={item.title}
                            className="acad-item"
                            href={item.href}
                            onClick={tutupDrop}
                          >
                            <span className="acad-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {item.icon}
                              </svg>
                            </span>
                            <span className="acad-body">
                              <span className="acad-title">
                                {item.title}
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                              </span>
                              {item.desc && <span className="acad-desc">{item.desc}</span>}
                            </span>
                          </a>
                        )
                      )}
                      </div>
                    </div>
                  )}
                </div>
              ) : l.href.startsWith('/#') ? (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} to={l.href}>
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="header-pop-area" ref={popRef}>
                <div className="header-pop-wrap">
                  <button
                    type="button"
                    className="header-cart"
                    aria-label="Notifikasi"
                    aria-expanded={openPop === 'notif'}
                    onClick={() => setOpenPop((v) => (v === 'notif' ? null : 'notif'))}
                  >
                    <Bell size={21} strokeWidth={2} />
                    {notifMenunggu > 0 && <span className="header-cart-badge">{notifMenunggu}</span>}
                  </button>
                  <AnimatePresence>
                    {openPop === 'notif' && (
                      <motion.div
                        className="header-pop"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                      >
                        <div className="header-pop-head">Notifikasi</div>
                        {daftarPesanan.length === 0 ? (
                          <p className="header-pop-kosong">Belum ada notifikasi baru.</p>
                        ) : (
                          <div className="header-pop-list">
                            {daftarPesanan.slice(0, 5).map((p) => (
                              <div className="header-pop-item" key={p.invoice}>
                                <span className="header-pop-ikon">
                                  <Bell size={16} strokeWidth={2} />
                                </span>
                                <span className="header-pop-body">
                                  <strong>Pesanan {p.invoice}</strong>
                                  <span>
                                    {p.status === 'Menunggu' ? 'Menunggu pembayaran' : p.status}
                                    {p.tanggal ? ` \u00b7 ${p.tanggal}` : ''}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="header-pop-foot">
                          <span className="header-pop-sub">
                            <span>Semua aktivitas</span>
                            <strong>{daftarPesanan.length} pesanan</strong>
                          </span>
                          <Link className="header-pop-btn" to={dashboardHref} onClick={() => setOpenPop(null)}>
                            Buka dashboard
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="header-pop-wrap">
                  <button
                    type="button"
                    className="header-cart"
                    aria-label="Keranjang"
                    aria-expanded={openPop === 'cart'}
                    onClick={() => setOpenPop((v) => (v === 'cart' ? null : 'cart'))}
                  >
                    <ShoppingBag size={21} strokeWidth={2} />
                    {totalItem > 0 && <span className="header-cart-badge">{totalItem}</span>}
                  </button>
                  <AnimatePresence>
                    {openPop === 'cart' && (
                      <motion.div
                        className="header-pop"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                      >
                        <div className="header-pop-head">Keranjang</div>
                        {barisKeranjang.length === 0 ? (
                          <p className="header-pop-kosong">Keranjangmu masih kosong.</p>
                        ) : (
                          <div className="header-pop-list">
                            {barisKeranjang.slice(0, 4).map((i) => (
                              <Link
                                className="header-pop-item"
                                key={i.id}
                                to={`/toko/${i.id}`}
                                onClick={() => setOpenPop(null)}
                              >
                                {i.gambar && <img src={i.gambar} alt={i.nama} loading="lazy" />}
                                <span className="header-pop-body">
                                  <strong>{i.nama}</strong>
                                  <span>
                                    {i.jumlah} &times; {formatRupiah(i.harga)}
                                  </span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                        <div className="header-pop-foot">
                          <span className="header-pop-sub">
                            <span>Subtotal</span>
                            <strong>{formatRupiah(subtotalKeranjang)}</strong>
                          </span>
                          <Link className="header-pop-btn" to="/keranjang" onClick={() => setOpenPop(null)}>
                            Lihat keranjang
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link className="link-daftar" to={dashboardHref}>Dashboard</Link>
              </div>
            ) : (
              <>
                <Link className="link-masuk" to="/masuk">Masuk</Link>
                <Link className="link-daftar" to="/daftar">Daftar</Link>
              </>
            )}
            <button
              className={`menu-toggle ${open ? 'is-open' : ''}`}
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="mt-bar" aria-hidden="true" />
              <span className="mt-bar" aria-hidden="true" />
              <span className="mt-bar" aria-hidden="true" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              className="mobile-nav open"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span className="mnav-label">Jelajahi Hifz</span>
              <div className="mnav-links">
                {links.map((l) => {
                  const Ikon = l.icon
                  return (
                    <Link key={l.href} className="mnav-item" to={l.href} onClick={() => setOpen(false)}>
                      <span className="mnav-ic"><Ikon size={19} strokeWidth={1.9} /></span>
                      <span className="mnav-teks">
                        <strong>{l.label}</strong>
                        <small>{l.desc}</small>
                      </span>
                      <ChevronRight size={16} strokeWidth={2} className="mnav-chev" />
                    </Link>
                  )
                })}
              </div>
              <div className="mobile-nav-cta">
                <a className="link-konsultasi" href="/#konsultasi" onClick={() => setOpen(false)}>
                  <MessageCircle size={16} strokeWidth={2.2} />
                  Konsultasi
                </a>
                <Link
                  className="link-masuk mnav-masuk"
                  to={user ? dashboardHref : '/masuk'}
                  onClick={() => setOpen(false)}
                >
                  {user ? <LayoutDashboard size={16} strokeWidth={2.2} /> : <LogIn size={16} strokeWidth={2.2} />}
                  {user ? 'Dashboard' : 'Masuk'}
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
