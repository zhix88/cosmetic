<template>
  <section class="dashboard-page">
    <div class="dashboard-filter-bar">
      <div class="dashboard-filters">
        <el-select v-model="selectedStore" :disabled="role !== 'admin'">
          <el-option v-if="role === 'admin'" label="全部门店" value="all" />
          <el-option v-for="store in stores" :key="store" :label="store" :value="store" />
        </el-select>
        <el-radio-group v-model="period" size="small">
          <el-radio-button value="today">今日</el-radio-button>
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="period === 'custom'"
          v-model="customRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
        />
      </div>
    </div>

    <div class="dashboard-summary">
      <button v-for="metric in summaryMetrics" :key="metric.key" @click="openMetricDetails(metric)">
        <span :class="['summary-icon', metric.tone]"><component :is="metric.icon" /></span>
        <div>
          <p>{{ metric.label }}</p>
          <strong>{{ metric.prefix }}{{ metric.value }}</strong>
          <small :class="{ down: metric.trend < 0 }">
            {{ metric.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}% 较上期
          </small>
        </div>
      </button>
    </div>

    <div class="dashboard-grid">
      <article class="dashboard-panel progress-panel">
        <div class="dashboard-panel-title">
          <div><h2>业务进度数据</h2><p>各节点当前业务量与周期完成情况</p></div>
          <span>{{ rangeLabel }}</span>
        </div>
        <div class="progress-stage-grid">
          <button v-for="stage in progressStages" :key="stage.key" @click="openStageDetails(stage.key, stage.label)">
            <span class="stage-dot" :style="{ background: stage.color }"></span>
            <p>{{ stage.label }}</p>
            <strong>{{ stage.count }}</strong>
            <small>占全部 {{ stage.share }}% · {{ stage.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(stage.trend) }}%</small>
          </button>
        </div>
        <div ref="progressChartRef" class="chart chart-progress"></div>
      </article>

      <article class="dashboard-panel funnel-panel">
        <div class="dashboard-panel-title">
          <div><h2>转化漏斗</h2><p>从邀约到回访完成的业务转化</p></div>
          <strong>总转化 {{ overallConversion }}%</strong>
        </div>
        <div ref="funnelChartRef" class="chart chart-funnel"></div>
        <div class="funnel-rates">
          <span v-for="item in funnelData.slice(1)" :key="item.name">
            {{ item.name }} <strong>{{ item.rate }}%</strong>
          </span>
        </div>
      </article>

      <article class="dashboard-panel trend-panel">
        <div class="dashboard-panel-title">
          <div><h2>经营趋势</h2><p>现金、耗卡和总消耗额变化</p></div>
          <div class="legend-inline"><i class="cash"></i>现金 <i class="card"></i>耗卡 <i class="total"></i>总消耗 <i class="people"></i>到店/成交</div>
        </div>
        <div ref="trendChartRef" class="chart chart-trend"></div>
      </article>

      <article class="dashboard-panel structure-panel">
        <div class="dashboard-panel-title">
          <div><h2>消费与客群结构</h2><p>消费方式及新诊复诊占比</p></div>
        </div>
        <div class="structure-charts">
          <div class="structure-chart-item">
            <div ref="paymentChartRef" class="chart chart-donut"></div>
            <h3>消费方式</h3>
            <div class="structure-legend">
              <span><i style="background:#5b8ff9"></i>现金 <strong>¥{{ money(cashAmount) }}</strong></span>
              <span><i style="background:#f6bd16"></i>耗卡 <strong>¥{{ money(cardAmount) }}</strong></span>
            </div>
          </div>
          <div class="structure-chart-item">
            <div ref="diagnosisChartRef" class="chart chart-donut"></div>
            <h3>顾客结构</h3>
            <div class="structure-legend">
              <span><i style="background:#7c6cff"></i>新诊 <strong>{{ diagnosisCounts.new }}人</strong></span>
              <span><i style="background:#24b8a6"></i>复诊 <strong>{{ diagnosisCounts.returning }}人</strong></span>
            </div>
          </div>
          <div class="structure-chart-item">
            <div ref="projectChartRef" class="chart chart-donut"></div>
            <h3>项目分类</h3>
            <div class="structure-legend compact">
              <span v-for="(item, index) in projectStructure" :key="item.name">
                <i :style="{ background: projectColors[index] }"></i>{{ item.name }}
                <strong>{{ item.value }}</strong>
              </span>
            </div>
          </div>
        </div>
      </article>

      <article class="dashboard-panel ranking-panel">
        <div class="dashboard-panel-title">
          <div><h2>业务排行</h2><p>门店、员工与项目经营表现</p></div>
          <div class="ranking-controls">
            <el-radio-group v-model="rankingType" size="small">
              <el-radio-button value="store">门店</el-radio-button>
              <el-radio-button value="staff">员工</el-radio-button>
              <el-radio-button value="project">项目</el-radio-button>
            </el-radio-group>
            <el-select v-model="rankingMetric">
              <el-option label="总消耗额" value="amount" />
              <el-option label="成交数" value="deals" />
              <el-option label="转化率" value="conversion" />
            </el-select>
          </div>
        </div>
        <div ref="rankingChartRef" class="chart chart-ranking"></div>
      </article>

      <article class="dashboard-panel insights-panel">
        <div class="dashboard-panel-title">
          <div><h2>经营洞察</h2><p>自动识别需要关注的经营信号</p></div>
        </div>
        <div class="insight-list">
          <button v-for="item in insights" :key="item.title" @click="openInsightDetails(item)">
            <span :class="item.tone">{{ item.icon }}</span>
            <div><strong>{{ item.title }}</strong><p>{{ item.description }}</p></div>
            <b>{{ item.value }}</b>
          </button>
        </div>
        <div class="peak-hours">
          <h3>到店高峰时段</h3>
          <div v-for="hour in peakHours" :key="hour.label">
            <span>{{ hour.label }}</span>
            <i><b :style="{ width: `${hour.percent}%` }"></b></i>
            <strong>{{ hour.count }}人</strong>
          </div>
        </div>
      </article>
    </div>

    <el-drawer v-model="detailVisible" size="760px" :title="detailTitle">
      <div class="detail-definition">{{ detailDefinition }}</div>
      <el-table :data="pagedDetailRecords" stripe max-height="650">
        <el-table-column label="顾客" min-width="100">
          <template #default="{ row }">{{ row.vip1.name }}</template>
        </el-table-column>
        <el-table-column prop="businessDate" label="业务日期" width="112" />
        <el-table-column prop="store" label="门店" min-width="130" />
        <el-table-column label="项目" min-width="160">
          <template #default="{ row }">{{ row.projects?.join('、') || row.estimatedProject }}</template>
        </el-table-column>
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">{{ row.assignments?.manager || '—' }}</template>
        </el-table-column>
        <el-table-column label="消费金额" width="110" align="right">
          <template #default="{ row }">¥{{ money(recordAmount(row)) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="72" fixed="right">
          <template #default="{ row }"><el-button link type="primary" @click="$emit('open-record', row)">详情</el-button></template>
        </el-table-column>
      </el-table>
      <div v-if="detailRecords.length > 15" class="customer-pagination"><span>共 {{ detailRecords.length }} 条，每页15条</span><el-pagination v-model:current-page="detailPage" background layout="prev, pager, next" :page-size="15" :total="detailRecords.length" /></div>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { Coin, CreditCard, DataLine, Money, TrendCharts, UserFilled, WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  records: { type: Array, required: true },
  role: { type: String, required: true },
  roleMeta: { type: Object, required: true },
  stores: { type: Array, required: true }
})
defineEmits(['open-record'])

