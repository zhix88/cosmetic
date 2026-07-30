<script>
import { ensureDemoData } from './services/repository'

export default {
  onLaunch() { ensureDemoData() }
}
</script>

<style>
page { background: #f5f7fb; color: #182033; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
button::after { border: 0; }
.page { min-height: 100vh; box-sizing: border-box; padding: 24rpx 24rpx 44rpx; }
.notice { margin-bottom: 20rpx; padding: 16rpx 20rpx; border-radius: 12rpx; background: #fff7e6; color: #9a6700; font-size: 24rpx; }
.card { background: #fff; border-radius: 20rpx; box-shadow: 0 6rpx 24rpx rgba(26, 45, 81, .06); }
.section-title { margin: 32rpx 0 18rpx; font-size: 30rpx; font-weight: 700; }
.muted { color: #7b8494; font-size: 25rpx; }
.primary-btn { background: #2167e8; color: #fff; border-radius: 14rpx; font-size: 27rpx; }
.tag { display: inline-flex; align-items: center; padding: 5rpx 12rpx; border-radius: 999rpx; font-size: 22rpx; }
.tag-blue { background: #e9f1ff; color: #2167e8; }.tag-orange { background: #fff3e0; color: #d97706; }.tag-green { background: #e9f8ef; color: #16803d; }.tag-gray { background: #f0f2f5; color: #667085; }.tag-red { background: #ffeded; color: #c72d2d; }
</style>
