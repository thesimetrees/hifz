import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// mulai fresh: buang semua cache lokal lama sekali saja; data asli ada di Supabase
const VERSI_RESET = 'hifzReset-2026-08'
if (!localStorage.getItem(VERSI_RESET)) {
  for (const k of Object.keys(localStorage)) if (k.startsWith('hifz')) localStorage.removeItem(k)
  localStorage.setItem(VERSI_RESET, '1')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
