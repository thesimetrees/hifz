import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, CloudUpload,
  Languages, LayoutDashboard, Layers, LibraryBig, Mail, MapPin, MonitorPlay,
  PencilLine, Phone, QrCode, ReceiptText, ShieldCheck, Trash2, TriangleAlert, UserRound,
} from 'lucide-react'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import CookieConsent from '../../components/CookieConsent.jsx'
import { formatRupiah, bacaPengguna, bacaKeranjang, simpanKeranjang, simpanPesanan, tambahKeKeranjang } from '../toko/tokoData.js'
import { semuaSub } from '../admin/adminData.js'
import { daftarJadwal, formatTanggalPanjang } from '../../lib/kalender.js'
import { api, kompresFoto } from '../../lib/api.js'

const WA_CS = 'https://wa.me/6285210447200'

export default function CheckoutProgram() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const pengguna = bacaPengguna()

  useEffect(() => {
    if (!pengguna) navigate('/masuk', { replace: true })
  }, [pengguna, navigate])

  const [program, setProgram] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [baris, setBaris] = useState([])
  const metode = 'QRIS'
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState('')
  const [selesai, setSelesai] = useState(null)
  const [popupBuka, setPopupBuka] = useState(false)
  const [atasNama, setAtasNama] = useState(pengguna?.nama || '')
  const [bukti, setBukti] = useState('')
  const [buktiGalat, setBuktiGalat] = useState('')

  useEffect(() => {
    let hidup = true
    api(`/programs/${programId}`, { auth: false })
      .then((data) => {
        if (!hidup) return
        setProgram(data)
        // masukkan program ke keranjang toko agar bisa beli lebih dari satu
        const isi = tambahKeKeranjang({ ...data, kategori: 'Program', stok: 1 }, 1)
        setBaris(isi.filter((i) => i.kategori === 'Program'))
      })
      .catch(() => hidup && setProgram(null))
      .finally(() => hidup && setMemuat(false))
    return () => {
      hidup = false
    }
  }, [programId])

  const total = baris.reduce((t, b) => t + Number(b.harga || 0) * (b.jumlah || 1), 0)
  const kurikulum = program?.kurikulum ?? []
  const semua = program ? semuaSub(program) : []
  const sesiOnline = semua.filter((m) => m.jenis === 'sesi-online').length
  const sesiOffline = semua.filter((m) => m.jenis === 'sesi-offline').length
  const pertemuan = sesiOnline + sesiOffline
  const mulai = program ? daftarJadwal(program.jadwal)[0]?.tanggalMulai : null

  const profilLengkap = Boolean(pengguna?.nama && pengguna?.email && pengguna?.telepon && pengguna?.alamat)
  const inisial = (pengguna?.nama || '')
    .split(' ')
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toUpperCase()

  const hapusBaris = (id) => {
    const sisa = bacaKeranjang().filter((i) => !(i.kategori === 'Program' && i.id === id))
    simpanKeranjang(sisa)
    setBaris(sisa.filter((i) => i.kategori === 'Program'))
  }

  const bayar = (e) => {
    e.preventDefault()
    if (!profilLengkap) {
      setGalat('Lengkapi profil terlebih dahulu sebelum melanjutkan pembayaran.')
      return
    }
    if (baris.length === 0) {
      setGalat('Belum ada program yang dipilih.')
      return
    }
    setGalat('')
    setBuktiGalat('')
    setPopupBuka(true)
  }

  const pilihBukti = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setBukti(await kompresFoto(file, 900))
      setBuktiGalat('')
    } catch {
      setBuktiGalat('File tidak bisa dibaca. Gunakan foto atau tangkapan layar.')
    }
  }

  const kirimBukti = async (e) => {
    e.preventDefault()
    if (!atasNama.trim()) {
      setBuktiGalat('Isi nama pengirim pembayaran.')
      return
    }
    if (!bukti) {
      setBuktiGalat('Unggah foto atau tangkapan layar bukti pembayaran.')
      return
    }
    setBuktiGalat('')
    setMemproses(true)
    try {
      const detail = [
        `Email ${pengguna.email}`,
        `WA ${pengguna.telepon}`,
        `Alamat: ${pengguna.alamat}`,
      ].join(' · ')
      const pesanan = await api('/toko/orders', {
        method: 'POST',
        body: {
          item: baris.map((b) => b.nama).join(' · '),
          metode,
          total,
          jenis: 'program',
          penerima: pengguna.nama,
          alamat: detail,
        },
        auth: false,
      })
      simpanPesanan({
        ...pesanan,
        programIds: baris.map((b) => b.id),
        buktiBayar: bukti,
        atasNama: atasNama.trim(),
        buktiWaktu: new Date().toISOString(),
      })
      simpanKeranjang(bacaKeranjang().filter((i) => i.kategori !== 'Program'))
      setSelesai(pesanan)
    } catch (err) {
      setBuktiGalat(`Tagihan gagal dibuat: ${err.message}`)
    } finally {
      setMemproses(false)
    }
  }

  if (!memuat && !program) {
    return (
      <>
        <Header />
        <main className="tk-main">
          <section className="pkat-hero" aria-hidden="true" />
          <div className="tk-shell tk-detail-shell cop-isi">
            <div className="tk-kosong tk-kosong--kartu">
              <ReceiptText size={34} strokeWidth={1.6} />
              <p>Program tidak ditemukan. Silakan pilih program dari katalog.</p>
              <Link to="/program" className="tk-btn">Jelajahi program <ChevronRight size={15} strokeWidth={2} /></Link>
            </div>
          </div>
        </main>
        <Footer />
        <CookieConsent />
      </>
    )
  }

  if (memuat || !program) return null

  return (
    <>
      <Header />
      <main className="tk-main">
        <section className="pkat-hero" aria-hidden="true" />
        <div className="tk-shell tk-detail-shell cop-isi">
          <div className="tk-crumb">
            <Link to={`/program/${program.id}`}><ChevronLeft size={14} strokeWidth={2} /> {program.nama}</Link>
            <span>/</span>
            <strong>Checkout</strong>
          </div>

          <div className="cop-hero">
            <div>
              <h1 className="tk-judul-hal"><ReceiptText size={20} strokeWidth={2} /> Checkout program</h1>
              <p className="cop-sub">Selesaikan pendaftaran dan pembayaran untuk mulai belajar bersama Hifz.</p>
            </div>
            <ol className="cop-langkah" aria-label="Langkah pendaftaran">
              <li className="is-aktif"><i>1</i> Checkout</li>
              <li><i>2</i> Bayar &amp; bukti</li>
              <li><i>3</i> Verifikasi</li>
            </ol>
          </div>

          <form className="tk-co cop-form" onSubmit={bayar} noValidate>
            <div className="tk-co-kiri">
              <section className="tk-co-kartu">
                <div className="cop-kartu-head">
                  <h3><UserRound size={16} strokeWidth={2} /> Data peserta</h3>
                  {profilLengkap && (
                    <Link to="/dashboard?tab=profil" className="cop-ubah"><PencilLine size={13} strokeWidth={2} /> Ubah</Link>
                  )}
                </div>
                {profilLengkap ? (
                  <>
                    <div className="cop-orang">
                      {pengguna.foto
                        ? <img src={pengguna.foto} alt={pengguna.nama} />
                        : <span className="cop-orang-ava">{inisial}</span>}
                      <span className="cop-orang-nama">
                        <strong>{pengguna.nama}</strong>
                        <small><Mail size={12} strokeWidth={1.9} /> {pengguna.email}</small>
                      </span>
                      <em className="cop-chip"><BadgeCheck size={13} strokeWidth={2} /> Data lengkap</em>
                    </div>
                    <div className="cop-data-grid">
                      <div>
                        <span><Phone size={12} strokeWidth={1.9} /> Nomor WhatsApp</span>
                        <strong>{pengguna.telepon}</strong>
                      </div>
                      <div>
                        <span><MapPin size={12} strokeWidth={1.9} /> Alamat</span>
                        <strong>{pengguna.alamat}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="cop-peringatan">
                    <TriangleAlert size={18} strokeWidth={2} />
                    <div>
                      <strong>Profil belum lengkap</strong>
                      <p>Lengkapi nama, email, nomor WhatsApp, dan alamat pada profil Anda untuk melanjutkan pembayaran.</p>
                      <Link to="/dashboard?tab=profil" className="cop-lengkapi">Lengkapi profil <ChevronRight size={13} strokeWidth={2} /></Link>
                    </div>
                  </div>
                )}
              </section>

              <section className="tk-co-kartu">
                <div className="cop-kartu-head">
                  <h3><QrCode size={16} strokeWidth={2} /> Pembayaran QRIS</h3>
                  <img className="cop-qris-logo" src="/pay/qris.svg" alt="QRIS" />
                </div>
                <ol className="cop-cara">
                  <li>
                    <i>1</i>
                    <span><strong>Klik “Bayar sekarang”</strong><small>Kode QRIS ditampilkan pada jendela pembayaran.</small></span>
                  </li>
                  <li>
                    <i>2</i>
                    <span><strong>Scan &amp; bayar</strong><small>Gunakan aplikasi pembayaran apa pun yang mendukung QRIS.</small></span>
                  </li>
                  <li>
                    <i>3</i>
                    <span><strong>Kirim bukti pembayaran</strong><small>Isi nama pengirim lalu unggah bukti pembayaran.</small></span>
                  </li>
                  <li>
                    <i>4</i>
                    <span><strong>Verifikasi admin</strong><small>Akses program terbuka otomatis setelah pembayaran dikonfirmasi.</small></span>
                  </li>
                </ol>
              </section>
            </div>

            <aside className="cop-kanan">
              <div className="tk-ringkasan">
                <h3>Pesanan Anda</h3>
                <div className="tk-co-item-list">
                  {baris.map((b) => (
                    <div className="tk-co-item" key={b.id}>
                      {b.gambar && <img src={b.gambar} alt={b.nama} />}
                      <span>
                        <strong>{b.nama}</strong>
                        <small>Program</small>
                      </span>
                      <b>{formatRupiah(b.harga)}</b>
                      {baris.length > 1 && (
                        <button type="button" className="cop-hapus" aria-label={`Hapus ${b.nama}`} onClick={() => hapusBaris(b.id)}>
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="cop-tambah">
                  <Link to="/program">+ Tambah program lain</Link>
                </p>
                <div className="tk-ringkasan-baris">
                  <span>Subtotal</span>
                  <strong>{formatRupiah(total)}</strong>
                </div>
                <div className="tk-ringkasan-baris tk-ringkasan-baris--total">
                  <span>Total</span>
                  <strong>{formatRupiah(total)}</strong>
                </div>
                {galat && <p className="tk-galat">{galat}</p>}
                <button type="submit" className="tk-btn tk-btn--blok" disabled={memproses || !profilLengkap}>
                  {memproses ? 'Memproses…' : 'Bayar sekarang'} <ChevronRight size={15} strokeWidth={2} />
                </button>
                <p className="tk-aman"><ShieldCheck size={13} strokeWidth={2} /> Transaksi terenkripsi dan tercatat di dashboard Anda.</p>
              </div>

              <div className="tk-ringkasan">
                <h3>Detail program</h3>
                <ul className="cop-detail-list">
                  <li><Layers size={14} strokeWidth={1.9} /> {program.jenis} · {program.mode}</li>
                  <li><LibraryBig size={14} strokeWidth={1.9} /> {kurikulum.length} materi · {semua.length} sub materi</li>
                  {pertemuan > 0 && (
                    <li><MonitorPlay size={14} strokeWidth={1.9} /> {pertemuan} pertemuan {sesiOnline > 0 && sesiOffline > 0 ? `(${sesiOnline} online, ${sesiOffline} offline)` : sesiOnline > 0 ? 'online' : 'offline'}</li>
                  )}
                  {mulai && <li><CalendarDays size={14} strokeWidth={1.9} /> Mulai {formatTanggalPanjang(mulai)}</li>}
                  <li><Languages size={14} strokeWidth={1.9} /> Bahasa Indonesia, Inggris & Arab</li>
                  <li><BadgeCheck size={14} strokeWidth={1.9} /> Sertifikat penyelesaian</li>
                </ul>
              </div>
            </aside>
          </form>
        </div>
      </main>

      {popupBuka && (
        <div className="bayar-overlay cop-overlay" role="presentation">
          <div className="bayar-modal cop-modal" role="dialog" aria-modal="true" aria-label="Selesaikan pembayaran">
            {selesai ? (
              <div className="cop-modal-ok">
                <span className="cop-modal-ic"><CheckCircle2 size={26} strokeWidth={2} /></span>
                <h3>Bukti pembayaran terkirim</h3>
                <p>
                  Tagihan <strong>{selesai.invoice}</strong> tercatat dengan bukti atas nama <strong>{atasNama}</strong>.
                  Akses program terbuka otomatis di dashboard setelah admin mengonfirmasi pembayaran.
                </p>
                <button type="button" className="tk-btn tk-btn--blok" onClick={() => navigate('/dashboard?tab=riwayat')}>
                  <LayoutDashboard size={15} strokeWidth={2} /> Lihat riwayat di dashboard
                </button>
              </div>
            ) : (
              <>
                <header className="cop-modal-head">
                  <h3>Selesaikan pembayaran</h3>
                  <p>Pembayaran atas nama {pengguna?.nama}. Tagihan tercatat setelah bukti terkirim.</p>
                </header>

                <div className="cop-modal-rinci">
                  <div><span>Metode</span><strong>{metode}</strong></div>
                  <div><span>Total</span><strong>{formatRupiah(total)}</strong></div>
                </div>

                <figure className="cop-qr">
                  <img
                    src="/pay/qris-code.png"
                    alt="Kode QRIS pembayaran Hifz"
                    onError={(e) => { e.currentTarget.src = '/pay/qris.svg' }}
                  />
                  <figcaption>Scan kode QRIS dari aplikasi pembayaran apa pun.</figcaption>
                </figure>

                <form className="cop-bukti" onSubmit={kirimBukti}>
                  <div className="cop-bukti-baris">
                    <label>
                      <span>Atas nama (pengirim pembayaran)</span>
                      <input type="text" value={atasNama} onChange={(e) => setAtasNama(e.target.value)} placeholder="Nama pada rekening / akun" />
                    </label>
                    <label className="cop-bukti-upload cop-bukti-upload--mini" title="Unggah bukti pembayaran">
                      <input type="file" accept="image/*" onChange={pilihBukti} />
                      {bukti
                        ? <img src={bukti} alt="Bukti pembayaran" />
                        : <CloudUpload size={16} strokeWidth={2} />}
                    </label>
                  </div>
                  {buktiGalat && <p className="tk-galat">{buktiGalat}</p>}
                  <div className="cop-modal-aksi">
                    <button type="button" className="tk-btn tk-btn--garis" onClick={() => setPopupBuka(false)}>Batal</button>
                    <button type="submit" className="tk-btn" disabled={memproses || !atasNama.trim() || !bukti}>
                      {memproses ? 'Memproses…' : 'Kirim bukti'}
                    </button>
                  </div>
                </form>

                <a
                  className="cop-cs"
                  href={`${WA_CS}?text=${encodeURIComponent("Assalamu'alaikum, saya butuh bantuan pembayaran program Hifz")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone size={14} strokeWidth={2} /> Hubungi Customer Service
                </a>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
      <CookieConsent />
    </>
  )
}
