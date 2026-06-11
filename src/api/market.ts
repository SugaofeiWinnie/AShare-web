import type {
  AiReviewRequest,
  AiReviewResponse,
  FundFlowOverview,
  MarketOverview,
  PreopenBrief,
  StockReportGenerateRequest,
  StockReportResponse
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
    throw new Error(`市场总览接口请求失败：${response.status}`)
  }

  return response.json() as Promise<MarketOverview>
}

export async function fetchPreopen(): Promise<PreopenBrief> {
  const response = await fetch(`${API_BASE}/api/market/preopen`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`盘前看点接口请求失败：${response.status}`)
  }

  return response.json() as Promise<PreopenBrief>
}

export async function fetchFunds(): Promise<FundFlowOverview> {
  const response = await fetch(`${API_BASE}/api/market/funds`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`资金流向接口请求失败：${response.status}`)
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
    throw new Error(`AI复盘接口请求失败：${response.status}`)
  }

  return response.json() as Promise<AiReviewResponse>
}

export async function generateStockReport(payload: StockReportGenerateRequest): Promise<StockReportResponse> {
  const response = await fetch(`${API_BASE}/api/reports/generate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`个股报告生成失败：${response.status}`)
  }

  return response.json() as Promise<StockReportResponse>
}

export async function fetchLatestStockReport(code: string): Promise<StockReportResponse> {
  const params = new URLSearchParams({ code })
  const response = await fetch(`${API_BASE}/api/reports/latest?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`个股报告读取失败：${response.status}`)
  }

  return response.json() as Promise<StockReportResponse>
}
