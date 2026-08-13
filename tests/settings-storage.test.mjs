import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_WORKFLOW_NODES,
  buildWorkflowTransitions,
  createOrgEntityDefaults,
  loadLocalJson,
  normalizeOrgRegions,
  normalizeWorkflowNodes,
  synchronizeDemoSettings
} from '../src/settingsStorage.js'

test('invalid cached settings fall back without breaking the settings page', () => {
  const removed = []
  const storage = {
    getItem: () => '{invalid json',
    removeItem: (key) => removed.push(key)
  }

  assert.equal(loadLocalJson('settings', storage), null)
  assert.deepEqual(removed, ['settings'])
})

test('empty or legacy organization cache is normalized for create dialogs', () => {
  const fallback = () => [{ id: 'region-default', name: '默认区域', stores: [] }]
  assert.deepEqual(normalizeOrgRegions([], fallback), fallback())
  assert.deepEqual(normalizeOrgRegions([null], fallback), fallback())

  assert.deepEqual(normalizeOrgRegions([{ id: 'legacy', name: '旧区域' }], fallback), [
    { id: 'legacy', name: '旧区域', stores: [] }
  ])
})

test('organization dialog defaults remain usable when cached organization data is empty', () => {
  assert.deepEqual(createOrgEntityDefaults([], []), {
    nodeType: 'store',
    name: '',
    region: '',
    storeId: '',
    manager: '',
    phone: '',
    address: '',
    status: 'active'
  })
})
test('workflow settings use the same seven stages as the workbench', () => {
  assert.deepEqual(
    normalizeWorkflowNodes().map(({ key, label }) => ({ key, label })),
    DEFAULT_WORKFLOW_NODES.map(({ key, label }) => ({ key, label }))
  )
  assert.deepEqual(normalizeWorkflowNodes().map((node) => node.key), [
    'floorControl',
    'arrivalConfirmation',
    'doctorDiagnosis',
    'service',
    'followup',
    'completed',
    'cancelled'
  ])
})

test('workflow settings preserve valid names and order while repairing legacy data', () => {
  const normalized = normalizeWorkflowNodes([
    { key: 'doctorDiagnosis', label: '专家面诊', owner: '错误角色' },
    { key: 'floorControl', label: '一楼排诊' },
    { key: 'doctorDiagnosis', label: '重复节点' },
    { key: 'unknown', label: '无效节点' },
    { key: 'service', label: '   ' }
  ])

  assert.deepEqual(normalized.slice(0, 3).map((node) => node.key), [
    'doctorDiagnosis',
    'floorControl',
    'service'
  ])
  assert.equal(normalized[0].label, '专家面诊')
  assert.equal(normalized[0].owner, '医生')
  assert.equal(normalized[2].label, '服务执行')
  assert.equal(normalized.length, DEFAULT_WORKFLOW_NODES.length)
  assert.equal(new Set(normalized.map((node) => node.key)).size, DEFAULT_WORKFLOW_NODES.length)
})
test('workflow order drives the active-stage forward and return transitions', () => {
  const reordered = normalizeWorkflowNodes([
    { key: 'floorControl', label: '场控排诊' },
    { key: 'doctorDiagnosis', label: '医生排诊' },
    { key: 'arrivalConfirmation', label: '确认到店' },
    { key: 'followup', label: '顾客回访' },
    { key: 'service', label: '服务执行' },
    { key: 'completed', label: '服务完成' },
    { key: 'cancelled', label: '服务取消' }
  ])
  const transitions = buildWorkflowTransitions(reordered)

  assert.equal(transitions.next.floorControl, 'doctorDiagnosis')
  assert.equal(transitions.next.doctorDiagnosis, 'arrivalConfirmation')
  assert.equal(transitions.next.followup, 'service')
  assert.equal(transitions.next.service, 'completed')
  assert.equal(transitions.previous.arrivalConfirmation, 'doctorDiagnosis')
  assert.equal(transitions.previous.completed, 'service')
  assert.equal(transitions.next.cancelled, undefined)
})

test('a new demo configuration revision replaces cached organization, staff, roles, and workflow data', () => {
  const baseline = {
    revision: '2026-08-13.1',
    orgRegions: [{ id: 'region-main', name: '演示区域', stores: [] }],
    staff: [{ code: '10001', name: '王晓歌', roleKey: 'storeManager' }],
    roles: [{ key: 'storeManager', label: '院长', dataScope: '本店', permissions: { workbench: ['view'] } }],
    workflowNodes: [{ key: 'floorControl', label: '场控排诊' }]
  }
  const result = synchronizeDemoSettings({
    demoConfigRevision: 'old',
    orgRegions: [{ id: 'old-region', name: '旧区域', stores: [] }],
    staff: [{ code: 'old', name: '旧员工' }],
    roles: [{ key: 'old', label: '旧角色' }],
    workflowNodes: [{ key: 'old', label: '旧流程' }],
    activityPackages: [{ id: 'keep-me' }]
  }, baseline)

  assert.equal(result.updated, true)
  assert.equal(result.settings.demoConfigRevision, '2026-08-13.1')
  assert.deepEqual(result.settings.staff, baseline.staff)
  assert.deepEqual(result.settings.roles, baseline.roles)
  assert.deepEqual(result.settings.orgRegions, baseline.orgRegions)
  assert.deepEqual(result.settings.activityPackages, [{ id: 'keep-me' }])
})