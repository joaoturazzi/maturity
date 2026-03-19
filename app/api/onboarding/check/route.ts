export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ ready: false }, { status: 401 })
    const meta = sessionClaims?.metadata as Record<string, string> | undefined
    const companyId = meta?.companyId ?? ''
    return Response.json({ ready: !!companyId })
  } catch {
    return Response.json({ ready: false }, { status: 500 })
  }
}
