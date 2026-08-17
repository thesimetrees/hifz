import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Mail, MessageCircle } from 'lucide-react'

const socials = [
  { name: 'Instagram', href: 'https://instagram.com', img: '/social/instagram.svg' },
  { name: 'YouTube', href: 'https://youtube.com', img: '/social/youtube.svg' },
  { name: 'TikTok', href: 'https://tiktok.com', img: '/social/tiktok.svg' },
  { name: 'LinkedIn', href: 'https://linkedin.com', img: '/social/linkedin.svg' },
  { name: 'WhatsApp', href: 'https://wa.me/6285210447200', img: '/social/whatsapp.svg' },
  { name: 'Telegram', href: 'https://t.me', img: '/social/telegram.svg' },
]

const columns = [
  {
    title: 'Program',
    links: [
      { label: 'Katalog program', href: '/program' },
      { label: 'Asesmen penempatan', href: '/asesmen' },
      { label: 'Komunitas', href: '/komunitas' },
      { label: 'Daftar akun', href: '/daftar' },
      { label: 'Masuk', href: '/masuk' },
    ],
  },
  {
    title: 'Jelajahi',
    links: [
      { label: 'Guru Hifz', href: '/guru' },
      { label: 'Daftar menjadi guru', href: '/daftar-guru' },
      { label: 'Toko', href: '/toko' },
      { label: 'Keranjang', href: '/keranjang' },
    ],
  },
  {
    title: 'Hifz Corner',
    links: [
      { label: 'Berita & artikel', href: '/corner/berita' },
      { label: 'Perpustakaan', href: '/corner/perpustakaan' },
      { label: 'Pembelajaran lainnya', href: '/corner/pembelajaran' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-isi">
        <div className="footer-hero">
          <h2>
            Belajar Qur&rsquo;an itu hangat, menyenangkan, dan penuh cinta.
          </h2>
          <Link className="footer-hero-cta" to="/program">
            Mulai belajar
            <ArrowUpRight size={18} strokeWidth={2.2} />
          </Link>
        </div>

        <div className="footer-grid">
          <div className="footer-about">
            <img className="brand-logo footer-logo" src="/logo/logo-mark.png" alt="Hifz" />
            <p>
              Ekosistem belajar Islam modern bersama guru bersanad dan
              terstandarisasi untuk Teman Hifz di seluruh Indonesia.
            </p>
          </div>

          {columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/#') ? (
                      <a href={l.href}>{l.label}</a>
                    ) : (
                      <Link to={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-kontak">
          <ul className="footer-contact">
            <li>
              <span className="fc-ic"><MapPin size={15} /></span>
              <div>
                <span className="contact-label">Kantor</span>
                PT Hifz Muslim Madani<br />
                Jl. Kebaikan No. 17, Jakarta Selatan, Indonesia
              </div>
            </li>
            <li>
              <span className="fc-ic"><Mail size={15} /></span>
              <div>
                <span className="contact-label">Email</span>
                <a href="mailto:halo@hifz.id">halo@hifz.id</a>
              </div>
            </li>
            <li>
              <span className="fc-ic"><MessageCircle size={15} /></span>
              <div>
                <span className="contact-label">WhatsApp</span>
                <a href="https://wa.me/6285210447200" target="_blank" rel="noopener noreferrer">+62 852-1044-7200</a>
              </div>
            </li>
          </ul>
          <div className="footer-social">
            {socials.map((s) => (
              <a
                key={s.name}
                className="social-btn"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
              >
                <img src={s.img} alt="" loading="lazy" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} PT Hifz Muslim Madani. Hak cipta dilindungi.</p>
          <div className="links">
            <a href="/#kebijakan-privasi">Kebijakan Privasi</a>
            <a href="/#syarat-ketentuan">Syarat &amp; Ketentuan</a>
            <a href="/#kebijakan-cookie">Kebijakan Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
