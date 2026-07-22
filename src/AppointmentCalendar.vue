<template>
  <section class="appointment-page">
    <section class="appointment-kpis">
      <article><span class="violet"><el-icon><Calendar /></el-icon></span><div><p>本月预约</p><strong>{{ monthRecords.length }}</strong></div></article>
      <article><span class="blue"><el-icon><CircleCheck /></el-icon></span><div><p>已确认</p><strong>{{ confirmedCount }}</strong></div></article>
      <article><span class="green"><el-icon><UserFilled /></el-icon></span><div><p>预计到店</p><strong>{{ arrivalCount }}</strong></div></article>
      <article><span class="orange"><el-icon><Star /></el-icon></span><div><p>新诊顾客</p><strong>{{ newCount }}</strong></div></article>
      <article><span class="red"><el-icon><CircleClose /></el-icon></span><div><p>取消率</p><strong>{{ cancelRate }}%</strong></div></article>
    </section>

    <section class="appointment-filters">
      <el-select v-model="storeFilter" :disabled="role !== 'admin'">
        <el-option v-if="role === 'admin'" label="全部门店" value="all" />
        <el-option v-for="store in stores" :key="store" :label="store" :value="store" />
      </el-select>
      <el-select v-model="statusFilter">
        <el-option label="全部预约状态" value="all" />
        <el-option v-for="item in appointmentStatuses" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="diagnosisFilter">
        <el-option label="全部诊疗类型" value="all" /><el-option label="新诊" value="新诊" /><el-option label="复诊" value="复诊" />
      </el-select>
      <el-select v-model="marketFilter">
        <el-option label="全部市场人员" value="all" />
        <el-option v-for="person in marketPeople" :key="person" :label="person" :value="person" />
      </el-select>
      <el-input v-model="keyword" clearable placeholder="搜索顾客、电话或项目"><template #prefix><el-icon><Search /></el-icon></template></el-input>
      <div v-if="canEdit" class="appointment-action-buttons">
        <el-button type="primary" :icon="Upload" @click="$emit('open-import')">批量导入</el-button>
        <el-button class="appointment-add-button" plain type="primary" :icon="Plus" @click="openCreate()">新增预约</el-button>
      </div>
    </section>

    <section class="calendar-layout">
      <article class="calendar-panel">
        <div class="calendar-toolbar">
          <div><el-button :icon="ArrowLeft" @click="shiftMonth(-1)" /><el-button :icon="ArrowRight" @click="shiftMonth(1)" /></div>
          <h2>{{ calendarYear }}年{{ calendarMonth }}月</h2>
          <el-button text type="primary" @click="goToday">回到今天</el-button>
        </div>
        <div class="weekday-row"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
        <div class="month-grid">
          <button
            v-for="cell in calendarCells"
            :key="cell.date"
            :class="{ muted: !cell.currentMonth, today: cell.date === today, selected: cell.date === selectedDate, weekend: cell.weekend, overload: cell.overload }"
            @click="selectDate(cell.date)"
          >
            <span class="date-number">{{ Number(cell.date.slice(-2)) }}</span>
            <template v-if="cell.total">
              <strong>{{ cell.total }}组</strong>
              <div class="calendar-dots">
                <i v-if="cell.pending" class="pending"></i><i v-if="cell.confirmed" class="confirmed"></i><i v-if="cell.cancelled" class="cancelled"></i>
              </div>
              <small>新诊{{ cell.newCount }} · 确认{{ cell.confirmed }}</small>
            </template>
            <small v-else class="empty-day">暂无预约</small>
            <b v-if="cell.overload">容量预警</b>
          </button>
        </div>
        <div class="calendar-legend">
          <span><i class="pending"></i>待邀约/待确认</span><span><i class="confirmed"></i>已确认/已到店</span><span><i class="cancelled"></i>已取消</span><span class="overload-key">容量预警</span>
        </div>
      </article>

      <aside class="daily-panel">
        <div class="daily-head">
          <div><p>{{ selectedWeekday }}</p><h2>{{ selectedDateLabel }}</h2><small>共 {{ dailyRecords.length }} 组预约</small></div>
          <el-button v-if="canEdit" type="primary" plain @click="openCreate(selectedDate)">新增</el-button>
        </div>
        <div v-if="dailyRecords.length" class="appointment-timeline">
          <article v-for="record in dailyRecords" :key="record.id" :class="{ cancelled: appointmentStatus(record) === 'cancelled' }">
            <div class="timeline-time"><strong>{{ record.appointmentTime }}</strong><span></span></div>
            <div class="appointment-item" role="button" tabindex="0" @click="openCustomerDetail(record)" @keydown.enter="openCustomerDetail(record)">
              <div class="appointment-item-head">
                <div><strong>{{ record.vip1.name }}</strong><small>{{ record.diagnosisType }} · {{ record.store }}</small></div>
                <el-tag :type="appointmentMeta[appointmentStatus(record)].type" round>{{ appointmentMeta[appointmentStatus(record)].label }}</el-tag>
              </div>
              <dl>
                <div><dt>同行顾客</dt><dd>{{ record.vip2?.name || '—' }}</dd></div>
                <div><dt>预约项目</dt><dd>{{ record.projects?.join('、') || record.estimatedProject }}</dd></div>
                <div><dt>市场负责人</dt><dd>{{ record.assignments.market }}</dd></div>
              </dl>
              <div v-if="slotCount(record) > capacity" class="capacity-warning"><el-icon><Warning /></el-icon>该时段已有 {{ slotCount(record) }} 组预约，超过建议容量</div>
              <div class="appointment-actions" @click.stop>
                <el-button link @click="$emit('open-record', record)">详情</el-button>
                <el-button v-if="canEditRecord(record) && ['pending','unconfirmed'].includes(appointmentStatus(record))" link type="primary" @click="openInvite(record)">处理邀约</el-button>
                <el-dropdown v-if="canEditRecord(record)" @command="handleCommand($event, record)">
                  <el-button link>更多<el-icon><ArrowDown /></el-icon></el-button>
                  <template #dropdown><el-dropdown-menu><el-dropdown-item command="reschedule">改期</el-dropdown-item><el-dropdown-item v-if="appointmentStatus(record) === 'cancelled'" command="reinvite">重新邀约</el-dropdown-item><el-dropdown-item v-else command="cancel" divided>取消预约</el-dropdown-item></el-dropdown-menu></template>
                </el-dropdown>
              </div>
            </div>
          </article>
        </div>
        <el-empty v-else description="当天暂无预约"><el-button v-if="canEdit" type="primary" @click="openCreate(selectedDate)">创建预约</el-button></el-empty>
      </aside>
    </section>

    <el-dialog v-model="createVisible" title="新增预约" width="760px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-alert title="可填写新顾客姓名和手机号，保存后将自动同步到顾客档案。" type="info" :closable="false" show-icon />
        <div class="appointment-form-grid form-gap-top">
          <el-form-item label="主顾客姓名" prop="customerName"><el-input v-model="createForm.customerName" /></el-form-item>
          <el-form-item label="主顾客手机号" prop="customerPhone"><el-input v-model="createForm.customerPhone" /></el-form-item>
          <el-form-item label="同行顾客姓名"><el-input v-model="createForm.companionName" /></el-form-item>
          <el-form-item label="同行顾客手机号"><el-input v-model="createForm.companionPhone" /></el-form-item>
          <el-form-item label="预约门店" prop="store"><el-select v-model="createForm.store" :disabled="role !== 'admin'"><el-option v-for="store in stores" :key="store" :label="store" :value="store" /></el-select></el-form-item>
          <el-form-item label="诊疗类型" prop="diagnosisType"><el-radio-group v-model="createForm.diagnosisType"><el-radio value="新诊">新诊</el-radio><el-radio value="复诊">复诊</el-radio></el-radio-group></el-form-item>
          <el-form-item label="预约日期" prop="date"><el-date-picker v-model="createForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="预约时间" prop="time"><el-time-select v-model="createForm.time" start="08:00" step="00:30" end="20:00" /></el-form-item>
          <el-form-item label="预约项目" prop="projects"><el-select v-model="createForm.projects" multiple filterable allow-create><el-option-group v-for="group in projectCatalog" :key="group.label" :label="group.label"><el-option v-for="project in group.options" :key="project" :label="project" :value="project" /></el-option-group></el-select></el-form-item>
        </div>
        <el-divider content-position="left">人员归属</el-divider>
        <div class="appointment-form-grid">
          <el-form-item v-for="roleItem in ownerRoles" :key="roleItem.key" :label="roleItem.label"><el-select v-model="createForm[roleItem.key]" clearable placeholder="请选择员工" :disabled="role === roleItem.key"><el-option v-for="employee in staffOptionsFor(roleItem.key)" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
        </div>
        <el-form-item label="备注"><el-input v-model="createForm.note" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" @click="saveAppointment">保存预约</el-button></template>
    </el-dialog>

    <el-dialog v-model="inviteVisible" title="邀约处理" width="560px">
      <el-form ref="inviteFormRef" :model="inviteForm" :rules="inviteRules" label-position="top">
        <el-form-item label="邀约结果" prop="result"><el-select v-model="inviteForm.result"><el-option v-for="item in ['已确认到店','待确认','拒绝到店','需要改期']" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item label="沟通记录" prop="note"><el-input v-model="inviteForm.note" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="inviteVisible = false">取消</el-button><el-button type="primary" @click="submitInvite">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="actionVisible" :title="actionType === 'reschedule' ? '预约改期' : '取消预约'" width="520px">
      <el-form ref="actionFormRef" :model="actionForm" :rules="actionRules" label-position="top">
        <template v-if="actionType === 'reschedule'"><el-form-item label="新日期" prop="date"><el-date-picker v-model="actionForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="新时间" prop="time"><el-time-select v-model="actionForm.time" start="08:00" step="00:30" end="20:00" /></el-form-item></template>
        <el-form-item :label="actionType === 'reschedule' ? '改期原因' : '取消原因'" prop="reason"><el-input v-model="actionForm.reason" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="actionVisible = false">取消</el-button><el-button :type="actionType === 'cancel' ? 'danger' : 'primary'" @click="submitAction">确认</el-button></template>
    </el-dialog>

    <el-drawer v-model="customerDetailVisible" size="600px" :with-header="false">
      <template v-if="detailCustomer">
        <div class="appointment-customer-head">
          <div class="appointment-customer-profile">
            <span>{{ detailCustomer.name.slice(0, 1) }}</span>
            <div>
              <p>顾客预约档案</p>
              <h2>{{ detailCustomer.name }}</h2>
              <small>{{ maskPhone(detailCustomer.phone) }} · {{ detailCustomer.store }}</small>
            </div>
          </div>
          <el-tag :type="detailCustomer.status === 'active' ? 'success' : 'warning'">
            {{ detailCustomer.status === 'active' ? '启用' : '暂停' }}
          </el-tag>
        </div>

        <div class="appointment-customer-stats">
          <article><p>会员等级</p><strong>{{ detailCustomer.memberLevel }}</strong></article>
          <article><p>累计预约</p><strong>{{ detailCustomer.records.length }}</strong></article>
          <article><p>累计消费</p><strong>¥{{ money(detailCustomer.totalSpend) }}</strong></article>
          <article><p>最近到店</p><strong>{{ detailCustomer.lastVisit || '暂无' }}</strong></article>
        </div>

        <section class="appointment-detail-section">
          <h3>个人信息</h3>
          <dl class="appointment-customer-info">
            <div><dt>姓名</dt><dd>{{ detailCustomer.name }}</dd></div>
            <div><dt>手机号</dt><dd>{{ detailCustomer.phone }}</dd></div>
            <div><dt>所属门店</dt><dd>{{ detailCustomer.store }}</dd></div>
            <div><dt>顾客来源</dt><dd>{{ detailCustomer.source }}</dd></div>
            <div><dt>特殊喜好</dt><dd>{{ detailCustomer.preferences || '暂无记录' }}</dd></div>
            <div><dt>铺垫内容</dt><dd>{{ detailCustomer.preparation || '暂无记录' }}</dd></div>
          </dl>
        </section>

        <section class="appointment-detail-section">
          <h3>已购与剩余项目</h3>
          <el-table :data="detailCustomer.packages" empty-text="暂无项目资产">
            <el-table-column prop="project" label="项目" min-width="150" />
            <el-table-column prop="purchased" label="已购" width="70" align="center" />
            <el-table-column prop="used" label="已用" width="70" align="center" />
            <el-table-column label="剩余" width="70" align="center"><template #default="{ row }">{{ Math.max(0, row.purchased - row.used) }}</template></el-table-column>
          </el-table>
        </section>

        <section class="appointment-detail-section">
          <h3>预约与服务记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in detailCustomer.records"
              :key="record.id"
              :timestamp="`${record.businessDate} ${record.appointmentTime}`"
              :type="appointmentMeta[appointmentStatus(record)].type"
            >
              <div class="customer-record-line">
                <strong>{{ record.projects?.join('、') || record.estimatedProject }}</strong>
                <el-tag size="small" :type="appointmentMeta[appointmentStatus(record)].type">{{ appointmentMeta[appointmentStatus(record)].label }}</el-tag>
              </div>
              <p>{{ record.diagnosisType }} · {{ record.store }} · 市场 {{ record.assignments.market }}</p>
              <el-button link type="primary" @click="$emit('open-record', record)">查看业务单</el-button>
            </el-timeline-item>
          </el-timeline>
        </section>
      </template>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ArrowDown, ArrowLeft, ArrowRight, Calendar, CircleCheck, CircleClose, Plus, Search, Star, Upload, UserFilled, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  records: { type: Array, required: true },
  role: { type: String, required: true },
  roleMeta: { type: Object, required: true },
  stores: { type: Array, required: true },
  staffOptions: { type: Array, default: () => [] },
  projectCatalog: { type: Array, required: true }
})
const emit = defineEmits(['update:records', 'open-record', 'open-import'])
const today = new Date().toISOString().slice(0, 10)
const weekdays = ['周一','周二','周三','周四','周五','周六','周日']
const capacity = 3
const appointmentStatuses = [
  { value: 'pending', label: '待邀约' }, { value: 'unconfirmed', label: '待确认' }, { value: 'confirmed', label: '已确认' },
  { value: 'arrived', label: '已到店' }, { value: 'completed', label: '已完成' }, { value: 'cancelled', label: '已取消' }
]
const appointmentMeta = {
  pending: { label: '待邀约', type: 'warning' }, unconfirmed: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' }, arrived: { label: '已到店', type: 'success' },
  completed: { label: '已完成', type: 'info' }, cancelled: { label: '已取消', type: 'danger' }
}
const selectedDate = ref(today)
const viewMonth = ref(today.slice(0, 7))
const storeFilter = ref(props.role === 'admin' ? 'all' : props.roleMeta.store)
const statusFilter = ref('all')
const diagnosisFilter = ref('all')
const marketFilter = ref(props.role === 'market' ? props.roleMeta.name : 'all')
const keyword = ref('')
const createVisible = ref(false)
const createFormRef = ref()
const inviteVisible = ref(false)
const inviteFormRef = ref()
const actionVisible = ref(false)
const actionFormRef = ref()
const editingId = ref(null)
const actionType = ref('reschedule')
const createForm = reactive({})
const inviteForm = reactive({})
const actionForm = reactive({})
const customerDetailVisible = ref(false)
const detailCustomer = ref(null)
const ownerRoles = [
  { key: 'cardConsultant', label: '卡姐' }, { key: 'beautyConsultant', label: '美导' },
  { key: 'market', label: '市场' }, { key: 'service', label: '客服' },
  { key: 'butler', label: '管家' }, { key: 'manager', label: '经理' },
  { key: 'director', label: '总监' }, { key: 'storeManager', label: '店长' }
]
const canEdit = computed(() => ['market','storeManager','admin'].includes(props.role))
const calendarYear = computed(() => Number(viewMonth.value.slice(0,4)))
const calendarMonth = computed(() => Number(viewMonth.value.slice(5,7)))
const marketPeople = computed(() => [...new Set(props.records.map((x) => x.assignments?.market).filter(Boolean).concat(['苏晴','秦悦','叶青']))])
const scopedRecords = computed(() => props.records.filter((record) => {
  if (storeFilter.value !== 'all' && record.store !== storeFilter.value) return false
  if (statusFilter.value !== 'all' && appointmentStatus(record) !== statusFilter.value) return false
  if (diagnosisFilter.value !== 'all' && record.diagnosisType !== diagnosisFilter.value) return false
  if (marketFilter.value !== 'all' && record.assignments?.market !== marketFilter.value) return false
  const q = keyword.value.trim().toLowerCase()
  return !q || [record.vip1?.name, record.vip1?.phone, record.vip2?.name, record.vip2?.phone, record.estimatedProject].some((x) => String(x || '').toLowerCase().includes(q))
}))
const monthRecords = computed(() => scopedRecords.value.filter((x) => x.businessDate.startsWith(viewMonth.value)))
const confirmedCount = computed(() => monthRecords.value.filter((x) => ['confirmed','arrived','completed'].includes(appointmentStatus(x))).length)
const arrivalCount = computed(() => monthRecords.value.filter((x) => appointmentStatus(x) !== 'cancelled').length)
const newCount = computed(() => monthRecords.value.filter((x) => x.diagnosisType === '新诊').length)
const cancelRate = computed(() => monthRecords.value.length ? Math.round(monthRecords.value.filter((x) => appointmentStatus(x) === 'cancelled').length / monthRecords.value.length * 1000) / 10 : 0)
const dailyRecords = computed(() => scopedRecords.value.filter((x) => x.businessDate === selectedDate.value).sort((a,b) => {
  const cancelled = Number(appointmentStatus(a) === 'cancelled') - Number(appointmentStatus(b) === 'cancelled')
  return cancelled || a.appointmentTime.localeCompare(b.appointmentTime)
}))
const selectedDateLabel = computed(() => `${Number(selectedDate.value.slice(5,7))}月${Number(selectedDate.value.slice(8))}日`)
const selectedWeekday = computed(() => `星期${'日一二三四五六'[new Date(`${selectedDate.value}T12:00:00`).getDay()]}`)
const calendarCells = computed(() => {
  const first = `${viewMonth.value}-01`
  const firstDate = new Date(`${first}T12:00:00`)
  const mondayIndex = (firstDate.getDay() + 6) % 7
  const start = addDays(first, -mondayIndex)
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index)
    const rows = scopedRecords.value.filter((x) => x.businessDate === date)
    const active = rows.filter((x) => appointmentStatus(x) !== 'cancelled')
    return {
      date, currentMonth: date.startsWith(viewMonth.value), weekend: [0,6].includes(new Date(`${date}T12:00:00`).getDay()),
      total: rows.length, newCount: rows.filter((x) => x.diagnosisType === '新诊').length,
      pending: rows.filter((x) => ['pending','unconfirmed'].includes(appointmentStatus(x))).length,
      confirmed: rows.filter((x) => ['confirmed','arrived','completed'].includes(appointmentStatus(x))).length,
      cancelled: rows.filter((x) => appointmentStatus(x) === 'cancelled').length,
      overload: hasOverload(active)
    }
  })
})
const createRules = {
  customerName: [{ required: true, message: '请填写顾客姓名', trigger: 'blur' }],
  customerPhone: [{ required: true, pattern: /^1\d{10}$/, message: '请输入11位手机号', trigger: 'blur' }],
  store: [{ required: true, message: '请选择门店', trigger: 'change' }],
  diagnosisType: [{ required: true, message: '请选择诊疗类型', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  time: [{ required: true, message: '请选择时间', trigger: 'change' }],
  market: [{ required: true, message: '请选择市场负责人', trigger: 'change' }],
  projects: [{ required: true, type: 'array', min: 1, message: '请选择预约项目', trigger: 'change' }]
}
const inviteRules = { result: [{ required: true, message: '请选择邀约结果', trigger: 'change' }], note: [{ required: true, message: '请填写沟通记录', trigger: 'blur' }] }
const actionRules = { date: [{ required: true, message: '请选择日期', trigger: 'change' }], time: [{ required: true, message: '请选择时间', trigger: 'change' }], reason: [{ required: true, message: '请填写原因', trigger: 'blur' }] }
watch(() => props.role, () => { storeFilter.value = props.role === 'admin' ? 'all' : props.roleMeta.store; marketFilter.value = props.role === 'market' ? props.roleMeta.name : 'all' })

function appointmentStatus(record) {
  if (record.appointmentStatus) return record.appointmentStatus
  if (record.status === 'cancelled') return 'cancelled'
  if (record.status === 'invited') return 'pending'
  if (record.status === 'reception') return 'confirmed'
  if (['triage','scheduling','service','followup'].includes(record.status)) return 'arrived'
  return record.status === 'completed' ? 'completed' : 'pending'
}
function canEditRecord(record) {
  if (props.role === 'admin') return true
  if (props.role === 'storeManager') return record.store === props.roleMeta.store
  return props.role === 'market' && record.store === props.roleMeta.store && record.assignments?.market === props.roleMeta.name
}
function openCustomerDetail(record) {
  const phone = normalizePhone(record.vip1.phone)
  const rows = props.records.filter((item) => [item.vip1, item.vip2].filter(Boolean).some((person) => normalizePhone(person.phone) === phone))
    .sort((a, b) => `${b.businessDate} ${b.appointmentTime}`.localeCompare(`${a.businessDate} ${a.appointmentTime}`))
  const stored = JSON.parse(localStorage.getItem('cosmetic-customer-archive-v1') || '[]')
    .find((customer) => normalizePhone(customer.phone) === phone)
  const packages = stored?.packages?.length ? stored.packages : buildPackages(rows)
  detailCustomer.value = {
    name: stored?.name || record.vip1.name,
    phone: stored?.phone || record.vip1.phone,
    store: stored?.store || record.store,
    status: stored?.status || 'active',
    memberLevel: stored?.memberLevel || (rows.reduce((sum, item) => sum + recordAmount(item), 0) >= 10000 ? '金卡' : '普通会员'),
    source: stored?.source || '业务单同步',
    preferences: stored?.preferences || '',
    preparation: stored?.preparation || '',
    packages,
    records: rows,
    totalSpend: rows.reduce((sum, item) => sum + recordAmount(item), 0),
    lastVisit: rows.map((item) => item.businessDate).sort().at(-1) || ''
  }
  customerDetailVisible.value = true
}
function shiftMonth(delta) { const date = new Date(`${viewMonth.value}-01T12:00:00`); date.setMonth(date.getMonth() + delta); viewMonth.value = date.toISOString().slice(0,7); selectedDate.value = `${viewMonth.value}-01` }
function goToday() { viewMonth.value = today.slice(0,7); selectedDate.value = today }
function selectDate(date) { selectedDate.value = date; if (!date.startsWith(viewMonth.value)) viewMonth.value = date.slice(0,7) }
function openCreate(date = selectedDate.value) {
  const store = props.role === 'admin' ? props.stores[0] : props.roleMeta.store
  Object.keys(createForm).forEach((key) => delete createForm[key])
  Object.assign(createForm, {
    customerName: '', customerPhone: '', companionName: '', companionPhone: '', store, diagnosisType: '新诊', date, time: '10:00', projects: [], note: '',
    ...Object.fromEntries(ownerRoles.map(({ key }) => [key, defaultOwner(key, store)]))
  })
  createVisible.value = true
}
async function saveAppointment() {
  if (!await createFormRef.value?.validate().catch(() => false)) return
  const activeSameDay = props.records.filter((x) => x.businessDate === createForm.date && x.vip1?.phone === createForm.customerPhone && appointmentStatus(x) !== 'cancelled')
  if (activeSameDay.length && !['storeManager','admin'].includes(props.role)) return ElMessage.warning('该顾客当天已有有效预约，请联系店长处理')
  if (activeSameDay.length) await ElMessageBox.confirm('该顾客当天已有有效预约，确认继续创建？', '重复预约提醒', { type: 'warning' })
  const slotRows = props.records.filter((x) => x.businessDate === createForm.date && x.appointmentTime === createForm.time && x.store === createForm.store && appointmentStatus(x) !== 'cancelled')
  if (slotRows.length >= capacity) {
    if (!['storeManager','admin'].includes(props.role)) return ElMessage.warning('该时段已超过建议容量，请调整时间')
    await ElMessageBox.confirm(`该时段已有${slotRows.length}组预约，确认继续保存？`, '容量预警', { type: 'warning' })
  }
  const id = `B${createForm.date.replaceAll('-','')}${String(Date.now()).slice(-5)}`
  const record = {
    id, businessDate: createForm.date, appointmentTime: createForm.time, diagnosisType: createForm.diagnosisType, store: createForm.store,
    vip1: { name: createForm.customerName, phone: createForm.customerPhone }, vip2: createForm.companionName ? { name: createForm.companionName, phone: createForm.companionPhone } : null,
    cardConsultant: createForm.cardConsultant, beautyConsultant: createForm.beautyConsultant, estimatedProject: createForm.projects.join('、'), projects: [...createForm.projects],
    estimatedAmount: 0, paymentType: 'none', revenue: 0, cardAmount: 0, note: createForm.note,
    assignments: { market: createForm.market, service: createForm.service, butler: createForm.butler, director: createForm.director, manager: createForm.manager },
    storeManager: createForm.storeManager,
    department: '', followupDate: addDays(createForm.date, 1), status: 'invited', appointmentStatus: 'pending', flags: [],
    logs: [{ id: `${id}-created`, time: nowText(), operator: `${props.roleMeta.label}·${props.roleMeta.name}`, action: '创建邀约', detail: `预约${createForm.date} ${createForm.time}到店，进入场控排诊`, fromStatus: 'floorControl', toStatus: 'floorControl', type: 'primary' }], status: 'floorControl', floorControl: { createdTime: nowText() }, doctorDiagnosis: {}, serviceExecution: {}, followupRecords: []
  }
  emit('update:records', [...props.records, record])
  createVisible.value = false
  selectedDate.value = createForm.date
  viewMonth.value = createForm.date.slice(0,7)
  ElMessage.success('预约已创建，并同步到工作台和顾客档案')
}
function staffOptionsFor(roleKey) {
  return props.staffOptions.filter((employee) => employee.status === 'active' && employee.roleKey === roleKey && employee.store === createForm.store)
}
function defaultOwner(roleKey, store) {
  if (props.role === roleKey) return props.roleMeta.name
  return props.staffOptions.find((employee) => employee.status === 'active' && employee.roleKey === roleKey && employee.store === store)?.name || ''
}
function openInvite(record) { editingId.value = record.id; Object.assign(inviteForm, { result: '', note: '' }); inviteVisible.value = true }
async function submitInvite() {
  if (!await inviteFormRef.value?.validate().catch(() => false)) return
  const record = props.records.find((x) => x.id === editingId.value)
  if (inviteForm.result === '需要改期') { inviteVisible.value = false; return openAction('reschedule', record) }
  if (inviteForm.result === '已确认到店') { record.appointmentStatus = 'confirmed'; record.status = 'floorControl' }
  if (inviteForm.result === '待确认') record.appointmentStatus = 'unconfirmed'
  if (inviteForm.result === '拒绝到店') { record.appointmentStatus = 'cancelled'; record.status = 'cancelled'; record.flags.push(`拒绝到店：${inviteForm.note}`) }
  addLog(record, '邀约处理', `${inviteForm.result}；${inviteForm.note}`, 'invited', record.status, inviteForm.result === '拒绝到店' ? 'danger' : 'primary')
  emit('update:records', [...props.records])
  inviteVisible.value = false
  ElMessage.success('邀约结果已同步')
}
function handleCommand(command, record) { if (command === 'reinvite') return reinvite(record); openAction(command, record) }
function openAction(type, record) { actionType.value = type; editingId.value = record.id; Object.assign(actionForm, { date: record.businessDate, time: record.appointmentTime, reason: '' }); actionVisible.value = true }
async function submitAction() {
  if (!await actionFormRef.value?.validate().catch(() => false)) return
  const record = props.records.find((x) => x.id === editingId.value)
  if (actionType.value === 'reschedule') {
    const old = `${record.businessDate} ${record.appointmentTime}`
    record.businessDate = actionForm.date; record.appointmentTime = actionForm.time; record.appointmentStatus = 'pending'; record.status = 'invited'
    record.flags.push(`已改期：${old} → ${actionForm.date} ${actionForm.time}`)
    addLog(record, '预约改期', `${old} → ${actionForm.date} ${actionForm.time}；${actionForm.reason}`, record.status, 'invited', 'warning')
    selectedDate.value = actionForm.date; viewMonth.value = actionForm.date.slice(0,7)
  } else {
    const from = record.status; record.appointmentStatus = 'cancelled'; record.status = 'cancelled'; record.flags.push(`已取消：${actionForm.reason}`)
    addLog(record, '取消预约', actionForm.reason, from, 'cancelled', 'danger')
  }
  emit('update:records', [...props.records]); actionVisible.value = false; ElMessage.success('预约已更新')
}
function reinvite(record) { const from = record.status; record.status = 'floorControl'; record.appointmentStatus = 'pending'; addLog(record, '重新邀约', '取消记录已重新进入场控排诊', from, 'floorControl'); emit('update:records', [...props.records]); ElMessage.success('已重新进入场控排诊') }
function addLog(record, action, detail, fromStatus, toStatus, type='primary') { record.logs ||= []; record.logs.push({ id: `${record.id}-${Date.now()}`, time: nowText(), operator: `${props.roleMeta.label}·${props.roleMeta.name}`, action, detail, fromStatus, toStatus, type }) }
function buildPackages(rows) {
  const usage = new Map()
  rows.filter((item) => recordAmount(item) > 0).forEach((item) => (item.projects || [item.estimatedProject]).filter(Boolean).forEach((project) => usage.set(project, (usage.get(project) || 0) + 1)))
  return [...usage.entries()].map(([project, used]) => ({ project, purchased: Math.max(5, used), used }))
}
function recordAmount(record) { return Number(record.revenue || 0) + Number(record.cardAmount || 0) }
function normalizePhone(phone) { return String(phone || '').replace(/\D/g, '') }
function maskPhone(phone) { return phone ? String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : '—' }
function money(value) { return Number(value || 0).toLocaleString('zh-CN') }
function slotCount(record) { return props.records.filter((x) => x.businessDate === record.businessDate && x.appointmentTime === record.appointmentTime && x.store === record.store && appointmentStatus(x) !== 'cancelled').length }
function hasOverload(rows) { const counts = {}; rows.forEach((x) => { const key = `${x.store}-${x.appointmentTime}`; counts[key] = (counts[key] || 0) + 1 }); return Object.values(counts).some((x) => x > capacity) }
function addDays(dateString, days) { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0,10) }
function nowText() { const d = new Date(); const p = (x) => String(x).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
</script>
