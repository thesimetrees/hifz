import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Star } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatRupiah } from '../pages/toko/tokoData.js'

const fotoCadangan = ['/programs/tilawah.jpg', '/programs/deeper.jpg', '/programs/arabic.jpg', '/programs/turats.jpg']
const nilai = [4.8, 4.7, 4.9, 4.6]

export default function TrendingSection() {
  const [programs, setPrograms] = useState([])
  const railRef = useRef(null)

  useEffect(() => {
    api('/programs', { auth: false })
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]))
  }, [])

  if (!programs.length) return null

  const geser = () => railRef.current?.scrollBy({ left: 800, behavior: 'smooth' })

  return (
    <section className="trend" id="promo-spesial">
      <div className="container">
        <h2 className="trend-judul">Promo Spesial</h2>
        <div className="trend-rel">
          <div className="trend-rail" ref={railRef}>
            {programs.map((p, i) => {
              // Harga sebelum promo (demo): promo 20% dari harga asli
              const hargaAsli = Math.round((p.harga * 1.25) / 1000) * 1000
              return (
              <Link className="trend-card" to={`/program/${p.id}`} key={p.id}>
                <span className="trend-figur">
                  <img className="trend-img" src={p.gambar || fotoCadangan[i % fotoCadangan.length]} alt="" />
                  <span className="trend-promo">Promo spesial</span>
                </span>
                <h3>{p.nama}</h3>
                <p className="trend-guru">{p.tutor}</p>
                <div className="trend-meta">
                  {i === 0 && <span className="trend-badge">Terlaris</span>}
                  <span className="trend-nilai">
                    <Star size={13} strokeWidth={1.5} aria-hidden="true" /> {nilai[i % nilai.length]}
                  </span>
                  <span className="trend-pil">{p.peserta > 0 ? `${p.peserta} peserta` : p.kategori}</span>
                </div>
                <div className="trend-harga-baris">
                  <strong className="trend-harga">{formatRupiah(p.harga)}</strong>
                  <s className="trend-harga-coret">{formatRupiah(hargaAsli)}</s>
                  <span className="trend-diskon">Hemat 20%</span>
                </div>
              </Link>
              )
            })}
          </div>
          <button type="button" className="trend-next" onClick={geser} aria-label="Program berikutnya">
            <ChevronRight size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </section>
  )
}
