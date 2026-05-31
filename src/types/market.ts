export interface QuoteItem {
  code: string
  name: string
  price: number
  pct: number
  change: number
  amount: number
  turnover: number
  inflow: number
  trends: TrendPoint[]
}

export interface GlobalMarketItem {
  group: string
  code: string
  name: string
  price: number
  pct: number
  change: number
  updatedAt: string
}

export interface TrendPoint {
  time: string
  price: number
  average: number
}

export interface LadderRow {
  code: string
  name: string
  industry: string
  promoted: boolean
  todayDays: number
  yesterdayDays: number
  pct: number
  firstLimit: string
  intradayBroken: boolean
}

export interface LadderSummary {
  todayDate: string
  yesterdayDate: string
  yesterdayLimitCount: number
  promotedCount: number
  promotionRate: number
  maxLadderDays: number
  rows: LadderRow[]
}

export interface MarketMood {
  label: string
  heat: number
  up: number
  down: number
  flat: number
  avgIndexPct: number
  detail: string
}

export interface MarketOverview {
  indices: QuoteItem[]
  industries: QuoteItem[]
  concepts: QuoteItem[]
  globalMarkets: GlobalMarketItem[]
  mood: MarketMood
  analysis: string
  ladder: LadderSummary
  tradeDate: string
  updatedAt: string
}

export interface CalendarItem {
  code: string
  name: string
  earningsDate: string
  note: string
}

export interface PreopenBrief {
  tradeDate: string
  overnightUs: GlobalMarketItem[]
  chineseAdr: GlobalMarketItem[]
  commodities: GlobalMarketItem[]
  fx: GlobalMarketItem[]
  importantEvents: string[]
  earningsCalendar: CalendarItem[]
  hotPredictions: string[]
  summary: string
  generatedAt: string
}

export interface NorthboundItem {
  name: string
  code: string
  dayNetAmtIn: number
  monthNetAmtIn: number
  yearNetAmtIn: number
  date: string
  date2: string
}

export interface MainFundItem {
  code: string
  name: string
  type: string
  inflow: number
  changePct: number
  date: string
}

export interface DragonTigerItem {
  code: string
  name: string
  reason: string
  closePrice: number
  changePct: number
  netBuy: number
  buyAmt: number
  sellAmt: number
  totalAmount: number
  turnoverRate: number
  tradeDate: string
}

export interface FundFlowOverview {
  tradeDate: string
  northbound: NorthboundItem[]
  mainFunds: MainFundItem[]
  dragonTiger: DragonTigerItem[]
  updatedAt: string
}

export interface AiReviewRequest {
  tradeDate?: string
  viewpoint: string
  operation: string
  position: string
  concern: string
  marketContext: string
}

export interface AiReviewResponse {
  fallback: boolean
  model: string
  reply: string
  generatedAt: string
}
