export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { generateAlertsForCompany } from '@/lib/alerts/generateAlerts'

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const meta = sessionClaims?.metadata as Record<string, string> | undefined
    const companyId = meta?.companyId ?? ''
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await generateAlertsForCompany(companyId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[alerts/generate]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
