export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { generateAlertsForCompany } from '@/lib/alerts/generateAlerts'

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await generateAlertsForCompany(companyId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[alerts/generate]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
