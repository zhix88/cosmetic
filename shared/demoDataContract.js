const STATUS_ALIASES = Object.freeze({
  invited: 'floorControl',
  reception: 'arrivalConfirmation',
  triage: 'doctorDiagnosis',
  scheduling: 'doctorDiagnosis',
  diagnosis: 'doctorDiagnosis',
  treatment: 'service',
  serviceExecution: 'service',
  aftercare: 'followup',
  finished: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled'
})

export const WORKFLOW_STATUSES = Object.freeze([
  'floorControl',
  'arrivalConfirmation',
  'doctorDiagnosis',
  'service',
  'followup',
  'completed',
  'cancelled'
])

export const NODE_TIME_FIELDS = Object.freeze([
  'createdAt',
  'appointmentTime',
  'floorControlAt',
  'arrivalConfirmationAt',
  'doctorDiagnosisAt',
  'serviceEndedAt',
  'followupAt',
  'cancelledAt'
])

const NODE_LOG_ALIASES = Object.freeze({
  floorControlAt: new Set(['floorControl', 'triage']),
  arrivalConfirmationAt: new Set(['arrivalConfirmation', 'reception']),
  doctorDiagnosisAt: new Set(['doctorDiagnosis', 'scheduling']),
  serviceEndedAt: new Set(['service', 'completed']),
  followupAt: new Set(['followup', 'completed']),
  cancelledAt: new Set(['cancelled', 'canceled'])
})

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '') || ''

export function normalizeStatus(status) {
  const value = String(status || '')
  return STATUS_ALIASES[value] || value
}

export function isProcessableStatus(status) {
  return WORKFLOW_STATUSES.includes(normalizeStatus(status))
}

