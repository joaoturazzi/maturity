'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type DimContext = {
  name: string
  score: string
  gap: string
  priority: string
  pctComportamental: number
  pctFerramental: number
  pctTecnica: number
  narrative: string | null
}

type AgentContextData = {
  companyName: string
  industry: string | null
  hasDiagnostic: boolean
  imeScore?: string
  maturityLevel?: string
  diagnosedAt?: string
  dimensions?: DimContext[]
  topGaps?: DimContext[]
  relevantDimension?: DimContext | null
  websiteContext?: Record<string, string> | null
}

export function AgentChat({
  agentType, agentName, agentRole, agentColor, agentBg,
}: {
  agentType: string
  agentName: string
  agentRole: string
  agentColor: string
  agentBg: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<AgentContextData | null>(null)
  const [contextLoaded, setContextLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load context + history on mount
  useEffect(() => {
    Promise.all([
      fetch(`/api/agents/${agentType}/context`)
        .then(r => r.json())
        .then(d => d.context as AgentContextData | null),
      fetch(`/api/conversations/${agentType}`)
        .then(r => r.json())
        .then(d => (d.messages ?? []) as Array<{ id: string; role: string; content: string }>),
    ])
      .then(([ctx, history]) => {
        setContext(ctx)
        setContextLoaded(true)

        if (history.length > 0) {
          setMessages(
            history.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content ?? '',
            }))
          )
        } else {
          // Proactive welcome with real data
          const welcome = ctx?.hasDiagnostic
            ? `Olá! Sou o ${agentName}. Já analisei seu diagnóstico — seu IME Score é **${ctx.imeScore}/5.0** (${ctx.maturityLevel}).` +
              (ctx.topGaps?.[0]
                ? ` A dimensão mais crítica é **${ctx.topGaps[0].name}** com gap de ${ctx.topGaps[0].gap} pontos.`
                : '') +
              ' Como posso ajudar você hoje?'
            : `Olá! Sou o ${agentName}. Para recomendações personalizadas, complete o diagnóstico de maturidade primeiro. Como posso ajudar?`

          setMessages([{ id: 'welcome', role: 'assistant', content: welcome }])
        }
      })
      .catch(() => {
        setContextLoaded(true)
        setMessages([
          { id: 'welcome-fallback', role: 'assistant', content: `Olá! Sou o ${agentName}. Como posso ajudar?` },
        ])
      })
  }, [agentType, agentName])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantId = `a-${Date.now()}`
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }

    const currentMessages = [...messages, userMsg]
    setMessages([...currentMessages, assistantMsg])

    let accumulated = ''

    try {
      const res = await fetch(`/api/agents/${agentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages
            .filter(m => !m.id.startsWith('welcome'))
            .map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`${res.status}: ${errText}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // toTextStreamResponse() returns plain text chunks
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        const currentText = accumulated
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: currentText } : m))
        )
      }

      // Persist to DB
      if (accumulated) {
        fetch(`/api/conversations/${agentType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: text, assistantMessage: accumulated }),
        }).catch(() => {})
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...m, content: `Erro: ${msg}. Tente novamente.` } : m))
      )
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, agentType, context])

  async function handleNewConversation() {
    await fetch(`/api/conversations/${agentType}`, { method: 'DELETE' }).catch(() => {})
    const welcome = context?.hasDiagnostic
      ? `Nova conversa iniciada. IME Score: **${context.imeScore}/5.0**. Como posso ajudar?`
      : 'Nova conversa iniciada. Como posso ajudar?'
    setMessages([{ id: `welcome-${Date.now()}`, role: 'assistant', content: welcome }])
  }

  // Render basic markdown (bold with **)
  function renderContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i}>{part.slice(2, -2)}</strong>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #eceae5',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/ai-agents" style={{ fontSize: 18, color: '#888', textDecoration: 'none' }}>
            ←
          </a>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: agentColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {agentName[0]}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{agentName}</p>
            <p style={{ fontSize: 11, color: '#888' }}>{agentRole}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {context?.hasDiagnostic && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: agentColor,
                background: agentBg,
                padding: '3px 10px',
                borderRadius: 20,
              }}
            >
              IME {context.imeScore} · {context.maturityLevel}
            </span>
          )}
          <button
            onClick={handleNewConversation}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid #e5e4e0',
              background: 'transparent',
              color: '#555',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Nova conversa
          </button>
        </div>
      </div>

      {/* Dimension scores bar */}
      {context?.hasDiagnostic && context.dimensions && (
        <div
          style={{
            background: agentBg,
            borderBottom: '1px solid #eceae5',
            padding: '10px 20px',
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {context.dimensions.map((dim) => (
            <div key={dim.name} style={{ flexShrink: 0, minWidth: 80, textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: agentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 2,
                }}
              >
                {dim.name}
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color:
                    Number(dim.score) < 2.5
                      ? '#c0392b'
                      : Number(dim.score) < 3.5
                        ? '#d68910'
                        : '#1e8449',
                }}
              >
                {dim.score}
              </p>
              <p style={{ fontSize: 9, color: '#888' }}>gap {dim.gap}</p>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#f7f6f3',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {!contextLoaded && (
          <div style={{ textAlign: 'center', color: '#bbb', fontSize: 12, paddingTop: 40 }}>
            Carregando contexto...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: agentColor,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {agentName[0]}
              </div>
            )}
            <div
              style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius:
                  msg.role === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                background: msg.role === 'user' ? agentColor : '#fff',
                color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                fontSize: 13,
                lineHeight: 1.65,
                border: msg.role === 'assistant' ? '1px solid #eceae5' : 'none',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content ? (
                renderContent(msg.content)
              ) : (
                <span style={{ color: '#bbb', letterSpacing: 2 }}>● ● ●</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid #eceae5',
          background: '#fff',
          display: 'flex',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={`Pergunte ao ${agentName}...`}
          disabled={loading || !contextLoaded}
          style={{
            flex: 1,
            fontSize: 13,
            padding: '10px 14px',
            border: '1px solid #e5e4e0',
            borderRadius: 8,
            outline: 'none',
            fontFamily: 'inherit',
            background: !contextLoaded ? '#f7f6f3' : '#fff',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || !contextLoaded}
          style={{
            padding: '10px 20px',
            background: loading || !input.trim() || !contextLoaded ? '#f0efec' : agentColor,
            color: loading || !input.trim() || !contextLoaded ? '#bbb' : '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: !loading && input.trim() && contextLoaded ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'all 0.12s',
            minWidth: 80,
          }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
