<template>
  <div class="permission-tree">
    <div class="permission-tree-head"><span>栏目 / 模块</span><span>功能点</span></div>
    <PermissionTreeNode
      v-for="node in catalog"
      :key="node.key"
      :node="node"
      :path="node.key"
      :level="0"
      :model-value="modelValue"
      :capabilities="capabilities"
      @update:model-value="update"
    />
  </div>
</template>

<script setup>
import { defineComponent, h, resolveComponent } from 'vue'

const props = defineProps({
  catalog: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  actions: { type: Array, default: () => [] },
  capabilities: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])
const update = (value) => emit('update:modelValue', value)

const PermissionTreeNode = defineComponent({
  name: 'PermissionTreeNode',
  props: { node: Object, path: String, level: Number, modelValue: Object, capabilities: Object },
  emits: ['update:model-value'],
  setup(nodeProps, { emit }) {
    const checkbox = resolveComponent('el-checkbox')
    const hasChildren = () => Boolean(nodeProps.node.children?.length)
    const childPath = (child) => `${nodeProps.path}.${child.key}`
    const descendants = (node = nodeProps.node, path = nodeProps.path) => [path, ...(node.children || []).flatMap((child) => descendants(child, `${path}.${child.key}`))]
    const pointChildren = () => (nodeProps.node.children || []).filter((child) => child.type === 'point' || !child.children?.length)
    const actionsFor = (path) => nodeProps.modelValue?.[path] || []
    const canView = (node) => (node.actions || nodeProps.capabilities[node.key] || ['view']).includes('view')
    const isChecked = (path) => actionsFor(path).includes('view')
    const state = (paths) => {
      const eligible = paths.filter((path) => path === nodeProps.path ? canView(nodeProps.node) : true)
      const count = eligible.filter(isChecked).length
      return { checked: eligible.length > 0 && count === eligible.length, indeterminate: count > 0 && count < eligible.length }
    }
    const setPaths = (paths, value) => {
      const next = JSON.parse(JSON.stringify(nodeProps.modelValue || {}))
      paths.forEach((path) => {
        const list = next[path] || []
        if (value && !list.includes('view')) list.push('view')
        if (!value && list.includes('view')) list.splice(list.indexOf('view'), 1)
        next[path] = list
      })
      emit('update:model-value', next)
    }
    const toggleNode = (value) => setPaths(descendants(), value)
    const togglePoint = (point, value) => setPaths([childPath(point), ...descendants(point, childPath(point)).slice(1)], value)
    const toggleExpand = (event) => { event.currentTarget.closest('.permission-tree-node')?.classList.toggle('is-collapsed') }
    return () => {
      const points = pointChildren()
      const nodeState = state(descendants())
      const pointState = state(points.map((point) => childPath(point)))
      const label = h('div', { class: 'permission-tree-label', style: { paddingLeft: `${nodeProps.level * 22 + 10}px` } }, [
        hasChildren() ? h('button', { type: 'button', class: 'permission-tree-toggle', onClick: toggleExpand }, '−') : h('span', { class: 'permission-tree-spacer' }),
        h(checkbox, { modelValue: nodeState.checked, indeterminate: nodeState.indeterminate, disabled: !canView(nodeProps.node), 'onUpdate:modelValue': toggleNode }),
        h('span', { class: `permission-tree-kind permission-tree-kind-${nodeProps.node.type || (nodeProps.level === 0 ? 'column' : 'module')}` }, nodeProps.level === 0 ? '栏目' : '模块'),
        h('span', nodeProps.node.label)
      ])
      const features = points.length ? h('div', { class: 'permission-feature-list' }, [
        h(checkbox, { modelValue: pointState.checked, indeterminate: pointState.indeterminate, class: 'permission-feature-select-all', 'onUpdate:modelValue': (value) => setPaths(points.flatMap((point) => descendants(point, childPath(point))), value) }, () => '全选'),
        ...points.map((point) => h(checkbox, { key: point.key, modelValue: isChecked(childPath(point)), disabled: !canView(point), 'onUpdate:modelValue': (value) => togglePoint(point, value) }, () => point.label))
      ]) : null
      const children = points.length ? null : (nodeProps.node.children || []).map((child) => h(PermissionTreeNode, { key: childPath(child), node: child, path: childPath(child), level: nodeProps.level + 1, modelValue: nodeProps.modelValue, capabilities: nodeProps.capabilities, 'onUpdate:model-value': (value) => emit('update:model-value', value) }))
      return h('div', { class: 'permission-tree-node' }, [h('div', { class: 'permission-tree-row' }, [label, features || h('span')]), children])
    }
  }
})
</script>
