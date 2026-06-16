'use client'

import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: '', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'zh-CN', label: '中文' },
]

function getCurrentLang(): string {
  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/)
  if (!match) return ''
  const lang = match[1]
  return lang === 'en' ? '' : lang
}

function setLangCookie(code: string) {
  const host = window.location.hostname
  // Clear existing on both path variations
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `googtrans=; path=/; ${expire}`
  document.cookie = `googtrans=; path=/; domain=.${host}; ${expire}`
  if (code !== '') {
    const val = `/en/${code}`
    document.cookie = `googtrans=${val}; path=/`
    document.cookie = `googtrans=${val}; path=/; domain=.${host}`
  }
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState('')

  useEffect(() => {
    setCurrent(getCurrentLang())
  }, [])

  function handleChange(code: string) {
    if (code === current) return
    setLangCookie(code)
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1">
      <Globe size={14} className="text-stone-400 shrink-0" />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="text-xs text-stone-600 bg-transparent border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        aria-label="Select language"
      >
        {LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
