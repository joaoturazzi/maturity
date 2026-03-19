export type ClerkMetadata = {
  companyId?: string
  role?: string
}

export function parseClerkMeta(
  sessionClaims: Record<string, unknown> | null | undefined
): ClerkMetadata {
  const metadata = sessionClaims?.metadata
  if (!metadata || typeof metadata !== 'object') return {}
  const meta = metadata as Record<string, unknown>
  return {
    companyId: typeof meta.companyId === 'string' ? meta.companyId : undefined,
    role: typeof meta.role === 'string' ? meta.role : undefined,
  }
}
