export type WebsiteSummary = {
  description: string
  targetAudience: string
  valueProposition: string
  sector: string
  toneOfVoice: string
  highlights: string
}

const MAX_CHARS = 12000

function truncate(text: string): string {
  if (text.length <= MAX_CHARS) return text
  const half = MAX_CHARS / 2
  return (
    text.slice(0, half) +
    '\n\n[... conteúdo omitido ...]\n\n' +
    text.slice(text.length - half)
  )
}

export async function scrapeWebsite(url: string): Promise<WebsiteSummary | null> {
  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null

    // Step 1: Jina scraping (10s timeout)
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!jinaRes.ok) return null

    const rawContent = await jinaRes.text()
    if (!rawContent || rawContent.length < 100) return null

    const content = truncate(rawContent)

    // Step 2: Use OpenAI to extract structured data (cheaper, already configured)
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return null

    const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: `Analise o conteúdo do site abaixo e extraia informações sobre a empresa.
Responda APENAS com um JSON válido, sem markdown, sem explicações, sem blocos de código.
Use aspas duplas. Se não encontrar uma informação, use string vazia "".

Campos obrigatórios:
{
  "description": "O que a empresa faz em 1-2 frases",
  "targetAudience": "Para quem é o produto/serviço",
  "valueProposition": "Qual o diferencial ou proposta de valor",
  "sector": "Setor de atuação (ex: Tecnologia, Saúde, Educação...)",
  "toneOfVoice": "Tom de comunicação (ex: formal, descontraído, técnico, inspiracional...)",
  "highlights": "Qualquer dado relevante: anos de mercado, nº de clientes, prêmios, etc."
}

Conteúdo do site:
${content}`,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!llmRes.ok) return null

    const llmData = await llmRes.json()
    const text = llmData?.choices?.[0]?.message?.content ?? ''

    if (!text) return null

    // Safe JSON parse
    try {
      const clean = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(clean) as WebsiteSummary
      if (!parsed.description) return null

      return parsed
    } catch {
      return null
    }
  } catch {
    return null
  }
}
