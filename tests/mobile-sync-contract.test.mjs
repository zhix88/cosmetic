import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  matchesAssignment,
  normalizeSnapshot,
  normalizeStatus,
  resolveNodeTimes
} from '../shared/demoDataContract.js'

const sharedSnapshot = JSON.parse(await readFile(new URL('../data/shared-workbench.json', import.meta.url), 'utf8'))
const records = sharedSnapshot.data

const expectedStatuses = [
  'floorControl',
  'arrivalConfirmation',
  'doctorDiagnosis',
  'service',
  'followup',
  'completed',
  'cancelled'
]

const mobileTimeFields = [
  'createdAt',
  'appointmentTime',
  'floorControlAt',
  'arrivalConfirmationAt',
  'doctorDiagnosisAt',
  'serviceEndedAt',
  'followupAt',
  'cancelledAt'
]

test('PC shared snapshot has a version marker and non-empty task collection', () => {
  assert.equal(typeof sharedSnapshot.updatedAt, 'number')
  assert.ok(Array.isArray(records))
  assert.ok(records.length > 0)
  assert.equal(new Set(records.map(record => record.id)).size, records.length)
})

test('PC shared snapshot covers every mobile workflow status', () => {
  const statuses = new Set(records.map(record => record.status))
  assert.deepEqual(expectedStatuses.filter(status => statuses.has(status)), expectedStatuses)
})

test('baseline tasks contain the fields required by mobile task cards and details', () => {
  for (const record of records.slice(0, 30)) {
    assert.equal(typeof record.id, 'string')
    assert.equal(typeof record.businessDate, 'string')
    assert.equal(typeof record.appointmentTime, 'string')
    assert.equal(typeof record.diagnosisType, 'string')
    assert.equal(typeof record.store, 'string')
    assert.equal(typeof record.status, 'string')
    assert.equal(typeof record.vip1?.name, 'string')
    assert.equal(typeof record.assignments, 'object')
    assert.ok(Array.isArray(record.logs))
  }
})

test('baseline tasks include the legacy and edge cases needed for compatibility', () => {
  assert.ok(records.some(record => record.vip2?.name), '同行顾客样例缺失')
  assert.ok(records.some(record => record.note), '备注信息样例缺失')
  assert.ok(records.some(record => record.status === 'completed'), '已完成任务样例缺失')
  assert.ok(records.some(record => record.status === 'cancelled'), '已取消任务样例缺失')
  assert.ok(records.some(record => record.logs.some(log => log.fromStatus === 'invited' || log.fromStatus === 'reception')), '旧流程日志样例缺失')
})

test('mobile time compatibility baseline names all node time sources', () => {
  assert.equal(new Set(mobileTimeFields).size, 8)
  assert.equal(mobileTimeFields[0], 'createdAt')
  assert.equal(mobileTimeFields.at(-1), 'cancelledAt')
})

test('legacy workflow statuses normalize without dropping the task', () => {
  assert.equal(normalizeStatus('invited'), 'floorControl')
  assert.equal(normalizeStatus('reception'), 'arrivalConfirmation')
  assert.equal(normalizeStatus('triage'), 'doctorDiagnosis')
  const snapshot = normalizeSnapshot([{ id: 'legacy-1', status: 'legacy-status', assignments: { floorControl: '娜娜' } }])
  assert.equal(snapshot.data[0].status, 'legacy-status')
  assert.equal(snapshot.data[0].processable, false)
})

test('node time resolution prefers node fields, then form fields, then logs', () => {
  const times = resolveNodeTimes({
    id: 'time-1',
    createdAt: '2026-08-16 08:00',
    nodeTimes: { floorControlAt: '2026-08-16 09:00' },
    floorControl: { completedAt: '2026-08-16 09:01' },
    logs: [{ time: '2026-08-16 09:02', fromStatus: 'doctorDiagnosis', toStatus: 'scheduling' }]
  })
  assert.equal(times.floorControlAt, '2026-08-16 09:00')
  assert.equal(times.doctorDiagnosisAt, '2026-08-16 09:02')
})

test('employee departments default to 未分组 and assignment matching accepts stable id or name', () => {
  const snapshot = normalizeSnapshot({ data: [{ id: 'task-1', status: 'floorControl', assignments: { floorControl: 'E-1' } }], config: { staff: [{ id: 'E-1', name: '娜娜' }] } })
  const employee = snapshot.config.staff[0]
  assert.equal(employee.department, '未分组')
  assert.equal(matchesAssignment(snapshot.data[0], employee), true)
})

test('followup fields receive stable defaults while preserving supplied values', () => {
  const snapshot = normalizeSnapshot({ data: [{ id: 'task-2', status: 'followup', followupRecords: [{ id: 'f-1', method: '电话', result: '已回访' }] }] })
  const followup = snapshot.data[0].followupRecords[0]
  assert.equal(followup.id, 'f-1')
  assert.equal(followup.method, '电话')
  assert.equal(followup.result, '已回访')
  assert.equal(followup.satisfaction, '未记录')
})
