export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from '@/lib/clerkMeta'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ ready: false }, { status: 401 })

    const jwtCompanyId = parseClerkMeta(sessionClaims).companyId ?? ''

    const cookieStore = await cookies()
    const cookieCompanyId = cookieStore.get('maturityiq_company')?.value ?? ''

    return Response.json({ ready: !!(jwtCompanyId || cookieCompanyId) })
  } catch {
    return Response.json({ ready: false }, { status: 500 })
  }
}
