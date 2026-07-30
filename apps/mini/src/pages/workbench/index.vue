<template>
  <view class="page">
    <view class="notice">演示数据，请勿录入真实顾客信息</view>
    <view class="header"><view><text class="hello">你好，{{ employee?.name }}</text><text class="sub">{{ employee?.role }} · {{ today }} 的个人待办</text></view><view class="todo"><text>{{ tasks.length }}</text><small>待办</small></view></view>
    <view class="filters card"><scroll-view scroll-x><view class="filter-row"><text v-for="item in filterOptions" :key="item.key" :class="['filter',{active:filter===item.key}]" @tap="filter=item.key">{{ item.label }}{{ item.key==='all'?'':` ${count(item.key)}` }}</text></view></scroll-view><input v-model="keyword" placeholder="搜索顾客、电话或项目" class="search" /></view>
    <view v-if="shownTasks.length" class="task-list"><view v-for="task in shownTasks" :key="task.id" class="task card" @tap="openTask(task)"><view class="task-head"><view><text class="name">{{ task.vip1.name }}</text><text class="phone">{{ mask(task.vip1.phone) }}</text></view><text :class="['tag',`tag-${stages[task.status].tone}`]">{{ stages[task.status].label }}</text></view><view class="task-info"><text>{{ task.businessDate }} {{ task.appointmentTime }} · {{ task.diagnosisType }}</text><text>{{ task.projects?.join('、') || task.estimatedProject || '待补充项目' }}</text><text>{{ task.store }}</text></view><view v-if="task.flags?.length" class="flag">{{ task.flags.at(-1) }}</view><button class="primary-btn action">处理{{ stages[task.status].label }}</button></view></view>
    <view v-else class="empty card"><text>暂无符合条件的个人待办</text><text>切换筛选条件或稍后再试</text></view>
  </view>
</template>
<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { currentTasks, getSession, stages } from '../../services/repository'
const employee = ref(null), tasks = ref([]), filter = ref('all'), keyword = ref(''); const today = new Date().toISOString().slice(0, 10)
const filterOptions = [{key:'all',label:'全部'},{key:'floorControl',label:'场控排诊'},{key:'arrivalConfirmation',label:'确认到店'},{key:'doctorDiagnosis',label:'医生排诊'},{key:'service',label:'服务执行'},{key:'followup',label:'顾客回访'}]
const shownTasks = computed(() => tasks.value.filter(t => (filter.value==='all'||t.status===filter.value) && [t.vip1.name,t.vip1.phone,t.estimatedProject,...(t.projects||[])].join(' ').includes(keyword.value)))
function count(status) { return tasks.value.filter(t=>t.status===status).length } function mask(v) { return v.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') } function openTask(task) { uni.navigateTo({url:`/pages/task-detail/index?id=${task.id}`}) }
onShow(() => { employee.value=getSession(); if(!employee.value) return uni.reLaunch({url:'/pages/login/index'}); tasks.value=currentTasks(employee.value) })
</script>
<style scoped>
.header{display:flex;justify-content:space-between;align-items:center;margin:16rpx 4rpx 26rpx}.hello{display:block;font-size:38rpx;font-weight:700}.sub{display:block;margin-top:10rpx;color:#7b8494;font-size:24rpx}.todo{width:96rpx;height:96rpx;border-radius:22rpx;background:#e9f1ff;text-align:center;color:#2167e8}.todo text{display:block;margin-top:13rpx;font-size:35rpx;font-weight:700}.todo small{font-size:21rpx}.filters{padding:20rpx}.filter-row{display:flex;gap:14rpx;white-space:nowrap}.filter{padding:10rpx 16rpx;border-radius:999rpx;background:#f1f3f7;color:#667085;font-size:23rpx}.filter.active{background:#2167e8;color:#fff}.search{margin-top:18rpx;padding:17rpx 18rpx;border-radius:12rpx;background:#f6f8fb;font-size:26rpx}.task-list{margin-top:18rpx}.task{margin-bottom:18rpx;padding:24rpx}.task-head{display:flex;justify-content:space-between}.name{font-size:31rpx;font-weight:700}.phone{margin-left:14rpx;color:#7b8494;font-size:23rpx}.task-info text{display:block;margin-top:13rpx;color:#586174;font-size:25rpx}.flag{margin-top:16rpx;padding:10rpx 12rpx;border-radius:9rpx;background:#fff7e6;color:#9a6700;font-size:23rpx}.action{margin-top:21rpx;height:74rpx;line-height:74rpx;font-size:26rpx}.empty{margin-top:35rpx;padding:76rpx 20rpx;text-align:center}.empty text{display:block;color:#7b8494;font-size:27rpx}.empty text+text{margin-top:12rpx;font-size:23rpx}
</style>
