const fs = require('fs')
const path = 'src/index.css'
const css = fs.readFileSync(path, 'utf8').split('\n')
// hanya deklarasi color: teks abu/narasi → warna iklan #2b2e33; judul (#1a1a1a dll) dibiarkan
const re = /^(\s*)color: (rgba\(0,\s*0,\s*0,\s*0\.(4[5-9]|[5-8][0-9]?)\)|#5c5c5c|#5b6b70|#444|#555|#666)( !important)?;/
let sel = ''
let buf = []
let n = 0
for (let i = 0; i < css.length; i++) {
  const l = css[i]
  if (l.includes('{')) {
    sel = (buf.join(' ') + ' ' + l.split('{')[0]).trim()
    buf = []
  } else if (l.includes('}')) {
    buf = []
  } else if (l.trim().endsWith(',')) {
    buf.push(l.trim())
  }
  if (/\.db|\.auth-galat|\.dtf-galat|\.tk-galat/.test(sel)) continue
  const m = l.match(re)
  if (m) {
    css[i] = `${m[1]}color: #2b2e33;${m[4] ?? ''}`
    n++
  }
}
fs.writeFileSync(path, css.join('\n'))
console.log('lines changed:', n)