const selectedStore = ref(props.role === 'admin' ? 'all' : props.roleMeta.store)
const period = ref('month')
const customRange = ref([monthStart(), today()])
const rankingType = ref(props.role === 'admin' ? 'store' : 'staff')
const rankingMetric = ref('amount')
const detailVisible = ref(false)
const detailTitle = ref('')
const detailDefinition = ref('')
const detailRecords = ref([])
const detailPage = ref(1)
const pagedDetailRecords = computed(() => detailRecords.value.slice((detailPage.value - 1) * 15, detailPage.value * 15))
const progressChartRef = ref()
const funnelChartRef = ref()
const trendChartRef = ref()
const paymentChartRef = ref()
const diagnosisChartRef = ref()
const projectChartRef = ref()
const rankingChartRef = ref()
const charts = []

const statusOrder = ['invited', 'reception', 'triage', 'scheduling', 'service', 'followup', 'completed']
const statusLabels = { invited: '待邀约', reception: '待接待', triage: '待分诊', scheduling: '待排诊', service: '服务中', followup: '待回访', completed: '已完成', cancelled: '已取消' }
const statusColors = ['#f59e0b', '#fb923c', '#6366f1', '#8b5cf6', '#10b981', '#06b6d4', '#64748b', '#ef4444']
const projectColors = ['#5b5bd6', '#24b8a6', '#f59e0b', '#e66a6a']

