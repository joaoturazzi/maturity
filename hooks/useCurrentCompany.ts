'use client'

import { useSession } from 'next-auth/react'

export function useCurrentCompany() {
  const { data: session, status } = useSession()

  return {
    companyId: session?.user?.companyId ?? null,
    user: session?.user ?? null,
    role: session?.user?.role ?? null,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
