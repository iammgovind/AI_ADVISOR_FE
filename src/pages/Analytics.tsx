import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getAnalytics, type AnalyticsItem } from '../api/expenses'

const COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#a78bfa','#fb923c','#34d399']

export default function Analytics() {
  const [data, setData] = useState<AnalyticsItem[]>([])

  useEffect(() => { getAnalytics().then(setData) }, [])

  if (!data.length) return <div className="page"><p className="empty">No analytics data.</p></div>

  return (
    <div className="page">
      <h2>Analytics</h2>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name as string}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Total Amount per Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="total" name="Total ($)" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="category-table">
        <table>
          <thead><tr><th>Category</th><th>Total</th><th>Transactions</th><th>Avg</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.category}>
                <td className="capitalize">{d.category}</td>
                <td>${d.total.toFixed(2)}</td>
                <td>{d.count}</td>
                <td>${(d.total / d.count).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
