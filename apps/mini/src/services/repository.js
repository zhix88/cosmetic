import { matchesAssignment, normalizeConfig, normalizeCustomers, normalizeSnapshot } from '../../../../shared/demoDataContract.js'

const DATA_KEY = 'cosme-mini-demo-data-v1'
const SESSION_KEY = 'cosme-mini-demo-session-v1'
const SNAPSHOT_KEY = 'cosme-mini-demo-snapshot-v1'
const SYNC_URL_KEY = 'cosme-mini-shared-sync-url-v1'
const SYNC_STATUS_KEY = 'cosme-mini-shared-sync-status-v1'

export const stages = {
  floorControl: { label: '场控排诊', owner: 'floorControl', tone: 'orange' },
  arrivalConfirmation: { label: '确认到店', owner: 'floorControl', tone: 'blue' },
  doctorDiagnosis: { label: '医生排诊', owner: 'doctor', tone: 'blue' },
  service: { label: '服务执行', owner: 'aftersales', tone: 'orange' },
  followup: { label: '顾客回访', owner: 'aftersales', tone: 'green' },
  completed: { label: '服务完成', owner: null, tone: 'green' },
  cancelled: { label: '服务取消', owner: null, tone: 'red' }
}
export const nextStage = { floorControl: 'arrivalConfirmation', arrivalConfirmation: 'doctorDiagnosis', doctorDiagnosis: 'service', service: 'followup', followup: 'completed' }
export const projects = ['光子嫩肤', '面部抗衰', '轮廓提升', '补水保湿', '形体管理', '术后护理']

const clone = value => JSON.parse(JSON.stringify(value))
const now = () => new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
const date = () => new Date().toISOString().slice(0, 10)
const log = (operator, action, detail, fromStatus, toStatus, type = 'primary') => ({ id: `LOG-${Date.now()}-${Math.random().toString(16).slice(2)}`, time: now(), operator, action, detail, fromStatus, toStatus, type })

