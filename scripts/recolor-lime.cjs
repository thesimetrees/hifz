const fs = require('fs')
const path = 'src/index.css'
const css = fs.readFileSync(path, 'utf8').split('\n')
const map = [
  [/rgba\(15,\s*190,\s*235/g, 'rgba(146, 200, 65'],
  [/#0fbeeb/gi, '#92c841'],
  [/#0ca6cf|#0ca9d2|#0da5cd/gi, '#7cb332'],
  [/#0b7fa6|#0a7fa0/gi, '#4d7417'],
  [/#3fd0f5/gi, '#b9e36a'],
  [/#0aa8d4/gi, '#92c841'],
  [/#076e8c/gi, '#2e6300'],
  [/#054e63/gi, '#1e4300'],
  [/#e5f7fd/gi, '#eef7dc'],
]
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
  if (/\.db/.test(sel)) continue
  let baru = l
  for (const [re, ke] of map) baru = baru.replace(re, ke)
  if (baru !== l) {
    css[i] = baru
    n++
  }
}
fs.writeFileSync(path, css.join('\n'))
console.log('lines changed:', n)
