'use client'

import { useUser } from '@clerk/nextjs'

export function useCurrentCompany() {
  const { user, isLoaded, isSignedIn } = useUser()

  const metadata = user?.publicMetadata as Record<string, string> | undefined

  return {
    companyId: metadata?.companyId ?? null,
    user: user ? { id: user.id, name: user.fullName, email: user.primaryEmailAddress?.emailAddress } : null,
    role: metadata?.role ?? null,
    loading: !isLoaded,
    isAuthenticated: !!isSignedIn,
  }
}
