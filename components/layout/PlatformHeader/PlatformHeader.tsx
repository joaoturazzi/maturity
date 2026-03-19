'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import styles from './PlatformHeader.module.css'

type Props = { userName: string }

export function PlatformHeader({ userName }: Props) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/alerts?unreadOnly=true')
      .then(r => r.json())
      .then(d => setUnreadCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.spacer} />

      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.alertBtn}>
          <span>◎</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className={styles.avatarWrap} ref={dropdownRef}>
          <button
            className={styles.avatar}
            onClick={() => setDropdownOpen(o => !o)}
          >
            {userName.charAt(0).toUpperCase()}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <Link href="/profile" className={styles.dropdownItem}>
                Perfil
              </Link>
              <Link href="/settings" className={styles.dropdownItem}>
                Configurações
              </Link>
              <button
                className={styles.dropdownItemDanger}
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
