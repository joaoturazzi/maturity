import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../lib/db/schema'
import * as relations from '../lib/db/relations'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema: { ...schema, ...relations } })

type IndicatorInput = {
  title: string
  description: string
  response_options: Array<{ level: number; text: string }>
  feedback_per_level: Array<{ level: number; feedback: string }>
}

function makeOptions(descriptions: string[]): Array<{ level: number; text: string }> {
  return descriptions.map((text, i) => ({ level: i + 1, text }))
}

function makeFeedback(feedbacks: string[]): Array<{ level: number; feedback: string }> {
  return feedbacks.map((feedback, i) => ({ level: i + 1, feedback }))
}

const MISSING_INDICATORS: Record<string, IndicatorInput[]> = {
  'Mercado': [
    {
      title: 'Personas e Segmentação',
      description: 'A empresa possui personas de clientes bem definidas e segmentação de mercado clara?',
      response_options: makeOptions([
        'Não temos personas definidas nem segmentação de mercado.',
        'Temos uma ideia geral do nosso público, mas sem documentação formal.',
        'Possuímos personas básicas documentadas e alguma segmentação.',
        'Nossas personas são bem detalhadas com dados reais e a segmentação é utilizada nas decisões.',
        'Personas são atualizadas regularmente com dados quantitativos e qualitativos, guiando toda a estratégia comercial.',
      ]),
      feedback_per_level: makeFeedback([
        'Defina ao menos 2-3 personas com base em entrevistas com clientes reais. Isso é fundamental para direcionar marketing e produto.',
        'Formalize suas personas em documentos acessíveis a toda a equipe. Use dados de uso do produto e pesquisas.',
        'Aprofunde suas personas com dados comportamentais e de compra. Teste sua segmentação com campanhas direcionadas.',
        'Considere implementar revisões trimestrais de personas com dados atualizados do funil de vendas.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Go-to-Market',
      description: 'A empresa possui uma estratégia de go-to-market estruturada?',
      response_options: makeOptions([
        'Não temos uma estratégia de GTM definida.',
        'Temos ações pontuais de vendas e marketing, mas sem estratégia integrada.',
        'Possuímos uma estratégia GTM básica com canais definidos.',
        'Nossa estratégia GTM é robusta com funil documentado, métricas e playbooks.',
        'GTM é continuamente otimizado com dados, testes A/B e processos escaláveis.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece definindo seu ICP (Ideal Customer Profile) e os canais mais eficientes para alcançá-lo.',
        'Estruture uma estratégia GTM documentada. Defina funil, métricas-chave e responsáveis.',
        'Crie playbooks de vendas e marketing. Documente o processo de qualificação de leads.',
        'Implemente testes A/B nos canais e otimize o funil com base em dados de conversão.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Posicionamento',
      description: 'A empresa tem um posicionamento de mercado claro e diferenciado?',
      response_options: makeOptions([
        'Não temos um posicionamento definido.',
        'Temos uma ideia do nosso posicionamento, mas não é comunicado consistentemente.',
        'Nosso posicionamento está documentado e é usado em materiais de marketing.',
        'O posicionamento é claro, diferenciado e validado com clientes e mercado.',
        'Posicionamento é revisado periodicamente e sustenta uma vantagem competitiva clara.',
      ]),
      feedback_per_level: makeFeedback([
        'Defina sua proposta de valor única. O que você faz de diferente? Para quem? Por que importa?',
        'Documente seu posicionamento e alinhe toda a comunicação da empresa com ele.',
        'Valide seu posicionamento com pesquisas de mercado e feedback de clientes.',
        'Monitore concorrentes e tendências para manter seu posicionamento relevante.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Canais de Aquisição',
      description: 'A empresa possui canais de aquisição de clientes diversificados e mensuráveis?',
      response_options: makeOptions([
        'Dependemos de um único canal ou de indicações informais.',
        'Temos 2-3 canais, mas sem métricas claras de performance.',
        'Canais diversificados com métricas básicas (CAC por canal, volume).',
        'Canais otimizados com CAC, LTV e ROI medidos por canal.',
        'Mix de canais continuamente otimizado com atribuição multi-touch e automação.',
      ]),
      feedback_per_level: makeFeedback([
        'Diversifique seus canais. Teste ao menos 3 canais diferentes e meça os resultados.',
        'Implemente tracking de origem para cada lead. Calcule CAC por canal.',
        'Aprofunde a análise com LTV por canal e taxa de conversão por etapa do funil.',
        'Considere modelos de atribuição multi-touch e automação de marketing.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Retenção e Fidelização',
      description: 'A empresa possui estratégias estruturadas de retenção e fidelização de clientes?',
      response_options: makeOptions([
        'Não temos estratégias de retenção. Focamos apenas em aquisição.',
        'Fazemos ações pontuais de retenção quando percebemos churn.',
        'Temos métricas de churn e ações recorrentes de retenção.',
        'Estratégia de retenção estruturada com NPS, health score e ações proativas.',
        'Customer success integrado com produto, dados preditivos de churn e programa de fidelidade.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece medindo sua taxa de churn. Entenda por que clientes saem e implemente ações básicas de retenção.',
        'Estruture um processo de acompanhamento do cliente. Implemente pesquisas de satisfação.',
        'Crie um health score do cliente e automatize alertas para intervenção proativa.',
        'Implemente modelos preditivos de churn e programas formais de customer success.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
  ],
  'Finanças': [
    {
      title: 'Fluxo de Caixa',
      description: 'A empresa possui controle e projeção de fluxo de caixa?',
      response_options: makeOptions([
        'Não temos controle formal de fluxo de caixa.',
        'Controlamos entradas e saídas de forma básica, sem projeções.',
        'Temos fluxo de caixa mensal com projeções de 3 meses.',
        'Fluxo de caixa detalhado com projeções de 12 meses e cenários.',
        'Gestão de caixa automatizada com projeções rolling, cenários e contingência.',
      ]),
      feedback_per_level: makeFeedback([
        'Implemente controle básico de entradas e saídas imediatamente. Isso é fundamental para a sobrevivência.',
        'Estruture projeções de fluxo de caixa para pelo menos 3 meses à frente.',
        'Amplie as projeções para 12 meses e crie cenários (otimista, realista, pessimista).',
        'Automatize a gestão de caixa e implemente processos de revisão semanal.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Métricas SaaS / Unit Economics',
      description: 'A empresa acompanha métricas unitárias como LTV, CAC, MRR?',
      response_options: makeOptions([
        'Não acompanhamos métricas unitárias.',
        'Conhecemos algumas métricas mas não calculamos regularmente.',
        'Calculamos MRR, CAC e LTV mensalmente.',
        'Dashboard completo com LTV/CAC ratio, payback, churn MRR e expansão.',
        'Métricas unitárias guiam todas as decisões. Benchmarks do setor são referência.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece calculando seu CAC e LTV básicos. Sem isso, é impossível avaliar a saúde do negócio.',
        'Formalize o cálculo mensal de MRR, CAC e LTV. Documente a metodologia.',
        'Adicione métricas de eficiência como LTV/CAC ratio (meta: >3x) e payback period.',
        'Segmente métricas por cohort, plano e canal de aquisição.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Precificação',
      description: 'A empresa possui uma estratégia de precificação baseada em dados?',
      response_options: makeOptions([
        'Preço definido por intuição ou cópia de concorrentes.',
        'Temos uma lógica básica de precificação, mas sem análise formal.',
        'Precificação baseada em custos + margem com análise de concorrentes.',
        'Precificação baseada em valor percebido com testes e segmentação por plano.',
        'Precificação dinâmica com análise contínua de willingness-to-pay e otimização.',
      ]),
      feedback_per_level: makeFeedback([
        'Analise seus custos e defina uma margem mínima. Pesquise preços de concorrentes.',
        'Faça pesquisas de willingness-to-pay com clientes potenciais.',
        'Teste diferentes faixas de preço e empacotamentos. Meça impacto na conversão.',
        'Implemente precificação baseada em valor e revise trimestralmente.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Captação de Investimentos',
      description: 'A empresa está preparada para captar investimentos?',
      response_options: makeOptions([
        'Não temos materiais de captação nem entendimento do processo.',
        'Temos um pitch deck básico mas sem preparação financeira detalhada.',
        'Pitch deck profissional, projeções financeiras e valuation calculado.',
        'Materiais completos, data room organizado e relacionamento com investidores.',
        'Track record de captação, board advisory e estratégia de funding de longo prazo.',
      ]),
      feedback_per_level: makeFeedback([
        'Estude os fundamentos de captação. Prepare um pitch deck inicial e defina quanto precisa e para quê.',
        'Refine seu pitch deck com dados de tração. Construa projeções financeiras de 3-5 anos.',
        'Organize um data room e inicie relacionamento com investidores antes de precisar do capital.',
        'Mantenha investidores atualizados regularmente e prepare-se para a próxima rodada.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Governança Financeira',
      description: 'A empresa possui processos de governança financeira estabelecidos?',
      response_options: makeOptions([
        'Não temos processos financeiros formais.',
        'Contabilidade básica e relatórios fiscais obrigatórios.',
        'Processos financeiros documentados com orçamento anual e prestação de contas.',
        'Governança financeira com comitê, auditorias internas e compliance.',
        'Governança robusta com board, auditorias externas e processos de classe mundial.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece separando contas PJ de PF e implementando controle básico de despesas.',
        'Crie um orçamento anual e implemente processos de aprovação de despesas.',
        'Considere formar um comitê financeiro e implementar auditorias internas periódicas.',
        'Prepare-se para auditorias externas e eleve o nível de compliance.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
  ],
  'Branding': [
    {
      title: 'Identidade Visual',
      description: 'A empresa possui uma identidade visual consistente e profissional?',
      response_options: makeOptions([
        'Não temos identidade visual definida.',
        'Temos um logo básico mas sem manual de marca ou padrões.',
        'Identidade visual documentada com logo, cores, tipografia e guidelines.',
        'Marca aplicada consistentemente em todos os touchpoints com manual completo.',
        'Identidade visual premium, reconhecida no mercado e revisada periodicamente.',
      ]),
      feedback_per_level: makeFeedback([
        'Invista em criar uma identidade visual profissional. Isso é fundamental para credibilidade.',
        'Crie um manual de marca básico com regras de uso do logo, cores e tipografia.',
        'Garanta consistência aplicando os guidelines em todos os materiais e canais.',
        'Faça pesquisas de percepção de marca e refine a identidade com base nos dados.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Presença Digital',
      description: 'A empresa possui presença digital estratégica e consistente?',
      response_options: makeOptions([
        'Presença digital mínima ou inexistente.',
        'Temos site e redes sociais, mas sem estratégia definida.',
        'Presença digital planejada com calendário editorial e métricas básicas.',
        'Estratégia digital integrada com SEO, conteúdo, social media e performance.',
        'Presença digital líder no segmento com autoridade, comunidade ativa e influência.',
      ]),
      feedback_per_level: makeFeedback([
        'Crie pelo menos um site profissional e perfis nas redes sociais relevantes para seu público.',
        'Defina uma estratégia de conteúdo e calendário editorial. Comece a medir resultados.',
        'Integre SEO, conteúdo e social media. Defina KPIs claros para cada canal.',
        'Foque em construir autoridade e comunidade. Invista em thought leadership.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Comunicação e Mensagem',
      description: 'A empresa possui mensagens-chave e tom de voz definidos?',
      response_options: makeOptions([
        'Não temos mensagens ou tom de voz definidos.',
        'Temos uma ideia do tom, mas cada pessoa comunica de forma diferente.',
        'Tom de voz e mensagens-chave documentados e usados pela equipe.',
        'Comunicação consistente em todos os canais com mensagens testadas e validadas.',
        'Narrativa de marca forte e reconhecida, com storytelling integrado a toda comunicação.',
      ]),
      feedback_per_level: makeFeedback([
        'Defina as mensagens-chave da sua marca: O que você faz? Para quem? Qual o benefício principal?',
        'Documente o tom de voz e distribua para toda a equipe que se comunica com o mercado.',
        'Teste suas mensagens com clientes e ajuste com base no feedback.',
        'Invista em storytelling e narrativa de marca que gere conexão emocional.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Reputação e PR',
      description: 'A empresa investe em construção de reputação e relações públicas?',
      response_options: makeOptions([
        'Não fazemos nenhum trabalho de PR ou reputação.',
        'Ações pontuais de PR quando surge oportunidade.',
        'Estratégia básica de PR com press kit e lista de contatos de mídia.',
        'PR estruturado com resultados mensuráveis, prêmios e reconhecimento do mercado.',
        'Empresa é referência no segmento com presença constante na mídia e eventos do setor.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece criando um press kit e identificando veículos de mídia relevantes para seu segmento.',
        'Estruture um calendário de PR com pautas alinhadas à estratégia da empresa.',
        'Busque prêmios e reconhecimentos do setor. Participe ativamente de eventos.',
        'Invista em thought leadership e posicione executivos como referências no mercado.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
  ],
  'Pessoas': [
    {
      title: 'Cultura Organizacional',
      description: 'A empresa possui uma cultura organizacional definida e vivenciada?',
      response_options: makeOptions([
        'Não temos cultura organizacional definida.',
        'Valores existem informalmente mas não estão documentados.',
        'Cultura documentada com missão, visão e valores comunicados à equipe.',
        'Cultura vivenciada no dia a dia com rituais, feedback e alinhamento visível.',
        'Cultura é diferencial competitivo, atrai talentos e é reconhecida externamente.',
      ]),
      feedback_per_level: makeFeedback([
        'Reúna os fundadores e defina os valores que guiam as decisões da empresa.',
        'Documente e comunique a cultura. Garanta que novos membros entendam os valores.',
        'Crie rituais que reforcem a cultura (all-hands, reconhecimento, feedback).',
        'Meça engajamento e satisfação regularmente. Use a cultura como filtro de contratação.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Contratação e Onboarding',
      description: 'A empresa possui processos estruturados de contratação e integração?',
      response_options: makeOptions([
        'Contratamos de forma ad-hoc, sem processo definido.',
        'Temos um processo básico de entrevistas, mas sem estrutura formal.',
        'Processo de contratação documentado com etapas, critérios e onboarding.',
        'Recrutamento estruturado com employer branding, pipeline e onboarding completo.',
        'Processo de talent acquisition de classe mundial com métricas, retenção alta e marca empregadora forte.',
      ]),
      feedback_per_level: makeFeedback([
        'Defina as competências necessárias para cada vaga e crie um roteiro mínimo de entrevista.',
        'Estruture o processo com etapas claras e crie um programa de onboarding para novos membros.',
        'Invista em employer branding e crie um pipeline de talentos.',
        'Meça métricas de recrutamento (time-to-hire, quality-of-hire) e otimize continuamente.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Desenvolvimento e Capacitação',
      description: 'A empresa investe no desenvolvimento profissional da equipe?',
      response_options: makeOptions([
        'Não há investimento em desenvolvimento da equipe.',
        'Desenvolvimento acontece informalmente e por iniciativa individual.',
        'Temos orçamento para treinamento e planos de desenvolvimento individual.',
        'Programas estruturados de capacitação com trilhas de carreira definidas.',
        'Cultura de aprendizado contínuo com mentoria, job rotation e investimento significativo.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece destinando tempo e recursos mínimos para capacitação da equipe.',
        'Crie planos de desenvolvimento individual alinhados com os objetivos da empresa.',
        'Implemente trilhas de carreira claras e programas de mentoria.',
        'Meça o ROI dos investimentos em desenvolvimento e ajuste os programas.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Liderança',
      description: 'A empresa possui lideranças preparadas e com competências desenvolvidas?',
      response_options: makeOptions([
        'Fundadores concentram todas as decisões, sem lideranças intermediárias.',
        'Líderes foram promovidos por competência técnica, sem preparo em gestão.',
        'Líderes passaram por treinamento básico de gestão e têm responsabilidades claras.',
        'Lideranças desenvolvidas com coaching, feedback 360 e delegação efetiva.',
        'Time de liderança forte, alinhado e autônomo, com sucessão planejada.',
      ]),
      feedback_per_level: makeFeedback([
        'Identifique potenciais líderes e comece a delegar responsabilidades gradualmente.',
        'Invista em treinamento de gestão para novos líderes. Gestão de pessoas é uma competência a ser desenvolvida.',
        'Implemente feedback 360 e coaching para lideranças.',
        'Crie planos de sucessão e desenvolva a próxima geração de líderes.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
    {
      title: 'Engajamento e Retenção',
      description: 'A empresa monitora e trabalha o engajamento e retenção de talentos?',
      response_options: makeOptions([
        'Não monitoramos engajamento nem temos estratégia de retenção.',
        'Percebemos problemas de retenção mas não temos ações estruturadas.',
        'Pesquisas de engajamento periódicas com planos de ação baseados nos resultados.',
        'Estratégia de retenção completa com benefícios, reconhecimento e clima organizacional.',
        'Engajamento é prioridade estratégica com eNPS alto, baixo turnover e cultura admirada.',
      ]),
      feedback_per_level: makeFeedback([
        'Comece com conversas 1:1 regulares e uma pesquisa simples de satisfação.',
        'Implemente pesquisas de engajamento trimestrais e crie planos de ação com base nos resultados.',
        'Desenvolva um pacote de benefícios competitivo e programas de reconhecimento.',
        'Torne o engajamento uma métrica do negócio e envolva lideranças na melhoria contínua.',
        'Parabéns! Você está no caminho certo!',
      ]),
    },
  ],
}

async function seedMissing() {
  for (const [dimName, indicators] of Object.entries(MISSING_INDICATORS)) {
    // Find the dimension
    const dim = await db.query.dimensions.findFirst({
      where: eq(schema.dimensions.name, dimName),
    })

    if (!dim) {
      console.error(`Dimension "${dimName}" not found!`)
      continue
    }

    // Check if already has indicators
    const existing = await db.query.indicators.findMany({
      where: eq(schema.indicators.dimensionId, dim.id),
    })

    if (existing.length > 0) {
      console.log(`${dimName}: já tem ${existing.length} indicadores, pulando.`)
      continue
    }

    const weight = 1 / indicators.length
    const values = indicators.map((ind, idx) => ({
      dimensionId: dim.id,
      title: ind.title,
      description: ind.description,
      weight: String(weight),
      orderIndex: idx + 1,
      responseOptions: ind.response_options,
      feedbackPerLevel: ind.feedback_per_level,
      hasNaOption: false,
    }))

    await db.insert(schema.indicators).values(values)
    console.log(`${dimName}: ${values.length} indicadores inseridos.`)
  }

  console.log('Seed de dimensões faltantes concluído!')
  process.exit(0)
}

seedMissing().catch(err => {
  console.error(err)
  process.exit(1)
})