const dateRange = computed(() => {
  const end = today()
  if (period.value === 'today') return [end, end]
  if (period.value === 'week') return [weekStart(), end]
  if (period.value === 'month') return [monthStart(), end]
  return customRange.value || [monthStart(), end]
})
const previousRange = computed(() => {
  const [start, end] = dateRange.value
  const days = daysBetween(start, end) + 1
  return [addDays(start, -days), addDays(start, -1)]
})
const rangeLabel = computed(() => `${dateRange.value[0]} 至 ${dateRange.value[1]}`)
const scopedRecords = computed(() => filterRange(props.records, dateRange.value))
const previousRecords = computed(() => filterRange(props.records, previousRange.value))
const activeRecords = computed(() => scopedRecords.value.filter((record) => record.status !== 'cancelled'))
const cashAmount = computed(() => sum(scopedRecords.value, (record) => Number(record.revenue || 0)))
const cardAmount = computed(() => sum(scopedRecords.value, (record) => Number(record.cardAmount || 0)))
const totalAmount = computed(() => cashAmount.value + cardAmount.value)
const dealRecords = computed(() => scopedRecords.value.filter((record) => recordAmount(record) > 0 && record.status !== 'cancelled'))
const cancelledRecords = computed(() => scopedRecords.value.filter((record) => record.status === 'cancelled'))
const averageTicket = computed(() => dealRecords.value.length ? Math.round(totalAmount.value / dealRecords.value.length) : 0)
const diagnosisCounts = computed(() => ({
  new: scopedRecords.value.filter((record) => record.diagnosisType === '新诊').length,
  returning: scopedRecords.value.filter((record) => record.diagnosisType === '复诊').length
}))

const summaryMetrics = computed(() => [
  metric('total', '总消耗额', money(totalAmount.value), '¥', TrendCharts, 'violet', totalAmount.value, previousTotal()),
  metric('cash', '现金收入', money(cashAmount.value), '¥', Money, 'blue', cashAmount.value, previousCash()),
  metric('card', '耗卡金额', money(cardAmount.value), '¥', CreditCard, 'orange', cardAmount.value, previousCard()),
  metric('deals', '成交人数', dealRecords.value.length, '', UserFilled, 'green', dealRecords.value.length, previousDeals()),
  metric('ticket', '成交客单价', money(averageTicket.value), '¥', Coin, 'cyan', averageTicket.value, previousTicket()),
  metric('cancel', '取消率', `${cancelRate()}%`, '', WarningFilled, 'red', cancelRate(), previousCancelRate())
])

const progressStages = computed(() => [...statusOrder, 'cancelled'].map((key, index) => {
  const count = scopedRecords.value.filter((record) => record.status === key).length
  const previous = previousRecords.value.filter((record) => record.status === key).length
  return { key, label: statusLabels[key], count, share: scopedRecords.value.length ? Math.round(count / scopedRecords.value.length * 100) : 0, trend: previous ? Math.round((count - previous) / previous * 1000) / 10 : count ? 100 : 0, color: statusColors[index] }
}))

const funnelData = computed(() => {
  const source = scopedRecords.value
  const counts = [
    source.length,
    source.filter((record) => reached(record, 'reception')).length,
    source.filter((record) => reached(record, 'triage')).length,
    source.filter((record) => reached(record, 'scheduling')).length,
    source.filter((record) => reached(record, 'followup')).length,
    source.filter((record) => reached(record, 'completed')).length
  ]
  const names = ['邀约业务', '到店接待', '完成分诊', '完成排诊', '服务完成', '回访完成']
  return names.map((name, index) => ({ name, value: counts[index], rate: index ? rate(counts[index], counts[index - 1]) : 100 }))
})
const overallConversion = computed(() => rate(funnelData.value.at(-1).value, funnelData.value[0].value))

const trendData = computed(() => {
  const dates = enumerateDates(dateRange.value[0], dateRange.value[1])
  return dates.map((date) => {
    const rows = scopedRecords.value.filter((record) => record.businessDate === date)
    return {
      date: date.slice(5),
      cash: sum(rows, (x) => Number(x.revenue || 0)),
      card: sum(rows, (x) => Number(x.cardAmount || 0)),
      arrivals: rows.filter((x) => reached(x, 'reception')).length,
      deals: rows.filter((x) => recordAmount(x) > 0 && x.status !== 'cancelled').length
    }
  })
})

