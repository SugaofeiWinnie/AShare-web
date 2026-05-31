<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  Calendar,
  Coin,
  DataAnalysis,
  TrendCharts,
  Tickets,
  MagicStick
} from '@element-plus/icons-vue'
import {
  fetchFunds,
  fetchOverview,
  fetchPreopen,
  submitAiReview
} from './api/market'
import type {
  AiReviewResponse,
  FundFlowOverview,
  GlobalMarketItem,
  LadderRow,
  MarketOverview,
  PreopenBrief,
  QuoteItem
} from './types/market'

type ViewName = 'overview' | 'preopen' | 'boards' | 'funds' | 'ladder' | 'ai'
type ConceptOrder = 'top' | 'bottom'

const activeView = ref<ViewName>('overview')
const selectedDate = ref(formatLocalDate(new Date()))

const overview = ref<MarketOverview | null>(null)
const preopen = ref<PreopenBrief | null>(null)
const funds = ref<FundFlowOverview | null>(null)
const aiResult = ref<AiReviewResponse | null>(null)

const overviewLoading = ref(false)
const preopenLoading = ref(false)
const fundsLoading = ref(false)
const aiLoading = ref(false)
const error = ref('')
const industryLimit = ref(12)
const conceptOrder = ref<ConceptOrder>('top')

const reviewForm = reactive({
  viewpoint: '',
  operation: '',
  position: '',
  concern: '',
  marketContext: ''
})

const pageMeta = computed(() => {
  const map: Record<ViewName, [string, string]> = {
    overview: ['今日市场总览', '看指数、看板块、看国际市场，把今天的盘面一次看清。'],
    preopen: ['盘前看点', '自动生成隔夜美股、中概股、商品、汇率和财报日历等内容。'],
    boards: ['热门板块排行', '按涨跌与资金流向查看今天最热的行业和概念。'],
    funds: ['资金流向', '观察北向资金、主力资金和龙虎榜里的真实偏好。'],
    ladder: ['连板天梯', '比较昨日涨停池和今日涨停池，跟踪晋级和断板。'],
    ai: ['AI盘后复盘', '输入今天的观点和操作，让智能助手帮你复盘节奏和风险。']
  }
  return map[activeView.value]
})

const topIndustries = computed(() => {
  return [...(overview.value?.industries ?? [])]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, industryLimit.value)
})

const displayedConcepts = computed(() => {
  const compare = conceptOrder.value === 'top'
    ? (a: QuoteItem, b: QuoteItem) => b.pct - a.pct
    : (a: QuoteItem, b: QuoteItem) => a.pct - b.pct
  return [...(overview.value?.concepts ?? [])].sort(compare).slice(0, 12)
})

const ladderRows = computed(() => {
  return (overview.value?.ladder.rows ?? []).filter((row) => row.todayDays > 0)
})

const ladderTiers = computed(() => {
  const days = new Set(ladderRows.value.map((row) => row.todayDays))
  return [...days].sort((a, b) => b - a)
})

const preopenRows = computed(() => preopen.value)
const northboundRows = computed(() => funds.value?.northbound ?? [])
const mainFundRows = computed(() => funds.value?.mainFunds ?? [])
const dragonTigerRows = computed(() => funds.value?.dragonTiger ?? [])

const moodLabel = computed(() => {
  const label = overview.value?.mood.label ?? ''
  if (label === 'Hot' || label === '偏热') return '偏热'
  if (label === 'Cold' || label === '偏冷') return '偏冷'
  return '震荡'
})

const moodColor = computed(() => {
  const label = overview.value?.mood.label ?? ''
  if (label === 'Hot' || label === '偏热') return '#dc2626'
  if (label === 'Cold' || label === '偏冷') return '#059669'
  return '#d97706'
})

const dateHint = computed(() => {
  if (!overview.value) return ''
  if (overview.value.tradeDate === selectedDate.value) return ''
  return `已回退至最近可用交易日 ${overview.value.tradeDate}`
})

