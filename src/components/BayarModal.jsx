import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { simpanPesanan } from '../pages/toko/tokoData.js'
import { formatRupiah } from '../pages/admin/adminData.js'

const METODE = [
  { id: 'BCA', nama: 'BCA', ket: 'Transfer Virtual Account', logo: '/pay/bca.svg' },
  { id: 'BCA Syariah', nama: 'BCA Syariah', ket: 'Transfer Virtual Account', logo: '/pay/bca-syariah.svg' },
  { id: 'BSI', nama: 'BSI', ket: 'Transfer Virtual Account', logo: '/pay/bsi.svg' },
  { id: 'QRIS', nama: 'QRIS', ket: 'Scan dari semua e-wallet & m-banking', logo: '/pay/qris.svg' },
]

export default function BayarModal({ buka, item, total, penerima, onTutup, onSelesai }) {
  const [metode, setMetode] = useState('BCA')
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState('')
  const [pesanan, setPesanan] = useState(null)

  const buatTagihan = async () => {
    setMemproses(true)
    setGalat('')
    try {
      const hasil = await api('/toko/orders', {
        method: 'POST',
        body: { item, metode, total, jenis: 'program', penerima },
        auth: false,
      })
      simpanPesanan(hasil)
      setPesanan(hasil)
    } catch {
      setGalat('Tagihan gagal dibuat. Periksa koneksi lalu coba lagi.')
    } finally {
      setMemproses(false)
    }
  }

  const tutup = () => {
    if (memproses) return
    if (pesanan) {
      const selesai = pesanan
      setPesanan(null)
      onSelesai?.(selesai)
    } else {
      onTutup?.()
    }
  }

  return (
    <AnimatePresence>
      {buka && (
        <motion.div
          className="bayar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={tutup}
        >
          <motion.div
            className="bayar-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pilih metode pembayaran"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="bayar-tutup" aria-label="Tutup" onClick={tutup}>
              <X size={16} strokeWidth={2} />
            </button>

            {pesanan ? (
              <div className="bayar-sukses">
                <span className="bayar-sukses-ic"><BadgeCheck size={26} strokeWidth={1.9} /></span>
                <h3>Tagihan berhasil dibuat</h3>
                <p>
                  Selesaikan pembayaran <strong>{formatRupiah(pesanan.total)}</strong> melalui{' '}
                  <strong>{pesanan.metode}</strong> dengan nomor tagihan <strong>{pesanan.invoice}</strong>.
                  Status akan diperbarui setelah pembayaran dikonfirmasi.
                </p>
                <button type="button" className="btn btn-hero-primary bayar-btn" onClick={tutup}>
                  Lanjut ke dashboard
                </button>
              </div>
            ) : (
              <>
                <h3 className="bayar-judul">Pilih metode pembayaran</h3>
                <p className="bayar-item">
                  {item} · <strong>{formatRupiah(total)}</strong>
                </p>
                <div className="bayar-opsi-grup" role="radiogroup" aria-label="Metode pembayaran">
                  {METODE.map((m) => (
                    <label key={m.id} className={`bayar-opsi${metode === m.id ? ' is-pilih' : ''}`}>
                      <input
                        type="radio"
                        name="metode-bayar"
                        value={m.id}
                        checked={metode === m.id}
                        onChange={() => setMetode(m.id)}
                      />
                      <img src={m.logo} alt={m.nama} className="bayar-logo" loading="lazy" />
                      <span className="bayar-ket">
                        <strong>{m.nama}</strong>
                        <small>{m.ket}</small>
                      </span>
                    </label>
                  ))}
                </div>
                {galat && <p className="bayar-galat">{galat}</p>}
                <button
                  type="button"
                  className="btn btn-hero-primary bayar-btn"
                  disabled={memproses}
                  onClick={buatTagihan}
                >
                  {memproses ? 'Memproses…' : 'Buat tagihan & ikuti program'}
                </button>
                <p className="bayar-catatan">Tagihan tercatat berstatus “Menunggu” hingga admin mengonfirmasi pembayaran.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
