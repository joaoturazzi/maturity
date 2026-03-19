export const dynamic = 'force-dynamic'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
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

    // If user already onboarded, update the existing company with new data
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (existingUser?.companyId) {
      await db.update(companies)
        .set({
          name: companyName.trim(),
          industry: industry ?? undefined,
          size: size ?? undefined,
          websiteUrl: websiteUrl || null,
        })
        .where(eq(companies.id, existingUser.companyId))

      // Sync real email and name from Clerk
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const realEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? existingUser.email
      const realName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || existingUser.name
      await db.update(users)
        .set({ email: realEmail, name: realName })
        .where(eq(users.id, userId))

      await client.users.updateUser(userId, {
        publicMetadata: { companyId: existingUser.companyId, role: existingUser.role ?? 'User' },
      })
      const cookieStore = await cookies()
      cookieStore.set('maturityiq_company', existingUser.companyId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })

      // Trigger scraping if URL provided
      if (websiteUrl) {
        const baseUrl = process.env.URL || 'https://maturity2.netlify.app'
        const cookieHeader = req.headers.get('cookie') ?? ''
        fetch(`${baseUrl}/api/internal/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          body: JSON.stringify({ companyId: existingUser.companyId, websiteUrl }),
        }).catch(() => {})
      }

      return Response.json({ ok: true, companyId: existingUser.companyId })
    }

    // 1. Create company
    const [company] = await db.insert(companies).values({
      name: companyName.trim(),
      industry,
      size,
      websiteUrl: websiteUrl || null,
    }).returning()

    // 2. Create user with real email from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const realEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? `${userId}@clerk.maturityiq`

    await db.insert(users).values({
      id: userId,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
      email: realEmail,
      companyId: company.id,
      role: 'User',
    }).onConflictDoUpdate({
      target: users.id,
      set: { companyId: company.id, role: 'User', email: realEmail },
    })

    // 3. Save to Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: { companyId: company.id, role: 'User' },
    })

    // 4. Set httpOnly cookie — instant, no JWT propagation delay
    const cookieStore = await cookies()
    cookieStore.set('maturityiq_company', company.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    // 5. Trigger scraping via separate API route (fire-and-forget)
    if (websiteUrl) {
      const baseUrl = process.env.URL || 'https://maturity2.netlify.app'
      const cookieHeader = req.headers.get('cookie') ?? ''
      fetch(`${baseUrl}/api/internal/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ companyId: company.id, websiteUrl }),
      }).catch(() => {})
    }

    return Response.json({ ok: true, companyId: company.id })
  } catch (error) {
    console.error('[onboarding]', error)
    return Response.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }
}
