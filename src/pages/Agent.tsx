import { useState } from 'react'
import { getMarketData, getPortfolioInsights, getRecommendations, analyzeFinances, type MarketData, type FinancialProfile } from '../api/agent'

type Tab = 'market' | 'insights' | 'recommendations' | 'analysis'

function Markdown({ text }: { text: string }) {
  const html = text
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li><span class="li-num">$1.</span> $2</li>')
    .replace(/\n{2,}/g, '</p><p>')
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />
}

function ProfileCard({ profile }: { profile: FinancialProfile }) {
  return (
    <div className="profile-card">
      <div className="stat-cards" style={{ marginBottom: 0 }}>
        <div className="stat-card">
          <span className="stat-label">Monthly Expenses</span>
          <span className="stat-value" style={{ fontSize: 18 }}>₹{profile.monthly_expense.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Budget Used</span>
          <span className="stat-value" style={{ fontSize: 18 }}>{profile.budget_utilization_pct}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Portfolio P&L</span>
          <span className="stat-value" style={{ fontSize: 18, color: profile.portfolio.profit_loss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {profile.portfolio.profit_loss >= 0 ? '+' : ''}₹{profile.portfolio.profit_loss.toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Holdings</span>
          <span className="stat-value" style={{ fontSize: 18 }}>{profile.portfolio.total_holdings}</span>
        </div>
      </div>
    </div>
  )
}

export default function Agent() {
  const [tab, setTab] = useState<Tab>('market')
  const [symbol, setSymbol] = useState('')
  const [market, setMarket] = useState<MarketData | null>(null)
  const [marketError, setMarketError] = useState('')
  const [marketLoading, setMarketLoading] = useState(false)
  const [insights, setInsights] = useState<{ profile: FinancialProfile; insights: string } | null>(null)
  const [recommendations, setRecommendations] = useState<{ profile: FinancialProfile; recommendations: string } | null>(null)
  const [analysis, setAnalysis] = useState<{ profile: FinancialProfile; analysis: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symbol.trim()) return
    setMarketError(''); setMarket(null); setMarketLoading(true)
    try {
      setMarket(await getMarketData(symbol.trim().toUpperCase()))
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setMarketError(detail ?? 'Failed to fetch market data')
    } finally { setMarketLoading(false) }
  }

  const fetchTab = async (t: Tab) => {
    setTab(t); setError(''); setLoading(true)
    try {
      if (t === 'insights' && !insights) setInsights(await getPortfolioInsights())
      if (t === 'recommendations' && !recommendations) setRecommendations(await getRecommendations())
      if (t === 'analysis' && !analysis) setAnalysis(await analyzeFinances())
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Failed to load data')
    } finally { setLoading(false) }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'market', label: '📈 Market Lookup' },
    { key: 'insights', label: '🔍 Portfolio Insights' },
    { key: 'recommendations', label: '💡 Recommendations' },
    { key: 'analysis', label: '📊 Full Analysis' },
  ]

  const plColor = (v: number) => v >= 0 ? 'var(--success)' : 'var(--danger)'

  return (
    <div className="page">
      <h2>🧠 Investment Research Agent</h2>

      <div className="tab-bar" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => t.key === 'market' ? setTab('market') : fetchTab(t.key)}
            className={tab === t.key ? '' : 'btn-secondary'} style={{ padding: '7px 16px', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Market Lookup */}
      {tab === 'market' && (
        <div>
          <form className="controls row" onSubmit={handleMarket} style={{ marginBottom: 20 }}>
            <input
              placeholder="Symbol e.g. RELIANCE.NS, TCS.BO, AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              style={{ maxWidth: 320 }}
            />
            <button type="submit" disabled={marketLoading}>{marketLoading ? 'Fetching...' : 'Lookup'}</button>
          </form>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 16 }}>
            NSE: add .NS &nbsp;|&nbsp; BSE: add .BO &nbsp;|&nbsp; US stocks: no suffix
          </p>
          {marketError && <p className="error">{marketError}</p>}
          {market && (
            <div className="market-card">
              <div className="market-header">
                <div>
                  <div className="market-name">{market.name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {market.symbol}
                    {market.sector ? ` · ${market.sector}` : ''}
                    {market.industry ? ` · ${market.industry}` : ''}
                  </div>
                </div>
                <div className="market-price-block">
                  {market.current_price != null ? (
                    <>
                      <span className="market-price">{market.currency} {market.current_price.toLocaleString()}</span>
                      {market.change_pct != null && (
                        <span style={{ color: plColor(market.change_pct), fontWeight: 600, fontSize: 14 }}>
                          {market.change_pct >= 0 ? '▲' : '▼'} {Math.abs(market.change_pct).toFixed(2)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="error">No price data — try adding .NS or .BO suffix</span>
                  )}
                </div>
              </div>
              <div className="market-stats">
                <div className="market-stat"><span className="stat-label">Prev Close</span><span>{market.previous_close != null ? `${market.currency} ${market.previous_close.toLocaleString()}` : '—'}</span></div>
                <div className="market-stat"><span className="stat-label">52W High</span><span style={{ color: 'var(--success)' }}>{market['52w_high'] != null ? `${market.currency} ${market['52w_high'].toLocaleString()}` : '—'}</span></div>
                <div className="market-stat"><span className="stat-label">52W Low</span><span style={{ color: 'var(--danger)' }}>{market['52w_low'] != null ? `${market.currency} ${market['52w_low'].toLocaleString()}` : '—'}</span></div>
                <div className="market-stat"><span className="stat-label">P/E Ratio</span><span>{market.pe_ratio ?? '—'}</span></div>
                <div className="market-stat"><span className="stat-label">Market Cap</span><span>{market.market_cap != null ? `${market.currency} ${(market.market_cap / 1e7).toFixed(2)}Cr` : '—'}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights / Recommendations / Analysis */}
      {tab !== 'market' && (
        <div>
          {loading && <p className="text-muted">Loading...</p>}
          {error && <p className="error">{error}</p>}

          {tab === 'insights' && insights && (
            <>
              <ProfileCard profile={insights.profile} />
              <div className="agent-result"><Markdown text={insights.insights} /></div>
            </>
          )}
          {tab === 'recommendations' && recommendations && (
            <>
              <ProfileCard profile={recommendations.profile} />
              <div className="agent-result"><Markdown text={recommendations.recommendations} /></div>
            </>
          )}
          {tab === 'analysis' && analysis && (
            <>
              <ProfileCard profile={analysis.profile} />
              <div className="agent-result"><Markdown text={analysis.analysis} /></div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
