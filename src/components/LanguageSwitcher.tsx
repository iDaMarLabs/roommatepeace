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
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
  // '/en/en' explicitly restores English — deleting the cookie leaves GT in its last state
  const val = code === '' ? '/en/en' : `/en/${code}`

  // Google Translate may have set its cookie on the root domain (e.g. .roommatepeace.com)
  // rather than the subdomain (.www.roommatepeace.com). Clear and set both to ensure
  // the new value wins on reload, especially on the www production domain.
  const parts = host.split('.')
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : host

  document.cookie = `googtrans=; path=/; ${expire}`
  document.cookie = `googtrans=; path=/; domain=.${host}; ${expire}`
  document.cookie = `googtrans=; path=/; domain=.${rootDomain}; ${expire}`

  document.cookie = `googtrans=${val}; path=/`
  document.cookie = `googtrans=${val}; path=/; domain=.${host}`
  document.cookie = `googtrans=${val}; path=/; domain=.${rootDomain}`
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
