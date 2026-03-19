import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

// Inline schema — Netlify functions can't import from app code reliably
const companies = pgTable('companies', {
  id: uuid('id').primaryKey(),
  websiteSummary: jsonb('website_summary'),
})

type WebsiteSummary = {
  description: string
  targetAudience: string
  valueProposition: string
  sector: string
  toneOfVoice: string
  highlights: string
}

const MAX_CHARS = 12000

function truncate(t: string): string {
  if (t.length <= MAX_CHARS) return t
  const h = MAX_CHARS / 2
  return t.slice(0, h) + '\n\n[...]\n\n' + t.slice(t.length - h)
}

async function scrape(url: string): Promise<WebsiteSummary | null> {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null

    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(10000),
    })
    if (!jinaRes.ok) return null

    const raw = await jinaRes.text()
    if (!raw || raw.length < 100) return null

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return null

    const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Extract company info from website content. Return valid JSON only.' },
          { role: 'user', content: `Extract: {"description":"...","targetAudience":"...","valueProposition":"...","sector":"...","toneOfVoice":"...","highlights":"..."}\n\nContent:\n${truncate(raw)}` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!llmRes.ok) return null

    const data = await llmRes.json()
    const text = data?.choices?.[0]?.message?.content ?? ''
    if (!text) return null

    try {
      const result = JSON.parse(text) as WebsiteSummary
      return result.description ? result : null
    } catch { return null }
  } catch { return null }
}

export default async function handler(req: Request) {
  try {
    const { companyId, websiteUrl } = await req.json()
    if (!companyId || !websiteUrl) return new Response('Missing params', { status: 400 })

    console.log(`[scrape-website] Starting for ${websiteUrl}`)

    const summary = await scrape(websiteUrl)
    if (!summary) {
      console.log(`[scrape-website] No summary extracted for ${websiteUrl}`)
      return new Response('No summary', { status: 200 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)

    await db.update(companies)
      .set({ websiteSummary: summary })
      .where(eq(companies.id, companyId))

    console.log(`[scrape-website] Summary saved for company ${companyId}`)
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[scrape-website]', err)
    return new Response('Error', { status: 500 })
  }
}
