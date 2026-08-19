// Klien API Hifz — lewat proxy Vite /api agar bisa diakses dari perangkat lain
const BASE = import.meta.env.VITE_API_URL ?? '/api'

export const KUNCI_TOKEN = 'hifzToken'

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem(KUNCI_TOKEN)
  if (auth && token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const pesan = Array.isArray(data?.message) ? data.message[0] : data?.message
    throw new Error(pesan ?? 'Terjadi kesalahan pada server')
  }
  return data
}

export const simpanToken = (token) => localStorage.setItem(KUNCI_TOKEN, token)
export const hapusToken = () => localStorage.removeItem(KUNCI_TOKEN)

// Kompres foto profil ke JPEG kecil (data URL)
export const kompresFoto = (file, ukuran = 320) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const skala = Math.min(1, ukuran / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * skala)
        canvas.height = Math.round(img.height * skala)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
