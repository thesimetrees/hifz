import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const src = 'public/logo/logo ihya 1.png'
const out = 'public/logo/logo ihya biru.png'

const png = PNG.sync.read(readFileSync(src))
const biru = [15, 190, 235] // sun -> #0fbeeb
const hitam = [26, 26, 26] // text -> #1a1a1a

for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i]
  const a = png.data[i + 3]
  if (a === 0) continue
  const [nr, ng, nb] = r > 150 ? biru : hitam
  png.data[i] = nr
  png.data[i + 1] = ng
  png.data[i + 2] = nb
}

writeFileSync(out, PNG.sync.write(png))
console.log('done ->', out)
