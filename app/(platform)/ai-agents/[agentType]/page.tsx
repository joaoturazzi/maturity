import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCompanyId } from '@/lib/getCompanyId'
import { AgentChat } from '@/components/agents/AgentChat'
import { AGENT_CONFIGS } from '@/lib/agents/config'

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ agentType: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const companyId = await getCompanyId()
  if (!companyId) redirect('/onboarding')

  const { agentType } = await params
  const agent = AGENT_CONFIGS[agentType]
  if (!agent) redirect('/ai-agents')

  return (
    <AgentChat
      agentType={agentType}
      agentName={agent.name}
      agentRole={agent.role}
      agentColor={agent.color}
      agentBg={agent.bg}
    />
  )
}
