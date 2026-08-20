// Klien Supabase — koneksi langsung dari browser (tanpa backend)
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di .env')
}

export const supabase = createClient(url, anonKey)

// Klien sekunder tanpa sesi persisten — untuk mendaftarkan user lain
// (admin membuat akun / formulir pelamar) tanpa mengganggu sesi yang aktif
export const buatClientSekunder = () =>
  createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
