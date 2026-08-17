const { readFileSync, writeFileSync } = require('node:fs')
const { PNG } = require('pngjs')

const png = PNG.sync.read(readFileSync('public/logo/logo ihya 1.png'))
const lime = [146, 200, 65] // mark -> #92c841

let minX = png.width, minY = png.height, maxX = 0, maxY = 0
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4
    const terang = png.data[i] > 150 && png.data[i + 3] > 0
    if (terang) {
      png.data[i] = lime[0]
      png.data[i + 1] = lime[1]
      png.data[i + 2] = lime[2]
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    } else {
      png.data[i + 3] = 0 // teks & lainnya dibuang
    }
  }
}

const pad = 6
minX = Math.max(0, minX - pad)
minY = Math.max(0, minY - pad)
maxX = Math.min(png.width - 1, maxX + pad)
maxY = Math.min(png.height - 1, maxY + pad)
const w = maxX - minX + 1
const h = maxY - minY + 1
const out = new PNG({ width: w, height: h })
PNG.bitblt(png, out, minX, minY, w, h, 0, 0)
writeFileSync('public/logo/logo-mark.png', PNG.sync.write(out))
console.log('done', w, 'x', h)
