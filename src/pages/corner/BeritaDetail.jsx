import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Newspaper } from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { api } from '../../lib/api.js'

const formatTanggal = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

export default function BeritaDetail() {
  const { slug } = useParams()
  const [semua, setSemua] = useState(null)

  useEffect(() => {
    api('/berita', { auth: false })
      .then((d) => setSemua(Array.isArray(d) ? d : []))
      .catch(() => setSemua([]))
    window.scrollTo({ top: 0 })
  }, [slug])

  if (semua === null) {
    return (
      <>
        <Header solid />
        <main className="corner-page">
          <section className="corner-head">
            <div className="container">
              <h1>Memuat berita&hellip;</h1>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  const berita = semua.find((b) => b.id === slug)

  if (!berita) {
    return (
      <>
        <Header solid />
        <main className="corner-page">
          <section className="corner-head">
            <div className="container">
              <h1>Berita tidak ditemukan</h1>
              <p>Tautan mungkin sudah berubah atau berita telah ditarik.</p>
              <Link className="phc-all" to="/corner/berita">Kembali ke berita</Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  const isi = (berita.konten || '').split(/\n+/).filter((p) => p.trim())
  const lainnya = semua.filter((b) => b.id !== berita.id).slice(0, 3)

  return (
    <>
      <Header solid />
      <main className="corner-page">
        <article className="berita-artikel">
          <div className="container berita-artikel-wrap">
            <Link to="/corner/berita" className="berita-kembali">
              <ChevronLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Semua berita
            </Link>
            <span className="bnc-kategori">{berita.kategori}</span>
            <h1>{berita.judul}</h1>
            <span className="bnc-meta">{formatTanggal(berita.createdAt)} &middot; {berita.penulis || 'Tim Hifz'}</span>
            {berita.gambar && (
              <figure className="berita-artikel-media">
                <img src={berita.gambar} alt={berita.judul} />
              </figure>
            )}
            <div className="berita-artikel-isi">
              {isi.length > 0 ? (
                isi.map((p) => <p key={p}>{p}</p>)
              ) : (
                berita.ringkas && <p>{berita.ringkas}</p>
              )}
            </div>
          </div>
        </article>

        {lainnya.length > 0 && (
          <section className="corner-isi berita-lainnya">
            <div className="container">
              <h2>Berita lainnya</h2>
              <div className="berita-grid">
                {lainnya.map((b) => (
                  <article key={b.id} className="bnc-card">
                    <Link className="bnc-media" to={`/corner/berita/${b.id}`} tabIndex={-1}>
                      {b.gambar ? (
                        <img src={b.gambar} alt={b.judul} loading="lazy" />
                      ) : (
                        <span className="bnc-media-kosong" aria-hidden="true">
                          <Newspaper size={26} strokeWidth={1.6} />
                        </span>
                      )}
                      <span className="bnc-kategori">{b.kategori}</span>
                    </Link>
                    <div className="bnc-body">
                      <span className="bnc-meta">{formatTanggal(b.createdAt)} &middot; {b.penulis || 'Tim Hifz'}</span>
                      <h3>
                        <Link to={`/corner/berita/${b.id}`}>{b.judul}</Link>
                      </h3>
                      {b.ringkas && <p>{b.ringkas}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
