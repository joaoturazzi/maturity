import { auth } from '@clerk/nextjs/server'
import { getAvailablePeriods } from '@/lib/db/queries/reports'

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const companyId = (sessionClaims?.metadata as Record<string, string>)?.companyId as string
  const periods = await getAvailablePeriods(companyId)
  return Response.json(periods)
}
