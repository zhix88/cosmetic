import assert from 'node:assert/strict'
import test from 'node:test'

import { canUseBatchImportInvitation, grantDemoCrudPermissions } from '../src/demoPermissions.js'

test('every normalized role receives all batch invitation import capabilities', () => {
  const permissions = grantDemoCrudPermissions({ workbench: ['view'] })

  assert.deepEqual(permissions['workbench.batchImportInvitation'], ['view', 'operate'])
  assert.deepEqual(permissions['workbench.batchImportInvitation.point0'], ['view'])
  assert.deepEqual(permissions['workbench.batchImportInvitation.point1'], ['view', 'operate'])
  assert.deepEqual(permissions['workbench.batchImportInvitation.point2'], ['view', 'operate'])
  assert.deepEqual(permissions['workbench.batchImportInvitation.point3'], ['view'])
})

test('batch invitation import requires every configured capability for non-admin roles', () => {
  const permissions = grantDemoCrudPermissions({})

  assert.equal(canUseBatchImportInvitation(permissions), true)
  delete permissions['workbench.batchImportInvitation.point2']
  assert.equal(canUseBatchImportInvitation(permissions), false)
  assert.equal(canUseBatchImportInvitation({}, true), true)
})