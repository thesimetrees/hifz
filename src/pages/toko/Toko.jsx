import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Heart,
  X,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import { formatRupiah, bacaKeranjang, tambahKeKeranjang, bacaPengguna, gambarUtama } from './tokoData.js'
import { api } from '../../lib/api.js'

const urutanOpsi = [
  { id: 'terlaris', label: 'Terlaris' },
  { id: 'terbaru', label: 'Terbaru' },
  { id: 'termurah', label: 'Harga terendah' },
  { id: 'termahal', label: 'Harga tertinggi' },
]

const hitungDiskon = (p) =>
  p.hargaCoret > 0 ? Math.round(((p.hargaCoret - p.harga) / p.hargaCoret) * 100) : 0

export default function Toko() {
  const navigate = useNavigate()
  const pengguna = bacaPengguna()
  const [produk, setProduk] = useState([])
  const [kata, setKata] = useState('')
  const [kategori, setKategori] = useState('Semua')
  const [urutan, setUrutan] = useState('terlaris')
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0)
  const [favorit, setFavorit] = useState([])
  const [bukaFilter, setBukaFilter] = useState(false)

  useEffect(() => {
    setJumlahKeranjang(bacaKeranjang().reduce((t, i) => t + i.jumlah, 0))
    api('/toko/products', { auth: false })
      .then((d) => setProduk(Array.isArray(d) ? d : []))
      .catch(() => setProduk([]))
  }, [])

  const kategoriToko = useMemo(
    () => ['Semua', ...new Set(produk.map((p) => p.kategori).filter(Boolean))],
    [produk]
  )

  const hasil = useMemo(() => {
    let daftar = produk.filter(
      (p) =>
        (kategori === 'Semua' || p.kategori === kategori) &&
        p.nama.toLowerCase().includes(kata.trim().toLowerCase())
    )
    if (urutan === 'termurah') daftar = [...daftar].sort((a, b) => a.harga - b.harga)
    if (urutan === 'termahal') daftar = [...daftar].sort((a, b) => b.harga - a.harga)
    if (urutan === 'terlaris') daftar = [...daftar].sort((a, b) => b.terjual - a.terjual)
    if (urutan === 'terbaru') daftar = [...daftar].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return daftar
  }, [produk, kata, kategori, urutan])

  const tambahCepat = (e, p) => {
    e.preventDefault()
    e.stopPropagation()
    if (!pengguna) {
      navigate('/masuk')
      return
    }
    const isi = tambahKeKeranjang(p, 1)
    setJumlahKeranjang(isi.reduce((t, i) => t + i.jumlah, 0))
  }

  const toggleFavorit = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorit((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  return (
    <>
      <Header />
      <main className="pkat">
        <section className="pkat-hero" aria-hidden="true" />

        <div className="container pkat-cari-wrap">
          <div className={`pkat-cari ${bukaFilter ? 'is-filter-buka' : ''}`}>
            <input
              type="search"
              value={kata}
              onChange={(e) => setKata(e.target.value)}
              placeholder="Cari produk, contoh: mushaf"
              aria-label="Cari produk"
            />
            {kata && (
              <button type="button" className="pkat-cari-hapus" onClick={() => setKata('')} aria-label="Bersihkan pencarian">
                <X size={14} strokeWidth={2.2} />
              </button>
            )}
            <Search size={19} strokeWidth={2.1} aria-hidden="true" />
            <button
              type="button"
              className={`pkat-cari-toggle ${bukaFilter ? 'is-aktif' : ''}`}
              onClick={() => setBukaFilter((v) => !v)}
              aria-label="Tampilkan filter"
              aria-expanded={bukaFilter}
            >
              <SlidersHorizontal size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="pkat-cari-sep" aria-hidden="true" />
            <label className="pkat-cari-urut">
              Kategori
              <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
                {kategoriToko.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
            <span className="pkat-cari-sep" aria-hidden="true" />
            <label className="pkat-cari-urut">
              Urutkan
              <select value={urutan} onChange={(e) => setUrutan(e.target.value)}>
                {urutanOpsi.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <section className="tk-katalog" id="tk-katalog">
          <div className="tk-shell">

            {hasil.length === 0 ? (
              <p className="tk-kosong">
                {produk.length === 0
                  ? 'Belum ada produk di toko. Produk yang ditambahkan admin akan tampil di sini.'
                  : 'Produk tidak ditemukan. Coba kata kunci atau kategori lain.'}
              </p>
            ) : (
              <div className="tk-grid">
                {hasil.map((p, i) => {
                  const diskon = hitungDiskon(p)
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                    >
                      <Link to={`/toko/${p.id}`} className="phc-card tk-kartu">
                        <div className="phc-media">
                          {gambarUtama(p.gambar) ? (
                            <img src={gambarUtama(p.gambar)} alt={p.nama} loading="lazy" />
                          ) : (
                            <span className="tk-media-kosong" aria-hidden="true">
                              <Store size={30} strokeWidth={1.6} />
                            </span>
                          )}
                          <div className="tk-card-badge">
                            {diskon > 0 && <span className="tk-diskon">-{diskon}%</span>}
                            {p.terjual >= 100 && <span className="tk-laris">Terlaris</span>}
                          </div>
                          <button
                            type="button"
                            className={`tk-fav ${favorit.includes(p.id) ? 'is-aktif' : ''}`}
                            aria-label="Simpan ke favorit"
                            onClick={(e) => toggleFavorit(e, p.id)}
                          >
                            <Heart size={14} strokeWidth={2.2} />
                          </button>
                          {p.stok === 0 && <span className="tk-habis">Stok habis</span>}
                        </div>
                        <div className="phc-body">
                          <div className="tk-card-atas">
                            {p.kategori && <span className="tk-card-kat">{p.kategori}</span>}
                            <span className="tk-card-terjual">{p.terjual} terjual</span>
                          </div>
                          <h3>{p.nama}</h3>
                          <div className="tk-card-stok">
                            <div className={`tk-stok-bar${p.stok > 0 && p.stok <= 5 ? ' is-tipis' : ''}`}>
                              <i style={{ width: `${p.terjual + p.stok > 0 ? Math.min(100, Math.round((p.terjual / (p.terjual + p.stok)) * 100)) : 0}%` }} />
                            </div>
                            <span>{p.stok === 0 ? 'Stok habis' : p.stok <= 5 ? `Sisa ${p.stok}, segera habis` : `Stok ${p.stok} tersedia`}</span>
                          </div>
                          <div className="phc-hargabar">
                            <div className="phc-hb">
                              <strong>{formatRupiah(p.harga)}</strong>
                              {p.hargaCoret > 0 && <s>{formatRupiah(p.hargaCoret)}</s>}
                            </div>
                            <button
                              type="button"
                              className="phc-go tk-go"
                              disabled={p.stok === 0}
                              aria-label="Tambah ke keranjang"
                              onClick={(e) => tambahCepat(e, p)}
                            >
                              <ShoppingCart size={14} strokeWidth={2.1} />
                              <span>Tambah</span>
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
