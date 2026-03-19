export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { scrapeWebsite } from '@/lib/website-scraper'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await getCompanyId()
    if (!companyId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
      columns: { websiteUrl: true },
    })

    if (!company?.websiteUrl) {
      return Response.json({ error: 'Nenhum site cadastrado.' }, { status: 400 })
    }

    const summary = await scrapeWebsite(company.websiteUrl)

    if (!summary) {
      return Response.json({ error: 'Não foi possível analisar o site. Verifique a URL.' }, { status: 422 })
    }

    await db.update(companies)
      .set({ websiteSummary: summary })
      .where(eq(companies.id, companyId))

    return Response.json({ ok: true, summary })
  } catch (error) {
    console.error('[company/scrape-now]', error)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
