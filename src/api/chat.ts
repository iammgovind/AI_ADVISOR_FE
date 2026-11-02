import api from './client'
import { getRiskAssessment } from './risk'
import { getMultiAgentRecommend } from './agent'
import { analyzeFinances } from './agent'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatReply {
  reply: string
}

const RISK_KEYWORDS = ['risk', 'risk profile', 'risk score', 'risk level', 'conservative', 'aggressive', 'moderate']
const RESEARCH_KEYWORDS = ['sip', 'mutual fund', 'invest', 'market', 'stock', 'equity', 'portfolio', 'fund', 'nifty', 'sensex']
const MULTI_KEYWORDS = ['score', 'health', 'overall', 'recommend', 'financial health', 'advisor', 'multi agent']

function detectIntent(msg: string): 'risk' | 'research' | 'multi' | 'chat' {
  const lower = msg.toLowerCase()
  if (RISK_KEYWORDS.some((k) => lower.includes(k))) return 'risk'
  if (MULTI_KEYWORDS.some((k) => lower.includes(k))) return 'multi'
  if (RESEARCH_KEYWORDS.some((k) => lower.includes(k))) return 'research'
  return 'chat'
}

function formatRisk(r: Awaited<ReturnType<typeof getRiskAssessment>>): string {
  const alloc = Object.entries(r.recommended_allocation).map(([k, v]) => `${k}: ${v}%`).join(' · ')
  const warnings = r.warnings.length ? `\n⚠️ ${r.warnings.join('\n⚠️ ')}` : ''
  return `🛡️ Risk Profile: ${r.risk_level.toUpperCase()} (Score: ${r.risk_score}/100)\n\n${r.description}\n\n📊 Allocation → ${alloc}\n💼 Suitable: ${r.suitable_investments.join(', ')}${warnings}`
}

function formatMulti(r: Awaited<ReturnType<typeof getMultiAgentRecommend>>): string {
  const recs = r.recommendations.slice(0, 3).map((rec) => `${rec.priority}. [${rec.urgency.toUpperCase()}] ${rec.action} — ${rec.detail}`).join('\n')
  return `🤖 Financial Health Score: ${r.financial_health_score} (${r.financial_health_status})\n\n📋 Top Recommendations:\n${recs}`
}

function formatResearch(r: Awaited<ReturnType<typeof analyzeFinances>>): string {
  return `💼 Portfolio Analysis\n\n${r.analysis}`
}

export async function smartSend(message: string): Promise<ChatReply> {
  const intent = detectIntent(message)
  if (intent === 'risk') {
    const r = await getRiskAssessment()
    return { reply: formatRisk(r) }
  }
  if (intent === 'multi') {
    const r = await getMultiAgentRecommend()
    return { reply: formatMulti(r) }
  }
  if (intent === 'research') {
    const r = await analyzeFinances()
    return { reply: formatResearch(r) }
  }
  return api.post<ChatReply>('/chat', { message }).then((r) => r.data)
}

export const sendMessage = (message: string) =>
  api.post<ChatReply>('/chat', { message }).then((r) => r.data)

export const getChatHistory = () =>
  api.get<ChatMessage[]>('/chat/history').then((r) => r.data)

export const clearChatHistory = () =>
  api.delete('/chat/history')