async function loadOverview() {
  overviewLoading.value = true
  error.value = ''
  try {
    overview.value = await fetchOverview(selectedDate.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '行情数据加载失败'
  } finally {
    overviewLoading.value = false
  }
}

async function loadPreopen(force = false) {
  if (preopenLoading.value || (!force && preopen.value)) return
  preopenLoading.value = true
  try {
    preopen.value = await fetchPreopen()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '盘前看点加载失败'
  } finally {
    preopenLoading.value = false
  }
}

async function loadFunds(force = false) {
  if (fundsLoading.value || (!force && funds.value)) return
  fundsLoading.value = true
  try {
    funds.value = await fetchFunds()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '资金流向加载失败'
  } finally {
    fundsLoading.value = false
  }
}

async function submitReview() {
  aiLoading.value = true
  error.value = ''
  try {
    aiResult.value = await submitAiReview({
      tradeDate: selectedDate.value,
      viewpoint: reviewForm.viewpoint.trim(),
      operation: reviewForm.operation.trim(),
      position: reviewForm.position.trim(),
      concern: reviewForm.concern.trim(),
      marketContext: reviewForm.marketContext.trim() || overview.value?.analysis || ''
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'AI复盘请求失败'
  } finally {
    aiLoading.value = false
  }
}

function selectView(key: string) {
  activeView.value = key as ViewName
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function disableFutureDate(date: Date) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '--'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

function formatPct(value: number) {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}%`
}

function formatAmount(value: number) {
  if (!Number.isFinite(value)) return '--'
  if (Math.abs(value) >= 100000000) return `${formatNumber(value / 100000000)} 亿`
  if (Math.abs(value) >= 10000) return `${formatNumber(value / 10000)} 万`
  return formatNumber(value, 0)
}

function displayDate(dateText: string) {
  if (!dateText || dateText.length !== 8) return '--'
  return `${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}`
}

function formatLimitTime(value: string) {
  if (!value) return '--'
  const padded = value.padStart(6, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`
}

function pctClass(value: number) {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

function sparklinePoints(item: QuoteItem) {
  const prices = item.trends.map((point) => point.price).filter((price) => Number.isFinite(price) && price > 0)
  if (prices.length < 2) return ''
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const width = 180
  const height = 52
  const step = width / Math.max(prices.length - 1, 1)
  return prices
    .map((price, index) => {
      const x = index * step
      const y = height - ((price - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function tierRows(days: number): LadderRow[] {
  return ladderRows.value.filter((row) => row.todayDays === days)
}

function tierLabel(days: number) {
  return days === 1 ? '首板' : `${days} 连板`
}

function ladderTagClass(row: LadderRow) {
  return row.intradayBroken ? 'ladder-chip is-broken' : 'ladder-chip'
}

function ladderStatus(row: LadderRow) {
  if (row.intradayBroken) return '盘中炸板'
  if (row.promoted) return '晋级'
  if (row.todayDays === 1) return '首板'
  return '断板'
}

function ladderStatusType(row: LadderRow) {
  if (row.intradayBroken) return 'info'
  if (row.promoted || row.todayDays === 1) return 'danger'
  return 'info'
}

function briefMove(item: GlobalMarketItem) {
  return `${marketName(item)} ${item.pct >= 0 ? '+' : ''}${formatNumber(item.pct)}%`
}

function marketGroup(group: string) {
  const map: Record<string, string> = {
    US: '美股',
    ADR: '中概股',
    Commodity: '商品',
    FX: '汇率',
    Earnings: '财报'
  }
  return map[group] ?? group
}

function marketName(item: GlobalMarketItem) {
  const map: Record<string, string> = {
    SPY: '标普500ETF',
    QQQ: '纳指100ETF',
    DIA: '道指ETF',
    IWM: '罗素2000ETF',
    BABA: '阿里巴巴',
    PDD: '拼多多',
    JD: '京东',
    BIDU: '百度',
    NIO: '蔚来',
    XPEV: '小鹏汽车',
    'XAU/USD': '黄金',
    'CL.F': 'WTI原油',
    'SI.F': '白银',
    'HG.F': '铜',
    USDCNY: '美元/人民币',
    USDCNH: '美元/离岸人民币',
    EURUSD: '欧元/美元',
    USDJPY: '美元/日元'
  }
  return map[item.code] ?? item.name
}

watch(selectedDate, () => {
  loadOverview()
})

watch(activeView, (view) => {
  if (view === 'preopen') loadPreopen()
  if (view === 'funds') loadFunds()
})

watch(overview, (current) => {
  if (current && !reviewForm.marketContext) {
    reviewForm.marketContext = current.analysis
  }
})

onMounted(async () => {
  await loadOverview()
  await Promise.all([loadPreopen(), loadFunds()])
})
</script>

<template>
  <el-config-provider>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">A</div>
          <div>
            <strong>A股观察台</strong>
            <span>市场观察面板</span>
          </div>
        </div>

        <el-menu :default-active="activeView" class="side-menu" @select="selectView">
          <el-menu-item index="overview">
            <el-icon><TrendCharts /></el-icon>
            <span>今日市场总览</span>
          </el-menu-item>
          <el-menu-item index="preopen">
            <el-icon><Calendar /></el-icon>
            <span>盘前看点</span>
          </el-menu-item>
          <el-menu-item index="boards">
            <el-icon><DataAnalysis /></el-icon>
            <span>热门板块排行</span>
          </el-menu-item>
          <el-menu-item index="funds">
            <el-icon><Coin /></el-icon>
            <span>资金流向</span>
          </el-menu-item>
          <el-menu-item index="ladder">
            <el-icon><Tickets /></el-icon>
            <span>连板天梯</span>
          </el-menu-item>
          <el-menu-item index="ai">
            <el-icon><MagicStick /></el-icon>
            <span>AI盘后复盘</span>
          </el-menu-item>
        </el-menu>

        <p class="side-note">数据来自东方财富公开行情接口与外部公开市场页，仅用于观察和学习。</p>
      </aside>

      <main class="main">
        <header class="topbar">
          <section>
            <p class="eyebrow">A股市场观察</p>
            <h1>{{ pageMeta[0] }}</h1>
            <p>{{ pageMeta[1] }}</p>
          </section>
          <section class="actions">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              :prefix-icon="Calendar"
              :clearable="false"
              :disabled-date="disableFutureDate"
              :disabled="overviewLoading"
            />
            <span v-if="overview">
              查询 {{ selectedDate }} · 交易日 {{ overview.tradeDate }} · 更新于 {{ overview.updatedAt }}
            </span>
            <small v-if="dateHint">{{ dateHint }}</small>
          </section>
        </header>

        <el-alert
          v-if="error"
          class="notice"
          type="error"
          :title="error"
          show-icon
          :closable="false"
        />

        <template v-if="overview">
          <section v-show="activeView === 'overview'" class="view">
            <div class="market-grid">
              <el-card class="mood-card" shadow="never">
                <template #header>
                  <span>市场温度</span>
                </template>
                <div class="mood-head">
                  <strong>{{ moodLabel }}</strong>
                  <el-progress
                    :percentage="overview.mood.heat"
                    :stroke-width="12"
                    :show-text="false"
                    :color="moodColor"
                  />
                </div>
                <p>{{ overview.mood.detail }}</p>
              </el-card>

              <el-card v-for="item in overview.indices" :key="item.code" class="index-card" shadow="never">
                <p>{{ item.name }}</p>
                <strong>{{ formatNumber(item.price) }}</strong>
                <span :class="pctClass(item.pct)">{{ formatPct(item.pct) }} / {{ formatNumber(item.change) }}</span>
                <svg class="sparkline" viewBox="0 0 180 52" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" y1="26" x2="180" y2="26" class="sparkline-axis" />
                  <polyline
                    v-if="sparklinePoints(item)"
                    :points="sparklinePoints(item)"
                    :class="['sparkline-line', pctClass(item.pct)]"
                  />
                </svg>
              </el-card>
            </div>

            <div class="analysis-grid">
              <el-card shadow="never">
                <template #header>
                  <span>当前状态</span>
                </template>
                <p class="analysis-text">{{ overview.analysis }}</p>
              </el-card>

              <el-card shadow="never">
                <template #header>
                  <span>国际市场</span>
                </template>
                <div class="global-grid">
                  <section v-for="item in overview.globalMarkets" :key="`${item.group}-${item.code}`" class="global-item">
                    <small>{{ marketGroup(item.group) }}</small>
                    <strong>{{ marketName(item) }}</strong>
                    <span :class="pctClass(item.pct)">{{ formatNumber(item.price) }} / {{ formatPct(item.pct) }}</span>
                  </section>
                </div>
              </el-card>
            </div>
          </section>

          <section v-show="activeView === 'preopen'" class="view">
            <div class="analysis-grid">
              <el-card shadow="never">
                <template #header>
                  <span>盘前摘要</span>
                </template>
                <p class="analysis-text">{{ preopenRows?.summary ?? '暂无盘前摘要' }}</p>
              </el-card>
              <el-card shadow="never">
                <template #header>
                  <span>今日重要事件</span>
                </template>
                <div class="list-block">
                  <p v-for="item in preopenRows?.importantEvents ?? []" :key="item">{{ item }}</p>
                </div>
              </el-card>
            </div>

            <div class="content-grid">
              <el-card shadow="never">
                <template #header>
                  <span>隔夜美股</span>
                </template>
                <ul class="compact-list">
                  <li v-for="item in preopenRows?.overnightUs ?? []" :key="item.code">{{ briefMove(item) }}</li>
                </ul>
              </el-card>
              <el-card shadow="never">
                <template #header>
                  <span>中概股</span>
                </template>
                <ul class="compact-list">
                  <li v-for="item in preopenRows?.chineseAdr ?? []" :key="item.code">{{ briefMove(item) }}</li>
                </ul>
              </el-card>
            </div>

            <div class="content-grid">
              <el-card shadow="never">
                <template #header>
                  <span>商品市场</span>
                </template>
                <ul class="compact-list">
                  <li v-for="item in preopenRows?.commodities ?? []" :key="item.code">{{ briefMove(item) }}</li>
                </ul>
              </el-card>
              <el-card shadow="never">
                <template #header>
                  <span>汇率</span>
                </template>
                <ul class="compact-list">
                  <li v-for="item in preopenRows?.fx ?? []" :key="item.code">{{ briefMove(item) }}</li>
                </ul>
              </el-card>
            </div>

            <div class="analysis-grid">
              <el-card shadow="never">
                <template #header>
                  <span>财报日历</span>
                </template>
                <el-table :data="preopenRows?.earningsCalendar ?? []" size="large">
                  <el-table-column prop="name" label="公司" min-width="120" />
                  <el-table-column prop="earningsDate" label="财报日期" width="140" />
                  <el-table-column prop="note" label="提示" min-width="220" />
                </el-table>
              </el-card>
              <el-card shadow="never">
                <template #header>
                  <span>今日热点预测</span>
                </template>
                <ol class="number-list">
                  <li v-for="item in preopenRows?.hotPredictions ?? []" :key="item">{{ item }}</li>
                </ol>
              </el-card>
            </div>
          </section>

          <section v-show="activeView === 'boards'" class="view">
            <div class="content-grid">
              <el-card shadow="never">
                <template #header>
                  <div class="panel-head">
                    <span>行业板块涨跌排名</span>
                    <el-select v-model="industryLimit" size="small" style="width: 112px">
                      <el-option :value="8" label="前 8" />
                      <el-option :value="12" label="前 12" />
                      <el-option :value="20" label="前 20" />
                    </el-select>
                  </div>
                </template>
                <el-table :data="topIndustries" size="large">
                  <el-table-column type="index" label="#" width="56" />
                  <el-table-column prop="name" label="行业" min-width="140" />
                  <el-table-column label="涨跌幅" width="120">
                    <template #default="{ row }">
                      <span :class="pctClass(row.pct)">{{ formatPct(row.pct) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="成交额" width="140">
                    <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
                  </el-table-column>
                </el-table>
              </el-card>

              <el-card shadow="never">
                <template #header>
                  <div class="panel-head">
                    <span>概念板块热点扫描</span>
                    <el-radio-group v-model="conceptOrder" size="small">
                      <el-radio-button label="top">领涨</el-radio-button>
                      <el-radio-button label="bottom">领跌</el-radio-button>
                    </el-radio-group>
                  </div>
                </template>
                <el-table :data="displayedConcepts" size="large">
                  <el-table-column type="index" label="#" width="56" />
                  <el-table-column prop="name" label="概念" min-width="140" />
                  <el-table-column label="涨跌幅" width="120">
                    <template #default="{ row }">
                      <span :class="pctClass(row.pct)">{{ formatPct(row.pct) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="资金净流入" width="140">
                    <template #default="{ row }">{{ formatAmount(row.inflow) }}</template>
                  </el-table-column>
                </el-table>
              </el-card>
            </div>
          </section>

          <section v-show="activeView === 'funds'" class="view">
            <div class="analysis-grid">
              <el-card shadow="never">
                <template #header>
                  <span>北向资金</span>
                </template>
                <el-table :data="northboundRows" size="large">
                  <el-table-column prop="name" label="方向" min-width="140" />
                  <el-table-column label="当日净流入" width="140">
                    <template #default="{ row }">{{ formatAmount(row.dayNetAmtIn) }}</template>
                  </el-table-column>
                  <el-table-column label="月度净流入" width="140">
                    <template #default="{ row }">{{ formatAmount(row.monthNetAmtIn) }}</template>
                  </el-table-column>
                  <el-table-column label="年度净流入" width="140">
                    <template #default="{ row }">{{ formatAmount(row.yearNetAmtIn) }}</template>
                  </el-table-column>
                </el-table>
              </el-card>
              <el-card shadow="never">
                <template #header>
                  <span>主力资金</span>
                </template>
                <el-table :data="mainFundRows" size="large">
                  <el-table-column prop="name" label="名称" min-width="140" />
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column label="净流入" width="140">
                    <template #default="{ row }">{{ formatAmount(row.inflow) }}</template>
                  </el-table-column>
                  <el-table-column label="涨跌幅" width="120">
                    <template #default="{ row }"><span :class="pctClass(row.changePct)">{{ formatPct(row.changePct) }}</span></template>
                  </el-table-column>
                </el-table>
              </el-card>
            </div>

            <el-card shadow="never">
              <template #header>
                <span>龙虎榜观察</span>
              </template>
              <el-table :data="dragonTigerRows" size="large">
                <el-table-column prop="name" label="股票" min-width="150" />
                <el-table-column prop="reason" label="原因" min-width="220" />
                <el-table-column label="收盘价" width="110">
                  <template #default="{ row }">{{ formatNumber(row.closePrice) }}</template>
                </el-table-column>
                <el-table-column label="涨跌幅" width="110">
                  <template #default="{ row }"><span :class="pctClass(row.changePct)">{{ formatPct(row.changePct) }}</span></template>
                </el-table-column>
                <el-table-column label="净买额" width="140">
                  <template #default="{ row }">{{ formatAmount(row.netBuy) }}</template>
                </el-table-column>
                <el-table-column label="买入额" width="140">
                  <template #default="{ row }">{{ formatAmount(row.buyAmt) }}</template>
                </el-table-column>
                <el-table-column label="卖出额" width="140">
                  <template #default="{ row }">{{ formatAmount(row.sellAmt) }}</template>
                </el-table-column>
                <el-table-column label="换手率" width="110">
                  <template #default="{ row }">{{ formatNumber(row.turnoverRate) }}%</template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>

          <section v-show="activeView === 'ladder'" class="view">
            <div class="metric-grid">
              <el-card shadow="never"><span>昨日涨停</span><strong>{{ overview.ladder.yesterdayLimitCount }}</strong></el-card>
              <el-card shadow="never"><span>今日晋级</span><strong>{{ overview.ladder.promotedCount }}</strong></el-card>
              <el-card shadow="never"><span>晋级率</span><strong>{{ formatNumber(overview.ladder.promotionRate, 1) }}%</strong></el-card>
              <el-card shadow="never"><span>最高连板</span><strong>{{ overview.ladder.maxLadderDays || '--' }}</strong></el-card>
            </div>

            <el-card class="ladder-card" shadow="never">
              <template #header>
                <div class="panel-head">
                  <span>连板天梯</span>
                  <small>{{ displayDate(overview.ladder.yesterdayDate) }} -> {{ displayDate(overview.ladder.todayDate) }}</small>
                </div>
              </template>
              <el-empty v-if="!ladderRows.length" description="暂无连板天梯数据" />
              <div v-else class="ladder">
                <section v-for="days in ladderTiers" :key="days" class="tier">
                  <div class="tier-label">{{ tierLabel(days) }}</div>
                  <div class="chips">
                    <el-tag
                      v-for="stock in tierRows(days)"
                      :key="stock.code"
                      :class="ladderTagClass(stock)"
                      effect="plain"
                      size="large"
                    >
                      {{ stock.name }} · {{ stock.industry }} · {{ formatPct(stock.pct) }}
                    </el-tag>
                  </div>
                </section>
              </div>
            </el-card>

            <el-card shadow="never">
              <template #header>
                <span>昨日涨停股今日表现</span>
              </template>
              <el-table :data="overview.ladder.rows" size="large">
                <el-table-column prop="name" label="股票" min-width="150" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="ladderStatusType(row)">{{ ladderStatus(row) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="连板" width="96">
                  <template #default="{ row }">
                    {{ row.todayDays > 0 ? tierLabel(row.todayDays) : `昨 ${row.yesterdayDays} 板` }}
                  </template>
                </el-table-column>
                <el-table-column label="涨跌幅" width="110">
                  <template #default="{ row }"><span :class="pctClass(row.pct)">{{ formatPct(row.pct) }}</span></template>
                </el-table-column>
                <el-table-column prop="industry" label="行业" min-width="130" />
                <el-table-column label="首次封板" width="120">
                  <template #default="{ row }">{{ formatLimitTime(row.firstLimit) }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </section>

          <section v-show="activeView === 'ai'" class="view">
            <div class="content-grid">
              <el-card shadow="never">
                <template #header>
                  <span>今天的观点和操作</span>
                </template>
                <div class="form-grid">
                  <el-input
                    v-model="reviewForm.viewpoint"
                    type="textarea"
                    :rows="3"
                    placeholder="例如：今天判断市场会继续偏强，重点看科技和高股息的轮动。"
                  />
                  <el-input
                    v-model="reviewForm.operation"
                    type="textarea"
                    :rows="3"
                    placeholder="例如：早盘加仓了AI应用，中午减了一部分，尾盘又做了回补。"
                  />
                  <el-input v-model="reviewForm.position" placeholder="当前持仓，选填" />
                  <el-input v-model="reviewForm.concern" placeholder="你最担心的问题，选填" />
                  <el-input
                    v-model="reviewForm.marketContext"
                    type="textarea"
                    :rows="4"
                    placeholder="市场背景，默认会带入今天的总览分析。"
                  />
                  <el-button type="danger" :loading="aiLoading" @click="submitReview">
                    开始 AI 复盘
                  </el-button>
                </div>
              </el-card>

              <el-card shadow="never">
                <template #header>
                  <span>AI 解答</span>
                </template>
                <div v-if="aiResult" class="ai-result">
                  <el-tag :type="aiResult.fallback ? 'info' : 'success'">
                    {{ aiResult.fallback ? '本地简版复盘' : '智能复盘已生成' }}
                  </el-tag>
                  <p class="analysis-text">{{ aiResult.reply }}</p>
                  <small>生成于 {{ aiResult.generatedAt }}</small>
                </div>
                <el-empty v-else description="先输入观点和操作，再点击按钮生成复盘" />
              </el-card>
            </div>
          </section>
        </template>

        <el-empty v-else-if="!overviewLoading && !error" description="正在加载市场数据" />
        <el-skeleton v-if="overviewLoading && !overview" :rows="8" animated />
      </main>
    </div>
  </el-config-provider>
</template>