const projectStructure = computed(() => {
  const categories = [
    { name: '皮肤护理', words: ['护理', '补水', '嫩肤', '祛斑', '痘肌', '敏感肌', '水光'] },
    { name: '抗衰祛皱', words: ['抗衰', '祛皱', '年轻化', '提升', '胶原'] },
    { name: '注射塑形', words: ['玻尿酸', '轮廓', '塑形', '瘦脸'] },
    { name: '身体护理', words: ['形体', '私密', '术后'] }
  ]
  return categories.map((category) => ({
    name: category.name,
    value: scopedRecords.value.reduce((total, record) => total + (record.projects || []).filter((project) => category.words.some((word) => project.includes(word))).length, 0)
  }))
})

const rankingData = computed(() => buildRanking(rankingType.value, rankingMetric.value))
const peakHours = computed(() => {
  const buckets = [['09:00-11:00', 9, 11], ['11:00-14:00', 11, 14], ['14:00-17:00', 14, 17], ['17:00-20:00', 17, 20]]
  const data = buckets.map(([label, start, end]) => ({ label, count: scopedRecords.value.filter((record) => {
    const hour = Number((record.arrivalTime || record.appointmentTime || '00').slice(0, 2))
    return hour >= start && hour < end && reached(record, 'reception')
  }).length }))
  const max = Math.max(1, ...data.map((x) => x.count))
  return data.map((x) => ({ ...x, percent: Math.round(x.count / max * 100) }))
})
const insights = computed(() => [
  { title: '取消业务', description: '建议复盘取消原因与邀约质量', value: `${cancelledRecords.value.length}单`, tone: 'danger', icon: '取', filter: (x) => x.status === 'cancelled' },
  { title: '待回访顾客', description: '及时回访可提升复购与满意度', value: `${scopedRecords.value.filter((x) => x.status === 'followup').length}人`, tone: 'warning', icon: '访', filter: (x) => x.status === 'followup' },
  { title: '未成交到店', description: '已到店但暂无现金或耗卡记录', value: `${scopedRecords.value.filter((x) => reached(x, 'reception') && !recordAmount(x) && x.status !== 'cancelled').length}人`, tone: 'info', icon: '转', filter: (x) => reached(x, 'reception') && !recordAmount(x) && x.status !== 'cancelled' }
])

watch(() => props.role, () => {
  selectedStore.value = props.role === 'admin' ? 'all' : props.roleMeta.store
  rankingType.value = props.role === 'admin' ? 'store' : 'staff'
})
watch([scopedRecords, rankingType, rankingMetric], () => nextTick(renderCharts), { deep: true })

