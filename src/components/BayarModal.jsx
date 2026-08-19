import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CloudUpload, X } from 'lucide-react'
import { api, kompresFoto } from '../lib/api.js'
import { simpanPesanan } from '../pages/toko/tokoData.js'
import { formatRupiah } from '../pages/admin/adminData.js'

export default function BayarModal({ buka, item, total, penerima, email, programIds, onTutup, onSelesai }) {
  const [atasNama, setAtasNama] = useState('')
  const [bukti, setBukti] = useState('')
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState('')
  const [pesanan, setPesanan] = useState(null)
  const perpanjang = String(item || '').startsWith('Perpanjangan')

  const pilihBukti = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setBukti(await kompresFoto(file, 900))
      setGalat('')
    } catch {
      setGalat('File tidak bisa dibaca. Gunakan foto atau tangkapan layar.')
    }
  }

  const kirimBukti = async (e) => {
    e.preventDefault()
    if (!atasNama.trim() || !bukti) {
      setGalat('Isi nama pengirim dan unggah bukti pembayaran.')
      return
    }
    setMemproses(true)
    setGalat('')
    try {
      const hasil = await api('/toko/orders', {
        method: 'POST',
        body: { item, metode: 'QRIS', total, jenis: 'program', penerima, email, programIds },
        auth: false,
      })
      simpanPesanan({
        ...hasil,
        email,
        programIds,
        buktiBayar: bukti,
        atasNama: atasNama.trim(),
        buktiWaktu: new Date().toISOString(),
      })
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
            aria-label="Selesaikan pembayaran"
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
                <span className="bayar-sukses-ic"><CheckCircle2 size={26} strokeWidth={1.9} /></span>
                <h3>Bukti pembayaran terkirim</h3>
                <p>
                  Tagihan <strong>{pesanan.invoice}</strong> sebesar <strong>{formatRupiah(pesanan.total)}</strong> tercatat
                  dengan bukti atas nama <strong>{atasNama}</strong>. Status diperbarui setelah admin mengonfirmasi pembayaran.
                </p>
                <button type="button" className="btn btn-hero-primary bayar-btn" onClick={tutup}>
                  Lanjut ke dashboard
                </button>
              </div>
            ) : (
              <>
                <h3 className="bayar-judul">Selesaikan pembayaran</h3>
                <p className="bayar-item">
                  {item} · <strong>{formatRupiah(total)}</strong>
                </p>
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
                      <input
                        type="text"
                        value={atasNama}
                        onChange={(e) => setAtasNama(e.target.value)}
                        placeholder="Nama pada rekening / akun"
                      />
                    </label>
                    <label className="cop-bukti-upload cop-bukti-upload--mini" title="Unggah bukti pembayaran">
                      <input type="file" accept="image/*" onChange={pilihBukti} />
                      {bukti
                        ? <img src={bukti} alt="Bukti pembayaran" />
                        : <CloudUpload size={16} strokeWidth={2} />}
                    </label>
                  </div>
                  {galat && <p className="bayar-galat">{galat}</p>}
                  <button
                    type="submit"
                    className="btn btn-hero-primary bayar-btn"
                    disabled={memproses || !atasNama.trim() || !bukti}
                  >
                    {memproses ? 'Memproses…' : perpanjang ? 'Kirim bukti perpanjangan' : 'Kirim bukti pembayaran'}
                  </button>
                </form>
                <p className="bayar-catatan">Tagihan tercatat berstatus “Menunggu” hingga admin mengonfirmasi pembayaran.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
