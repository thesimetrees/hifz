import { useRef, useState } from 'react'
import { Play } from 'lucide-react'

/* Pemutar YouTube tertutup: iframe tanpa kontrol (controls=0, disablekb=1, fs=0)
   ditutup lapisan overlay sehingga tautan/logo tidak bisa diklik, tidak bisa
   diunduh, dan kecepatan tidak bisa diubah. Play/jeda dikirim via postMessage. */
export default function PlayerTertutup({ videoId, judul = 'Video pembelajaran' }) {
  const iframeRef = useRef(null)
  const [main, setMain] = useState(false)

  const perintah = (func) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*',
    )
  }

  const togglePutar = () => {
    perintah(main ? 'pauseVideo' : 'playVideo')
    setMain((v) => !v)
  }

  return (
    <div className="lms-player" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&disablekb=1&rel=0&fs=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
        title={judul}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
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
    </div>
  )
}
