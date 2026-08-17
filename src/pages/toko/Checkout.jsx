import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2, CreditCard, LayoutDashboard,
  MapPin, QrCode, Landmark, ReceiptText, ShieldCheck, Store,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import { formatRupiah, bacaKeranjang, simpanKeranjang, simpanPesanan, bacaPengguna, gambarUtama, alamatUtama, hitungOngkir } from './tokoData.js'
import { api } from '../../lib/api.js'

const metodeOpsi = [
  { id: 'QRIS', label: 'QRIS', ket: 'Scan dari semua aplikasi pembayaran', ikon: QrCode },
  { id: 'Transfer BSI', label: 'Transfer BSI', ket: 'Virtual account Bank Syariah Indonesia', ikon: Landmark },
]

export default function Checkout() {
  const navigate = useNavigate()
  const pengguna = bacaPengguna()

  useEffect(() => {
    if (!pengguna) navigate('/masuk', { replace: true })
  }, [pengguna, navigate])

  const [isi] = useState(bacaKeranjang)
  const [form, setForm] = useState(() => {
    const utama = alamatUtama()
    return {
      nama: utama?.nama || '',
      email: pengguna?.email || '',
      wa: utama?.telepon || '',
      alamat: utama ? `${utama.alamat}${utama.kecamatan ? `, Kec. ${utama.kecamatan}` : ''}` : '',
      kota: utama ? `${utama.kota}${utama.provinsi ? `, ${utama.provinsi}` : ''}` : '',
      kodePos: utama?.kodePos || '',
      catatan: '',
    }
  })
  const [metode, setMetode] = useState('QRIS')
  const [galat, setGalat] = useState('')
  const [selesai, setSelesai] = useState(null)

  const baris = isi

  const subtotal = baris.reduce((t, i) => t + i.harga * i.jumlah, 0)
  const infoOngkir = hitungOngkir(form.kodePos, subtotal)
  const ongkir = subtotal === 0 ? 0 : infoOngkir.tarif ?? 15000
  const total = subtotal + ongkir

  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const bayar = async (e) => {
    e.preventDefault()
    if (!form.nama.trim() || !form.wa.trim() || !form.alamat.trim() || !form.kota.trim()) {
      setGalat('Silakan lengkapi nama, nomor WhatsApp, alamat, dan kota tujuan.')
      return
    }
    if (!/^\d{5}$/.test(form.kodePos.trim())) {
      setGalat('Kode pos harus 5 digit agar ongkir dihitung sesuai lokasi tujuan.')
      return
    }
    setGalat('')
    const isiPesanan = {
      item: baris.map((b) => `${b.nama} x${b.jumlah}`).join(' · '),
      metode,
      total,
      jenis: 'toko',
      penerima: form.nama.trim(),
      alamat: `${form.alamat.trim()}, ${form.kota.trim()} ${form.kodePos.trim()} (ongkir ${ongkir === 0 ? 'gratis' : formatRupiah(ongkir)}${infoOngkir.zona && ongkir > 0 ? `, ${infoOngkir.zona}` : ''})`,
    }
    try {
      const pesanan = await api('/toko/orders', { method: 'POST', body: isiPesanan, auth: false })
      simpanPesanan(pesanan)
      simpanKeranjang([])
      setSelesai(pesanan)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setGalat(`Pesanan gagal dikirim: ${err.message}`)
    }
  }

  if (selesai) {
    return (
      <>
        <Header />
        <main className="tk-main">
          <div className="tk-shell tk-detail-shell">
            <div className="tk-sukses-kartu">
              <CheckCircle2 size={44} strokeWidth={1.8} />
              <h1>Pesanan berhasil dibuat</h1>
              <p>
                Terima kasih, {selesai.penerima}. Pesanan Anda dengan nomor <strong>{selesai.invoice}</strong> sedang
                menunggu konfirmasi pembayaran dari admin. Setelah lunas, pesanan dikirim ke alamat tujuan dalam 1-2 hari kerja.
              </p>
              <div className="tk-sukses-rincian">
                <div><span>Invoice</span><strong>{selesai.invoice}</strong></div>
                <div><span>Metode</span><strong>{selesai.metode}</strong></div>
                <div><span>Total</span><strong>{formatRupiah(selesai.total)}</strong></div>
              </div>
              <div className="tk-aksi">
                <Link to="/dashboard" className="tk-btn tk-btn--garis">
                  <LayoutDashboard size={15} strokeWidth={2} /> Lihat riwayat di dashboard
                </Link>
                <Link to="/toko" className="tk-btn">
                  <Store size={15} strokeWidth={2} /> Kembali ke toko
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <CookieConsent />
      </>
    )
  }

  if (baris.length === 0) {
    return (
      <>
        <Header />
        <main className="tk-main">
          <div className="tk-shell tk-detail-shell">
            <div className="tk-kosong tk-kosong--kartu">
              <ReceiptText size={34} strokeWidth={1.6} />
              <p>Belum ada barang untuk dibayar. Silakan isi keranjang terlebih dahulu.</p>
              <Link to="/toko" className="tk-btn">Jelajahi toko <ChevronRight size={15} strokeWidth={2} /></Link>
            </div>
          </div>
        </main>
        <Footer />
        <CookieConsent />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="tk-main">
        <div className="tk-shell tk-detail-shell">
          <div className="tk-crumb">
            <Link to="/keranjang"><ChevronLeft size={14} strokeWidth={2} /> Keranjang</Link>
            <span>/</span>
            <strong>Checkout</strong>
          </div>

          <h1 className="tk-judul-hal"><ReceiptText size={20} strokeWidth={2} /> Checkout</h1>

          <form className="tk-co" onSubmit={bayar} noValidate>
            <div className="tk-co-kiri">
              <section className="tk-co-kartu">
                <h3><MapPin size={16} strokeWidth={2} /> Alamat pengiriman</h3>
                <div className="tk-co-grid">
                  <label>
                    Nama penerima
                    <input name="nama" value={form.nama} onChange={ubah} placeholder="Contoh: Ahmad Fauzan" />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" value={form.email} onChange={ubah} placeholder="Contoh: nama@email.com" />
                  </label>
                  <label>
                    Nomor WhatsApp
                    <input name="wa" value={form.wa} onChange={ubah} placeholder="Contoh: 0812 3456 7890" />
                  </label>
                  <label>
                    Kota / kabupaten
                    <input name="kota" value={form.kota} onChange={ubah} placeholder="Contoh: Kota Bandung" />
                  </label>
                  <label className="tk-co-lebar">
                    Alamat lengkap
                    <textarea name="alamat" rows="3" value={form.alamat} onChange={ubah} placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan" />
                  </label>
                  <label>
                    Kode pos
                    <input name="kodePos" value={form.kodePos} onChange={ubah} placeholder="Contoh: 40115" />
                  </label>
                  <label>
                    Catatan (opsional)
                    <input name="catatan" value={form.catatan} onChange={ubah} placeholder="Contoh: titip di satpam" />
                  </label>
                </div>
              </section>

              <section className="tk-co-kartu">
                <h3><CreditCard size={16} strokeWidth={2} /> Metode pembayaran</h3>
                <div className="tk-metode">
                  {metodeOpsi.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`tk-metode-opsi ${metode === m.id ? 'is-aktif' : ''}`}
                      onClick={() => setMetode(m.id)}
                    >
                      <m.ikon size={20} strokeWidth={1.9} />
                      <span>
                        <strong>{m.label}</strong>
                        <small>{m.ket}</small>
                      </span>
                      <i className="tk-radio" />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="tk-ringkasan">
              <h3>Pesanan Anda</h3>
              <div className="tk-co-item-list">
                {baris.map((b) => (
                  <div className="tk-co-item" key={`${b.id}-${b.varian}`}>
                    <img src={gambarUtama(b.produk.gambar)} alt={b.produk.nama} />
                    <span>
                      <strong>{b.produk.nama}</strong>
                      <small>{b.varian ? `${b.varian} · ` : ''}{b.jumlah} x {formatRupiah(b.produk.harga)}</small>
                    </span>
                    <b>{formatRupiah(b.produk.harga * b.jumlah)}</b>
                  </div>
                ))}
              </div>
              <div className="tk-ringkasan-baris">
                <span>Subtotal</span>
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
              {galat && <p className="tk-galat">{galat}</p>}
              <button type="submit" className="tk-btn tk-btn--blok">
                Bayar sekarang <ChevronRight size={15} strokeWidth={2} />
              </button>
              <p className="tk-aman"><ShieldCheck size={13} strokeWidth={2} /> Transaksi terenkripsi dan tercatat di dashboard Anda.</p>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
