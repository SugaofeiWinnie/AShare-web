import type { MarketOverview } from '../types/market'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function fetchOverview(): Promise<MarketOverview> {
  const response = await fetch(`${API_BASE}/api/market/overview`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`行情接口请求失败：${response.status}`)
  }

  return response.json() as Promise<MarketOverview>
}
