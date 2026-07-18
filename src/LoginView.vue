<template>
  <main class="login-page">
    <div class="login-page__veil"></div>
    <section class="login-intro">
      <div class="login-brand"><span>ME</span><strong>医美运营管理后台</strong></div>
      <div class="login-intro-copy"><p>MEDICAL AESTHETICS OPERATIONS</p><h1>让门店运营<br />更高效、更可控</h1><span>统一协同客户全流程，沉淀可追溯的经营数据。</span></div>
      <div class="login-intro-footer">演示环境 · 数据仅保存在当前浏览器</div>
    </section>

    <section class="login-panel-wrap">
      <el-card class="login-panel" shadow="never">
        <p class="login-panel__eyebrow">WELCOME BACK</p>
        <h2>登录管理后台</h2>
        <p class="login-panel__hint">请选择员工账号，系统将自动带入演示密码。</p>
        <el-form label-position="top" @submit.prevent="submit">
          <el-form-item label="员工账号">
            <el-select v-model="selectedCode" filterable placeholder="请选择在职员工" class="login-control">
              <el-option v-for="employee in activeEmployees" :key="employee.code" :label="`${employee.name} · ${employee.code}`" :value="employee.code">
                <div class="login-option"><strong>{{ employee.name }}</strong><span>{{ employee.roleLabel || employee.roleKey }} · {{ employee.store || '总部' }}</span></div>
              </el-option>
            </el-select>
          </el-form-item>
          <div v-if="selectedEmployee" class="login-identity">
            <span>{{ selectedEmployee.name.slice(0, 1) }}</span><div><strong>{{ selectedEmployee.name }}</strong><small>{{ selectedEmployee.roleLabel || selectedEmployee.roleKey }} · {{ selectedEmployee.store || '总部' }}</small></div>
          </div>
          <el-form-item label="演示密码">
            <el-input v-model="password" type="password" show-password class="login-control" />
          </el-form-item>
          <el-alert title="当前为体验环境，统一演示密码为 demo123" type="info" :closable="false" show-icon />
          <el-button native-type="submit" type="primary" class="login-submit" :disabled="!selectedEmployee">进入后台 <span>→</span></el-button>
        </el-form>
      </el-card>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({ employees: { type: Array, default: () => [] } })
const emit = defineEmits(['login'])
const selectedCode = ref('')
const password = ref('demo123')
const activeEmployees = computed(() => props.employees.filter((item) => item.status === 'active' && item.code && item.roleKey))
const selectedEmployee = computed(() => activeEmployees.value.find((item) => item.code === selectedCode.value))
watch(selectedCode, () => { password.value = 'demo123' })
function submit() {
  if (!selectedEmployee.value) return ElMessage.warning('请选择员工账号')
  if (password.value !== 'demo123') return ElMessage.error('演示密码错误，请使用 demo123')
  emit('login', selectedEmployee.value)
}
</script>
