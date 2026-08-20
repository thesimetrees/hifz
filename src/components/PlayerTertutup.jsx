import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Play, RotateCcw } from 'lucide-react'

const KUNCI_POSISI = 'hifzVideoPosisi'

const bacaPosisi = () => {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_POSISI) || '{}')
  } catch {
    return {}
  }
}

const simpanPosisi = (id, t, d) => {
  try {
    const peta = bacaPosisi()
    peta[id] = { t, d }
    localStorage.setItem(KUNCI_POSISI, JSON.stringify(peta))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

const hapusPosisi = (id) => {
  try {
    const peta = bacaPosisi()
    delete peta[id]
    localStorage.setItem(KUNCI_POSISI, JSON.stringify(peta))
  } catch {
    // penyimpanan lokal tidak tersedia
  }
}

const formatDetik = (t) => {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/* Pemutar YouTube tertutup: iframe tanpa kontrol (controls=0, disablekb=1, fs=0)
   ditutup lapisan overlay sehingga tautan/logo tidak bisa diklik, tidak bisa
   diunduh, dan kecepatan tidak bisa diubah. Play/jeda dikirim via postMessage. */
export default function PlayerTertutup({ videoId, judul = 'Video pembelajaran' }) {
  const iframeRef = useRef(null)
  const simpanTerakhir = useRef(0)
  const durasiRef = useRef(0)
  // titik terjauh yang sudah ditonton — batas maju saat menggeser bar
  const maksRef = useRef(bacaPosisi()[videoId]?.t ?? 0)
  const [main, setMain] = useState(false)
  const [penuh, setPenuh] = useState(false)
  const [progres, setProgres] = useState(0)
  const [maksPct, setMaksPct] = useState(0)
  // posisi tersimpan dari sesi sebelumnya → tawarkan lanjutkan / mulai dari awal
  const [sambung, setSambung] = useState(() => {
    const p = bacaPosisi()[videoId]
    return p && p.t > 10 && (!p.d || p.t < p.d * 0.95) ? p : null
  })

  const perintah = (func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    )
  }

  const togglePutar = () => {
    perintah(main ? 'pauseVideo' : 'playVideo')
    setMain((v) => !v)
  }

  const lanjutkan = () => {
    perintah('seekTo', [sambung.t, true])
    perintah('playVideo')
    if (sambung.d) setProgres(Math.min(100, (sambung.t / sambung.d) * 100))
    setSambung(null)
    setMain(true)
  }

  const mulaiAwal = () => {
    perintah('seekTo', [0, true])
    perintah('playVideo')
    hapusPosisi(videoId)
    setProgres(0)
    setSambung(null)
    setMain(true)
  }

  // klik bar: mundur bebas, maju hanya sampai bagian yang sudah ditonton
  const klikBar = (e) => {
    const durasi = durasiRef.current
    if (!durasi) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const tujuan = Math.min(frac * durasi, maksRef.current)
    perintah('seekTo', [tujuan, true])
    setProgres(Math.min(100, (tujuan / durasi) * 100))
    if (sambung) setSambung(null)
  }

  // terima progres pemutaran dari iframe YouTube (infoDelivery) dan simpan posisi
  useEffect(() => {
    const onPesan = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      let d
      try {
        d = JSON.parse(e.data)
      } catch {
        return
      }
      const info = d?.info
      if (d?.event === 'infoDelivery' && info?.duration > 0 && info.currentTime != null) {
        durasiRef.current = info.duration
        // lompatan maju di luar batas tontonan → tarik kembali
        if (info.currentTime > maksRef.current + 2) {
          perintah('seekTo', [maksRef.current, true])
          return
        }
        maksRef.current = Math.max(maksRef.current, info.currentTime)
        setMaksPct(Math.min(100, (maksRef.current / info.duration) * 100))
        setProgres(Math.min(100, (info.currentTime / info.duration) * 100))
        const kini = Date.now()
        if (kini - simpanTerakhir.current > 3000) {
          simpanTerakhir.current = kini
          if (info.currentTime >= info.duration * 0.95) hapusPosisi(videoId)
          else simpanPosisi(videoId, maksRef.current, info.duration)
        }
      }
    }
    window.addEventListener('message', onPesan)
    return () => window.removeEventListener('message', onPesan)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  useEffect(() => {
    if (!penuh) return
    const onEsc = (e) => e.key === 'Escape' && setPenuh(false)
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [penuh])

  const daftarkan = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: videoId }),
      '*',
    )
  }

  return (
    <div className="lms-player-wrap">
      <div className={`lms-player${penuh ? ' is-penuh' : ''}`} onContextMenu={(e) => e.preventDefault()}>
        <iframe
          ref={iframeRef}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&rel=0&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
          title={judul}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          onLoad={daftarkan}
        />
        <button
          type="button"
          className={`lms-player-tirai${main ? ' is-main' : ''}`}
          onClick={togglePutar}
          aria-label={main ? 'Jeda video' : 'Putar video'}
        >
          <span className="lms-player-tombol" aria-hidden="true">
            <Play size={22} strokeWidth={2} />
          </span>
        </button>
        <button
          type="button"
          className="lms-player-penuh"
          onClick={() => setPenuh((v) => !v)}
          aria-label={penuh ? 'Keluar dari layar penuh' : 'Lihat layar penuh'}
          title={penuh ? 'Keluar dari layar penuh' : 'Lihat layar penuh'}
        >
          {penuh ? <Minimize2 size={15} strokeWidth={2} /> : <Maximize2 size={15} strokeWidth={2} />}
        </button>
        {sambung && (
          <div className="lms-sambung" role="dialog" aria-label="Lanjutkan menonton">
            <p>Terakhir berhenti di {formatDetik(sambung.t)}</p>
            <div className="lms-sambung-aksi">
              <button type="button" className="lms-sambung-btn is-utama" onClick={lanjutkan}>
                <Play size={13} strokeWidth={2} /> Lanjutkan
              </button>
              <button type="button" className="lms-sambung-btn" onClick={mulaiAwal}>
                <RotateCcw size={13} strokeWidth={2} /> Mulai dari awal
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="lms-bar" aria-hidden={penuh}>
        <div
          className="lms-bar-rel"
          role="slider"
          aria-valuenow={Math.round(progres)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres video — klik untuk mengulang bagian yang sudah ditonton"
          title="Klik untuk mengulang — tidak bisa melompat ke bagian yang belum ditonton"
          onClick={klikBar}
        >
          <i className="is-maks" style={{ width: `${maksPct}%` }} />
          <i style={{ width: `${progres}%` }} />
        </div>
        <span>{Math.round(progres)}%</span>
      </div>
    </div>
  )
}