function seedData() {
  const employees = [
    { id: '10001', name: '王晓歌', role: '院长', roleKey: 'storeManager', store: '科臻澳总店' },
    { id: '10002', name: '娜娜', role: '场控', roleKey: 'floorControl', store: '科臻澳总店' },
    { id: '10003', name: '张璐', role: '护士长', roleKey: 'headNurse', store: '科臻澳总店' },
    { id: '10004', name: '洋洋', role: '护士长', roleKey: 'headNurse', store: '科臻澳总店' },
    { id: '10005', name: '舒婷', role: '售后', roleKey: 'aftersales', store: '科臻澳总店' },
    { id: '10006', name: '小洁', role: '财务', roleKey: 'finance', store: '科臻澳总店' }
  ]
  const customers = [
    { id: 'C001', name: '林女士', gender: '女', birthday: '1993-06-18', phone: '13800138001', store: '科臻澳总店', memberLevel: '金卡', source: '线上咨询', preferences: '偏好下午到店，关注抗衰项目', taboos: '青霉素过敏史待确认', preparation: '已完成初次需求沟通', note: '需关注术后恢复感受', owners: { floorControl: '娜娜', doctor: '小医', service: '舒婷', aftercare: '舒婷' }, balance: 6800, points: 1260, packages: [{ project: '光子嫩肤', purchased: 5, used: 2, expiry: '2027-06-30' }], images: [{ type: '术前', project: '光子嫩肤', date: '2026-07-20' }], followups: [] },
    { id: 'C002', name: '周女士', gender: '女', birthday: '1989-11-02', phone: '13800138002', store: '科臻澳总店', memberLevel: '普通会员', source: '老客转介绍', preferences: '偏好微信沟通', taboos: '暂无记录', preparation: '医生初步评估已完成', note: '', owners: { floorControl: '娜娜', doctor: '小医', service: '舒婷', aftercare: '舒婷' }, balance: 0, points: 480, packages: [{ project: '面部抗衰', purchased: 3, used: 1, expiry: '2026-12-31' }], images: [], followups: [] },
    { id: 'C003', name: '孙女士', gender: '女', birthday: '1996-03-09', phone: '13800138003', store: '科臻澳总店', memberLevel: '铂金', source: '到店咨询', preferences: '重视隐私和恢复周期', taboos: '暂无记录', preparation: '等待服务后回访', note: '优先确认满意度', owners: { floorControl: '娜娜', doctor: '小医', service: '舒婷', aftercare: '舒婷' }, balance: 12000, points: 2100, packages: [{ project: '轮廓提升', purchased: 2, used: 1, expiry: '2027-01-01' }], images: [{ type: '术后', project: '轮廓提升', date: '2026-07-24' }], followups: [] }
  ]
  const assignments = { floorControl: '娜娜', doctor: '小医', service: '舒婷', aftercare: '舒婷', butler: '林悦', director: '陈楠', manager: '赵阳', nurse: '张璐', storeManager: '王晓歌' }
  const records = [
    { id: 'B20260727001', customerId: 'C001', vip1: { name: '林女士', phone: '13800138001' }, vip2: { name: '王女士', phone: '13800138011' }, businessDate: date(), appointmentTime: '10:00', diagnosisType: '新诊', estimatedProject: '光子嫩肤', projects: [], department: '皮肤管理科', store: '科臻澳总店', status: 'floorControl', assignments, flags: ['今日到店，请提前完成排诊'], floorControl: {}, doctorDiagnosis: {}, serviceExecution: {}, followupRecords: [], logs: [log('系统', '创建业务单', '由预约记录生成当天业务任务', null, 'floorControl')] },
    { id: 'B20260727002', customerId: 'C002', vip1: { name: '周女士', phone: '13800138002' }, vip2: null, businessDate: date(), appointmentTime: '13:30', diagnosisType: '复诊', estimatedProject: '面部抗衰', projects: ['面部抗衰'], department: '抗衰中心', store: '科臻澳总店', status: 'doctorDiagnosis', assignments, flags: ['顾客已到店'], floorControl: { scheduledTime: `${date()} 12:50`, managerSuggestion: '面部抗衰', note: '复诊评估' }, doctorDiagnosis: {}, serviceExecution: {}, followupRecords: [], logs: [log('娜娜', '完成场控排诊', '顾客已到店，转医生排诊', 'floorControl', 'doctorDiagnosis')] },
    { id: 'B20260726003', customerId: 'C003', vip1: { name: '孙女士', phone: '13800138003' }, vip2: null, businessDate: '2026-07-26', appointmentTime: '15:00', diagnosisType: '新诊', estimatedProject: '轮廓提升', projects: ['轮廓提升'], department: '微整注射科', store: '科臻澳总店', status: 'followup', assignments, flags: ['回访已到期'], floorControl: {}, doctorDiagnosis: { doctor: '小医', nurse: '张璐', note: '项目执行安排完成' }, serviceExecution: { result: '服务已结束', projects: ['轮廓提升'], note: '服务顺利完成', followupDate: date() }, followupRecords: [], logs: [log('舒婷', '完成服务执行', '已生成顾客回访任务', 'service', 'followup')] },
    { id: 'B20260725004', customerId: 'C001', vip1: { name: '林女士', phone: '13800138001' }, vip2: null, businessDate: '2026-07-25', appointmentTime: '11:00', diagnosisType: '复诊', estimatedProject: '补水保湿', projects: ['补水保湿'], department: '皮肤管理科', store: '科臻澳总店', status: 'cancelled', assignments, flags: ['已取消：顾客临时有事'], floorControl: {}, doctorDiagnosis: {}, serviceExecution: {}, followupRecords: [], logs: [log('娜娜', '取消业务', '顾客临时有事', 'arrivalConfirmation', 'cancelled', 'danger')] }
  ]
  return { employees, customers, records }
}

