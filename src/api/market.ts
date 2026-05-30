import type {
  AiReviewRequest,
  AiReviewResponse,
  FundFlowOverview,
  MarketOverview,
  PreopenBrief
} from '../types/market'

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
    throw new Error(`overview request failed: ${response.status}`)
  }

  return response.json() as Promise<MarketOverview>
}

export async function fetchPreopen(): Promise<PreopenBrief> {
  const response = await fetch(`${API_BASE}/api/market/preopen`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`preopen request failed: ${response.status}`)
  }

  return response.json() as Promise<PreopenBrief>
}

export async function fetchFunds(): Promise<FundFlowOverview> {
  const response = await fetch(`${API_BASE}/api/market/funds`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`funds request failed: ${response.status}`)
  }

  return response.json() as Promise<FundFlowOverview>
}

export async function submitAiReview(payload: AiReviewRequest): Promise<AiReviewResponse> {
  const response = await fetch(`${API_BASE}/api/market/ai-review`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`ai review request failed: ${response.status}`)
  }

  return response.json() as Promise<AiReviewResponse>
}
