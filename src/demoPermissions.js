const demoCrudPermissions = {
  customers: ['view', 'create', 'edit', 'delete'],
  'customers.customerList': ['view', 'create', 'edit', 'delete', 'operate'],
  'customers.customerList.point0': ['view'],
  'customers.customerList.point1': ['view', 'operate'],
  'customers.customerList.point2': ['view', 'operate'],
  'customers.customerList.point3': ['view', 'operate'],
  'customers.customerList.point4': ['view', 'operate'],
  appointments: ['view', 'create', 'edit', 'delete'],
  'appointments.appointmentList': ['view', 'create', 'edit', 'delete', 'operate'],
  'appointments.appointmentList.point0': ['view'],
  'appointments.appointmentList.point1': ['view', 'operate'],
  'appointments.appointmentList.point2': ['view', 'operate'],
  'appointments.appointmentList.point3': ['view', 'operate'],
  'appointments.appointmentList.point4': ['view', 'operate'],
  'appointments.calendar': ['view', 'create', 'edit', 'operate'],
  'appointments.calendar.point0': ['view'],
  'appointments.calendar.point1': ['view', 'operate'],
  'appointments.calendar.point2': ['view', 'operate'],
  'workbench.batchImportInvitation': ['view', 'operate'],
  'workbench.batchImportInvitation.point0': ['view'],
  'workbench.batchImportInvitation.point1': ['view', 'operate'],
  'workbench.batchImportInvitation.point2': ['view', 'operate'],
  'workbench.batchImportInvitation.point3': ['view']
}

const batchImportRequirements = [
  ['workbench.batchImportInvitation', 'view'],
  ['workbench.batchImportInvitation.point0', 'view'],
  ['workbench.batchImportInvitation.point1', 'operate'],
  ['workbench.batchImportInvitation.point2', 'operate'],
  ['workbench.batchImportInvitation.point3', 'view']
]

export function grantDemoCrudPermissions(rawPermissions = {}) {
  const permissions = JSON.parse(JSON.stringify(rawPermissions || {}))
  Object.entries(demoCrudPermissions).forEach(([path, actions]) => {
    permissions[path] = [...new Set([...(permissions[path] || []), ...actions])]
  })
  return permissions
}

export function canUseBatchImportInvitation(rawPermissions = {}, isAdmin = false) {
  if (isAdmin) return true
  return batchImportRequirements.every(([path, action]) => {
    const actions = rawPermissions[path] || []
    return actions.includes(action) || actions.includes('operate')
  })
}
