import { useState, useEffect } from 'react'

const MODULES = [
  {
    id: 'bpo',
    tag: 'MERCADO',
    tagColor: '#00E5C3',
    name: '01 — BPO Global & Regional',
    desc: 'Tendencias, movimientos competitivos, M&A y datos del sector BPO mundial y Cono Sur.',
    prompt: `Eres analista senior para el CEO de Konecta Cono Sur (Argentina, Chile, Uruguay, Paraguay, Bolivia). Busca las noticias MAS RECIENTES del sector BPO mundial y LATAM. Responde en español con esta estructura:\n\n**TITULARES CRÍTICOS**\n(3 bullets de 1 línea)\n\n**TENDENCIA DOMINANTE**\n(1 párrafo 3-4 líneas)\n\n**MOVIMIENTOS COMPETITIVOS**\n(2-3 bullets)\n\n**DATO A RETENER**\n(1 estadística con fuente)\n\n**IMPLICANCIA PARA CONO SUR**\n(1 párrafo corto)`,
  },
  {
    id: 'ai',
    tag: 'TECNOLOGÍA',
    tagColor: '#FF6B35',
    name: '02 — IA & Tecnología',
    desc: 'Desarrollos en IA generativa, automatización y plataformas CX aplicadas a BPO.',
    prompt: `Eres analista de tecnología para el CEO de Konecta Cono Sur. Busca desarrollos RECIENTES en IA y tech para BPO/CX. Responde en español:\n\n**LANZAMIENTOS Y NOVEDADES IA**\n(3 bullets)\n\n**AUTOMATIZACIÓN Y AGENTES**\n(1 párrafo)\n\n**PLATAFORMAS CX-TECH**\n(2 bullets)\n\n**CASO DE IMPLEMENTACIÓN**\n(1 ejemplo real con resultados)\n\n**ALERTA TECNOLÓGICA**\n(1 desarrollo disruptivo en 12-18 meses)`,
  },
  {
    id: 'impact',
    tag: 'APLICABILIDAD',
    tagColor: '#A78BFA',
    name: '03 — IA Aplicada al Negocio',
    desc: 'Impacto concreto de IA en operaciones, comercial y transformación BPO.',
    prompt: `Eres consultor de transformación para el CEO de Konecta Cono Sur. Analiza impacto CONCRETO de IA en BPO/CX. Responde en español:\n\n**IMPACTO OPERATIVO INMEDIATO**\n(2-3 bullets)\n\n**IMPACTO COMERCIAL**\n(1 párrafo)\n\n**TRANSFORMACIÓN DEL TALENTO**\n(2 bullets)\n\n**ROI DOCUMENTADO**\n(1-2 ejemplos con números)\n\n**ACCIÓN PRIORITARIA**\n(1 recomendación concreta)`,
  },
]

type ModuleState = {
  loading: boolean
  content: string | null
  timestamp: string | null
  open: boolean
  error: string | null
}


function renderInline(line: string) {
  if (!line.includes('**')) return line
  return line.split(/(\*\*.*?\*\*)/).map((part, j) =>
    /^\*\*.*\*\*$/.test(part)
      ? <strong key={j} style={{ color: '#E2E8F0' }}>{part.replace(/\*\*/g, '')}</strong>
      : part
  )
}

function formatContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    line = line.trim()
    if (!line || line === '---' || line === '–') return <div key={i} style={{ height: 5 }} />
    // markdown headings: #, ##, ###
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      const title = headingMatch[1].replace(/\*\*/g, '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim()
      return <div key={i} className="contentSectionTitle">{title}</div>
    }
    // bold-only line as section title
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      return <div key={i} className="contentSectionTitle">{line.replace(/\*\*/g, '')}</div>
    }
    // bullet points
    if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
      return (
        <div key={i} className="contentBullet">
          <span className="contentBulletArrow">▸</span>
          <span className="contentBulletText">{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    return <p key={i} className="contentPara">{renderInline(line)}</p>
  })
}