function normalizeDemoData(data) {
  const seeded = seedData()
  const sharedSnapshot = uni.getStorageSync(SNAPSHOT_KEY) || {}
  const sharedConfig = normalizeConfig(sharedSnapshot.config || {})
  const employees = sharedConfig.staff.length ? sharedConfig.staff : (Array.isArray(data.employees) && data.employees.length ? data.employees : seeded.employees)
  const fallback = seeded.records[0].assignments
  const records = (data.records || []).map((record, index) => ({
    ...record,
    assignments: { ...fallback, ...(record.assignments || {}) },
    floorControl: { ...record.floorControl },
    doctorDiagnosis: { ...record.doctorDiagnosis },
    serviceExecution: { ...record.serviceExecution }
  }))
  const customers = normalizeCustomers(data.customers || []).map(customer => ({ ...customer, owners: { ...(customer.owners || {}) } }))
  return { ...data, employees, customers, records, departments: sharedConfig.departments.length ? sharedConfig.departments : (data.departments || []), workflowNodes: sharedConfig.workflowNodes.length ? sharedConfig.workflowNodes : (data.workflowNodes || []) }
}
export function ensureDemoData() { if (!uni.getStorageSync(DATA_KEY)) uni.setStorageSync(DATA_KEY, seedData()) }
export function getData() { ensureDemoData(); const data = normalizeDemoData(uni.getStorageSync(DATA_KEY)); applyWorkflowConfig(data.workflowNodes); uni.setStorageSync(DATA_KEY, data); return clone(data) }
export function saveData(data) { uni.setStorageSync(DATA_KEY, clone(data)) }
export function resetDemoData() { uni.setStorageSync(DATA_KEY, seedData()); uni.removeStorageSync(SESSION_KEY) }
export function getSyncUrl() { return uni.getStorageSync(SYNC_URL_KEY) || '' }
export function setSyncUrl(url) { if (url) uni.setStorageSync(SYNC_URL_KEY, String(url).trim()); else uni.removeStorageSync(SYNC_URL_KEY) }
function requestSnapshot(url) {
  return new Promise((resolve, reject) => {
    uni.request({ url, method: 'GET', timeout: 8000, success: response => resolve(response.data), fail: reject })
  })
}
function postSnapshot(url, payload) {
  return new Promise((resolve, reject) => {
    uni.request({ url, method: 'POST', timeout: 8000, header: { 'content-type': 'application/json' }, data: payload, success: response => {
      if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data)
      else reject(new Error(`共享快照写入失败（${response.statusCode || '未知错误'}）`))
    }, fail: reject })
  })
}
function setSyncStatus(status, message = '') { uni.setStorageSync(SYNC_STATUS_KEY, { status, message, updatedAt: Date.now() }) }
export function getSyncStatus() { return uni.getStorageSync(SYNC_STATUS_KEY) || { status: 'idle', message: '' } }
export async function pushSharedSnapshot(url = getSyncUrl()) {
  if (!url) return false
  setSyncStatus('syncing', '正在同步共享任务')
  try {
    const current = getData()
    const payload = await postSnapshot(url, { data: current.records, customers: current.customers })
    const snapshot = normalizeSnapshot(payload)
    if (!snapshot.data.length) throw new Error('共享快照为空')
    uni.setStorageSync(SNAPSHOT_KEY, { ...payload, data: snapshot.data, customers: snapshot.customers })
    setSyncStatus('synced')
    return true
  } catch (error) {
    setSyncStatus('pending', error?.message || '网络不可用，已保留本地结果')
    return false
  }
}
export async function syncSharedSnapshot(url = getSyncUrl()) {
  ensureDemoData()
  if (!url) return false
  try {
    const payload = await requestSnapshot(url)
    const snapshot = normalizeSnapshot(payload)
    if (!snapshot.data.length) return false
    const cached = uni.getStorageSync(SNAPSHOT_KEY) || {}
    const incomingVersion = Number(snapshot.updatedAt || 0)
    if (incomingVersion && Number(cached.updatedAt || 0) > incomingVersion) return false
    const current = getData()
    saveData({ ...current, records: snapshot.data, customers: snapshot.customers.length ? snapshot.customers : current.customers })
    uni.setStorageSync(SNAPSHOT_KEY, { ...payload, updatedAt: incomingVersion, data: snapshot.data, customers: snapshot.customers })
    setSyncStatus('synced')
    return true
  } catch {
    // 网络不可用或快照非法时保留当前本地演示数据。
    setSyncStatus('offline', '网络不可用，继续使用本地演示数据')
    return false
  }
}
export function getSession() { return uni.getStorageSync(SESSION_KEY) || null }
export function setSession(employee) { uni.setStorageSync(SESSION_KEY, employee) }
export function logout() { uni.removeStorageSync(SESSION_KEY) }
const roleAssignmentKeys = { aftersales: ['aftersales', 'aftercare', 'service'], headNurse: ['headNurse', 'nurse'] }
const assignmentKeys = role => roleAssignmentKeys[role] || [role]
function applyWorkflowConfig(nodes = []) {
  nodes.forEach(node => {
    if (!node?.key || !stages[node.key]) return
    stages[node.key] = { ...stages[node.key], label: node.label || stages[node.key].label, owner: node.ownerKey || stages[node.key].owner, tone: node.type || stages[node.key].tone }
  })
}
const belongsToEmployee = (record, employee) => {
  if (!employee) return false
  if (employee.roleKey === 'storeManager') return record.store === employee.store
  return matchesAssignment(record, employee) || assignmentKeys(employee.roleKey).some(key => record.assignments?.[key] === employee.name)
}
const canHandleStage = (record, employee) => {
  if (employee?.roleKey === 'storeManager') return record.store === employee.store
  return stages[record.status]?.owner === employee?.roleKey && belongsToEmployee(record, employee)
}
export function currentTasks(employee) { const data = getData(); return data.records.filter(record => canHandleStage(record, employee)) }
export function customerRecords(customerId) { return getData().records.filter(item => item.customerId === customerId).sort((a, b) => `${b.businessDate}${b.appointmentTime}`.localeCompare(`${a.businessDate}${a.appointmentTime}`)) }
export function accessibleCustomers(employee) { const data = getData(); const ids = new Set(data.records.filter(record => belongsToEmployee(record, employee)).map(record => record.customerId)); return data.customers.filter(customer => ids.has(customer.id)) }
export function submitStage(recordId, employee, form) {
  const data = getData(); const record = data.records.find(item => item.id === recordId)
  if (!record || !canHandleStage(record, employee)) throw new Error('无权处理该任务')
  const from = record.status; const to = nextStage[from]; record.nodeTimes ||= {}
  if (from === 'arrivalConfirmation' && form.result !== '已到店') {
    record.flags = [...record.flags, form.result === '申请改期' ? '顾客申请改期' : '未到店：需再次联系']
    record.arrivalConfirmation = { ...form, confirmedTime: now() }
    record.logs.push(log(`${employee.role}·${employee.name}`, '登记到店结果', form.result, from, from, 'warning'))
  } else {
    if (from === 'floorControl') { const completedAt = now(); record.floorControl = { ...form, scheduledTime: completedAt, managerSuggestion: form.project }; record.nodeTimes.floorControlAt = completedAt; record.floorControlAt = completedAt; record.estimatedProject = form.project || record.estimatedProject }
    if (from === 'arrivalConfirmation') { const confirmedAt = now(); record.arrivalConfirmation = { ...form, confirmedTime: confirmedAt }; record.nodeTimes.arrivalConfirmationAt = confirmedAt; record.arrivalConfirmationAt = confirmedAt; record.arrivalTime = form.time; record.diagnosisType = form.diagnosisType }
    if (from === 'doctorDiagnosis') { const scheduledAt = now(); record.doctorDiagnosis = { ...form, scheduledTime: scheduledAt }; record.nodeTimes.doctorDiagnosisAt = scheduledAt; record.doctorDiagnosisAt = scheduledAt; record.projects = form.projects || record.projects; record.department = form.department; record.assignments.doctor = form.doctor || employee.name }
    if (from === 'service') { const endedAt = now(); record.serviceExecution = { ...form, time: endedAt }; record.nodeTimes.serviceEndedAt = endedAt; record.serviceEndedAt = endedAt; record.projects = form.projects || record.projects; record.followupDate = form.followupDate }
    if (from === 'followup') { const followedAt = now(); const followup = { id: `FU-${Date.now()}`, ...form, date: date(), createdAt: followedAt, followupAt: followedAt, operator: `${employee.role}·${employee.name}` }; record.followupRecords.push(followup); record.nodeTimes.followupAt = followedAt; record.followupAt = followedAt; const customer = data.customers.find(c => c.id === record.customerId); if (customer) customer.followups.push(followup) }
    record.status = to
    record.logs.push(log(`${employee.role}·${employee.name}`, `完成${stages[from].label}`, form.note || '已完成当前节点处理', from, to, to === 'completed' ? 'success' : 'primary'))
  }
  saveData(data); void pushSharedSnapshot(); return clone(record)
}
