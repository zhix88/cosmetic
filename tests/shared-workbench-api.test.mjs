import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeWorkbenchSnapshot } from '../shared/demoDataContract.js'

const task = id => ({ id, status: 'floorControl', vip1: { name: '演示顾客' } })

test('shared workbench snapshot accepts tasks, customers, and config', () => {
  const result = mergeWorkbenchSnapshot({ data: [task('A-1')], customers: [{ id: 'C-1', name: '演示顾客', phone: '13800138001' }], config: { revision: 7, staff: [] } }, { updatedAt: 100 })
  assert.equal(result.data.length, 1)
  assert.equal(result.customers[0].id, 'C-1')
  assert.equal(result.config.revision, 7)
  assert.ok(result.updatedAt > 100)
})

test('legacy array payload remains readable and keeps current config', () => {
  const result = mergeWorkbenchSnapshot([task('A-2')], { updatedAt: 200, config: { revision: 8 } })
  assert.equal(result.data[0].id, 'A-2')
  assert.equal(result.config.revision, 8)
})

test('empty, malformed, and duplicate task payloads are rejected', () => {
  assert.throws(() => mergeWorkbenchSnapshot({ data: [] }))
  assert.throws(() => mergeWorkbenchSnapshot({ data: [{ status: 'floorControl' }] }))
  assert.throws(() => mergeWorkbenchSnapshot({ data: [task('A-3'), task('A-3')] }))
})
