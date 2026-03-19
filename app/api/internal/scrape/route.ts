export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { scrapeWebsite } from '@/lib/website-scraper'

export async function POST(req: Request) {
  try {
    const { companyId, websiteUrl } = await req.json()
    if (!companyId || !websiteUrl) {
      return Response.json({ ok: false, error: 'Missing params' })
    }

    const summary = await scrapeWebsite(websiteUrl)
    if (summary) {
      await db.update(companies)
        .set({ websiteSummary: summary })
        .where(eq(companies.id, companyId))
      console.log(`[scrape] Summary saved for company ${companyId}`)
    }

    return Response.json({ ok: true, hasSummary: !!summary })
  } catch (error) {
    console.error('[internal/scrape]', error)
    return Response.json({ ok: false })
  }
}
