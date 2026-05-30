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
  mood: MarketMood
  analysis: string
  ladder: LadderSummary
  tradeDate: string
  updatedAt: string
}