export default function Home() {
  const [today, setToday] = useState('')
  const [state, setState] = useState<Record<string, ModuleState>>(() =>
    Object.fromEntries(
      MODULES.map(m => [m.id, { loading: false, content: null, timestamp: null, open: false, error: null }])
    )
  )

  useEffect(() => {
    setToday(new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }))
  }, [])

  async function fetchModule(id: string) {
    const mod = MODULES.find(m => m.id === id)!
    setState(prev => ({ ...prev, [id]: { ...prev[id], loading: true, error: null, open: true } }))
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mod.prompt }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Error del servidor')
      const text = d.text
      setState(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          loading: false,
          content: text || 'Sin contenido.',
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        },
      }))
    } catch (e) {
      setState(prev => ({
        ...prev,
        [id]: { ...prev[id], loading: false, error: 'Error: ' + (e as Error).message, open: false },
      }))
    }
  }

  function toggleModule(id: string) {
    if (state[id].content) {
      setState(prev => ({ ...prev, [id]: { ...prev[id], open: !prev[id].open } }))
    }
  }

  async function generateAll() {
    for (let i = 0; i < MODULES.length; i++) {
      await fetchModule(MODULES[i].id)
      if (i < MODULES.length - 1) await new Promise(r => setTimeout(r, 30000))
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbarLeft">
          <div className="dotLive" />
          <span className="topbarTitle">Konecta Cono Sur · CEO Intel</span>
        </div>
        <span className="topbarDate">{today}</span>
      </div>


      <div className="hero">
        <div className="heroEyebrow">Market Intelligence Daily</div>
        <h1 className="heroTitle">
          Radar de<br />
          <span>industria, tech</span><br />
          y transformación.
        </h1>
        <p className="heroDesc">Intelligence diaria para el CEO de Konecta Cono Sur.</p>
        <button className="btnAll" onClick={generateAll}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Generar Brief Completo
        </button>
      </div>

      <div className="modules">
        {MODULES.map(mod => {
          const ms = state[mod.id]
          const btnLabel = ms.loading ? 'Buscando...' : ms.content ? 'Actualizar' : 'Generar Brief'
          const btnStyle = ms.content
            ? { background: '#1E293B', color: '#94A3B8' }
            : { background: mod.tagColor, color: '#0B1120' }
          return (
            <div key={mod.id} className={`module${ms.open ? ' moduleOpen' : ''}`}>
              <div className="moduleHeader" onClick={() => toggleModule(mod.id)}>
                <div className="moduleHeaderLeft">
                  <span
                    className="moduleTag"
                    style={{ color: mod.tagColor, border: `1px solid ${mod.tagColor}33`, background: `${mod.tagColor}11` }}
                  >
                    {mod.tag}
                  </span>
                  <span className="moduleName">{mod.name}</span>
                </div>
                <div className="moduleHeaderRight">
                  {ms.timestamp && <span className="moduleTimestamp">{ms.timestamp}</span>}
                  <button
                    className="btnGenerate"
                    style={btnStyle}
                    onClick={e => { e.stopPropagation(); fetchModule(mod.id) }}
                  >
                    <svg
                      style={ms.loading ? { animation: 'spin 0.8s linear infinite' } : {}}
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    {btnLabel}
                  </button>
                </div>
              </div>

              {!ms.open && <div className="moduleDesc">{mod.desc}</div>}

              {ms.open && ms.loading && (
                <div className="moduleLoading">
                  <div className="spinner" style={{ borderTopColor: mod.tagColor }} />
                  <span className="loadingText">Consultando fuentes...</span>
                </div>
              )}

              {ms.open && ms.content && !ms.loading && (
                <div className="moduleContent">{formatContent(ms.content)}</div>
              )}

              {ms.error && <div className="moduleError">⚠ {ms.error}</div>}
            </div>
          )
        })}
      </div>

      <div className="footer">
        <span>Konecta Cono Sur © 2026</span>
        <span>Claude + Web Search</span>
      </div>
    </>
  )
}
