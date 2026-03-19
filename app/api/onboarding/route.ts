export const dynamic = 'force-dynamic'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyName, industry, size, websiteUrl } = await req.json()

    if (!companyName?.trim()) {
      return Response.json({ error: 'Nome da empresa é obrigatório.' }, { status: 400 })
    }

    // Prevent double onboarding
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (existingUser?.companyId) {
      const client = await clerkClient()
      await client.users.updateUser(userId, {
        publicMetadata: { companyId: existingUser.companyId, role: existingUser.role ?? 'User' },
      })
      return Response.json({ ok: true, companyId: existingUser.companyId })
    }

    // 1. Create company
    const [company] = await db.insert(companies).values({
      name: companyName.trim(),
      industry,
      size,
      websiteUrl: websiteUrl || null,
    }).returning()

    // 2. Create user
    await db.insert(users).values({
      id: userId,
      email: `${userId}@clerk.maturityiq`,
      companyId: company.id,
      role: 'User',
    }).onConflictDoUpdate({
      target: users.id,
      set: { companyId: company.id, role: 'User' },
    })

    // 3. Save to Clerk metadata
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: { companyId: company.id, role: 'User' },
    })

    // 4. Trigger scraping via separate API route (fire-and-forget)
    if (websiteUrl) {
      const baseUrl = process.env.URL || 'https://maturity2.netlify.app'
      fetch(`${baseUrl}/api/internal/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, websiteUrl }),
      }).catch(() => {})
    }

    return Response.json({ ok: true, companyId: company.id })
  } catch (error) {
    console.error('[onboarding]', error)
    return Response.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}
