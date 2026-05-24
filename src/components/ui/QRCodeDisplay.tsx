'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'

interface Props {
  path: string
  size?: number
}

export default function QRCodeDisplay({ path, size = 160 }: Props) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`)
  }, [path])

  if (!url) return <div style={{ width: size, height: size }} className="bg-stone-100 rounded-lg animate-pulse" />

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 inline-block">
      <QRCode value={url} size={size} />
    </div>
  )
}
