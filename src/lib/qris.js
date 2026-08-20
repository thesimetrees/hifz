// QRIS dinamis: baca payload QRIS statis dari gambar, sisipkan nominal (tag 54), CRC ulang
import jsQR from 'jsqr'
import QRCode from 'qrcode'

const SUMBER_STATIS = '/pay/qris-code.png'

let payloadStatis = null

const crc16 = (s) => {
  let crc = 0xffff
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const urai = (s) => {
  const tags = []
  let i = 0
  while (i + 4 <= s.length) {
    const tag = s.slice(i, i + 2)
    const len = Number(s.slice(i + 2, i + 4))
    if (Number.isNaN(len)) break
    tags.push([tag, s.slice(i + 4, i + 4 + len)])
    i += 4 + len
  }
  return tags
}

const susun = (tags) => tags.map(([t, v]) => t + String(v.length).padStart(2, '0') + v).join('')

async function bacaPayloadStatis() {
  if (payloadStatis) return payloadStatis
  const img = new Image()
  img.src = SUMBER_STATIS
  await img.decode()
  const kanvas = document.createElement('canvas')
  kanvas.width = img.naturalWidth
  kanvas.height = img.naturalHeight
  const ctx = kanvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const piksel = ctx.getImageData(0, 0, kanvas.width, kanvas.height)
  const kode = jsQR(piksel.data, kanvas.width, kanvas.height)
  if (!kode?.data) throw new Error('QRIS statis tidak terbaca')
  payloadStatis = kode.data
  return payloadStatis
}

// hasilkan data URL gambar QRIS dengan nominal terkunci sesuai tagihan
export async function qrisDinamis(nominal) {
  const payload = await bacaPayloadStatis()
  const jumlah = String(Math.max(1, Math.round(Number(nominal) || 0)))
  let tags = urai(payload).filter(([t]) => t !== '63' && t !== '54')
  tags = tags.map(([t, v]) => (t === '01' ? ['01', '12'] : [t, v]))
  const posisi = tags.findIndex(([t]) => Number(t) > 54)
  const tagNominal = ['54', jumlah]
  if (posisi === -1) tags.push(tagNominal)
  else tags.splice(posisi, 0, tagNominal)
  let hasil = susun(tags) + '6304'
  hasil += crc16(hasil)
  return QRCode.toDataURL(hasil, { margin: 1, width: 520, errorCorrectionLevel: 'M' })
}