onMounted(() => {
  nextTick(() => {
    createCharts()
    renderCharts()
    window.addEventListener('resize', resizeCharts)
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  charts.forEach((chart) => chart.dispose())
})

function createCharts() {
  ;[progressChartRef, funnelChartRef, trendChartRef, paymentChartRef, diagnosisChartRef, projectChartRef, rankingChartRef].forEach((target) => {
    charts.push(markRaw(echarts.init(target.value)))
  })
  charts[1].on('click', (params) => openFunnelDetails(params.name))
  charts[6].on('click', (params) => openRankingDetails(params.name))
}

function renderCharts() {
  if (!charts.length) return
  charts[0].setOption({
    grid: { left: 40, right: 18, top: 18, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: progressStages.value.map((x) => x.label), axisTick: { show: false }, axisLine: { show: false } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#eef0f5' } } },
    series: [{ type: 'bar', barWidth: 24, data: progressStages.value.map((x) => ({ value: x.count, itemStyle: { color: x.color, borderRadius: [6, 6, 0, 0] } })) }]
  }, true)
  charts[1].setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>人数：{c}' },
    series: [{ type: 'funnel', left: '8%', top: 10, bottom: 10, width: '84%', minSize: '35%', maxSize: '100%', sort: 'descending', gap: 3,
      label: { show: true, position: 'inside', formatter: '{b}  {c}人', color: '#fff', fontWeight: 600 },
      itemStyle: { borderColor: '#fff', borderWidth: 2 }, data: funnelData.value.map((x, i) => ({ ...x, itemStyle: { color: ['#5b5bd6','#6868dc','#7474e2','#8585e8','#21b88c','#10a9b3'][i] } })) }]
  }, true)
  charts[2].setOption({
    tooltip: { trigger: 'axis' }, grid: { left: 58, right: 24, top: 28, bottom: 34 },
    xAxis: { type: 'category', data: trendData.value.map((x) => x.date), axisLine: { lineStyle: { color: '#dfe2eb' } } },
    yAxis: [
      { type: 'value', axisLabel: { formatter: (x) => `${Math.round(x / 1000)}k` }, splitLine: { lineStyle: { color: '#eef0f5' } } },
      { type: 'value', minInterval: 1, splitLine: { show: false }, axisLabel: { color: '#9298a8' } }
    ],
    series: [
      { name: '现金', type: 'bar', stack: 'amount', barMaxWidth: 18, itemStyle: { color: '#5b8ff9' }, data: trendData.value.map((x) => x.cash) },
      { name: '耗卡', type: 'bar', stack: 'amount', itemStyle: { color: '#f6bd16' }, data: trendData.value.map((x) => x.card) },
      { name: '总消耗', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 3, color: '#5b5bd6' }, data: trendData.value.map((x) => x.cash + x.card) },
      { name: '到店人数', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 1.5, type: 'dashed', color: '#22a88a' }, itemStyle: { color: '#22a88a' }, data: trendData.value.map((x) => x.arrivals) },
      { name: '成交人数', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { width: 1.5, type: 'dashed', color: '#e66a6a' }, itemStyle: { color: '#e66a6a' }, data: trendData.value.map((x) => x.deals) }
    ]
  }, true)
  renderDonut(charts[3], [{ name: '现金', value: cashAmount.value }, { name: '耗卡', value: cardAmount.value }], ['#5b8ff9', '#f6bd16'])
  renderDonut(charts[4], [{ name: '新诊', value: diagnosisCounts.value.new }, { name: '复诊', value: diagnosisCounts.value.returning }], ['#7c6cff', '#24b8a6'])
  renderDonut(charts[5], projectStructure.value, projectColors)
  charts[6].setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, grid: { left: 90, right: 42, top: 18, bottom: 25 },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef0f5' } }, axisLabel: { formatter: rankingMetric.value === 'conversion' ? '{value}%' : '{value}' } },
    yAxis: { type: 'category', inverse: true, data: rankingData.value.map((x) => x.name), axisTick: { show: false }, axisLine: { show: false } },
    series: [{ type: 'bar', barWidth: 17, data: rankingData.value.map((x, i) => ({ value: x.value, itemStyle: { color: i < 3 ? ['#5b5bd6','#7773e8','#9a97ef'][i] : '#d9d9f6', borderRadius: [0, 6, 6, 0] } })), label: { show: true, position: 'right', formatter: rankingMetric.value === 'amount' ? (x) => `¥${money(x.value)}` : rankingMetric.value === 'conversion' ? '{c}%' : '{c}' } }]
  }, true)
}

function renderDonut(chart, data, colors) {
  chart.setOption({
    color: colors,
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c}（{d}%）' },
    series: [{
      type: 'pie',
      radius: ['54%', '76%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, label: { show: true, position: 'center', formatter: '{b}\n{d}%', color: '#343a4d', fontWeight: 700 } },
      data
    }]
  }, true)
}
function resizeCharts() { charts.forEach((chart) => chart.resize()) }
function filterRange(source, range) {
  return source.filter((record) => record.businessDate >= range[0] && record.businessDate <= range[1] && (selectedStore.value === 'all' || record.store === selectedStore.value))
}
function reached(record, stage) {
  if (record.status === 'cancelled') return stage === 'invited' || Boolean(record.nodeTimes?.[stage]) || (record.logs || []).some((log) => log.fromStatus === stage || log.toStatus === stage)
  return statusOrder.indexOf(record.status) >= statusOrder.indexOf(stage)
}
function recordAmount(record) { return Number(record.revenue || 0) + Number(record.cardAmount || 0) }
function sum(source, getter) { return source.reduce((total, item) => total + getter(item), 0) }
function rate(value, base) { return base ? Math.round(value / base * 1000) / 10 : 0 }
function money(value) { return Number(value || 0).toLocaleString('zh-CN') }
function metric(key, label, value, prefix, icon, tone, current, previous) { return { key, label, value, prefix, icon, tone, trend: previous ? Math.round((current - previous) / previous * 1000) / 10 : current ? 100 : 0 } }
function previousTotal() { return sum(previousRecords.value, recordAmount) }
function previousCash() { return sum(previousRecords.value, (x) => Number(x.revenue || 0)) }
function previousCard() { return sum(previousRecords.value, (x) => Number(x.cardAmount || 0)) }
function previousDeals() { return previousRecords.value.filter((x) => recordAmount(x) > 0 && x.status !== 'cancelled').length }
function previousTicket() { return previousDeals() ? Math.round(previousTotal() / previousDeals()) : 0 }
function cancelRate(source = scopedRecords.value) { return source.length ? Math.round(source.filter((x) => x.status === 'cancelled').length / source.length * 1000) / 10 : 0 }
function previousCancelRate() { return cancelRate(previousRecords.value) }

