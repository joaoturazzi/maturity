'use client'

import { useEffect } from 'react'

export function CookieRefresher() {
  useEffect(() => {
    const key = 'maturityiq_cookie_refreshed'
    if (!sessionStorage.getItem(key)) {
      fetch('/api/auth/refresh-cookie')
        .then(r => r.json())
        .then(d => { if (d.ok) sessionStorage.setItem(key, '1') })
        .catch(() => {})
    }
  }, [])

  return null
}
