export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { parseClerkMeta } from '@/lib/clerkMeta'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) return Response.json({ ok: false }, { status: 401 })

    let companyId = parseClerkMeta(sessionClaims).companyId ?? ''

    if (!companyId) {
      const userInDb = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { companyId: true },
      })
      companyId = userInDb?.companyId ?? ''
    }

    if (!companyId) return Response.json({ ok: false })

    const cookieStore = await cookies()
    cookieStore.set('maturityiq_company', companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return Response.json({ ok: true, companyId })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
