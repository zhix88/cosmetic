<template>
  <view class="login-page">
    <view class="hero"><view class="mark">美</view><text class="title">医美服务助手</text><text class="subtitle">个人待办演示版</text></view>
    <view class="panel">
      <text class="panel-title">选择演示账号</text>
      <text class="panel-desc">登录后仅可查看和处理本人负责的任务</text>
      <view v-for="employee in employees" :key="employee.id" class="employee" @tap="login(employee)">
        <view class="avatar">{{ employee.name.slice(0, 1) }}</view><view class="employee-info"><text>{{ employee.name }}</text><text>{{ employee.role }} · {{ employee.store }}</text></view><text class="arrow">›</text>
      </view>
    </view>
    <view class="privacy">演示数据，请勿录入真实顾客信息</view>
  </view>
</template>
<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { getData, getSession, setSession } from '../../services/repository'
import { ref } from 'vue'
const employees = ref([])
onLoad(() => { const active = getSession(); if (active) return openWorkbench(); employees.value = getData().employees })
function login(employee) { setSession(employee); openWorkbench() }
function openWorkbench() {
  // #ifdef H5
  // H5 的 tabBar 路由在部分 Vue 运行时中不会卸载登录页；完整导航可保证账号会话生效。
  window.location.assign(`${window.location.origin}${window.location.pathname}?demoSession=${Date.now()}#/pages/workbench/index`)
  // #endif
  // #ifndef H5
  uni.switchTab({ url: '/pages/workbench/index' })
  // #endif
}
</script>
<style scoped>
.login-page{min-height:100vh;background:linear-gradient(155deg,#143a81,#2167e8 46%,#eef4ff 46%);padding:110rpx 32rpx 52rpx;box-sizing:border-box}.hero{color:#fff;text-align:center;margin-bottom:76rpx}.mark{margin:auto auto 18rpx;width:94rpx;height:94rpx;line-height:94rpx;border-radius:28rpx;background:#fff;color:#2167e8;font-size:50rpx;font-weight:800}.title{display:block;font-size:44rpx;font-weight:700}.subtitle{display:block;margin-top:12rpx;font-size:26rpx;opacity:.78}.panel{padding:34rpx 28rpx;background:#fff;border-radius:24rpx;box-shadow:0 14rpx 42rpx rgba(11,35,81,.2)}.panel-title{display:block;font-size:34rpx;font-weight:700}.panel-desc{display:block;margin:12rpx 0 22rpx;color:#7b8494;font-size:24rpx}.employee{display:flex;align-items:center;padding:24rpx 0;border-top:1rpx solid #edf0f5}.avatar{width:72rpx;height:72rpx;line-height:72rpx;border-radius:50%;background:#e9f1ff;color:#2167e8;text-align:center;font-weight:700}.employee-info{flex:1;margin-left:18rpx}.employee-info text:first-child{display:block;font-size:29rpx;font-weight:600}.employee-info text:last-child{display:block;margin-top:7rpx;color:#7b8494;font-size:23rpx}.arrow{font-size:48rpx;color:#a8b0bd}.privacy{text-align:center;margin-top:38rpx;color:#6e7890;font-size:23rpx}
</style>
