import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Store,
  Truck, ShieldCheck, PackageCheck, CheckCircle2,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import { formatRupiah, bacaKeranjang, tambahKeKeranjang, bacaPengguna, daftarGambar, gambarUtama } from './tokoData.js'
import { api } from '../../lib/api.js'

export default function ProdukDetail() {
  const { produkId } = useParams()
  const navigate = useNavigate()
  const pengguna = bacaPengguna()

  const [daftar, setDaftar] = useState(null)
  const [jumlah, setJumlah] = useState(1)
  const [jumlahKeranjang, setJumlahKeranjang] = useState(0)
  const [ditambahkan, setDitambahkan] = useState(false)
  const [gbrAktif, setGbrAktif] = useState(0)

  useEffect(() => {
    api('/toko/products', { auth: false })
      .then((d) => setDaftar(Array.isArray(d) ? d : []))
      .catch(() => setDaftar([]))
  }, [])

  useEffect(() => {
    setJumlahKeranjang(bacaKeranjang().reduce((t, i) => t + i.jumlah, 0))
    setJumlah(1)
    setDitambahkan(false)
    setGbrAktif(0)
    window.scrollTo({ top: 0 })
  }, [produkId])

  const produk = useMemo(() => (daftar ?? []).find((p) => p.id === produkId), [daftar, produkId])
  const terkait = useMemo(
    () => (daftar ?? []).filter((p) => p.id !== produkId).slice(0, 3),
    [daftar, produkId]
  )

  if (daftar === null) {
    return (
      <>
        <Header solid />
        <main className="tk-main">
          <div className="tk-shell">
            <p className="tk-kosong">Memuat produk&hellip;</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!produk) {
    return (
      <>
        <Header solid />
        <main className="tk-main">
          <div className="tk-shell">
            <p className="tk-kosong">Produk tidak ditemukan. <Link to="/toko">Kembali ke toko</Link>.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const diskon = produk.hargaCoret > 0
    ? Math.round(((produk.hargaCoret - produk.harga) / produk.hargaCoret) * 100)
    : 0

  const tambah = () => {
    if (!pengguna) {
      navigate('/masuk')
      return false
    }
    const isi = tambahKeKeranjang(produk, jumlah)
    setJumlahKeranjang(isi.reduce((t, i) => t + i.jumlah, 0))
    return true
  }

  const keKeranjang = () => {
    if (tambah()) {
      setDitambahkan(true)
      setTimeout(() => setDitambahkan(false), 2500)
    }
  }

  const beliSekarang = () => {
    if (tambah()) navigate('/keranjang')
  }

  return (
    <>
      <Header solid />
      <main className="tk-main">
        <div className="tk-shell tk-detail-shell">
          <div className="tk-crumb">
            <Link to="/toko"><ChevronLeft size={14} strokeWidth={2} /> Toko</Link>
            {produk.kategori && (
              <>
                <span>/</span>
                <span>{produk.kategori}</span>
              </>
            )}
            <span>/</span>
            <strong>{produk.nama}</strong>
            {pengguna && (
              <Link to="/keranjang" className="tk-cart-btn tk-cart-btn--kecil">
                <ShoppingCart size={15} strokeWidth={2} />
                Keranjang
                {jumlahKeranjang > 0 && <i>{jumlahKeranjang}</i>}
              </Link>
            )}
          </div>

          <div className="tk-detail">
            <div className="tk-galeri">
              <div className="tk-galeri-utama">
                {(() => {
                  const galeri = daftarGambar(produk.gambar)
                  return galeri.length ? (
                    <img src={galeri[gbrAktif] ?? galeri[0]} alt={produk.nama} />
                  ) : (
                    <span className="tk-media-kosong" aria-hidden="true">
                      <Store size={44} strokeWidth={1.5} />
                    </span>
                  )
                })()}
                {diskon > 0 && <span className="tk-diskon">-{diskon}%</span>}
              </div>
              {daftarGambar(produk.gambar).length > 1 && (
                <div className="tk-galeri-thumbs">
                  {daftarGambar(produk.gambar).map((g, i) => (
                    <button
                      key={g + i}
                      type="button"
                      className={i === gbrAktif ? 'is-aktif' : undefined}
                      onClick={() => setGbrAktif(i)}
                      aria-label={`Gambar ${i + 1}`}
                    >
                      <img src={g} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tk-info">
              {produk.kategori && <span className="tk-card-kat">{produk.kategori}</span>}
              <h1>{produk.nama}</h1>
              <div className="tk-info-meta">
                <span>{produk.terjual} terjual</span>
                <span>Stok {produk.stok}</span>
              </div>
              <div className="tk-info-harga">
                <strong>{formatRupiah(produk.harga)}</strong>
                {produk.hargaCoret > 0 && <s>{formatRupiah(produk.hargaCoret)}</s>}
              </div>
              {produk.ringkas && <p className="tk-ringkas">{produk.ringkas}</p>}

              <div className="tk-jumlah-baris">
                <span className="tk-label">Jumlah</span>
                <div className="tk-stepper">
                  <button type="button" onClick={() => setJumlah((j) => Math.max(1, j - 1))} aria-label="Kurangi">
                    <Minus size={14} strokeWidth={2} />
                  </button>
                  <span>{jumlah}</span>
                  <button
                    type="button"
                    onClick={() => setJumlah((j) => Math.min(produk.stok || 1, j + 1))}
                    aria-label="Tambah"
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>
                <span className="tk-stok">Stok: {produk.stok}</span>
              </div>

              {ditambahkan && (
                <p className="tk-sukses"><CheckCircle2 size={14} strokeWidth={2} /> Produk ditambahkan ke keranjang.</p>
              )}

              <div className="tk-aksi">
                <button type="button" className="tk-btn tk-btn--garis" disabled={produk.stok === 0} onClick={keKeranjang}>
                  <ShoppingCart size={15} strokeWidth={2} /> Tambah ke keranjang
                </button>
                <button type="button" className="tk-btn" disabled={produk.stok === 0} onClick={beliSekarang}>
                  Beli sekarang <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>

              <div className="tk-jaminan">
                <span><Truck size={14} strokeWidth={2} /> Dikirim 1-2 hari kerja</span>
                <span><ShieldCheck size={14} strokeWidth={2} /> Garansi tukar 7 hari</span>
                <span><PackageCheck size={14} strokeWidth={2} /> Dikemas aman</span>
              </div>
            </div>

            {produk.deskripsi && (
              <section className="tk-deskripsi">
                <h2>Deskripsi produk</h2>
                <p>{produk.deskripsi}</p>
              </section>
            )}
          </div>

          {terkait.length > 0 && (
            <section className="tk-terkait">
              <div className="tk-terkait-head">
                <h2><Store size={16} strokeWidth={2} /> Produk lainnya</h2>
                <Link to="/toko">Lihat semua <ChevronRight size={14} strokeWidth={2} /></Link>
              </div>
              <div className="tk-grid tk-grid--tiga">
                {terkait.map((p) => (
                  <Link to={`/toko/${p.id}`} className="tk-card" key={p.id}>
                    <div className="tk-card-img">
                      {gambarUtama(p.gambar) ? (
                        <img src={gambarUtama(p.gambar)} alt={p.nama} loading="lazy" />
                      ) : (
                        <span className="tk-media-kosong" aria-hidden="true">
                          <Store size={26} strokeWidth={1.6} />
                        </span>
                      )}
                    </div>
                    <div className="tk-card-body">
                      {p.kategori && <span className="tk-card-kat">{p.kategori}</span>}
                      <h3>{p.nama}</h3>
                      <div className="tk-harga">
                        <strong>{formatRupiah(p.harga)}</strong>
                        {p.hargaCoret > 0 && <s>{formatRupiah(p.hargaCoret)}</s>}
                      </div>
                      <div className="tk-meta">
                        <span>{p.terjual} terjual</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
