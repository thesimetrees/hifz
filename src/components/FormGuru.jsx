import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Banknote,
  BookMarked,
  CloudUpload,
  ContactRound,
  FileBadge2,
  HandCoins,
  MapPinned,
  NotebookPen,
  Paperclip,
  Plus,
  ScanFace,
  Trash2,
  X,
} from 'lucide-react'

export const benderaBahasa = {
  Indonesia: '\u{1F1EE}\u{1F1E9}',
  Arab: '\u{1F1F8}\u{1F1E6}',
  Inggris: '\u{1F1EC}\u{1F1E7}',
  Prancis: '\u{1F1EB}\u{1F1F7}',
  Jerman: '\u{1F1E9}\u{1F1EA}',
  Mandarin: '\u{1F1E8}\u{1F1F3}',
  Turki: '\u{1F1F9}\u{1F1F7}',
}

const daftarBank = ['Bank Syariah Indonesia (BSI)', 'BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga Syariah', 'Bank Muamalat']
const bidangOpsi = ['Tilawah', 'Bahasa Arab', 'Islamic Studies', 'Turats']

const API_WILAYAH = 'https://cdn.jsdelivr.net/gh/emsifa/api-wilayah-indonesia@gh-pages/api'

const rapiWilayah = (nama) =>
  nama
    .toLowerCase()
    .split(' ')
    .map((kata) => (['di', 'dki'].includes(kata) ? kata.toUpperCase() : kata.charAt(0).toUpperCase() + kata.slice(1)))
    .join(' ')

const formAwal = {
  nama: '',
  gelar: '',
  email: '',
  wa: '',
  tglLahir: '',
  gender: 'Laki-laki',
  provinsi: { id: '', nama: '' },
  kota: { id: '', nama: '' },
  kecamatan: { id: '', nama: '' },
  kelurahan: { id: '', nama: '' },
  alamat: '',
  lat: '',
  lng: '',
  nik: '',
  npwp: '',
  bank: daftarBank[0],
  noRek: '',
  namaRek: '',
  bidang: bidangOpsi[0],
  profil: '',
  bahasa: ['Indonesia', 'Arab'],
  pendidikan: [{ jenis: 'Formal', nama: '' }],
  sertifikasi: [''],
}

function UploadBox({ label, hint, accept, nama, onPilih, wajib }) {
  return (
    <label className="dtf-upload">
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPilih(f)
        }}
      />
      <span className="dtf-upload-ic"><CloudUpload size={16} strokeWidth={2} aria-hidden="true" /></span>
      <span className="dtf-upload-teks">
        <strong>{label} {wajib && <i>*</i>}</strong>
        {nama ? <em className="dtf-upload-nama"><Paperclip size={11} strokeWidth={2} aria-hidden="true" /> {nama}</em> : <em>{hint}</em>}
      </span>
    </label>
  )
}

