// Klien API Hifz — langsung ke Supabase (tanpa backend NestJS)
// Meniru kontrak REST lama: api('/berita'), api('/toko/orders', {...}), dst.
import { buatClientSekunder, supabase } from './supabase'

export const KUNCI_TOKEN = 'hifzToken'

export const simpanToken = (token) => localStorage.setItem(KUNCI_TOKEN, token)
export const hapusToken = () => {
  localStorage.removeItem(KUNCI_TOKEN)
  supabase.auth.signOut().catch(() => {})
}

// ---------- util ----------
const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

const tanggalId = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )

const gagal = (pesan) => {
  throw new Error(pesan)
}

const cekError = (error, pesanNotFound) => {
  if (!error) return
  if (error.code === 'PGRST116') gagal(pesanNotFound ?? 'Data tidak ditemukan')
  gagal(error.message ?? 'Terjadi kesalahan pada server')
}

const sanitasiUser = (u) => {
  if (!u) return u
  const { password: _p, ...rest } = u
  return rest
}

const serializeOrder = (o) => ({
  ...o,
  programIds: o.programIds ? JSON.parse(o.programIds) : undefined,
  tanggal: tanggalId(o.createdAt),
})

const serializePost = (p) => ({ ...p, tanggal: tanggalId(p.createdAt) })

const serializeProgram = (p) => {
  let kurikulum = []
  let jadwal = null
  try {
    kurikulum = JSON.parse(p.kurikulum)
  } catch {
    kurikulum = []
  }
  try {
    jadwal = JSON.parse(p.jadwal)
  } catch {
    jadwal = null
  }
  return { ...p, kurikulum, jadwal }
}

const sesiUser = async () => {
  const { data } = await supabase.auth.getUser()
  if (!data?.user) gagal('Sesi berakhir. Silakan masuk kembali.')
  return data.user
}

// Cek sesi Supabase masih hidup (tanpa lempar error)
export const adaSesi = async () => {
  const { data } = await supabase.auth.getSession()
  return Boolean(data?.session)
}

const ambilProfil = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  cekError(error)
  return data
}

// ---------- auth ----------
async function authRegister(body) {
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  })
  if (error) gagal(error.message)
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    gagal('Email sudah terdaftar')
  }
  // Tanpa sesi (mis. "Confirm email" aktif) — email sudah auto-konfirmasi
  // oleh trigger DB, jadi langsung login
  let session = data.session
  if (!session) {
    const { data: masuk, error: eMasuk } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })
    if (eMasuk) gagal('Akun dibuat, tapi gagal masuk otomatis. Silakan login manual.')
    session = masuk.session
  }
  const { data: user, error: e2 } = await supabase
    .from('users')
    .upsert({
      id: data.user.id,
      email: body.email,
      nama: body.nama,
      password: 'supabase-auth',
      peran: 'customer',
      updatedAt: now(),
    })
    .select()
    .single()
  cekError(e2)
  return { accessToken: session?.access_token ?? '', user: sanitasiUser(user) }
}

async function authLogin(body) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })
  if (error) gagal('Email atau password salah')
  let user = await ambilProfil(data.user.id)
  if (!user) {
    const { data: baru, error: e2 } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        nama: data.user.email.split('@')[0],
        password: 'supabase-auth',
        updatedAt: now(),
      })
      .select()
      .single()
    cekError(e2)
    user = baru
  }
  if (!user.aktif) {
    await supabase.auth.signOut().catch(() => {})
    gagal('Akun dinonaktifkan. Hubungi admin.')
  }
  return { accessToken: data.session.access_token, user: sanitasiUser(user) }
}

async function authMe() {
  const auth = await sesiUser()
  const user = await ambilProfil(auth.id)
  if (!user) gagal('Profil tidak ditemukan')
  return sanitasiUser(user)
}

// ---------- users ----------
async function buatPelamar(body) {
  const sekunder = buatClientSekunder()
  const passwordAcak = crypto.randomUUID() + crypto.randomUUID()
  const { data, error } = await sekunder.auth.signUp({
    email: body.email,
    password: passwordAcak,
  })
  if (error) gagal(error.message)
  // email sudah terdaftar — anggap lamaran diterima tanpa mengubah akun lama
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: true, email: body.email }
  }
  const { data: user, error: e2 } = await sekunder
    .from('users')
    .upsert({
      id: data.user.id,
      email: body.email,
      nama: body.nama,
      password: 'supabase-auth',
      peran: 'pelamar',
      telepon: body.telepon || null,
      alamat: body.alamat || null,
      bio: body.bio || null,
      updatedAt: now(),
    })
    .select()
    .single()
  cekError(e2)
  return sanitasiUser(user)
}

