import type { MarketOverview } from '../types/market'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function fetchOverview(date?: string): Promise<MarketOverview> {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  const query = params.toString()
  const response = await fetch(`${API_BASE}/api/market/overview${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`行情接口请求失败：${response.status}`)
  }

  return response.json() as Promise<MarketOverview>
}
