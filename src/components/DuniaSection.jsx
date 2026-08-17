import { useEffect, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

/* Benua sebagai poligon kasar (lon, lat), dirasterisasi jadi dot-matrix */
const BENUA = [
  // Greenland
  [[-45, 83], [-20, 82], [-22, 70], [-42, 60], [-55, 68], [-55, 78]],
  // Amerika Utara
  [[-165, 68], [-130, 72], [-85, 72], [-70, 63], [-55, 60], [-58, 48], [-70, 44], [-75, 35], [-81, 25], [-95, 28], [-97, 20], [-92, 15], [-83, 8], [-88, 15], [-105, 19], [-112, 30], [-125, 42], [-128, 50], [-150, 60], [-168, 60]],
  // Amerika Selatan
  [[-78, 7], [-60, 10], [-50, 5], [-35, -6], [-38, -15], [-48, -28], [-57, -38], [-65, -47], [-68, -55], [-73, -50], [-72, -35], [-70, -18], [-80, -5], [-80, 2]],
  // Inggris
  [[-8, 58], [0, 56], [1, 52], [-3, 50], [-8, 53]],
  // Eropa
  [[-10, 44], [-10, 36], [0, 40], [10, 42], [15, 38], [25, 36], [30, 45], [40, 48], [45, 60], [40, 68], [30, 70], [22, 63], [10, 58], [5, 62], [-5, 58], [0, 50]],
  // Afrika
  [[-17, 15], [-10, 30], [-5, 35], [10, 37], [20, 33], [32, 31], [43, 11], [51, 12], [43, -5], [40, -15], [35, -25], [30, -34], [20, -35], [12, -18], [8, -5], [-8, 5], [-17, 10]],
  // Jazirah Arab
  [[35, 30], [48, 30], [58, 23], [55, 15], [43, 12], [33, 28]],
  // India
  [[68, 23], [77, 33], [88, 26], [90, 22], [85, 20], [80, 12], [77, 8], [72, 18]],
  // Asia utama
  [[30, 45], [40, 48], [45, 60], [60, 70], [70, 73], [100, 78], [180, 71], [180, 66], [160, 60], [140, 50], [135, 44], [127, 40], [120, 35], [122, 28], [115, 22], [108, 18], [105, 12], [100, 14], [98, 20], [92, 22], [88, 24], [80, 30], [70, 35], [60, 35], [50, 37], [40, 40]],
  // Jepang
  [[130, 31], [142, 45], [146, 44], [134, 32]],
  // Filipina
  [[118, 14], [120, 18], [126, 7], [122, 6]],
  // Nusantara
  [[95, 5], [105, 2], [115, 0], [125, 2], [135, -2], [140, -8], [120, -9], [110, -8], [100, -3], [95, 2]],
  // Australia
  [[114, -22], [122, -14], [132, -11], [142, -11], [147, -19], [153, -27], [150, -37], [140, -38], [129, -32], [115, -34], [113, -26]],
  // Selandia Baru
  [[166, -40], [174, -35], [178, -38], [172, -44], [166, -46]],
]

const AKTIF = [
  { lon: -98, lat: 39, nama: 'Amerika', bendera: '\u{1F1FA}\u{1F1F8}' },
  { lon: -51, lat: -10, nama: 'Brasil', bendera: '\u{1F1E7}\u{1F1F7}' },
  { lon: -2, lat: 53, nama: 'Inggris', bendera: '\u{1F1EC}\u{1F1E7}', dx: -33, dy: 3 },
  { lon: 2, lat: 47, nama: 'Prancis', bendera: '\u{1F1EB}\u{1F1F7}', dx: 34, dy: 6 },
  { lon: -4, lat: 40, nama: 'Spanyol', bendera: '\u{1F1EA}\u{1F1F8}', dy: 16 },
  { lon: 10, lat: 51, nama: 'Jerman', bendera: '\u{1F1E9}\u{1F1EA}', dx: 32, dy: 0 },
  { lon: 13, lat: 42, nama: 'Italia', bendera: '\u{1F1EE}\u{1F1F9}', dx: 11, dy: 16 },
  { lon: 33, lat: 39, nama: 'Turki', bendera: '\u{1F1F9}\u{1F1F7}', dx: 28, dy: 3 },
  { lon: 60, lat: 58, nama: 'Rusia', bendera: '\u{1F1F7}\u{1F1FA}' },
  { lon: 30, lat: 27, nama: 'Mesir', bendera: '\u{1F1EA}\u{1F1EC}', dx: -29, dy: 3 },
  { lon: 45, lat: 24, nama: 'Arab Saudi', bendera: '\u{1F1F8}\u{1F1E6}', dy: 17 },
  { lon: 54, lat: 24, nama: 'UEA', bendera: '\u{1F1E6}\u{1F1EA}', dx: 23, dy: 3 },
  { lon: 78, lat: 22, nama: 'India', bendera: '\u{1F1EE}\u{1F1F3}', dy: 17 },
  { lon: 104, lat: 35, nama: 'Tiongkok', bendera: '\u{1F1E8}\u{1F1F3}' },
  { lon: 138, lat: 37, nama: 'Jepang', bendera: '\u{1F1EF}\u{1F1F5}', dx: 32, dy: 3 },
  { lon: 128, lat: 36, nama: 'Korea Selatan', bendera: '\u{1F1F0}\u{1F1F7}', dx: -20, dy: 19 },
  { lon: 102, lat: 4, nama: 'Malaysia', bendera: '\u{1F1F2}\u{1F1FE}', dx: -36, dy: 3 },
  { lon: 104, lat: 1, nama: 'Singapura', bendera: '\u{1F1F8}\u{1F1EC}', dx: 39, dy: 3 },
  { lon: 113, lat: -6, nama: 'Indonesia', bendera: '\u{1F1EE}\u{1F1E9}', dy: 18 },
  { lon: 134, lat: -25, nama: 'Australia', bendera: '\u{1F1E6}\u{1F1FA}', dx: 38, dy: 3 },
]

const dalamPoligon = (poly, lon, lat) => {
  let dalam = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dalam = !dalam
  }
  return dalam
}

