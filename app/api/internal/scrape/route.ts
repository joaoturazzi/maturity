export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/getCompanyId'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { scrapeWebsite } from '@/lib/website-scraper'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const { companyId: bodyCompanyId, websiteUrl } = await req.json()
    if (!websiteUrl) return Response.json({ ok: false, error: 'Missing websiteUrl' })

    // Validate ownership: body companyId must match authenticated user's company
    if (bodyCompanyId && bodyCompanyId !== companyId) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const summary = await scrapeWebsite(websiteUrl)
    if (summary) {
      await db.update(companies)
        .set({ websiteSummary: summary })
        .where(eq(companies.id, companyId))
    }

    return Response.json({ ok: true, hasSummary: !!summary })
  } catch (error) {
    console.error('[internal/scrape]', error)
    return Response.json({ ok: false })
  }
}