function buildRanking(type, metricName) {
  const groups = new Map()
  const personalView = !['storeManager', 'director', 'admin'].includes(props.role)
  scopedRecords.value.forEach((record) => {
    let names = []
    if (type === 'store') names = [record.store]
    if (type === 'staff') names = personalView ? [props.roleMeta.name] : [...new Set(Object.values(record.assignments || {}))]
    if (type === 'project') names = record.projects?.length ? record.projects : [record.estimatedProject || '未分类']
    names.filter(Boolean).forEach((name) => {
      if (!groups.has(name)) groups.set(name, { name, records: [], amount: 0, deals: 0 })
      const group = groups.get(name)
      group.records.push(record)
      const divisor = type === 'project' ? Math.max(1, names.length) : 1
      group.amount += recordAmount(record) / divisor
      if (recordAmount(record) > 0 && record.status !== 'cancelled') group.deals += 1
    })
  })
  return [...groups.values()].map((group) => ({
    ...group,
    value: metricName === 'amount' ? Math.round(group.amount) : metricName === 'deals' ? group.deals : rate(group.deals, group.records.length)
  })).sort((a, b) => b.value - a.value).slice(0, 8)
}

function openMetricDetails(metricItem) {
  const filters = {
    total: (x) => recordAmount(x) > 0, cash: (x) => Number(x.revenue || 0) > 0,
    card: (x) => Number(x.cardAmount || 0) > 0, deals: (x) => recordAmount(x) > 0,
    ticket: (x) => recordAmount(x) > 0, cancel: (x) => x.status === 'cancelled'
  }
  openDetails(metricItem.label, `统计周期：${rangeLabel.value}`, scopedRecords.value.filter(filters[metricItem.key]))
}
function openStageDetails(key, label) { openDetails(label, '按当前业务状态筛选', scopedRecords.value.filter((x) => x.status === key)) }
function openFunnelDetails(name) {
  const stage = { 邀约业务: 'invited', 到店接待: 'reception', 完成分诊: 'triage', 完成排诊: 'scheduling', 服务完成: 'followup', 回访完成: 'completed' }[name]
  openDetails(name, `已到达“${name}”或后续节点的业务`, scopedRecords.value.filter((x) => reached(x, stage)))
}
function openRankingDetails(name) {
  const row = rankingData.value.find((x) => x.name === name)
  openDetails(`${name} · 排行明细`, `按${rankingType.value === 'store' ? '门店' : rankingType.value === 'staff' ? '员工' : '项目'}聚合`, row?.records || [])
}
function openInsightDetails(item) { openDetails(item.title, item.description, scopedRecords.value.filter(item.filter)) }
function openDetails(title, definition, rows) {
  detailPage.value = 1
  detailTitle.value = title
  detailDefinition.value = definition
  detailRecords.value = [...rows].sort((a, b) => {
    const dateCompare = String(b.businessDate || '').localeCompare(String(a.businessDate || ''))
    if (dateCompare) return dateCompare
    return String(b.appointmentTime || '').localeCompare(String(a.appointmentTime || ''))
  })
  detailVisible.value = true
}
function today() { return new Date().toISOString().slice(0, 10) }
function addDays(dateString, days) { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
function monthStart() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01` }
function weekStart() { const date = new Date(); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); return date.toISOString().slice(0, 10) }
function daysBetween(start, end) { return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) }
function enumerateDates(start, end) { const result = []; for (let date = start; date <= end; date = addDays(date, 1)) result.push(date); return result }
</script>
