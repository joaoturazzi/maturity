export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  industry: z.string().optional(),
  size: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = schema.parse(await req.json())

    await db.update(companies)
      .set({
        name: body.name.trim(),
        industry: body.industry ?? null,
        size: body.size ?? null,
        websiteUrl: body.websiteUrl || null,
      })
      .where(eq(companies.id, companyId))

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[company/update]', error)
    return Response.json({ error: 'Erro ao atualizar empresa' }, { status: 500 })
  }
}
