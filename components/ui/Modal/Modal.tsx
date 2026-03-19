'use client'

import { useEffect } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
