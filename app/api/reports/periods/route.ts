import { auth } from '@/auth'
import { getAvailablePeriods } from '@/lib/db/queries/reports'

export async function GET() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const periods = await getAvailablePeriods(session.user.companyId)
  return Response.json(periods)
}