export default function FormGuru({ mode = 'daftar', awal, onKirim }) {
  const profilMode = mode === 'profil'
  const [form, setForm] = useState(() => ({ ...formAwal, ...awal }))
  const [berkas, setBerkas] = useState({ fotoProfil: null, fotoKtp: '', fotoNpwp: '', cv: '', surat: '' })
  const [galat, setGalat] = useState('')
  const [disimpan, setDisimpan] = useState(false)

  const [wilayah, setWilayah] = useState({ provinsi: [], kota: [], kecamatan: [], kelurahan: [] })
  const [lokasiStatus, setLokasiStatus] = useState('')

  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    fetch(`${API_WILAYAH}/provinces.json`)
      .then((r) => r.json())
      .then((d) => setWilayah((w) => ({ ...w, provinsi: d })))
      .catch(() => {})
  }, [])

  const pilihWilayah = (tingkat, e) => {
    const opt = e.target.selectedOptions[0]
    const val = { id: e.target.value, nama: opt?.dataset.nama ?? '' }
    const urutan = ['provinsi', 'kota', 'kecamatan', 'kelurahan']
    const mulai = urutan.indexOf(tingkat)
    setForm((f) => {
      const baru = { ...f, [tingkat]: val }
      urutan.slice(mulai + 1).forEach((t) => { baru[t] = { id: '', nama: '' } })
      return baru
    })
    setWilayah((w) => {
      const baru = { ...w }
      urutan.slice(mulai + 1).forEach((t) => { baru[t] = [] })
      return baru
    })
    if (!val.id) return
    const sumber = { provinsi: `regencies/${val.id}`, kota: `districts/${val.id}`, kecamatan: `villages/${val.id}` }[tingkat]
    const tujuan = urutan[mulai + 1]
    if (!sumber || !tujuan) return
    fetch(`${API_WILAYAH}/${sumber}.json`)
      .then((r) => r.json())
      .then((d) => setWilayah((w) => ({ ...w, [tujuan]: d })))
      .catch(() => {})
  }

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setLokasiStatus('Peramban tidak mendukung geolokasi.')
      return
    }
    setLokasiStatus('Mengambil lokasi...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
        setLokasiStatus('Koordinat berhasil diisi.')
      },
      () => setLokasiStatus('Izin lokasi ditolak. Silakan isi koordinat secara manual.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const tambahBahasa = (e) => {
    const b = e.target.value
    if (b && !form.bahasa.includes(b)) setForm((f) => ({ ...f, bahasa: [...f.bahasa, b] }))
    e.target.value = ''
  }

  const hapusBahasa = (b) => setForm((f) => ({ ...f, bahasa: f.bahasa.filter((x) => x !== b) }))

  const ubahPendidikan = (i, k, v) => {
    setForm((f) => ({ ...f, pendidikan: f.pendidikan.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)) }))
  }
  const ubahSertifikasi = (i, v) => {
    setForm((f) => ({ ...f, sertifikasi: f.sertifikasi.map((s, idx) => (idx === i ? v : s)) }))
  }

  const kirim = (e) => {
    e.preventDefault()
    if (profilMode && !/^\d{16}$/.test(form.nik)) {
      setGalat('Nomor KTP (NIK) harus 16 digit angka.')
      return
    }
    if (!form.bahasa.length) {
      setGalat('Pilih minimal satu penguasaan bahasa.')
      return
    }
    if (!profilMode && (!berkas.cv || !berkas.surat)) {
      setGalat('CV dan surat lamaran wajib dilampirkan.')
      return
    }
    setGalat('')
    if (profilMode) setDisimpan(true)
    onKirim?.(form, berkas)
  }

  return (
    <form className="dtf-form" onSubmit={kirim}>
      <section className="dtf-sec">
        <header className="dtf-sec-head">
          <span className="dtf-sec-ic"><ContactRound size={17} strokeWidth={2} aria-hidden="true" /></span>
          <div>
            <h2>Data pribadi</h2>
            <p>Identitas dasar, kontak, dan alamat domisili.</p>
          </div>
        </header>
        <div className="dtf-grid">
          <label className="dtf-field">
            <span>Nama lengkap *</span>
            <input type="text" required placeholder="Contoh: Ahmad Fauzan" value={form.nama} onChange={ubah('nama')} />
          </label>
          <label className="dtf-field">
            <span>Gelar</span>
            <input type="text" placeholder="Contoh: Lc., M.A." value={form.gelar} onChange={ubah('gelar')} />
          </label>
          <label className="dtf-field">
            <span>Email *</span>
            <input type="email" required placeholder="nama@email.com" value={form.email} onChange={ubah('email')} />
          </label>
          <label className="dtf-field">
            <span>Nomor WhatsApp *</span>
            <input type="tel" required placeholder="Contoh: 081234567890" value={form.wa} onChange={ubah('wa')} />
          </label>
          <label className="dtf-field">
            <span>Tanggal lahir *</span>
            <input type="date" required value={form.tglLahir} onChange={ubah('tglLahir')} />
          </label>
          <label className="dtf-field">
            <span>Jenis kelamin</span>
            <select value={form.gender} onChange={ubah('gender')}>
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </label>
          <label className="dtf-field">
            <span>Provinsi *</span>
            <select required value={form.provinsi.id} onChange={(e) => pilihWilayah('provinsi', e)}>
              <option value="">Pilih provinsi</option>
              {wilayah.provinsi.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
            </select>
          </label>
          <label className="dtf-field">
            <span>Kabupaten/Kota *</span>
            <select required value={form.kota.id} onChange={(e) => pilihWilayah('kota', e)} disabled={!form.provinsi.id}>
              <option value="">Pilih kabupaten/kota</option>
              {wilayah.kota.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
            </select>
          </label>
          <label className="dtf-field">
            <span>Kecamatan *</span>
            <select required value={form.kecamatan.id} onChange={(e) => pilihWilayah('kecamatan', e)} disabled={!form.kota.id}>
              <option value="">Pilih kecamatan</option>
              {wilayah.kecamatan.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
            </select>
          </label>
          <label className="dtf-field">
            <span>Kelurahan/Desa *</span>
            <select required value={form.kelurahan.id} onChange={(e) => pilihWilayah('kelurahan', e)} disabled={!form.kecamatan.id}>
              <option value="">Pilih kelurahan/desa</option>
              {wilayah.kelurahan.map((w) => <option key={w.id} value={w.id} data-nama={rapiWilayah(w.name)}>{rapiWilayah(w.name)}</option>)}
            </select>
          </label>
          <label className="dtf-field dtf-field--full">
            <span>Alamat lengkap *</span>
            <textarea rows={2} required placeholder="Nama jalan, nomor rumah, RT/RW" value={form.alamat} onChange={ubah('alamat')} />
          </label>
          <div className="dtf-field dtf-field--full">
            <span>Titik lokasi</span>
            <div className="dtf-lokasi">
              <input type="text" placeholder="Latitude" value={form.lat} onChange={ubah('lat')} />
              <input type="text" placeholder="Longitude" value={form.lng} onChange={ubah('lng')} />
              <button type="button" onClick={ambilLokasi}>
                <MapPinned size={14} strokeWidth={2} aria-hidden="true" /> Ambil lokasi saat ini
              </button>
            </div>
            {lokasiStatus && <em className="dtf-lokasi-status">{lokasiStatus}</em>}
          </div>
        </div>
        <UploadBox
          label="Foto profil"
          hint="JPG atau PNG, wajah terlihat jelas, maks. 2 MB"
          accept="image/*"
          nama={berkas.fotoProfil?.name}
          onPilih={(f) => setBerkas((b) => ({ ...b, fotoProfil: f }))}
          wajib={!profilMode}
        />
      </section>

      {profilMode && (
        <section className="dtf-sec">
          <header className="dtf-sec-head">
            <span className="dtf-sec-ic"><ScanFace size={17} strokeWidth={2} aria-hidden="true" /></span>
            <div>
              <h2>Identitas &amp; pajak</h2>
              <p>Digunakan untuk verifikasi identitas dan administrasi honorarium.</p>
            </div>
          </header>
          <div className="dtf-grid">
            <label className="dtf-field">
              <span>Nomor KTP (NIK) *</span>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={16}
                placeholder="16 digit angka"
                value={form.nik}
                onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value.replace(/\D/g, '') }))}
              />
            </label>
            <label className="dtf-field">
              <span>Nomor NPWP (opsional)</span>
              <input type="text" placeholder="Contoh: 12.345.678.9-012.345" value={form.npwp} onChange={ubah('npwp')} />
            </label>
          </div>
          <div className="dtf-upload-grid">
            <UploadBox
              label="Foto KTP"
              hint="Foto asli, bukan fotokopi, terbaca jelas"
              accept="image/*,.pdf"
              nama={berkas.fotoKtp}
              onPilih={(f) => setBerkas((b) => ({ ...b, fotoKtp: f.name }))}
              wajib
            />
            <UploadBox
              label="Foto kartu NPWP"
              hint="Opsional, lampirkan bila memiliki"
              accept="image/*,.pdf"
              nama={berkas.fotoNpwp}
              onPilih={(f) => setBerkas((b) => ({ ...b, fotoNpwp: f.name }))}
            />
          </div>
        </section>
      )}

      {profilMode && (
        <section className="dtf-sec">
          <header className="dtf-sec-head">
            <span className="dtf-sec-ic"><HandCoins size={17} strokeWidth={2} aria-hidden="true" /></span>
            <div>
              <h2>Rekening pencairan honor</h2>
              <p>Honorarium mengajar ditransfer ke rekening ini setiap tanggal 28.</p>
            </div>
          </header>
          <div className="dtf-grid dtf-grid--tiga">
            <label className="dtf-field">
              <span>Bank *</span>
              <select value={form.bank} onChange={ubah('bank')}>
                {daftarBank.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label className="dtf-field">
              <span>Nomor rekening *</span>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="Contoh: 7201234567"
                value={form.noRek}
                onChange={(e) => setForm((f) => ({ ...f, noRek: e.target.value.replace(/\D/g, '') }))}
              />
            </label>
            <label className="dtf-field">
              <span>Nama pemilik rekening *</span>
              <input type="text" required placeholder="Sesuai buku tabungan" value={form.namaRek} onChange={ubah('namaRek')} />
            </label>
          </div>
          <p className="dtf-catatan">
            <Banknote size={13} strokeWidth={2} aria-hidden="true" />
            Nama pemilik rekening harus sama dengan nama pada KTP agar pencairan tidak tertunda.
          </p>
        </section>
      )}

      <section className="dtf-sec">
        <header className="dtf-sec-head">
          <span className="dtf-sec-ic"><NotebookPen size={17} strokeWidth={2} aria-hidden="true" /></span>
          <div>
            <h2>Profil pengajar</h2>
            <p>Data ini ditampilkan pada profil guru di halaman program.</p>
          </div>
        </header>
        <div className="dtf-grid">
          <label className="dtf-field">
            <span>Bidang keahlian utama *</span>
            <select value={form.bidang} onChange={ubah('bidang')}>
              {bidangOpsi.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <div className="dtf-field">
            <span>Penguasaan bahasa *</span>
            <select onChange={tambahBahasa} defaultValue="">
              <option value="" disabled>Pilih bahasa</option>
              {Object.keys(benderaBahasa).filter((b) => !form.bahasa.includes(b)).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="dtf-bahasa">
              {form.bahasa.map((b) => (
                <span key={b} className="dtf-bahasa-chip">
                  <span role="img" aria-hidden="true">{benderaBahasa[b]}</span> {b}
                  <button type="button" aria-label={`Hapus ${b}`} onClick={() => hapusBahasa(b)}>
                    <X size={11} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <label className="dtf-field dtf-field--full">
            <span>Profil singkat *</span>
            <textarea
              rows={3}
              required
              placeholder={'Contoh: Lulusan Al-Azhar Kairo yang menekuni ilmu qira\u2019at dan terbiasa membimbing peserta dewasa memperbaiki bacaan dari nol.'}
              value={form.profil}
              onChange={ubah('profil')}
            />
          </label>
        </div>

        <div className="dtf-sub">
          <h3><BookMarked size={14} strokeWidth={2} aria-hidden="true" /> Pendidikan</h3>
          {form.pendidikan.map((p, i) => (
            <div className="dtf-baris" key={i}>
              <select value={p.jenis} onChange={(e) => ubahPendidikan(i, 'jenis', e.target.value)}>
                <option>Formal</option>
                <option>Non-formal</option>
              </select>
              <input
                type="text"
                required
                placeholder={i === 0 ? 'Contoh: S2 Universitas Al-Azhar, Kairo' : 'Contoh: Talaqqi bersanad masyayikh Al-Azhar, Kairo'}
                value={p.nama}
                onChange={(e) => ubahPendidikan(i, 'nama', e.target.value)}
              />
              {form.pendidikan.length > 1 && (
                <button
                  type="button"
                  className="dtf-baris-hapus"
                  aria-label="Hapus baris pendidikan"
                  onClick={() => setForm((f) => ({ ...f, pendidikan: f.pendidikan.filter((_, idx) => idx !== i) }))}
                >
                  <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="dtf-tambah"
            onClick={() => setForm((f) => ({ ...f, pendidikan: [...f.pendidikan, { jenis: 'Non-formal', nama: '' }] }))}
          >
            <Plus size={13} strokeWidth={2.2} aria-hidden="true" /> Tambah pendidikan
          </button>
        </div>

        <div className="dtf-sub">
          <h3><BadgeCheck size={14} strokeWidth={2} aria-hidden="true" /> Sertifikasi</h3>
          {form.sertifikasi.map((s, i) => (
            <div className="dtf-baris" key={i}>
              <input
                type="text"
                placeholder={i === 0 ? 'Contoh: Ijazah Sanad Qira\u2019ah' : 'Contoh: Pembina Tahsin Dewasa'}
                value={s}
                onChange={(e) => ubahSertifikasi(i, e.target.value)}
              />
              {form.sertifikasi.length > 1 && (
                <button
                  type="button"
                  className="dtf-baris-hapus"
                  aria-label="Hapus baris sertifikasi"
                  onClick={() => setForm((f) => ({ ...f, sertifikasi: f.sertifikasi.filter((_, idx) => idx !== i) }))}
                >
                  <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="dtf-tambah"
            onClick={() => setForm((f) => ({ ...f, sertifikasi: [...f.sertifikasi, ''] }))}
          >
            <Plus size={13} strokeWidth={2.2} aria-hidden="true" /> Tambah sertifikasi
          </button>
        </div>
      </section>

      {!profilMode && (
        <section className="dtf-sec">
          <header className="dtf-sec-head">
            <span className="dtf-sec-ic"><FileBadge2 size={17} strokeWidth={2} aria-hidden="true" /></span>
            <div>
              <h2>Berkas lamaran</h2>
              <p>CV terbaru dan surat lamaran Anda.</p>
            </div>
          </header>
          <div className="dtf-upload-grid">
            <UploadBox
              label="CV / daftar riwayat hidup"
              hint="PDF, maks. 5 MB"
              accept=".pdf"
              nama={berkas.cv}
              onPilih={(f) => setBerkas((b) => ({ ...b, cv: f.name }))}
              wajib
            />
            <UploadBox
              label="Surat lamaran (cover letter)"
              hint="PDF atau DOCX, maks. 2 MB"
              accept=".pdf,.doc,.docx"
              nama={berkas.surat}
              onPilih={(f) => setBerkas((b) => ({ ...b, surat: f.name }))}
              wajib
            />
          </div>
        </section>
      )}

      {galat && <p className="dtf-galat" role="alert">{galat}</p>}
      {profilMode && disimpan && !galat && (
        <p className="dtf-tersimpan" role="status">Perubahan profil berhasil disimpan.</p>
      )}

      {!profilMode && (
        <label className="dtf-setuju">
          <input type="checkbox" required />
          <span>
            Saya menyatakan seluruh data yang diisi adalah benar dan menyetujui{' '}
            <a href="#syarat">Syarat dan Ketentuan</a> serta <a href="#privasi">Kebijakan Privasi</a> Hifz.
          </span>
        </label>
      )}
      <button type="submit" className="btn dtf-kirim">{profilMode ? 'Simpan profil' : 'Kirim pendaftaran'}</button>
    </form>
  )
}
