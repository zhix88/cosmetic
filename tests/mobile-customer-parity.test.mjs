import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { normalizeCustomers, normalizeSnapshot } from '../shared/demoDataContract.js'

test('customer archive normalization keeps PC fields and followup history', () => {
  const [customer] = normalizeCustomers([{
    id: 'C001', name: '林女士', mobile: '13800138001', storeName: '科臻澳总店', level: '金卡',
    owners: { butler: '安然' }, preferences: '偏好下午到店', taboos: '青霉素过敏', packages: [{ project: '光子嫩肤', purchased: 5, used: 2 }],
    images: [{ id: 'IMG-1', type: '术前' }], followups: [{ id: 'FU-1', way: '电话', outcome: '已回访', rating: '满意', nextFollowupDate: '2026-08-04' }]
  }])
  assert.equal(customer.phone, '13800138001')
  assert.equal(customer.memberLevel, '金卡')
  assert.equal(customer.store, '科臻澳总店')
  assert.equal(customer.taboos, '青霉素过敏')
  assert.equal(customer.followups[0].method, '电话')
  assert.equal(customer.followups[0].satisfaction, '满意')
  assert.equal(customer.followups[0].nextDate, '2026-08-04')
})

test('shared snapshot carries customer archives alongside tasks', () => {
  const snapshot = normalizeSnapshot({ data: [{ id: 'B1', status: 'completed', vip1: { name: '林女士', phone: '13800138001' } }], customers: [{ id: 'C1', name: '林女士', phone: '13800138001', memberLevel: '铂金' }] })
  assert.equal(snapshot.data[0].status, 'completed')
  assert.equal(snapshot.customers[0].memberLevel, '铂金')
})

test('mobile customer detail pages keep base data and assets read-only', () => {
  const h5 = fs.readFileSync(new URL('../apps/h5/main.js', import.meta.url), 'utf8')
  const mini = fs.readFileSync(new URL('../apps/mini/src/pages/customer-detail/index.vue', import.meta.url), 'utf8')
  assert.match(h5, /基础资料、资产、服务及影像均为只读内容/)
  assert.match(h5, /移动端不可编辑或核销/)
  assert.match(mini, /项目资产（只读）/)
  assert.match(mini, /资料和资产均为只读/)
  assert.doesNotMatch(mini, /v-model=/)
})