export function normalizeAssignments(assignments = {}) {
  if (Array.isArray(assignments)) {
    return Object.fromEntries(assignments.map(item => [item.key || item.role || item.id || 'staff', item.name || item.value || '']).filter(([, value]) => value))
  }
  return Object.fromEntries(Object.entries(assignments || {}).map(([key, value]) => [key, typeof value === 'object' ? (value.name || value.id || '') : value]).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export function assignmentValues(task) {
  const values = []
  const add = value => {
    if (Array.isArray(value)) value.forEach(add)
    else if (value && typeof value === 'object') {
      const identity = value.name || value.id
      if (identity) add(identity)
      else Object.values(value).forEach(add)
    }
    else if (value !== undefined && value !== null && value !== '') values.push(String(value))
  }
  add(task?.assignments)
  add(task?.owner)
  add(task?.ownerId)
  add(task?.currentOwner)
  return [...new Set(values)]
}

export function matchesAssignment(task, employee) {
  if (!employee) return false
  const ids = [employee.id, employee.code, employee.name, employee.account].filter(Boolean).map(String)
  return assignmentValues(task).some(value => ids.includes(value))
}

export function normalizeEmployee(employee = {}) {
  const id = firstValue(employee.id, employee.code, employee.account, employee.name)
  return {
    ...employee,
    id: String(id),
    code: firstValue(employee.code, employee.id, id),
    name: firstValue(employee.name, employee.label, employee.account),
    role: firstValue(employee.role, employee.roleLabel, employee.label, employee.roleKey),
    roleKey: firstValue(employee.roleKey, employee.role, ''),
    store: firstValue(employee.store, employee.storeName, '未分配门店'),
    department: firstValue(employee.department, employee.departmentName, '未分组'),
    status: firstValue(employee.status, 'active')
  }
}

export function normalizeEmployees(employees = []) {
  const source = Array.isArray(employees) ? employees : Object.values(employees || {})
  return source.map(normalizeEmployee).filter(item => item.name && item.status !== 'disabled' && item.status !== 'inactive')
}

function logTimeFor(log, aliases) {
  const from = String(log?.fromStatus || '')
  const to = String(log?.toStatus || '')
  return aliases.has(from) || aliases.has(to) ? firstValue(log?.time, log?.createdAt) : ''
}

export function resolveNodeTimes(record = {}) {
  const logs = Array.isArray(record.logs) ? [...record.logs].sort((a, b) => String(a?.time || '').localeCompare(String(b?.time || ''))) : []
  const latestLog = aliases => [...logs].reverse().map(log => logTimeFor(log, aliases)).find(Boolean) || ''
  const form = record.floorControl || {}
  const arrival = record.arrivalConfirmation || record.reception || {}
  const doctor = record.doctorDiagnosis || {}
  const service = record.serviceExecution || record.service || {}
  const followups = Array.isArray(record.followupRecords) ? record.followupRecords : []
  const latestFollowup = [...followups].reverse().map(item => firstValue(item.createdAt, item.time, item.followupAt, item.date)).find(Boolean) || ''
  const node = record.nodeTimes || {}
  return {
    createdAt: firstValue(node.createdAt, record.createdAt, record.createdTime, logs[0]?.time),
    appointmentTime: firstValue(node.appointmentTime, record.appointmentDateTime, record.appointmentAt, record.appointmentTime),
    floorControlAt: firstValue(node.floorControlAt, form.completedAt, form.time, form.createdAt, latestLog(NODE_LOG_ALIASES.floorControlAt)),
    arrivalConfirmationAt: firstValue(node.arrivalConfirmationAt, arrival.completedAt, arrival.time, arrival.createdAt, record.arrivalTime, latestLog(NODE_LOG_ALIASES.arrivalConfirmationAt)),
    doctorDiagnosisAt: firstValue(node.doctorDiagnosisAt, doctor.completedAt, doctor.time, doctor.createdAt, latestLog(NODE_LOG_ALIASES.doctorDiagnosisAt)),
    serviceEndedAt: firstValue(node.serviceEndedAt, service.completedAt, service.endedAt, service.endTime, latestLog(NODE_LOG_ALIASES.serviceEndedAt)),
    followupAt: firstValue(node.followupAt, record.followupAt, latestFollowup, latestLog(NODE_LOG_ALIASES.followupAt)),
    cancelledAt: firstValue(node.cancelledAt, record.cancelledAt, record.cancelledTime, latestLog(NODE_LOG_ALIASES.cancelledAt))
  }
}

export function normalizeFollowup(item = {}, index = 0) {
  return {
    ...item,
    id: firstValue(item.id, `followup-${index + 1}`),
    createdAt: firstValue(item.createdAt, item.time, item.recordedAt),
    operator: firstValue(item.operator, item.operatorName, item.createdBy, '未记录'),
    method: firstValue(item.method, item.way, item.followupMethod, '未记录'),
    result: firstValue(item.result, item.outcome, '未记录'),
    satisfaction: firstValue(item.satisfaction, item.rating, '未记录'),
    nextDate: firstValue(item.nextDate, item.nextFollowupDate, item.followupDate),
    note: firstValue(item.note, item.remark, '')
  }
}

export function normalizeCustomer(customer = {}) {
  const phone = firstValue(customer.phone, customer.mobile, customer.mobilePhone)
  return {
    ...customer,
    id: firstValue(customer.id, phone ? `C${String(phone).slice(-6)}` : customer.name),
    name: firstValue(customer.name, customer.customerName, '未命名顾客'),
    phone: String(phone),
    store: firstValue(customer.store, customer.storeName, '未分配门店'),
    memberLevel: firstValue(customer.memberLevel, customer.level, '普通会员'),
    owners: customer.owners && typeof customer.owners === 'object' ? customer.owners : {},
    tags: Array.isArray(customer.tags) ? customer.tags : [],
    preferences: firstValue(customer.preferences, customer.preference, ''),
    taboos: firstValue(customer.taboos, customer['禁忌'], customer['禁忌事项'], ''),
    preparation: firstValue(customer.preparation, customer.noteBeforeService, ''),
    note: firstValue(customer.note, customer.remark, ''),
    packages: Array.isArray(customer.packages) ? customer.packages : [],
    images: Array.isArray(customer.images) ? customer.images : [],
    followups: (Array.isArray(customer.followups) ? customer.followups : []).map(normalizeFollowup),
    logs: Array.isArray(customer.logs) ? customer.logs : [],
    imageCount: Number(customer.imageCount || (Array.isArray(customer.images) ? customer.images.length : 0))
  }
}

export function normalizeCustomers(customers = []) {
  const source = Array.isArray(customers) ? customers : Object.values(customers || {})
  return source.map(normalizeCustomer).filter(item => item.name && item.phone)
}

export function normalizeTask(record = {}) {
  const originalStatus = String(record.status || '')
  const status = normalizeStatus(originalStatus)
  const companions = record.companions || (record.vip2 ? [record.vip2] : [])
  const normalized = {
    ...record,
    id: firstValue(record.id, record.businessId),
    status,
    originalStatus,
    processable: isProcessableStatus(status),
    assignments: normalizeAssignments(record.assignments),
    department: firstValue(record.department, record.departmentName, '未分组'),
    projects: Array.isArray(record.projects) && record.projects.length ? record.projects : [firstValue(record.estimatedProject, record.project)].filter(Boolean),
    companions: Array.isArray(companions) ? companions : [],
    vip2: record.vip2 || (Array.isArray(companions) ? companions[0] || null : null),
    followupRecords: (Array.isArray(record.followupRecords) ? record.followupRecords : []).map(normalizeFollowup),
    nodeTimes: resolveNodeTimes(record)
  }
  normalized.createdAt = normalized.nodeTimes.createdAt
  normalized.cancelledAt = normalized.nodeTimes.cancelledAt || record.cancelledAt || ''
  normalized.serviceEndedAt = normalized.nodeTimes.serviceEndedAt || record.serviceEndedAt || ''
  normalized.followupAt = normalized.nodeTimes.followupAt || record.followupAt || ''
  return normalized
}

export function normalizeConfig(config = {}) {
  const source = config || {}
  const staffSource = source.staff || source.employees || []
  return {
    ...source,
    staff: normalizeEmployees(staffSource),
    departments: [...new Set((source.departments || []).map(String).filter(Boolean))],
    workflowNodes: Array.isArray(source.workflowNodes) ? source.workflowNodes : []
  }
}

export function createConfigSnapshot(config = {}, revision = Date.now()) {
  const normalized = normalizeConfig(config)
  return {
    ...normalized,
    revision: Number(revision) || Date.now(),
    updatedAt: Date.now()
  }
}

export function normalizeSnapshot(payload) {
  const source = Array.isArray(payload) ? { data: payload } : (payload || {})
  const data = Array.isArray(source.data) ? source.data : Array.isArray(source.records) ? source.records : []
  return {
    updatedAt: Number(source.updatedAt || source.version || 0),
    data: data.map(normalizeTask),
    config: normalizeConfig(source.config || source.configuration || {}),
    customers: normalizeCustomers(source.customers || source.customerArchives || [])
  }
}

export function mergeWorkbenchSnapshot(payload, current = {}) {
  const source = Array.isArray(payload) ? { data: payload } : (payload || {})
  const data = Array.isArray(source.data) ? source.data : Array.isArray(source.records) ? source.records : []
  if (!data.length || data.some(item => !item || typeof item !== 'object' || !item.id)) throw new Error('Invalid workbench payload')
  if (new Set(data.map(item => String(item.id))).size !== data.length) throw new Error('Duplicate workbench task id')
  const currentUpdatedAt = Number(current.updatedAt || 0)
  return {
    updatedAt: Math.max(Date.now(), currentUpdatedAt + 1),
    data,
    config: source.config && typeof source.config === 'object' && !Array.isArray(source.config)
      ? source.config
      : (current.config || {}),
    customers: Array.isArray(source.customers) ? source.customers : (Array.isArray(current.customers) ? current.customers : [])
  }
}