async function adminBuatUser(body) {
  const sekunder = buatClientSekunder()
  const { data, error } = await sekunder.auth.signUp({
    email: body.email,
    password: body.password,
  })
  if (error) gagal(error.message)
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    gagal('Email sudah terdaftar')
  }
  const { data: user, error: e2 } = await supabase
    .from('users')
    .upsert({
      id: data.user.id,
      email: body.email,
      nama: body.nama,
      password: 'supabase-auth',
      peran: body.peran ?? 'customer',
      telepon: body.telepon ?? null,
      alamat: body.alamat ?? null,
      bio: body.bio ?? null,
      foto: body.foto ?? null,
      updatedAt: now(),
    })
    .select()
    .single()
  cekError(e2)
  return sanitasiUser(user)
}

async function updateUser(id, body) {
  const data = { updatedAt: now() }
  for (const k of ['nama', 'email', 'peran', 'telepon', 'alamat', 'alamatDetail', 'bio', 'foto', 'aktif']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  // password user lain tidak bisa diubah dari browser (butuh service role)
  if (body.password) {
    const { data: auth } = await supabase.auth.getUser()
    if (auth?.user?.id === id) {
      const { error } = await supabase.auth.updateUser({ password: body.password })
      if (error) gagal(error.message)
    }
  }
  const { data: user, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  cekError(error, 'Pengguna tidak ditemukan')
  return sanitasiUser(user)
}

// ---------- toko: orders ----------
async function buatOrder(body) {
  const invoice = `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
  const { programIds, ...data } = body
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      ...data,
      invoice,
      programIds: programIds?.length ? JSON.stringify(programIds) : null,
      updatedAt: now(),
    })
    .select()
    .single()
  cekError(error)
  return serializeOrder(order)
}

async function daftarkanPeserta(order) {
  if (!order.email || !order.programIds) return
  let ids = []
  try {
    ids = JSON.parse(order.programIds)
  } catch {
    return
  }
  const rows = ids.map((programId) => ({ id: newId(), email: order.email, programId }))
  await supabase
    .from('enrollments')
    .upsert(rows, { onConflict: 'email,programId', ignoreDuplicates: true })
}

async function updateStatusOrder(invoice, status) {
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status, updatedAt: now() })
    .eq('invoice', invoice)
    .select()
    .single()
  cekError(error, 'Pesanan tidak ditemukan')
  if (status === 'Lunas') await daftarkanPeserta(order)
  return serializeOrder(order)
}

// ---------- router ----------
export async function api(path, { method = 'GET', body } = {}) {
  const p = path.split('?')[0]
  const seg = p.split('/').filter(Boolean)

  // ===== AUTH =====
  if (p === '/auth/register' && method === 'POST') return authRegister(body)
  if (p === '/auth/login' && method === 'POST') return authLogin(body)
  if (p === '/auth/me') return authMe()

  // ===== USERS =====
  if (p === '/users/pelamar' && method === 'POST') return buatPelamar(body)
  if (p === '/users/me/foto' && method === 'PATCH') {
    const auth = await sesiUser()
    return updateUser(auth.id, { foto: body.foto })
  }
  if (p === '/users/me' && method === 'PATCH') {
    const auth = await sesiUser()
    return updateUser(auth.id, body)
  }
  if (p === '/users' && method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(sanitasiUser)
  }
  if (p === '/users' && method === 'POST') return adminBuatUser(body)
  if (seg[0] === 'users' && seg.length === 3 && seg[2] === 'peran' && method === 'PATCH') {
    return updateUser(seg[1], { peran: body.peran })
  }
  if (seg[0] === 'users' && seg.length === 3 && seg[2] === 'status' && method === 'PATCH') {
    const user = await ambilProfil(seg[1])
    if (!user) gagal('Pengguna tidak ditemukan')
    return updateUser(seg[1], { aktif: !user.aktif })
  }
  if (seg[0] === 'users' && seg.length === 2 && method === 'GET') {
    const user = await ambilProfil(seg[1])
    if (!user) gagal('Pengguna tidak ditemukan')
    return sanitasiUser(user)
  }
  if (seg[0] === 'users' && seg.length === 2 && method === 'PATCH') {
    return updateUser(seg[1], body)
  }

  // ===== TOKO: PRODUCTS =====
  if (p === '/toko/products' && method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('aktif', true)
      .order('createdAt', { ascending: false })
    cekError(error)
    return data
  }
  if (p === '/toko/products/admin/semua') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data
  }
  if (p === '/toko/products' && method === 'POST') {
    const { data, error } = await supabase
      .from('products')
      .insert({ id: newId(), ...body, stok: body.stok ?? 0, updatedAt: now() })
      .select()
      .single()
    cekError(error)
    return data
  }
  if (seg[0] === 'toko' && seg[1] === 'products' && seg.length === 4 && seg[3] === 'aktif') {
    const { data: produk, error } = await supabase
      .from('products')
      .select('aktif')
      .eq('id', seg[2])
      .single()
    cekError(error, 'Produk tidak ditemukan')
    const { data, error: e2 } = await supabase
      .from('products')
      .update({ aktif: !produk.aktif, updatedAt: now() })
      .eq('id', seg[2])
      .select()
      .single()
    cekError(e2, 'Produk tidak ditemukan')
    return data
  }
  if (seg[0] === 'toko' && seg[1] === 'products' && seg.length === 3 && method === 'PATCH') {
    const { data, error } = await supabase
      .from('products')
      .update({ ...body, updatedAt: now() })
      .eq('id', seg[2])
      .select()
      .single()
    cekError(error, 'Produk tidak ditemukan')
    return data
  }
  if (seg[0] === 'toko' && seg[1] === 'products' && seg.length === 3 && method === 'DELETE') {
    const { error } = await supabase.from('products').delete().eq('id', seg[2])
    cekError(error, 'Produk tidak ditemukan')
    return { ok: true }
  }

  // ===== TOKO: ORDERS =====
  if (p === '/toko/orders' && method === 'POST') return buatOrder(body)
  if (p === '/toko/orders/peserta/semua') {
    const { data, error } = await supabase.from('enrollments').select('*')
    cekError(error)
    const peta = {}
    for (const r of data) (peta[r.programId] ??= []).push(r.email)
    return peta
  }
  if (p === '/toko/orders' && method === 'GET') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(serializeOrder)
  }
  if (seg[0] === 'toko' && seg[1] === 'orders' && seg.length === 4 && seg[3] === 'status') {
    return updateStatusOrder(seg[2], body.status)
  }
  if (seg[0] === 'toko' && seg[1] === 'orders' && seg.length === 4 && seg[3] === 'admin') {
    const data = { updatedAt: now() }
    if (body.invoiceFile !== undefined) data.invoiceFile = body.invoiceFile
    if (body.keterangan !== undefined) data.keterangan = body.keterangan
    const { data: order, error } = await supabase
      .from('orders')
      .update(data)
      .eq('invoice', seg[2])
      .select()
      .single()
    cekError(error, 'Pesanan tidak ditemukan')
    return serializeOrder(order)
  }
  if (seg[0] === 'toko' && seg[1] === 'orders' && seg.length === 3 && method === 'GET') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('invoice', seg[2])
      .single()
    cekError(error, 'Pesanan tidak ditemukan')
    return serializeOrder(data)
  }

  // ===== BERITA =====
  if (p === '/berita' && method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'terbit')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(serializePost)
  }
  if (p === '/berita/admin/semua') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(serializePost)
  }
  if (p === '/berita' && method === 'POST') {
    const { data, error } = await supabase
      .from('posts')
      .insert({ id: newId(), ...body, updatedAt: now() })
      .select()
      .single()
    cekError(error)
    return serializePost(data)
  }
  if (seg[0] === 'berita' && seg.length === 2 && method === 'PATCH') {
    const { data, error } = await supabase
      .from('posts')
      .update({ ...body, updatedAt: now() })
      .eq('id', seg[1])
      .select()
      .single()
    cekError(error, 'Berita tidak ditemukan')
    return serializePost(data)
  }
  if (seg[0] === 'berita' && seg.length === 2 && method === 'DELETE') {
    const { error } = await supabase.from('posts').delete().eq('id', seg[1])
    cekError(error, 'Berita tidak ditemukan')
    return { ok: true }
  }

  // ===== PROGRAMS =====
  if (p === '/programs' && method === 'GET') {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('status', 'terbit')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(serializeProgram)
  }
  if (p === '/programs/admin/semua') {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('createdAt', { ascending: false })
    cekError(error)
    return data.map(serializeProgram)
  }
  if (p === '/programs' && method === 'POST') {
    const { data, error } = await supabase
      .from('programs')
      .insert({ id: newId(), ...body, harga: body.harga ?? 0, updatedAt: now() })
      .select()
      .single()
    cekError(error)
    return serializeProgram(data)
  }
  if (seg[0] === 'programs' && seg.length === 2 && method === 'PATCH') {
    const { kurikulum, jadwal, ...rest } = body
    const data = { ...rest, updatedAt: now() }
    if (kurikulum !== undefined) data.kurikulum = JSON.stringify(kurikulum)
    if (jadwal !== undefined) data.jadwal = JSON.stringify(jadwal)
    const { data: program, error } = await supabase
      .from('programs')
      .update(data)
      .eq('id', seg[1])
      .select()
      .single()
    if (error?.code === 'PGRST116' && !(await adaSesi()))
      gagal('Sesi berakhir. Silakan masuk kembali sebagai admin.')
    cekError(error, 'Program tidak ditemukan')
    return serializeProgram(program)
  }
  if (seg[0] === 'programs' && seg.length === 2 && method === 'DELETE') {
    const { error } = await supabase.from('programs').delete().eq('id', seg[1])
    cekError(error, 'Program tidak ditemukan')
    return { ok: true }
  }
  if (seg[0] === 'programs' && seg.length === 2 && method === 'GET') {
    const { data, error } = await supabase.from('programs').select('*').eq('id', seg[1]).single()
    cekError(error, 'Program tidak ditemukan')
    return serializeProgram(data)
  }

  gagal(`Endpoint tidak dikenal: ${method} ${path}`)
}

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
