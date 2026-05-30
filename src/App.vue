<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Calendar, TrendCharts, Histogram, Tickets } from '@element-plus/icons-vue'
import { fetchOverview } from './api/market'
import type { LadderRow, MarketOverview, QuoteItem } from './types/market'

type ViewName = 'home' | 'boards' | 'ladder'
type ConceptOrder = 'top' | 'bottom'

const activeView = ref<ViewName>('home')
const overview = ref<MarketOverview | null>(null)
const loading = ref(false)
const error = ref('')
const industryLimit = ref(12)
const conceptOrder = ref<ConceptOrder>('top')
const selectedDate = ref(formatLocalDate(new Date()))

const pageMeta = computed(() => {
  const copy = {
    home: ['A股大盘与板块观察台', '聚焦主要指数、市场温度和结构化盘面解读。'],
    boards: ['板块详情', '查看行业板块与概念板块涨跌排序，识别当天主线。'],
    ladder: ['连板天梯', '对比昨日涨停池与今日涨停池，观察个股晋级和断板。']
  } as const
  return copy[activeView.value]
})

const topIndustries = computed(() => {
  return [...(overview.value?.industries ?? [])]
    .sort((a, b) => b.pct - a.pct)
    .slice(0, industryLimit.value)
})

const displayedConcepts = computed(() => {
  const sort = conceptOrder.value === 'top'
    ? (a: QuoteItem, b: QuoteItem) => b.pct - a.pct
    : (a: QuoteItem, b: QuoteItem) => a.pct - b.pct
  return [...(overview.value?.concepts ?? [])].sort(sort).slice(0, 12)
})

const promotedRows = computed(() => {
  return (overview.value?.ladder.rows ?? []).filter((row) => row.promoted)
})

async function loadMarket() {
  loading.value = true
  error.value = ''
  try {
    overview.value = await fetchOverview(selectedDate.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '行情数据加载失败'
  } finally {
    loading.value = false
  }
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

function selectView(key: string) {
  activeView.value = key as ViewName
}

function moodColor(label: string) {
  if (label === '偏热') return '#dc2626'
  if (label === '偏冷') return '#059669'
  return '#d97706'
}

function pctClass(value: number) {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
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
  return promotedRows.value.filter((row) => row.todayDays === days)
}

const ladderTiers = computed(() => {
  const days = new Set(promotedRows.value.map((row) => row.todayDays))
  return [...days].sort((a, b) => b - a)
})

onMounted(loadMarket)
</script>

<template>
  <el-config-provider>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">A</div>
          <div>
            <strong>A股观察台</strong>
            <span>Market Board</span>
          </div>
        </div>

        <el-menu :default-active="activeView" class="side-menu" @select="selectView">
          <el-menu-item index="home">
            <el-icon><TrendCharts /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="boards">
            <el-icon><Histogram /></el-icon>
            <span>板块详情</span>
          </el-menu-item>
          <el-menu-item index="ladder">
            <el-icon><Tickets /></el-icon>
            <span>连板天梯</span>
          </el-menu-item>
        </el-menu>

        <p class="side-note">数据来自东方财富公开行情接口，仅用于观察和学习。</p>
      </aside>

      <main class="main">
        <header class="topbar">
          <section>
            <p class="eyebrow">A-SHARE MARKET DASHBOARD</p>
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
              :disabled="loading"
              @change="loadMarket"
            />
            <span>
              {{
                overview?.updatedAt
                  ? `交易日 ${overview.tradeDate} · 更新于 ${overview.updatedAt}`
                  : '等待加载'
              }}
            </span>
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
          <section v-show="activeView === 'home'" class="view">
            <div class="market-grid">
              <el-card class="mood-card" shadow="never">
                <template #header>
                  <span>市场温度</span>
                </template>
                <div class="mood-head">
                  <strong>{{ overview.mood.label }}</strong>
                  <el-progress
                    :percentage="overview.mood.heat"
                    :stroke-width="12"
                    :show-text="false"
                    :color="moodColor(overview.mood.label)"
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
                  <span>趋势框架</span>
                </template>
                <p class="analysis-text">
                  短线看量能和扩散，中线看盈利与政策，长期看产业升级与资本回报。若上涨由多个行业同步扩散且成交放大，持续性通常更强；若只集中在少数题材，波动会更高。
                </p>
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
              <el-empty v-if="!promotedRows.length" description="暂无晋级到今日涨停池的个股" />
              <div v-else class="ladder">
                <section v-for="days in ladderTiers" :key="days" class="tier">
                  <div class="tier-label">{{ days }} 连板</div>
                  <div class="chips">
                    <el-tag v-for="stock in tierRows(days)" :key="stock.code" effect="plain" size="large">
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
                <el-table-column prop="name" label="股票" min-width="150">
                  <template #default="{ row }">{{ row.name }} {{ row.code }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.promoted ? 'danger' : 'info'">{{ row.promoted ? '晋级' : '断板' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="连板" width="96">
                  <template #default="{ row }">{{ row.promoted ? `${row.todayDays} 板` : `昨 ${row.yesterdayDays} 板` }}</template>
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
        </template>

        <el-empty v-else-if="!loading && !error" description="请选择日期加载行情" />
        <el-skeleton v-if="loading && !overview" :rows="8" animated />
      </main>
    </div>
  </el-config-provider>
</template>
