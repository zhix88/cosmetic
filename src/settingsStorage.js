export function loadLocalJson(key, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    storage?.removeItem?.(key)
    return null
  }
}

export function synchronizeDemoSettings(saved, baseline) {
  const current = saved && typeof saved === 'object' ? saved : {}
  if (current.demoConfigRevision === baseline.revision) {
    return { settings: current, updated: false }
  }
  return {
    updated: true,
    settings: {
      ...current,
      demoConfigRevision: baseline.revision,
      orgRegions: structuredClone(baseline.orgRegions),
      staff: structuredClone(baseline.staff),
      roles: structuredClone(baseline.roles),
      workflowNodes: structuredClone(baseline.workflowNodes)
    }
  }
}
export function normalizeOrgRegions(value, fallbackFactory) {
  const cached = Array.isArray(value) ? value.filter((region) => region && typeof region === 'object') : []
  const source = cached.length ? cached : fallbackFactory()
  return source
    .filter((region) => region && typeof region === 'object')
    .map((region, regionIndex) => ({
      ...region,
      id: region.id || `region-${regionIndex + 1}`,
      name: region.name || `区域${regionIndex + 1}`,
      stores: (Array.isArray(region.stores) ? region.stores : [])
        .filter((store) => store && typeof store === 'object')
        .map((store, storeIndex) => ({
          ...store,
          id: store.id || `store-${regionIndex + 1}-${storeIndex + 1}`,
          departments: Array.isArray(store.departments) ? store.departments : []
        }))
    }))
}

export function createOrgEntityDefaults(regions, stores) {
  return {
    nodeType: 'store',
    name: '',
    region: regions?.[0]?.name || '',
    storeId: stores?.[0]?.id || '',
    manager: '',
    phone: '',
    address: '',
    status: 'active'
  }
}
export const DEFAULT_WORKFLOW_NODES = Object.freeze([
  { key: 'floorControl', label: '场控排诊', owner: '场控', ownerKey: 'floorControl', type: 'warning', terminal: false },
  { key: 'arrivalConfirmation', label: '确认到店', owner: '场控', ownerKey: 'floorControl', type: 'info', terminal: false },
  { key: 'doctorDiagnosis', label: '医生排诊', owner: '医生', ownerKey: 'doctor', type: 'primary', terminal: false },
  { key: 'service', label: '服务执行', owner: '总监', ownerKey: 'director', type: 'success', terminal: false },
  { key: 'followup', label: '顾客回访', owner: '售后', ownerKey: 'aftersales', type: 'success', terminal: false },
  { key: 'completed', label: '服务完成', owner: '系统', ownerKey: null, type: 'info', terminal: true },
  { key: 'cancelled', label: '服务取消', owner: '系统', ownerKey: null, type: 'danger', terminal: true }
])

export function normalizeWorkflowNodes(value) {
  const defaultsByKey = new Map(DEFAULT_WORKFLOW_NODES.map((node) => [node.key, node]))
  const seen = new Set()
  const normalized = []

  for (const candidate of Array.isArray(value) ? value : []) {
    const defaults = defaultsByKey.get(candidate?.key)
    if (!defaults || seen.has(defaults.key)) continue
    const label = typeof candidate.label === 'string' ? candidate.label.trim() : ''
    normalized.push({ ...defaults, label: label || defaults.label })
    seen.add(defaults.key)
  }

  for (const defaults of DEFAULT_WORKFLOW_NODES) {
    if (!seen.has(defaults.key)) normalized.push({ ...defaults })
  }
  return normalized
}

export function buildWorkflowTransitions(value) {
  const activeKeys = normalizeWorkflowNodes(value)
    .filter((node) => !node.terminal)
    .map((node) => node.key)
  const next = {}
  const previous = {}
  activeKeys.forEach((key, index) => {
    const target = activeKeys[index + 1] || 'completed'
    next[key] = target
    previous[target] = key
  })
  return { next, previous }
}
