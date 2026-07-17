<template>
  <main class="product-portal">
    <header class="portal-nav">
      <a class="portal-brand" href="#top" aria-label="医美管理后台产品门户"><span>ME</span><strong>医美运营管理平台</strong></a>
      <nav aria-label="产品导航"><a href="#capabilities">核心能力</a><a href="#workflow">服务闭环</a><a href="#roles">角色协同</a></nav>
      <button class="portal-text-button" @click="enter('workbench')">进入演示 <span>→</span></button>
    </header>

    <section id="top" class="portal-hero">
      <div class="portal-hero-copy">
        <p class="portal-eyebrow">MEDICAL AESTHETICS OPERATIONS</p>
        <h1>让每一次到店服务<br><em>可协同、可追溯、可经营</em></h1>
        <p class="portal-lead">覆盖邀约、接待、分诊、服务、回访与经营分析，帮助门店将顾客全流程运营沉淀为可执行的日常工作。</p>
        <div class="portal-actions"><button class="portal-primary-button" @click="enter('workbench')">开始产品演示 <span>→</span></button><a class="portal-secondary-button" href="#capabilities">了解核心能力</a></div>
        <div class="portal-trust"><span>纯前端演示</span><i></i><span>数据仅保存在本机浏览器</span><i></i><span>无需真实账号</span></div>
      </div>
      <div class="portal-hero-visual" aria-label="产品能力概览">
        <div class="portal-orbit orbit-one"></div><div class="portal-orbit orbit-two"></div>
        <div class="portal-dashboard-card"><div class="portal-card-top"><span>今日运营概览</span><b>实时演示</b></div><div class="portal-kpis"><div><small>待办任务</small><strong>24</strong><em>+ 6</em></div><div><small>今日到店</small><strong>18</strong><em>82%</em></div></div><div class="portal-chart"><span style="height:38%"></span><span style="height:62%"></span><span style="height:48%"></span><span style="height:78%"></span><span style="height:91%"></span><span style="height:67%"></span><span style="height:84%"></span></div><div class="portal-flow-mini"><span>邀约</span><i></i><span>到店</span><i></i><span>服务</span><i></i><span>回访</span></div></div>
        <div class="portal-float-card portal-float-top"><small>顾客档案</small><strong>1,286</strong><span>全生命周期沉淀</span></div><div class="portal-float-card portal-float-bottom"><b>✓</b><div><small>流程节点</small><strong>服务已完成</strong></div></div>
      </div>
    </section>

    <section id="capabilities" class="portal-section portal-capabilities">
      <p class="portal-eyebrow">ONE PLATFORM, FULL JOURNEY</p><div class="portal-section-heading"><h2>一套平台，覆盖门店运营全场景</h2><p>以顾客业务为主线，连接一线人员、管理者与经营决策。</p></div>
      <div class="portal-module-grid"><button v-for="module in modules" :key="module.page" class="portal-module-card" @click="enter(module.page)"><span class="portal-module-icon">{{ module.icon }}</span><strong>{{ module.title }}</strong><p>{{ module.description }}</p><em>查看演示 →</em></button></div>
    </section>

    <section id="workflow" class="portal-section portal-workflow"><div><p class="portal-eyebrow">STANDARDIZED SERVICE LOOP</p><h2>服务流程在线协同<br>每一步都有据可查</h2><p class="portal-section-copy">从市场邀约到售后回访，系统按角色分派待办、记录关键操作并聚合经营数据，让门店协作从经验驱动转向流程驱动。</p><button class="portal-link-button" @click="enter('workbench')">体验流程工作台 →</button></div><ol class="portal-flow-list"><li v-for="(step, index) in workflow" :key="step.title"><span>0{{ index + 1 }}</span><div><strong>{{ step.title }}</strong><p>{{ step.description }}</p></div></li></ol></section>

    <section id="roles" class="portal-section portal-roles"><p class="portal-eyebrow">ROLE-BASED COLLABORATION</p><div class="portal-section-heading"><h2>按角色分工，按权限协同</h2><p>不同岗位进入同一业务链路，看到各自需要处理的任务与数据。</p></div><div class="portal-role-grid"><article v-for="role in roles" :key="role.title"><span>{{ role.index }}</span><strong>{{ role.title }}</strong><p>{{ role.description }}</p></article></div></section>
    <section class="portal-cta"><p>立即体验门店全流程运营协同</p><h2>从一个可操作的产品演示开始</h2><button class="portal-primary-button" @click="enter('workbench')">进入产品演示 <span>→</span></button></section>
    <footer class="portal-footer"><span>医美运营管理平台 · 静态演示版</span><span>所有演示数据仅存储于当前浏览器</span></footer>
  </main>
</template>

<script setup>
const emit = defineEmits(['enter-demo'])
const modules = [
  { icon: '01', title: '业务工作台', description: '按节点汇聚待办、异常与顾客进度，支持流程推进。', page: 'workbench' }, { icon: '02', title: '顾客资产沉淀', description: '集中管理档案、偏好、服务历史与项目资产。', page: 'customers' },
  { icon: '03', title: '预约与到店管理', description: '通过日历统一安排预约、改期、取消与到店接待。', page: 'appointments' }, { icon: '04', title: '经营数据分析', description: '从过程、转化到成交，多维呈现门店经营表现。', page: 'dashboard' },
  { icon: '05', title: '日报与成交报表', description: '自动汇总每日经营数据，支持核对与本地导出。', page: 'dailyReports' }, { icon: '06', title: '组织与运营配置', description: '维护人员、项目、库存、权限及门店业务规则。', page: 'settings' }
]
const workflow = [{ title: '市场邀约', description: '沉淀邀约结果和预估到店信息' }, { title: '到店接待', description: '登记顾客到店与服务需求' }, { title: '分诊排诊', description: '匹配项目、科室与服务人员' }, { title: '服务回访', description: '记录消费、服务结果与后续跟进' }]
const roles = [{ index: 'M', title: '市场 / 客服', description: '邀约确认、到店接待与回访跟进' }, { index: 'B', title: '管家 / 总监', description: '顾客分诊、排诊服务与成交推进' }, { index: 'S', title: '店长', description: '门店运营统筹、日报核对与经营分析' }, { index: 'A', title: '平台管理员', description: '跨店数据查看与组织规则维护' }]
function enter(page) { emit('enter-demo', page) }
</script>
