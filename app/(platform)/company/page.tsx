import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanyId } from '@/lib/getCompanyId'
import { CompanyForm } from '@/components/company/CompanyForm'

export default async function CompanyPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  })

  if (!company) redirect('/onboarding')

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: '#aaa',
          textTransform: 'uppercase', letterSpacing: '0.09em',
          marginBottom: 4,
        }}>
          Configurações
        </p>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          letterSpacing: '-0.3px', marginBottom: 6,
        }}>
          Minha Empresa
        </h1>
        <p style={{ fontSize: 13, color: '#888' }}>
          Visualize e edite as informações da sua empresa.
        </p>
      </div>

      <CompanyForm company={{
        id: company.id,
        name: company.name,
        industry: company.industry,
        size: company.size,
        websiteUrl: company.websiteUrl,
        websiteSummary: company.websiteSummary,
        createdAt: company.createdAt!,
      }} />
    </div>
  )
}