const LON_MIN = -180
const LON_MAX = 185
const LAT_MAX = 84
const LAT_MIN = -58
const KOLOM = 105
const LANGKAH = (LON_MAX - LON_MIN) / KOLOM
const BARIS = Math.round((LAT_MAX - LAT_MIN) / LANGKAH)
const SKALA = 7

const keXY = (lon, lat) => ({
  x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * KOLOM * SKALA,
  y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * BARIS * SKALA,
})

const DOTS = []
for (let r = 0; r <= BARIS; r++) {
  const lat = LAT_MAX - r * LANGKAH
  for (let c = 0; c <= KOLOM; c++) {
    const lon = LON_MIN + c * LANGKAH
    if (BENUA.some((p) => dalamPoligon(p, lon, lat))) DOTS.push(keXY(lon, lat))
  }
}

export default function DuniaSection({ polos = false }) {
  const lebar = KOLOM * SKALA
  const tinggi = BARIS * SKALA
  const petaRef = useRef(null)

  // Zoom scroll: mulai kecil di tengah lalu membesar penuh
  const { scrollYProgress } = useScroll({
    target: petaRef,
    offset: ['start 100%', 'start 62%'],
  })
  const halus = useSpring(scrollYProgress, { stiffness: 48, damping: 20, mass: 0.9, restDelta: 0.0005 })
  const zoom = useTransform(halus, [0, 1], [0.55, 1])

  // Di layar sempit, mulai tampilan peta dari Indonesia
  useEffect(() => {
    const el = petaRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const indo = AKTIF.find((a) => a.nama === 'Indonesia')
    const xIndo = ((indo.lon - LON_MIN) / (LON_MAX - LON_MIN)) * el.scrollWidth
    el.scrollLeft = Math.max(0, xIndo - el.clientWidth / 2)
  }, [])

  const peta = (
    <div ref={petaRef} className="dunia-peta">
      <motion.div
        className="dunia-peta-zoom"
        style={{ scale: zoom, transformOrigin: '50% 50%' }}
      >
        <svg viewBox={`0 0 ${lebar} ${tinggi}`} role="img" aria-label="Peta dunia jangkauan Hifz">
          {DOTS.map((d, i) => (
            <circle key={i} className="dunia-dot" cx={d.x} cy={d.y} r={2.1} />
          ))}
          {AKTIF.map((a) => {
            const { x, y } = keXY(a.lon, a.lat)
            const dx = a.dx ?? 0
            const anchor = dx > 15 ? 'start' : dx < -15 ? 'end' : 'middle'
            const lx = anchor === 'start' ? x + 9 : anchor === 'end' ? x - 9 : x + dx
            const ly = y + (a.dy ?? -12)
            return (
              <g key={a.nama} className="dunia-dot-aktif">
                <circle className="dunia-ping" cx={x} cy={y} r={5.4} />
                <circle cx={x} cy={y} r={4.6} />
                <text className="dunia-label" x={lx} y={ly} textAnchor={anchor}>
                  {a.bendera} {a.nama}
                </text>
              </g>
            )
          })}
        </svg>
      </motion.div>
    </div>
  )

  if (polos) return peta

  return (
    <section className="dunia-home" id="dunia">
      <div className="container">
        <motion.div
          className="dunia-copy"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="psec-title">Tanpa Batas Jarak dan Waktu, Terhubung ke Seluruh Dunia</h2>
          <p className="bnc-sub">
            Kami menjangkau Teman Hifz di berbagai negara, belajar bersama guru pilihan
            yang menguasai berbagai bahasa. Di mana pun kamu berada, ayo tumbuh bersama Hifz.
          </p>
        </motion.div>

        {peta}
      </div>
    </section>
  )
}
