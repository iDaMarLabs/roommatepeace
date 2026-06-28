'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const arr = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i)
  }
  return arr
}

type State = 'loading' | 'unsupported' | 'denied' | 'enabled' | 'disabled'

export default function PushNotificationToggle() {
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'enabled' : 'disabled')
    }).catch(() => setState('disabled'))
  }, [])

  async function enable() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setState('denied')
        return
      }
      if (permission !== 'granted') {
        setState('disabled')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setState(res.ok ? 'enabled' : 'disabled')
    } catch {
      setState('disabled')
    }
  }

  async function disable() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('disabled')
    } catch {
      setState('enabled')
    }
  }

  if (state === 'loading') return null

  if (state === 'unsupported') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    return (
      <div>
        <p className="text-sm font-medium text-stone-900">Notifications</p>
        <p className="text-xs text-stone-500 mt-0.5">
          {isIOS
            ? 'To enable push notifications on iPhone, tap the Share button in Safari and choose "Add to Home Screen." Then open the app from your home screen and enable notifications here.'
            : 'Push notifications are not supported in this browser.'}
        </p>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-900">Push notifications blocked</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Allow notifications in your browser settings to enable reminders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-stone-900">
          {state === 'enabled' ? 'Notifications on' : 'Notifications off'}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          {state === 'enabled'
            ? 'You will receive push reminders for chores and bills on this device.'
            : 'Get push reminders for chores and bills due today or tomorrow.'}
        </p>
      </div>
      <button
        onClick={state === 'enabled' ? disable : enable}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          state === 'enabled'
            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {state === 'enabled' ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  )
}
