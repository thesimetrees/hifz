import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'

const WA_URL =
  'https://wa.me/6285210447200?text=Assalamu%27alaikum%2C%20saya%20ingin%20bertanya%20tentang%20program%20Hifz%27'

export default function FloatingChat() {
  const [tutup, setTutup] = useState({ promo: false, chat: false })
  const { pathname } = useLocation()

  const diDashboard =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/guru/dashboard'
  if (diDashboard) return null

  if (tutup.promo && tutup.chat) return null

  return (
    <div className="floating-stack">
      {!tutup.promo && (
        <div className="floating-item floating-item--promo">
          <button
            type="button"
            className="floating-tutup"
            aria-label="Tutup promo"
            onClick={() => setTutup((t) => ({ ...t, promo: true }))}
          >
            <X size={12} strokeWidth={2.6} aria-hidden="true" />
          </button>
          <a href="/#program" aria-label="Lihat promo dan diskon">
            <img src="/Icon/color%20pop%20(6).png" alt="Promo dan diskon Hifz" loading="lazy" />
          </a>
        </div>
      )}
      {!tutup.chat && (
        <div className="floating-item floating-item--chat">
          <button
            type="button"
            className="floating-tutup"
            aria-label="Tutup chat"
            onClick={() => setTutup((t) => ({ ...t, chat: true }))}
          >
            <X size={12} strokeWidth={2.6} aria-hidden="true" />
          </button>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" aria-label="Chat admin Hifz via WhatsApp">
            <img src="/Icon/popup.png" alt="Halo Teman Hifz, ada yang bisa kami bantu?" loading="lazy" />
          </a>
        </div>
      )}
    </div>
  )
}
