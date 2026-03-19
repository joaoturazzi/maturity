export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return Response.json({ hasCompanyId: false }, { status: 401 })
    }
    const meta = sessionClaims?.metadata as Record<string, string> | undefined
    const companyId = meta?.companyId ?? ''
    return Response.json({ hasCompanyId: !!companyId, companyId })
  } catch {
    return Response.json({ hasCompanyId: false }, { status: 500 })
  }
}
