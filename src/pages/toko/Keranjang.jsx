import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Minus, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import {
  formatRupiah, bacaKeranjang, simpanKeranjang, bacaPengguna,
  bacaAlamat, simpanAlamat, hitungOngkir,
} from './tokoData.js'

const ALAMAT_KOSONG = {
  label: '', nama: '', telepon: '', alamat: '', kodePos: '',
  provinsiId: '', provinsi: '', kotaId: '', kota: '', kecamatanId: '', kecamatan: '',
}

const API_WILAYAH = 'https://cdn.jsdelivr.net/gh/emsifa/api-wilayah-indonesia@gh-pages/api'

const rapiWilayah = (nama) =>
  nama
    .toLowerCase()
    .split(' ')
    .map((kata) => (['di', 'dki'].includes(kata) ? kata.toUpperCase() : kata.charAt(0).toUpperCase() + kata.slice(1)))
    .join(' ')

export default function Keranjang() {
  const navigate = useNavigate()
  const [isi, setIsi] = useState(bacaKeranjang)
  const [alamat, setAlamat] = useState(bacaAlamat)
  const [formAlamat, setFormAlamat] = useState(null) // null | { id?, ...fields }
  const [wilayah, setWilayah] = useState({ provinsi: [], kota: [], kecamatan: [] })

  useEffect(() => {
    if (!bacaPengguna()) navigate('/masuk', { replace: true })
  }, [navigate])

  useEffect(() => {
    fetch(`${API_WILAYAH}/provinces.json`)
      .then((r) => r.json())
      .then((d) => setWilayah((w) => ({ ...w, provinsi: d })))
      .catch(() => {})
  }, [])

  const baris = isi
  const aktif = alamat.find((a) => a.utama) ?? alamat[0] ?? null

  const subtotal = baris.reduce((t, i) => t + i.harga * i.jumlah, 0)
  const infoOngkir = hitungOngkir(aktif?.kodePos, subtotal)
  const ongkir = subtotal === 0 ? 0 : infoOngkir.tarif ?? 15000
  const total = subtotal + ongkir

  const perbarui = (baru) => {
    setIsi(baru)
    simpanKeranjang(baru)
  }

  const ubahJumlah = (id, delta) => {
    perbarui(
      isi.map((i) => {
        if (i.id !== id) return i
        const stok = i.stok || 99
        return { ...i, jumlah: Math.min(stok, Math.max(1, i.jumlah + delta)) }
      })
    )
  }

  const hapus = (id) => {
    perbarui(isi.filter((i) => i.id !== id))
  }

  const perbaruiAlamat = (baru) => {
    setAlamat(baru)
    simpanAlamat(baru)
  }

  const pilihAlamat = (id) => {
    perbaruiAlamat(alamat.map((a) => ({ ...a, utama: a.id === id })))
  }

  const hapusAlamat = (id) => {
    const sisa = alamat.filter((a) => a.id !== id)
    if (sisa.length > 0 && !sisa.some((a) => a.utama)) sisa[0] = { ...sisa[0], utama: true }
    perbaruiAlamat(sisa)
    if (formAlamat?.id === id) setFormAlamat(null)
  }

  const bukaFormBaru = () => {
    const p = bacaPengguna()
    setFormAlamat({
      ...ALAMAT_KOSONG,
      nama: p?.nama || p?.name || '',
      telepon: p?.wa || p?.telepon || p?.phone || '',
    })
    setWilayah((w) => ({ ...w, kota: [], kecamatan: [] }))
  }

  const bukaFormUbah = (a) => {
    setFormAlamat({ ...ALAMAT_KOSONG, ...a })
    setWilayah((w) => ({ ...w, kota: [], kecamatan: [] }))
    if (a.provinsiId) {
      fetch(`${API_WILAYAH}/regencies/${a.provinsiId}.json`)
        .then((r) => r.json())
        .then((d) => setWilayah((w) => ({ ...w, kota: d })))
        .catch(() => {})
    }
    if (a.kotaId) {
      fetch(`${API_WILAYAH}/districts/${a.kotaId}.json`)
        .then((r) => r.json())
        .then((d) => setWilayah((w) => ({ ...w, kecamatan: d })))
        .catch(() => {})
    }
  }

  const pilihWilayah = (tingkat, e) => {
    const opt = e.target.selectedOptions[0]
    const id = e.target.value
    const nama = opt?.dataset.nama ?? ''
    setFormAlamat((f) => {
      const baru = { ...f, [`${tingkat}Id`]: id, [tingkat]: nama }
      if (tingkat === 'provinsi') Object.assign(baru, { kotaId: '', kota: '', kecamatanId: '', kecamatan: '' })
      if (tingkat === 'kota') Object.assign(baru, { kecamatanId: '', kecamatan: '' })
      return baru
    })
    if (tingkat === 'provinsi') {
      setWilayah((w) => ({ ...w, kota: [], kecamatan: [] }))
      if (id) fetch(`${API_WILAYAH}/regencies/${id}.json`).then((r) => r.json()).then((d) => setWilayah((w) => ({ ...w, kota: d }))).catch(() => {})
    }
    if (tingkat === 'kota') {
      setWilayah((w) => ({ ...w, kecamatan: [] }))
      if (id) fetch(`${API_WILAYAH}/districts/${id}.json`).then((r) => r.json()).then((d) => setWilayah((w) => ({ ...w, kecamatan: d }))).catch(() => {})
    }
  }

  const simpanFormAlamat = (e) => {
    e.preventDefault()
    if (!formAlamat.nama.trim() || !formAlamat.alamat.trim() || !formAlamat.kota || !/^\d{5}$/.test(formAlamat.kodePos.trim())) return
    const bersih = {
      ...formAlamat,
      label: formAlamat.label.trim() || 'Rumah',
      nama: formAlamat.nama.trim(),
      telepon: formAlamat.telepon.trim(),
      alamat: formAlamat.alamat.trim(),
      kodePos: formAlamat.kodePos.trim(),
    }
    if (bersih.id) {
      perbaruiAlamat(alamat.map((a) => (a.id === bersih.id ? { ...a, ...bersih } : a)))
    } else {
      if (alamat.length >= 3) return
      const baru = { ...bersih, id: `al-${Date.now()}`, utama: alamat.length === 0 }
      perbaruiAlamat([...alamat, baru])
    }
    setFormAlamat(null)
  }

  const ubahFieldAlamat = (e) => setFormAlamat({ ...formAlamat, [e.target.name]: e.target.value })

  return (
    <>
      <Header solid />
      <main className="tk-main">
        <div className="tk-shell tk-detail-shell">
          <div className="tk-crumb">
            <Link to="/toko"><ChevronLeft size={14} strokeWidth={2} /> Lanjut belanja</Link>
            <span>/</span>
            <strong>Keranjang</strong>
          </div>

          <h1 className="tk-judul-hal"><ShoppingCart size={20} strokeWidth={2} /> Keranjang belanja</h1>

          {baris.length === 0 ? (
            <div className="tk-kosong tk-kosong--kartu">
              <ShoppingCart size={34} strokeWidth={1.6} />
              <p>Keranjang Anda masih kosong.</p>
              <Link to="/toko" className="tk-btn">Jelajahi toko <ChevronRight size={15} strokeWidth={2} /></Link>
            </div>
          ) : (
            <div className="tk-krj">
              <div className="tk-krj-daftar">
                {baris.map((b) => (
                  <div className="tk-krj-item" key={b.id}>
                    <Link to={`/toko/${b.id}`} className="tk-krj-img">
                      {b.gambar ? <img src={b.gambar} alt={b.nama} /> : <span className="tk-media-kosong" aria-hidden="true"><ShoppingCart size={22} strokeWidth={1.6} /></span>}
                    </Link>
                    <div className="tk-krj-info">
                      {b.kategori && <span className="tk-card-kat">{b.kategori}</span>}
                      <Link to={`/toko/${b.id}`}><h3>{b.nama}</h3></Link>
                      <strong className="tk-krj-harga">{formatRupiah(b.harga)}</strong>
                    </div>
                    <div className="tk-krj-aksi">
                      <div className="tk-stepper">
                        <button type="button" onClick={() => ubahJumlah(b.id, -1)} aria-label="Kurangi">
                          <Minus size={13} strokeWidth={2} />
                        </button>
                        <span>{b.jumlah}</span>
                        <button type="button" onClick={() => ubahJumlah(b.id, 1)} aria-label="Tambah">
                          <Plus size={13} strokeWidth={2} />
                        </button>
                      </div>
                      <strong>{formatRupiah(b.harga * b.jumlah)}</strong>
                      <button type="button" className="tk-hapus" onClick={() => hapus(b.id)} aria-label="Hapus">
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}

                <section className="tk-alamat-kartu">
                  <div className="tk-alamat-head">
                    <h3><MapPin size={16} strokeWidth={2} /> Alamat pengiriman</h3>
                    {!formAlamat && alamat.length < 3 && (
                      <button type="button" className="tk-alamat-tambah" onClick={bukaFormBaru}>
                        <Plus size={13} strokeWidth={2.2} /> Tambah alamat
                      </button>
                    )}
                    {!formAlamat && alamat.length >= 3 && (
                      <span className="tk-alamat-maks">Maks. 3 alamat</span>
                    )}
                  </div>

                  {alamat.length === 0 && !formAlamat && (
                    <p className="tk-alamat-kosong">Belum ada alamat tersimpan. Tambahkan alamat agar ongkir dihitung sesuai kode pos tujuan.</p>
                  )}

                  {alamat.length > 0 && (
                    <div className="tk-alamat-list">
                      {alamat.map((a) => (
                        <label className={`tk-alamat-item ${aktif?.id === a.id ? 'is-aktif' : ''}`} key={a.id}>
                          <input
                            type="radio"
                            name="alamat"
                            checked={aktif?.id === a.id}
                            onChange={() => pilihAlamat(a.id)}
                          />
                          <span className="tk-alamat-isi">
                            <strong>{a.label} · {a.nama}</strong>
                            {a.telepon && <small>{a.telepon}</small>}
                            <small>{a.alamat}{a.kecamatan ? `, Kec. ${a.kecamatan}` : ''}, {a.kota}{a.provinsi ? `, ${a.provinsi}` : ''} {a.kodePos}</small>
                          </span>
                          <span className="tk-alamat-aksi">
                            <button
                              type="button"
                              className="tk-alamat-ubah"
                              onClick={(e) => { e.preventDefault(); bukaFormUbah(a) }}
                              aria-label={`Ubah alamat ${a.label}`}
                            >
                              <Pencil size={13} strokeWidth={2} /> Ubah
                            </button>
                            <button
                              type="button"
                              className="tk-alamat-ubah"
                              onClick={(e) => { e.preventDefault(); hapusAlamat(a.id) }}
                              aria-label={`Hapus alamat ${a.label}`}
                            >
                              <Trash2 size={13} strokeWidth={2} /> Hapus
                            </button>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {formAlamat && (
                    <form className="tk-co-grid tk-alamat-form" onSubmit={simpanFormAlamat}>
                      <label>
                        Label alamat
                        <input name="label" value={formAlamat.label} onChange={ubahFieldAlamat} placeholder="Contoh: Rumah, Kantor" />
                      </label>
                      <label>
                        Nama penerima
                        <input name="nama" value={formAlamat.nama} onChange={ubahFieldAlamat} placeholder="Contoh: Ahmad Fauzan" />
                      </label>
                      <label>
                        Nomor WhatsApp
                        <input name="telepon" value={formAlamat.telepon} onChange={ubahFieldAlamat} placeholder="Contoh: 0812 3456 7890" />
                      </label>
                      <label>
                        Provinsi
                        <select value={formAlamat.provinsiId} onChange={(e) => pilihWilayah('provinsi', e)}>
                          <option value="">Pilih provinsi</option>
                          {wilayah.provinsi.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                        </select>
                      </label>
                      <label>
                        Kota / kabupaten
                        <select value={formAlamat.kotaId} onChange={(e) => pilihWilayah('kota', e)} disabled={!formAlamat.provinsiId}>
                          <option value="">Pilih kota / kabupaten</option>
                          {wilayah.kota.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                        </select>
                      </label>
                      <label>
                        Kecamatan
                        <select value={formAlamat.kecamatanId} onChange={(e) => pilihWilayah('kecamatan', e)} disabled={!formAlamat.kotaId}>
                          <option value="">Pilih kecamatan</option>
                          {wilayah.kecamatan.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
                        </select>
                      </label>
                      <label className="tk-co-lebar">
                        Alamat lengkap
                        <textarea name="alamat" rows="2" value={formAlamat.alamat} onChange={ubahFieldAlamat} placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan" />
                      </label>
                      <label>
                        Kode pos
                        <input name="kodePos" value={formAlamat.kodePos} onChange={ubahFieldAlamat} placeholder="Contoh: 40115" inputMode="numeric" maxLength={5} />
                      </label>
                      <div className="tk-alamat-form-aksi">
                        <button type="button" className="tk-btn tk-btn--garis" onClick={() => setFormAlamat(null)}>Batal</button>
                        <button type="submit" className="tk-btn">Simpan alamat</button>
                      </div>
                    </form>
                  )}
                </section>
              </div>

              <aside className="tk-ringkasan">
                <h3>Ringkasan belanja</h3>
                <div className="tk-ringkasan-baris">
                  <span>Subtotal ({baris.reduce((t, i) => t + i.jumlah, 0)} barang)</span>
                  <strong>{formatRupiah(subtotal)}</strong>
                </div>
                <div className="tk-ringkasan-baris">
                  <span>Ongkos kirim{infoOngkir.zona && ongkir > 0 ? ` (${infoOngkir.zona})` : ''}</span>
                  <strong>{ongkir === 0 ? 'Gratis' : formatRupiah(ongkir)}</strong>
                </div>
                <div className="tk-ringkasan-baris tk-ringkasan-baris--total">
                  <span>Total</span>
                  <strong>{formatRupiah(total)}</strong>
                </div>
                <button type="button" className="tk-btn tk-btn--blok" onClick={() => navigate('/checkout')}>
                  Lanjut ke checkout <ChevronRight size={15} strokeWidth={2} />
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
