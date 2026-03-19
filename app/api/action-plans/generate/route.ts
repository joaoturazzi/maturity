export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { generateActionPlanForCycle } from '@/lib/services/generateActionPlan'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { cycleId } = await req.json()
    if (!cycleId) return Response.json({ error: 'cycleId required' }, { status: 400 })

    const result = await generateActionPlanForCycle(cycleId, companyId)
    return Response.json({ ok: true, ...result })
  } catch (err) {
    console.error('[action-plans/generate]', err)
    return Response.json({ error: 'Erro ao gerar plano' }, { status: 500 })
  }
}
