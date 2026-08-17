const fs = require('fs')
const css = fs.readFileSync('src/index.css', 'utf8').split('\n')
const tok = /#0fbeeb|#0b7fa6|#0a7fa0|#0ca9d2|#0ca6cf|#0da5cd|#076e8c|#054e63|#3fd0f5|#0aa8d4|rgba\(15,\s*190,\s*235/i
let sel = ''
let buf = []
const out = []
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
  if (tok.test(l) && !/\.db|--deep|--green|--a-cyan/.test(sel)) {
    out.push(String(i + 1).padStart(5) + ' | ' + sel.slice(0, 80) + ' | ' + l.trim().slice(0, 60))
  }
}
console.log(out.join('\n'))
console.log('total:', out.length)
