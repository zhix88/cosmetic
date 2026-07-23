<template>
  <LoginView v-if="!isAuthenticated" :employees="employees" @login="handleLogin" />
  <template v-else>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">澜</span>
        <div>
          <strong>医美管理后台</strong>
          <small>顾客全流程协作</small>
        </div>
      </div>

      <nav class="nav-list">
        <button class="nav-item" :class="{ active: activePage === 'workbench' }" @click="activePage = 'workbench'"><el-icon><Monitor /></el-icon>工作台</button>
        <button class="nav-item" :class="{ active: activePage === 'customers' }" @click="activePage = 'customers'"><el-icon><User /></el-icon>顾客档案</button>
        <button class="nav-item" :class="{ active: activePage === 'appointments' }" @click="activePage = 'appointments'"><el-icon><Calendar /></el-icon>预约记录</button>
        <button
          v-if="canViewDashboard"
          class="nav-item"
          :class="{ active: activePage === 'dashboard' }"
          @click="activePage = 'dashboard'"
        >
          <el-icon><DataAnalysis /></el-icon>经营看板
        </button>
        <button
          v-if="canViewDailyReports"
          class="nav-item"
          :class="{ active: activePage === 'dailyReports' }"
          @click="activePage = 'dailyReports'"
        >
          <el-icon><Document /></el-icon>每日报表
        </button>
        <button
          v-if="canViewDealReports"
          class="nav-item"
          :class="{ active: activePage === 'dealReports' }"
          @click="activePage = 'dealReports'"
        >
          <el-icon><TrendCharts /></el-icon>成交报表
        </button>
        <button
          v-if="canViewSettings"
          class="nav-item"
          :class="{ active: activePage === 'settings' }"
          @click="activePage = 'settings'"
        >
          <el-icon><Setting /></el-icon>系统设置
        </button>
      </nav>

      <div class="flow-legend">
        <p>标准服务流程</p>
        <ol>
          <li v-for="(item, index) in workflowLegend" :key="item">
            <span>{{ index + 1 }}</span>{{ item }}
          </li>
        </ol>
      </div>
    </aside>

    <main class="main-shell">
      <header class="topbar">
        <div>
          <h1>{{ pageHeader.title }}</h1>
          <p>{{ pageHeader.subtitle }}</p>
        </div>
        <div class="top-actions">
          <div class="current-user">
            <span>{{ currentRoleMeta.name.slice(0, 1) }}</span>
            <div><strong>{{ currentRoleMeta.name }}</strong><small>{{ currentRoleMeta.label }}</small></div>
          </div>
          <el-button :icon="QuestionFilled" plain @click="openGuide">操作指引</el-button>
          <el-button plain @click="resetData">重置演示数据</el-button>
          <el-button plain @click="logout">退出登录</el-button>
        </div>
      </header>

      <section v-if="activePage === 'workbench'" class="page-content">
        <div class="toolbar">
          <div class="date-nav">
            <el-button :icon="ArrowLeft" @click="shiftDate(-1)" />
            <el-date-picker
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY年MM月DD日"
              :clearable="false"
            />
            <el-button :icon="ArrowRight" @click="shiftDate(1)" />
            <el-button text type="primary" @click="selectedDate = today">回到今天</el-button>
          </div>
          <div class="filters">
            <el-select v-model="selectedStore" placeholder="全部门店" :disabled="!hasAllStores">
              <el-option v-if="hasAllStores" label="全部门店" value="all" />
              <el-option v-for="store in stores" :key="store" :label="store" :value="store" />
            </el-select>
            <el-select v-model="diagnosisFilter" placeholder="诊疗类型">
              <el-option label="全部类型" value="all" />
              <el-option label="新诊" value="新诊" />
              <el-option label="复诊" value="复诊" />
            </el-select>
            <el-input v-model="keyword" clearable placeholder="搜索顾客、电话、项目">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button v-if="canBatchImport" class="workbench-import-button" type="primary" :icon="Upload" @click="batchImportVisible=true">批量导入邀约</el-button>
          </div>
        </div>

        <section class="metric-grid">
          <article class="metric-card primary">
            <span class="metric-icon"><el-icon><Bell /></el-icon></span>
            <div><p>我的待办</p><strong>{{ myTodoCount }}</strong><small>{{ currentRoleMeta.label }}负责节点</small></div>
          </article>
          <article class="metric-card">
            <span class="metric-icon purple"><el-icon><List /></el-icon></span>
            <div><p>今日到店</p><strong>{{ arrivalRecords.length }}</strong><small>含新诊 {{ newDiagnosisCount }} 人</small></div>
          </article>
          <article class="metric-card">
            <span class="metric-icon orange"><el-icon><Warning /></el-icon></span>
            <div><p>异常提醒</p><strong>{{ exceptionCount }}</strong><small>取消、改期或超时</small></div>
          </article>
          <article class="metric-card">
            <span class="metric-icon green"><el-icon><Money /></el-icon></span>
            <div><p>今日现金业绩</p><strong>¥{{ formatMoney(todayRevenue) }}</strong><small>耗卡 {{ consumeCardCount }} 单</small></div>
          </article>
        </section>

        <section class="workspace-grid">
          <article class="panel board-panel">
            <div class="panel-title">
              <div>
                <h2>业务进度看板</h2>
                <p>点击顾客卡片查看完整档案和处理记录</p>
              </div>
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button value="all">全店流程</el-radio-button>
                <el-radio-button value="mine">只看我的待办</el-radio-button>
              </el-radio-group>
            </div>

            <div class="status-tabs">
              <button
                v-for="tab in statusTabs"
                :key="tab.value"
                :class="{ active: activeStatus === tab.value }"
                @click="activeStatus = tab.value"
              >
                {{ tab.label }} <span>{{ countByStatus(tab.value) }}</span>
              </button>
            </div>

            <div v-if="filteredRecords.length" class="record-grid">
              <article
                v-for="record in pagedRecords"
                :key="record.id"
                class="record-card"
                :class="{ cancelled: record.status === 'cancelled' }"
                @click="openDetail(record)"
              >
                <div class="card-head">
                  <div class="customer-avatar">{{ record.vip1.name.slice(0, 1) }}</div>
                  <div class="customer-name">
                    <strong>{{ record.vip1.name }}</strong>
                    <p>{{ record.diagnosisType }} · {{ record.appointmentTime }}</p>
                  </div>
                  <el-tag :type="statusMeta[record.status].type" effect="light" round>
                    {{ statusMeta[record.status].label }}
                  </el-tag>
                </div>
                <div class="card-body">
                  <p><span>同行顾客</span>{{ record.vip2?.name || '—' }}</p>
                  <p><span>预约项目</span>{{ record.estimatedProject || '待补充' }}</p>
                  <p><span>所属门店</span>{{ record.store }}</p>
                  <p><span>当前负责人</span>{{ currentOwner(record) }}</p>
                </div>
                <div v-if="record.flags.length" class="flag-row">
                  <span v-for="flag in record.flags.slice(-2)" :key="flag">{{ flag }}</span>
                </div>
                <div class="card-actions" @click.stop>
                  <div class="card-action-cell">
                    <el-button text @click="openDetail(record)">详情</el-button>
                  </div>
                  <div class="card-action-cell">
                    <el-button
                      v-if="canOperate(record)"
                      type="primary"
                      link
                      @click="openNodeDialog(record)"
                    >
                      {{ actionLabel(record.status) }}
                    </el-button>
                    <span v-else class="action-placeholder">—</span>
                  </div>
                  <div class="card-action-cell">
                    <el-dropdown v-if="canManage(record)" trigger="click" @command="handleCommand($event, record)">
                      <el-button text>更多<el-icon><ArrowDown /></el-icon></el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="revenue">编辑业绩</el-dropdown-item>
                          <el-dropdown-item command="reschedule">改期</el-dropdown-item>
                          <el-dropdown-item command="rollback" :disabled="!canRollback(record)">退回节点</el-dropdown-item>
                          <el-dropdown-item command="cancel" divided :disabled="record.status === 'cancelled'">取消业务</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <span v-else class="action-placeholder">—</span>
                  </div>
                </div>
              </article>
            </div>
            <el-empty v-else description="当前筛选条件下暂无业务记录" />
            <div v-if="filteredRecords.length > pageSize" class="pagination">
              <el-pagination
                v-model:current-page="currentPage"
                background
                layout="prev, pager, next"
                :page-size="pageSize"
                :total="filteredRecords.length"
              />
            </div>
          </article>

          <aside class="right-rail">
            <article class="panel node-panel">
              <div class="panel-title compact">
                <div><h2>节点完成情况</h2><p>{{ selectedDate }}</p></div>
              </div>
              <div class="node-list">
                <div v-for="node in nodeSummary" :key="node.status">
                  <div class="node-label">
                    <span><i :style="{ background: node.color }"></i>{{ node.label }}</span>
                    <strong>{{ node.count }}</strong>
                  </div>
                  <el-progress :percentage="node.percentage" :show-text="false" :color="node.color" />
                </div>
              </div>
            </article>

            <article class="panel alert-panel">
              <div class="panel-title compact">
                <div><h2>需要关注</h2><p>异常与即将超时任务</p></div>
              </div>
              <div v-if="attentionRecords.length" class="attention-list">
                <button v-for="record in attentionRecords" :key="record.id" @click="openDetail(record)">
                  <span :class="attentionTone(record)">{{ attentionIcon(record) }}</span>
                  <div>
                    <strong>{{ record.vip1.name }} · {{ statusMeta[record.status].label }}</strong>
                    <p>{{ record.flags.at(-1) || '预约时间临近，请及时处理' }}</p>
                  </div>
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
              <el-empty v-else :image-size="70" description="暂无异常任务" />
            </article>
          </aside>
        </section>
      </section>
      <BusinessDashboard
        v-else-if="activePage === 'dashboard'"
        :records="dashboardRecords"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        @open-record="openDetail"
      />
      <DailyReport
        v-else-if="activePage === 'dailyReports'"
        :records="scopedRecords"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        :reset-token="dataResetToken"
        @open-record="openDetail"
      />
      <DealReport
        v-else-if="activePage === 'dealReports'"
        :records="scopedRecords"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        @open-record="openDetail"
      />
      <CustomerArchive
        v-else-if="activePage === 'customers'"
        :records="scopedRecords"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        :staff-options="employees"
        :project-catalog="projectCatalog"
        :focus-phone="customerFocus.phone"
        :focus-request="customerFocus.request"
        @open-record="openDetail"
      />
      <AppointmentCalendar
        v-else-if="activePage === 'appointments'"
        v-model:records="scopedRecords"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        :staff-options="employees"
        :project-catalog="projectCatalog"
        @open-record="openDetail"
        @open-import="batchImportVisible=true"
      />
      <SystemSettings
        v-else-if="activePage === 'settings'"
        :role="currentRole"
        :role-meta="currentRoleMeta"
        :stores="stores"
        :departments="departments"
        :project-catalog="projectCatalog"
        @config-change="handleConfigChange"
      />
    </main>

    <el-drawer v-model="detailVisible" size="520px" :with-header="false">
      <template v-if="activeRecord">
        <div class="drawer-header">
          <div>
            <p>业务单 {{ activeRecord.id }}</p>
            <h2>{{ activeRecord.vip1.name }}的到店服务</h2>
          </div>
          <el-tag :type="statusMeta[activeRecord.status].type" round>{{ statusMeta[activeRecord.status].label }}</el-tag>
        </div>

        <div class="drawer-section">
          <h3>顾客信息</h3>
          <div class="customer-pair">
            <div>
              <span>VIP1 · 主顾客</span>
              <strong>{{ activeRecord.vip1.name }}</strong>
              <p>{{ maskPhone(activeRecord.vip1.phone) }}</p>
            </div>
            <div>
              <span>VIP2 · 同行顾客</span>
              <strong>{{ activeRecord.vip2?.name || '无同行顾客' }}</strong>
              <p>{{ activeRecord.vip2 ? maskPhone(activeRecord.vip2.phone) : '—' }}</p>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <h3>业务信息</h3>
          <dl class="detail-list">
            <div><dt>预约时间</dt><dd>{{ activeRecord.businessDate }} {{ activeRecord.appointmentTime }}</dd></div>
            <div><dt>诊疗类型</dt><dd>{{ activeRecord.diagnosisType }}</dd></div>
            <div><dt>门店</dt><dd>{{ activeRecord.store }}</dd></div>
            <div><dt>预估项目</dt><dd>{{ activeRecord.estimatedProject || '—' }}</dd></div>
            <div><dt>消费方式</dt><dd>{{ paymentLabel(activeRecord) }}</dd></div>
            <div><dt>备注</dt><dd>{{ activeRecord.note || '—' }}</dd></div>
          </dl>
        </div>

        <div class="drawer-section">
          <h3>人员归属</h3>
          <div class="staff-tags">
            <span v-for="item in staffDisplay(activeRecord)" :key="item.label">
              {{ item.label }}：<strong>{{ item.name || '未分配' }}</strong>
            </span>
          </div>
        </div>

        <div class="drawer-section">
          <h3>操作时间轴</h3>
          <el-timeline>
            <el-timeline-item
              v-for="log in [...activeRecord.logs].reverse()"
              :key="log.id"
              :timestamp="log.time"
              :type="log.type || 'primary'"
              placement="top"
            >
              <strong>{{ log.action }}</strong>
              <p>{{ log.operator }} · {{ log.detail }}</p>
              <small v-if="log.fromStatus !== log.toStatus">
                {{ statusName(log.fromStatus) }} → {{ statusName(log.toStatus) }}
              </small>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="drawer-footer">
          <el-button v-if="canManage(activeRecord)" @click="openCommonDialog('staff', activeRecord)">设置人员归属</el-button>
          <el-button v-if="canManage(activeRecord)" @click="openCommonDialog('revenue', activeRecord)">编辑业绩</el-button>
          <el-button v-if="canOperate(activeRecord)" type="primary" @click="openNodeDialog(activeRecord)">
            {{ actionLabel(activeRecord.status) }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="nodeDialogVisible" :title="nodeDialogTitle" width="680px" destroy-on-close>
      <el-form ref="nodeFormRef" :model="nodeForm" :rules="nodeRules" label-position="top">
        <template v-if="dialogStatus === 'floorControl'">
          <div class="form-grid">
            <el-form-item label="到店结果" prop="result"><el-select v-model="nodeForm.result"><el-option label="已到店" value="已到店" /><el-option label="未到店" value="未到店" /></el-select></el-form-item>
            <el-form-item label="实际到店时间" prop="time"><el-time-select v-model="nodeForm.time" start="08:00" step="00:15" end="21:00" /></el-form-item>
            <el-form-item label="管家"><el-select v-model="nodeForm.butler"><el-option v-for="x in staffOptions('butler')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="咨询"><el-select v-model="nodeForm.consultant"><el-option v-for="x in staffOptions('consultant')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="总监"><el-select v-model="nodeForm.director"><el-option v-for="x in staffOptions('director')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="经理" prop="manager"><el-select v-model="nodeForm.manager"><el-option v-for="x in staffOptions('manager')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="经理建议项目" prop="project"><el-input v-model="nodeForm.project" /></el-form-item>
          </div>
          <el-form-item label="场控排诊备注" prop="note"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'doctorDiagnosis'">
          <div class="form-grid">
            <el-form-item label="医生" prop="doctor"><el-select v-model="nodeForm.doctor"><el-option v-for="x in staffOptions('doctor')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="配台护士" prop="nurse"><el-select v-model="nodeForm.nurse"><el-option v-for="x in staffOptions('nurse')" :key="x.code" :label="x.name" :value="x.name" /></el-select></el-form-item>
            <el-form-item label="敷麻时间" prop="numbingTime"><el-time-select v-model="nodeForm.numbingTime" start="08:00" step="00:15" end="21:00" /></el-form-item>
            <el-form-item label="项目科室" prop="department"><el-select v-model="nodeForm.department"><el-option v-for="x in departments" :key="x" :label="x" :value="x" /></el-select></el-form-item>
          </div>
          <el-form-item label="服务项目" prop="projects"><el-select v-model="nodeForm.projects" multiple filterable><el-option v-for="project in allProjects" :key="project" :label="project" :value="project" /></el-select></el-form-item>
          <el-form-item label="药物/服务信息"><el-input v-model="nodeForm.medication" /></el-form-item>
          <el-form-item label="医生排诊备注" prop="note"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'invited'">
          <div class="form-grid">
            <el-form-item label="邀约结果" prop="result"><el-select v-model="nodeForm.result"><el-option v-for="x in ['已确认到店','待确认','拒绝到店']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="预计到店日期" prop="date"><el-date-picker v-model="nodeForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
            <el-form-item label="预计到店时间" prop="time"><el-time-select v-model="nodeForm.time" start="08:00" step="00:30" end="20:00" /></el-form-item>
            <el-form-item label="预计项目" prop="project"><el-input v-model="nodeForm.project" placeholder="如：面部抗衰升级" /></el-form-item>
          </div>
          <el-form-item label="沟通备注"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'reception'">
          <div class="form-grid">
            <el-form-item label="接待结果" prop="result"><el-select v-model="nodeForm.result"><el-option v-for="x in ['已到店','未到店','申请改期']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="实际到店时间" prop="time"><el-time-select v-model="nodeForm.time" start="08:00" step="00:15" end="21:00" /></el-form-item>
            <el-form-item label="诊疗类型" prop="diagnosisType"><el-radio-group v-model="nodeForm.diagnosisType"><el-radio value="新诊">新诊</el-radio><el-radio value="复诊">复诊</el-radio></el-radio-group></el-form-item>
            <el-form-item label="接待客服"><el-input :model-value="currentRoleMeta.name" disabled /></el-form-item>
          </div>
          <el-form-item label="顾客诉求" prop="note"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'triage'">
          <div class="form-grid">
            <el-form-item label="项目科室" prop="department"><el-select v-model="nodeForm.department"><el-option v-for="x in departments" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="负责管家"><el-input :model-value="currentRoleMeta.name" disabled /></el-form-item>
            <el-form-item label="顾客需求等级" prop="level"><el-select v-model="nodeForm.level"><el-option v-for="x in ['高意向','一般意向','体验了解']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="建议项目" prop="project"><el-input v-model="nodeForm.project" /></el-form-item>
          </div>
          <el-form-item label="分诊备注" prop="note"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'scheduling'">
          <div class="form-grid">
            <el-form-item label="排诊进度" prop="result"><el-select v-model="nodeForm.result"><el-option v-for="x in ['已排诊','等待医生','服务开始']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="项目科室" prop="department"><el-select v-model="nodeForm.department"><el-option v-for="x in departments" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="负责经理" prop="manager"><el-select v-model="nodeForm.manager"><el-option v-for="x in ['周店长','林经理','许经理']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="预计消费（元）" prop="estimatedAmount"><el-input-number v-model="nodeForm.estimatedAmount" :min="0" :step="1000" /></el-form-item>
          </div>
          <el-form-item label="排诊说明"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'service'">
          <div class="form-grid">
            <el-form-item label="服务结果" prop="result"><el-select v-model="nodeForm.result"><el-option label="服务已结束" value="服务已结束" /><el-option label="服务中止" value="服务中止" /></el-select></el-form-item>
            <el-form-item label="消费方式" prop="paymentType"><el-select v-model="nodeForm.paymentType"><el-option label="现金/支付" value="cash" /><el-option label="单项目/套餐次数" value="card" /><el-option label="会员充值余额" value="member" /><el-option label="未消费" value="none" /></el-select></el-form-item>
            <el-form-item v-if="nodeForm.paymentType === 'cash'" label="实收业绩（元）" prop="revenue"><el-input-number v-model="nodeForm.revenue" :min="0" :step="1000" /></el-form-item>
            <el-form-item v-if="nodeForm.paymentType === 'card'" label="耗卡金额（元）" prop="cardAmount"><el-input-number v-model="nodeForm.cardAmount" :min="0" :step="1000" /></el-form-item>
            <el-form-item v-if="nodeForm.paymentType === 'member'" label="余额扣减金额（元）" prop="cardAmount"><el-input-number v-model="nodeForm.cardAmount" :min="0" :step="1000" /></el-form-item>
            <el-form-item label="回访日期"><el-date-picker v-model="nodeForm.followupDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          </div>
          <el-form-item label="服务小结"><el-input v-model="nodeForm.note" type="textarea" :rows="3" /></el-form-item>
        </template>

        <template v-else-if="dialogStatus === 'followup'">
          <div class="form-grid">
            <el-form-item label="回访方式" prop="method"><el-select v-model="nodeForm.method"><el-option v-for="x in ['电话','微信','短信']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="回访结果" prop="result"><el-select v-model="nodeForm.result"><el-option v-for="x in ['满意','基本满意','需再次跟进','投诉待处理']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
            <el-form-item label="满意度" prop="satisfaction"><el-rate v-model="nodeForm.satisfaction" /></el-form-item>
            <el-form-item label="再次跟进日期"><el-date-picker v-model="nodeForm.nextDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          </div>
          <el-form-item label="回访记录" prop="note"><el-input v-model="nodeForm.note" type="textarea" :rows="4" /></el-form-item>
        </template>

        <el-form-item label="顾客涉及项目" prop="projects">
          <el-select
            v-model="nodeForm.projects"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入顾客咨询、预估或消费项目"
          >
            <el-option-group v-for="group in projectCatalog" :key="group.label" :label="group.label">
              <el-option v-for="project in group.options" :key="project" :label="project" :value="project" />
            </el-option-group>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNode">确认并推进流程</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="commonDialogVisible" :title="commonDialogTitle" width="520px">
      <el-form ref="commonFormRef" :model="commonForm" :rules="commonRules" label-position="top">
        <template v-if="commonAction === 'revenue'">
          <el-form-item label="消费方式" prop="paymentType">
            <el-radio-group v-model="commonForm.paymentType">
              <el-radio-button value="cash">现金/支付</el-radio-button>
              <el-radio-button value="card">耗卡</el-radio-button>
              <el-radio-button value="none">未消费</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="commonForm.paymentType === 'cash'" label="现金业绩（元）" prop="revenue">
            <el-input-number v-model="commonForm.revenue" :min="0" :step="1000" />
          </el-form-item>
          <el-form-item v-if="commonForm.paymentType === 'card'" label="耗卡金额（元）" prop="cardAmount">
            <el-input-number v-model="commonForm.cardAmount" :min="0" :step="1000" />
          </el-form-item>
          <el-form-item label="本次消费项目" prop="projects">
            <el-select v-model="commonForm.projects" multiple filterable allow-create default-first-option>
              <el-option-group v-for="group in projectCatalog" :key="group.label" :label="group.label">
                <el-option v-for="project in group.options" :key="project" :label="project" :value="project" />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item label="备注"><el-input v-model="commonForm.reason" type="textarea" /></el-form-item>
        </template>
        <template v-else-if="commonAction === 'reschedule'">
          <el-form-item label="新的到店日期" prop="date"><el-date-picker v-model="commonForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="新的到店时间" prop="time"><el-time-select v-model="commonForm.time" start="08:00" step="00:30" end="20:00" /></el-form-item>
          <el-form-item label="改期原因" prop="reason"><el-input v-model="commonForm.reason" type="textarea" /></el-form-item>
        </template>
        <template v-else-if="commonAction === 'staff'">
          <div class="form-grid">
            <el-form-item label="卡姐"><el-select v-model="commonForm.cardConsultant" clearable><el-option v-for="employee in staffOptions('cardConsultant')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="美导"><el-select v-model="commonForm.beautyConsultant" clearable><el-option v-for="employee in staffOptions('beautyConsultant')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="市场"><el-select v-model="commonForm.market" clearable><el-option v-for="employee in staffOptions('market')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="客服"><el-select v-model="commonForm.service" clearable><el-option v-for="employee in staffOptions('service')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="管家"><el-select v-model="commonForm.butler" clearable><el-option v-for="employee in staffOptions('butler')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="经理"><el-select v-model="commonForm.manager" clearable><el-option v-for="employee in staffOptions('manager')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
            <el-form-item label="总监"><el-select v-model="commonForm.director" clearable><el-option v-for="employee in staffOptions('director')" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
          </div>
        </template>
        <template v-else>
          <el-alert v-if="commonAction === 'rollback'" title="业务将退回上一节点，原操作记录会保留。" type="warning" :closable="false" show-icon />
          <el-alert v-else title="取消后该业务将停止流转，可在全店流程中继续查看。" type="error" :closable="false" show-icon />
          <el-form-item class="reason-field" :label="commonAction === 'rollback' ? '退回原因' : '取消原因'" prop="reason">
            <el-input v-model="commonForm.reason" type="textarea" :rows="4" placeholder="请填写原因，便于团队追溯" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="commonDialogVisible = false">取消</el-button>
        <el-button :type="commonAction === 'cancel' ? 'danger' : 'primary'" @click="submitCommon">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="guideVisible" width="900px" class="guide-dialog" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false" align-center>
      <template #header>
        <div class="guide-header">
          <span class="guide-logo">医</span>
          <div><h2>欢迎使用医美管理后台</h2><p>用几分钟了解角色切换、业务流程和主要功能</p></div>
          <el-tag round>{{ currentRoleMeta.label }}</el-tag>
        </div>
      </template>

      <el-steps :active="guideStep" align-center finish-status="success" class="guide-steps">
        <el-step title="认识系统" /><el-step title="切换角色" /><el-step title="功能模块" /><el-step title="开始使用" />
      </el-steps>

      <div v-if="guideStep === 0" class="guide-page">
        <div class="guide-welcome">
          <section><span>1</span><div><h3>选择自己的角色</h3><p>顶部角色选择框决定可查看的数据范围和可操作的流程节点。</p></div></section>
          <section><span>2</span><div><h3>处理本人待办</h3><p>进入工作台，按邀约、接待、分诊、排诊、服务和回访推进顾客业务。</p></div></section>
          <section><span>3</span><div><h3>查看经营结果</h3><p>店长和管理员可通过经营看板、每日报表与成交报表掌握门店情况。</p></div></section>
        </div>
        <el-alert title="当前是本地演示原型，数据仅保存在本机浏览器中。" type="info" :closable="false" show-icon />
      </div>

      <div v-else-if="guideStep === 1" class="guide-page">
        <div class="guide-role-pointer" :style="guidePointerStyle">
          <span>角色切换入口</span>
          <i></i>
          <strong>点击顶栏右侧的角色选择框</strong>
        </div>
        <div class="guide-role-tip"><el-icon><Switch /></el-icon><div><h3>在页面右上角切换角色</h3><p>选择角色后，侧栏模块、待办数量、门店范围和操作按钮会自动变化。</p></div></div>
        <div class="guide-role-grid">
          <article v-for="item in guideRoles" :key="item.value" :class="{ active: item.value === currentRole }" @click="currentRole = item.value">
            <span>{{ item.name.slice(0, 1) }}</span><div><strong>{{ item.label }}</strong><p>{{ item.guide }}</p></div><el-tag v-if="item.value === currentRole" size="small">当前</el-tag>
          </article>
        </div>
      </div>

      <div v-else-if="guideStep === 2" class="guide-page">
        <div class="guide-module-grid">
          <article v-for="item in visibleGuideModules" :key="item.key">
            <span><el-icon><component :is="item.icon" /></el-icon></span>
            <div><h3>{{ item.label }}</h3><p>{{ item.description }}</p><small>{{ item.tip }}</small></div>
          </article>
        </div>
      </div>

      <div v-else class="guide-page">
        <div class="guide-flow">
          <h3>顾客服务标准流程</h3>
          <div><span v-for="(item,index) in guideFlow" :key="item.label"><b>{{ index+1 }}</b><strong>{{ item.label }}</strong><small>{{ item.owner }}</small></span></div>
        </div>
        <div class="guide-start-cards">
          <button @click="finishGuide('workbench')"><el-icon><Monitor /></el-icon><strong>进入工作台</strong><small>查看并处理当前待办</small></button>
          <button @click="finishGuide('appointments')"><el-icon><Calendar /></el-icon><strong>查看预约</strong><small>了解今日到店安排</small></button>
          <button @click="finishGuide('customers')"><el-icon><User /></el-icon><strong>查看顾客档案</strong><small>查询顾客资料与资产</small></button>
        </div>
      </div>

      <template #footer>
        <div class="guide-footer">
          <el-checkbox v-model="hideGuideNextTime">下次不再自动显示</el-checkbox>
          <div><el-button v-if="guideStep > 0" @click="guideStep--">上一步</el-button><el-button v-if="guideStep < 3" type="primary" @click="guideStep++">下一步</el-button><el-button v-else type="primary" @click="finishGuide('workbench')">开始使用</el-button></div>
        </div>
      </template>
    </el-dialog>

    <BatchAppointmentImport
      v-model="batchImportVisible"
      :records="records"
      :role="currentRole"
      :role-meta="currentRoleMeta"
      :stores="stores"
      @imported="handleBatchImported"
    />
  </div>
  </template>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowDown, ArrowLeft, ArrowRight, Bell, Calendar, DataAnalysis, List,
  Money, Monitor, Search, User, Warning, Document, TrendCharts,
  Setting, QuestionFilled, Switch, Upload
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BusinessDashboard from './BusinessDashboard.vue'
import CustomerArchive from './CustomerArchive.vue'
import AppointmentCalendar from './AppointmentCalendar.vue'
import SystemSettings from './SystemSettings.vue'
import DailyReport from './DailyReport.vue'
import DealReport from './DealReport.vue'
import BatchAppointmentImport from './BatchAppointmentImport.vue'
import LoginView from './LoginView.vue'

const STORAGE_KEY = 'cosmetic-workbench-v2'
const today = new Date().toISOString().slice(0, 10)
const CONFIG_KEY = 'cosmetic-system-config-v1'
const GUIDE_KEY = 'cosmetic-guide-seen-v1'
const SETTINGS_KEY = 'cosmetic-settings-data-v1'
const AUTH_KEY = 'cosmetic-login-session-v1'
// 演示站会复用浏览器中既有的本地数据。历史版本或手动修改过的数据
// 可能不是有效 JSON；不能让一条损坏的缓存阻断 Vue 挂载并出现空白页。
function readLocalJson(key, fallback = null) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

const savedConfig = readLocalJson(CONFIG_KEY)
const stores = reactive(savedConfig?.stores || ['科臻澳总店', '金水形象店', '东区旗舰店'])
const departments = reactive(savedConfig?.departments || ['皮肤管理科', '微整注射科', '抗衰中心', '形体管理科', '私密护理科'])
const projectCatalog = reactive(savedConfig?.projectCatalog || [
  { label: '皮肤护理', options: ['面部护理', '补水保湿', '光子嫩肤', '祛斑管理', '痘肌管理', '敏感肌修护'] },
  { label: '抗衰祛皱', options: ['祛皱纹', '面部抗衰', '眼周年轻化', '轮廓提升', '胶原焕活'] },
  { label: '注射塑形', options: ['玻尿酸塑形', '轮廓固定', '水光项目', '瘦脸塑形'] },
  { label: '身体护理', options: ['形体管理', '私密护理', '术后护理'] }
])
const allProjects = computed(() => projectCatalog.flatMap((group) => group.options))
const workflowLegend = ['批量导入', '场控排诊', '医生排诊', '服务执行', '顾客回访']

const defaultEmployees = [
  ['E0001','苏晴','科臻澳总店','市场','market'],['E0002','顾妍','科臻澳总店','客服','service'],['E0003','安然','科臻澳总店','管家','butler'],['E0004','林珊','科臻澳总店','总监','director'],['E0005','周店长','科臻澳总店','店长','storeManager'],['E0009','叶老师','科臻澳总店','卡姐','cardConsultant'],['E0010','乔老师','科臻澳总店','美导','beautyConsultant'],['E0011','韩经理','科臻澳总店','经理','manager'],['E0012','陈场控','科臻澳总店','场控','floorControl'],['E0013','吴咨询','科臻澳总店','咨询','consultant'],['E0014','李医生','科臻澳总店','医生','doctor'],['E0015','赵护士','科臻澳总店','护士','nurse'],['admin','admin','总部','admin','admin']
].map(([code,name,store,roleLabel,roleKey])=>({code,name,store,roleLabel,roleKey,status:'active',label:roleLabel}))
const defaultRoles = [
  ['market','市场','本人'],['service','客服','本人'],['butler','管家','本人'],['cardConsultant','卡姐','本人'],['beautyConsultant','美导','本人'],['manager','经理','本人'],['floorControl','场控','本店'],['consultant','咨询','本人'],['director','总监','本店'],['doctor','医生','本人'],['nurse','护士','本人'],['storeManager','店长','本店'],['admin','admin','全部门店']
].map(([key,label,dataScope])=>({key,label,dataScope,permissions:{workbench:['view','edit'],customers:['view'],appointments:['view'],dashboard:['view','export'],dailyReports:['view','export'],dealReports:['view','export'],...(key==='storeManager'?{settings:['view','edit']}:{}),...(key==='admin'?{settings:['view','edit']}: {})}}))
const savedSettings = readLocalJson(SETTINGS_KEY)
const employees = ref(ensureAdminEmployee(savedSettings?.staff || defaultEmployees))
const roleDefinitions = ref(ensureReportPermissions(savedSettings?.roles || defaultRoles))
const roles = computed(() => employees.value.map((employee) => ({ value: employee.roleKey, label: employee.roleLabel || employee.roleKey, name: employee.name, store: employee.store })))
const guideRoles = roles.value.map((role) => ({
  ...role,
  guide: {
    market: '负责顾客邀约和预约确认',
    service: '负责顾客接待与服务后回访',
    butler: '负责到店顾客需求分诊',
    director: '负责排诊、服务推进与成交分析',
    storeManager: '管理本店业务、日报和经营数据',
    admin: '查看全部门店并维护系统配置'
  }[role.value]
}))
const guideModules = [
  { key:'workbench',label:'工作台',icon:Monitor,description:'集中查看顾客业务进度和本人待办。',tip:'日常工作从这里开始' },
  { key:'customers',label:'顾客档案',icon:User,description:'维护顾客资料、偏好、项目资产、储值积分和照片。',tip:'沉淀完整顾客历史' },
  { key:'appointments',label:'预约记录',icon:Calendar,description:'通过月历查看预约，支持新增、邀约、改期和取消。',tip:'安排每日到店计划' },
  { key:'dashboard',label:'经营看板',icon:DataAnalysis,description:'查看业务进度、转化漏斗、经营趋势和排行。',tip:'店长和管理员可见',roles:['storeManager','admin'] },
  { key:'dailyReports',label:'每日报表',icon:Document,description:'自动汇总门店每日经营数据，由店长核对确认。',tip:'支持审核和Excel导出',roles:['storeManager','admin'] },
  { key:'dealReports',label:'成交报表',icon:TrendCharts,description:'按日期、门店、人员岗位分析成交表现。',tip:'全员可按权限查看',roles:['market','service','butler','director','storeManager','admin'] },
  { key:'settings',label:'系统设置',icon:Setting,description:'维护组织、员工、项目、耗材、权限和业务规则。',tip:'店长和管理员可见',roles:['storeManager','admin'] }
]
const guideFlow = [
  {label:'市场邀约',owner:'市场'},{label:'客服接待',owner:'客服'},{label:'管家分诊',owner:'管家'},
  {label:'总监排诊',owner:'总监'},{label:'服务执行',owner:'总监'},{label:'客服回访',owner:'客服'}
]

const statusMeta = {
  floorControl: { label: '场控排诊', type: 'warning', owner: 'floorControl' },
  doctorDiagnosis: { label: '医生排诊', type: 'primary', owner: 'doctor' },
  service: { label: '服务执行', type: 'success', owner: 'director' },
  followup: { label: '顾客回访', type: 'success', owner: 'service' },
  completed: { label: '服务完成', type: 'info', owner: null },
  cancelled: { label: '服务取消', type: 'danger', owner: null }
}

const statusTabs = [
  { value: 'all', label: '全部' },
  ...Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))
]

const nextStatus = {
  floorControl: 'doctorDiagnosis', doctorDiagnosis: 'service', service: 'followup', followup: 'completed'
}
const previousStatus = {
  doctorDiagnosis: 'floorControl', service: 'doctorDiagnosis', followup: 'service', completed: 'followup'
}

const savedSession = readLocalJson(AUTH_KEY)
const currentUser = ref(employees.value.find((item) => item.code === savedSession?.code && item.status === 'active') || null)
const currentRole = ref(currentUser.value?.roleKey || '')
const activePage = ref('workbench')
const isAuthenticated = computed(() => Boolean(currentUser.value))
const customerFocus = reactive({ phone: '', request: 0 })
const selectedDate = ref(today)
const selectedStore = ref('all')
const diagnosisFilter = ref('all')
const keyword = ref('')
const activeStatus = ref('all')
const viewMode = ref('all')
const currentPage = ref(1)
const pageSize = 15
const detailVisible = ref(false)
const activeRecordId = ref(null)
const nodeDialogVisible = ref(false)
const nodeFormRef = ref()
const dialogStatus = ref('')
const commonDialogVisible = ref(false)
const commonFormRef = ref()
const commonAction = ref('')
const editingRecordId = ref(null)
const dataResetToken = ref(0)
const guideVisible = ref(false)
const guideStep = ref(0)
const hideGuideNextTime = ref(true)
const roleSelectRef = ref()
const guidePointerStyle = ref({})
const batchImportVisible = ref(false)
const canBatchImport = computed(() => ['market','storeManager','admin'].includes(currentRole.value))
const visibleGuideModules = computed(() => guideModules.filter((item) => !item.roles || item.roles.includes(currentRole.value)))

const nodeForm = reactive({})
const commonForm = reactive({})

const nodeRules = {
  result: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  time: [{ required: true, message: '请选择时间', trigger: 'change' }],
  project: [{ required: true, message: '请填写项目', trigger: 'blur' }],
  diagnosisType: [{ required: true, message: '请选择诊疗类型', trigger: 'change' }],
  department: [{ required: true, message: '请选择科室', trigger: 'change' }],
  level: [{ required: true, message: '请选择需求等级', trigger: 'change' }],
  manager: [{ required: true, message: '请选择经理', trigger: 'change' }],
  doctor: [{ required: true, message: '请选择医生', trigger: 'change' }],
  nurse: [{ required: true, message: '请选择配台护士', trigger: 'change' }],
  numbingTime: [{ required: true, message: '请设置敷麻时间', trigger: 'change' }],
  paymentType: [{ required: true, message: '请选择消费方式', trigger: 'change' }],
  cardAmount: [{
    validator: (_rule, value, callback) => {
      if (nodeForm.paymentType === 'card' && !Number(value)) callback(new Error('请填写耗卡金额'))
      else callback()
    },
    trigger: 'change'
  }],
  projects: [{ required: true, type: 'array', min: 1, message: '请至少选择一个顾客项目', trigger: 'change' }],
  method: [{ required: true, message: '请选择回访方式', trigger: 'change' }],
  satisfaction: [{ required: true, message: '请填写满意度', trigger: 'change' }],
  note: [{ required: true, message: '请填写处理记录', trigger: 'blur' }]
}
const commonRules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  time: [{ required: true, message: '请选择时间', trigger: 'change' }],
  reason: [{ required: true, message: '请填写原因或备注', trigger: 'blur' }],
  paymentType: [{ required: true, message: '请选择消费方式', trigger: 'change' }],
  projects: [{ required: true, type: 'array', min: 1, message: '请至少选择一个消费项目', trigger: 'change' }],
  cardAmount: [{
    validator: (_rule, value, callback) => {
      if (commonForm.paymentType === 'card' && !Number(value)) callback(new Error('请填写耗卡金额'))
      else callback()
    },
    trigger: 'change'
  }]
}

function initialRecords() {
  const base = [
    ['B20260618001', '陈女士', '13800001231', '赵女士', '13900004562', '新诊', '09:00', '科臻澳总店', '面部抗衰升级', 'invited'],
    ['B20260618002', '林女士', '13800001876', '孙女士', '13900003218', '新诊', '09:30', '科臻澳总店', '水光补水疗程', 'reception'],
    ['B20260618003', '周女士', '13800006543', null, null, '复诊', '10:00', '金水形象店', '眼周精雕复查', 'triage'],
    ['B20260618004', '许女士', '13800009876', '吴女士', '13900001129', '新诊', '10:30', '科臻澳总店', '轮廓固定咨询', 'scheduling'],
    ['B20260618005', '沈女士', '13800002345', null, null, '复诊', '11:00', '东区旗舰店', '皮肤焕新管理', 'service'],
    ['B20260618006', '郑女士', '13800007654', '唐女士', '13900008761', '复诊', '13:30', '科臻澳总店', '玻尿酸术后护理', 'followup'],
    ['B20260618007', '顾女士', '13800004321', null, null, '新诊', '14:00', '金水形象店', '形体管理体验', 'completed'],
    ['B20260618008', '陆女士', '13800005567', '方女士', '13900007890', '新诊', '14:30', '科臻澳总店', '私密护理咨询', 'reception'],
    ['B20260618009', '夏女士', '13800006789', null, null, '复诊', '15:00', '东区旗舰店', '光子嫩肤复查', 'cancelled'],
    ['B20260618010', '叶女士', '13800008901', '程女士', '13900002234', '新诊', '15:30', '科臻澳总店', '胶原焕活项目', 'triage'],
    ['B20260618011', '宋女士', '13800001098', null, null, '复诊', '16:00', '金水形象店', '皮肤维养', 'scheduling'],
    ['B20260618012', '冯女士', '13800003456', '袁女士', '13900006578', '新诊', '16:30', '科臻澳总店', '面部年轻化', 'invited']
  ]
  return base.map((x, index) => {
    const status = x[9]
    return {
      id: x[0],
      businessDate: today,
      appointmentTime: x[6],
      diagnosisType: x[5],
      store: x[7],
      vip1: { name: x[1], phone: x[2] },
      vip2: x[3] ? { name: x[3], phone: x[4] } : null,
      cardConsultant: index % 3 === 0 ? '叶老师' : '',
      beautyConsultant: index % 4 === 0 ? '乔老师' : '',
      estimatedProject: x[8],
      projects: [x[8]],
      estimatedAmount: status === 'scheduling' ? 18000 : 0,
      paymentType: status === 'completed' ? 'cash' : status === 'followup' ? 'card' : 'none',
      revenue: status === 'completed' ? 12800 : 0,
      cardAmount: status === 'followup' ? 6800 : 0,
      note: index === 3 ? '主顾客与同行顾客希望分开面诊' : '',
      assignments: { market: '苏晴', service: '顾妍', butler: '安然', director: '林珊', manager: '韩经理' },
      storeManager: x[7] === '科臻澳总店' ? '周店长' : x[7] === '金水形象店' ? '林经理' : '许经理',
      department: index % 2 ? '皮肤管理科' : '抗衰中心',
      followupDate: addDays(today, 1),
      status,
      flags: status === 'cancelled' ? ['已取消：顾客临时有事'] : index === 1 ? ['即将到店'] : [],
      logs: buildInitialLogs(x[0], status, index)
    }
  })
}

function createHistoricalRecords() {
  const names = ['安女士', '白女士', '曹女士', '戴女士', '方女士', '高女士', '何女士', '姜女士', '孔女士', '罗女士', '孟女士', '倪女士']
  const projects = projectCatalog.flatMap((group) => group.options)
  const statuses = ['completed', 'completed', 'completed', 'followup', 'service', 'scheduling', 'triage', 'reception', 'cancelled']
  const staffByStore = {
    科臻澳总店: { market: '苏晴', service: '顾妍', butler: '安然', director: '林珊', manager: '韩经理' },
    金水形象店: { market: '秦悦', service: '宋佳', butler: '夏薇', director: '顾宁', manager: '林经理' },
    东区旗舰店: { market: '叶青', service: '唐欣', butler: '温然', director: '许诺', manager: '许经理' }
  }
  const result = []
  for (let dayOffset = 1; dayOffset <= 90; dayOffset++) {
    const date = addDays(today, -dayOffset)
    const dailyCount = 3 + (dayOffset % 5)
    for (let index = 0; index < dailyCount; index++) {
      const seed = dayOffset * 17 + index * 13
      const store = stores[seed % stores.length]
      const status = statuses[seed % statuses.length]
      const project = projects[seed % projects.length]
      const secondProject = seed % 4 === 0 ? projects[(seed + 5) % projects.length] : null
      const paymentType = ['completed', 'followup'].includes(status) ? (seed % 3 === 0 ? 'card' : 'cash') : 'none'
      const amount = paymentType === 'none' ? 0 : 1800 + (seed % 11) * 900
      const id = `H${date.replaceAll('-', '')}${String(index + 1).padStart(3, '0')}`
      result.push({
        id,
        businessDate: date,
        statisticsDate: date,
        appointmentTime: `${String(9 + (seed % 9)).padStart(2, '0')}:${seed % 2 ? '30' : '00'}`,
        arrivalTime: status === 'invited' ? '' : `${String(9 + (seed % 9)).padStart(2, '0')}:${seed % 2 ? '35' : '05'}`,
        diagnosisType: seed % 3 === 0 ? '新诊' : '复诊',
        store,
        storeManager: staffByStore[store].manager,
        vip1: { name: names[seed % names.length], phone: `138****${String(1000 + seed).slice(-4)}` },
        vip2: null,
        cardConsultant: seed % 5 === 0 ? '叶老师' : '',
        beautyConsultant: seed % 4 === 0 ? '乔老师' : '',
        estimatedProject: [project, secondProject].filter(Boolean).join('、'),
        projects: [project, secondProject].filter(Boolean),
        estimatedAmount: amount ? amount + 1200 : 0,
        paymentType,
        revenue: paymentType === 'cash' ? amount : 0,
        cardAmount: paymentType === 'card' ? amount : 0,
        note: '',
        assignments: staffByStore[store],
        department: departments[seed % departments.length],
        followupDate: addDays(date, 1),
        completedDate: status === 'completed' ? addDays(date, 1) : '',
        status,
        flags: status === 'cancelled' ? ['历史取消记录'] : [],
        source: 'history-demo',
        nodeTimes: createNodeTimes(date, status, seed),
        logs: buildInitialLogs(id, status, seed % 12).map((log) => ({
          ...log,
          time: `${date}${log.time.slice(10)}`
        }))
      })
    }
  }
  return result
}

function createNodeTimes(date, status, seed) {
  const route = ['invited', 'reception', 'triage', 'scheduling', 'service', 'followup', 'completed']
  const currentIndex = status === 'cancelled' ? 1 : route.indexOf(status)
  const times = {}
  for (let index = 0; index <= Math.max(0, currentIndex); index++) {
    times[route[index]] = `${date} ${String(8 + index + (seed % 2)).padStart(2, '0')}:${index % 2 ? '30' : '10'}`
  }
  return times
}

const historicalRecords = createHistoricalRecords().map(normalizeRecord)

const savedRecords = readLocalJson(STORAGE_KEY, initialRecords())
const records = ref(ensureAppointmentSamples((Array.isArray(savedRecords) ? savedRecords : initialRecords()).map(normalizeRecord)))

const currentRoleMeta = computed(() => currentUser.value ? { ...currentUser.value, label: currentUser.value.roleLabel || currentUser.value.roleKey } : { name: '未登录', label: '', roleLabel: '', store: '' })
const pageHeader = computed(() => ({
  workbench: { title: '顾客业务维护工作台', subtitle: '按角色处理本人任务，全店进度实时可见' },
  dashboard: { title: '门店经营数据看板', subtitle: '按周期洞察门店业务转化与经营质量' },
  dailyReports: { title: '门店每日经营报表', subtitle: '自动汇总每日经营数据，由店长核对确认' },
  dealReports: { title: '成交报表', subtitle: '按门店、岗位和个人维度分析每日成交业绩' },
  customers: { title: '顾客档案管理', subtitle: '沉淀顾客资料、会员资产与完整服务历史' }
  ,appointments: { title: '预约记录', subtitle: '按月查看每日邀约与到店安排' }
  ,settings: { title: '系统设置', subtitle: '统一维护组织、人员、项目、权限与耗材库存' }
}[activePage.value] || { title: '医美管理后台', subtitle: '顾客全流程协作' }))
const currentRoleDefinition = computed(() => roleDefinitions.value.find((item) => item.key === currentRole.value))
const canView = (module) => currentRole.value === 'admin' || (currentRoleDefinition.value?.permissions?.[module] || []).includes('view')
const canViewDashboard = computed(() => canView('dashboard'))
const canViewDailyReports = computed(() => canView('dailyReports'))
const canViewDealReports = computed(() => canView('dealReports'))
const canViewSettings = computed(() => ['storeManager', 'admin'].includes(currentRole.value) && canView('settings'))
const hasAllStores = computed(() => currentRole.value === 'admin' || currentRoleDefinition.value?.dataScope === '全部门店')
function recordInScope(record) {
  if (currentRole.value === 'admin') return true
  if (['storeManager', 'director'].includes(currentRole.value)) return record.store === currentRoleMeta.value.store
  const owner = currentRole.value === 'cardConsultant' ? record.cardConsultant : currentRole.value === 'beautyConsultant' ? record.beautyConsultant : record.assignments?.[currentRole.value]
  return owner === currentRoleMeta.value.name
}
const scopedRecords = computed({ get: () => records.value.filter(recordInScope), set: (value) => { records.value = value } })
const dashboardRecords = computed(() => [...historicalRecords, ...records.value].filter(recordInScope))
const activeRecord = computed(() => dashboardRecords.value.find((x) => x.id === activeRecordId.value))
const dayRecords = computed(() => records.value.filter((x) => {
  const belongsToDate = x.businessDate === selectedDate.value
    || (x.status === 'followup' && x.followupDate === selectedDate.value)
    || (x.status === 'completed' && x.completedDate === selectedDate.value)
  return belongsToDate && recordInScope(x) && (selectedStore.value === 'all' || x.store === selectedStore.value)
}))
const arrivalRecords = computed(() => dayRecords.value.filter((x) => x.businessDate === selectedDate.value))
const newDiagnosisCount = computed(() => arrivalRecords.value.filter((x) => x.diagnosisType === '新诊').length)
const exceptionCount = computed(() => dayRecords.value.filter((x) => x.flags.length || x.status === 'cancelled').length)
const todayRevenue = computed(() => arrivalRecords.value.reduce((sum, x) => sum + (x.paymentType === 'cash' ? Number(x.revenue || 0) : 0), 0))
const consumeCardCount = computed(() => arrivalRecords.value.filter((x) => x.paymentType === 'card').length)
const myTodoCount = computed(() => dayRecords.value.filter((x) => canOperate(x)).length)

const filteredRecords = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return dayRecords.value.filter((record) => {
    if (activeStatus.value !== 'all' && record.status !== activeStatus.value) return false
    if (diagnosisFilter.value !== 'all' && record.diagnosisType !== diagnosisFilter.value) return false
    if (viewMode.value === 'mine' && !canOperate(record)) return false
    if (!q) return true
    return [record.vip1.name, record.vip1.phone, record.vip2?.name, record.vip2?.phone, record.estimatedProject]
      .some((value) => String(value || '').toLowerCase().includes(q))
  })
})
const pagedRecords = computed(() => filteredRecords.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

const nodeSummary = computed(() => {
  const colors = ['#f59e0b', '#fb923c', '#6366f1', '#8b5cf6', '#10b981', '#06b6d4', '#64748b']
  const keys = ['floorControl', 'doctorDiagnosis', 'service', 'followup', 'completed', 'cancelled']
  const max = Math.max(1, ...keys.map((key) => dayRecords.value.filter((x) => x.status === key).length))
  return keys.map((status, index) => {
    const count = dayRecords.value.filter((x) => x.status === status).length
    return { status, label: statusMeta[status].label, count, percentage: Math.round(count / max * 100), color: colors[index] }
  })
})
const attentionRecords = computed(() => dayRecords.value.filter((x) => x.flags.length || x.status === 'cancelled').slice(0, 5))

const nodeDialogTitle = computed(() => ({
  floorControl: '场控排诊', doctorDiagnosis: '医生排诊',
  invited: '邀约处理', reception: '到店接待', triage: '顾客分诊',
  scheduling: '排诊安排', service: '结束服务', followup: '顾客回访'
}[dialogStatus.value] || '节点处理'))
const commonDialogTitle = computed(() => ({
  revenue: '编辑消费与业绩', reschedule: '业务改期', rollback: '退回上一节点', cancel: '取消业务', staff: '设置人员归属'
}[commonAction.value]))

watch(records, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })
watch(currentRole, () => {
  if (!canViewDashboard.value && activePage.value === 'dashboard') activePage.value = 'workbench'
  if (!canViewDailyReports.value && activePage.value === 'dailyReports') activePage.value = 'workbench'
  if (!canViewDealReports.value && activePage.value === 'dealReports') activePage.value = 'workbench'
  if (!canViewSettings.value && activePage.value === 'settings') activePage.value = 'workbench'
  if (!hasAllStores.value) selectedStore.value = currentRoleMeta.value.store
})
watch([selectedDate, selectedStore, diagnosisFilter, keyword, activeStatus, viewMode], () => { currentPage.value = 1 })
watch([guideVisible, guideStep], async () => {
  if (!guideVisible.value || guideStep.value !== 1) return
  await nextTick()
  positionGuidePointer()
})

onMounted(() => {
  window.addEventListener('resize', positionGuidePointer)
  if (!localStorage.getItem(GUIDE_KEY)) {
    guideStep.value = 0
    guideVisible.value = true
  }
})
onBeforeUnmount(() => window.removeEventListener('resize', positionGuidePointer))

function openGuide() {
  guideStep.value = 0
  hideGuideNextTime.value = true
  guideVisible.value = true
}

function handleLogin(employee) {
  currentUser.value = employee
  currentRole.value = employee.roleKey
  selectedStore.value = employee.roleKey === 'admin' ? 'all' : employee.store
  activePage.value = 'workbench'
  localStorage.setItem(AUTH_KEY, JSON.stringify({ code: employee.code }))
}

function logout() {
  localStorage.removeItem(AUTH_KEY)
  currentUser.value = null
  currentRole.value = ''
  activePage.value = 'workbench'
}

function positionGuidePointer() {
  const element = roleSelectRef.value?.$el
  if (!element) return
  const rect = element.getBoundingClientRect()
  guidePointerStyle.value = {
    top: `${rect.bottom + 14}px`,
    left: `${rect.left + rect.width / 2}px`
  }
}

function finishGuide(page = 'workbench') {
  if (hideGuideNextTime.value) localStorage.setItem(GUIDE_KEY, 'seen')
  else localStorage.removeItem(GUIDE_KEY)
  activePage.value = page
  guideVisible.value = false
}

function handleBatchImported(imported) {
  records.value = [...records.value, ...imported]
  if (imported[0]) {
    selectedDate.value = imported.map(x=>x.businessDate).sort()[0]
    if (currentRole.value !== 'admin') selectedStore.value = currentRoleMeta.value.store
  }
}

function canOperate(record) {
  if (record.source === 'history-demo') return false
  if (['completed', 'cancelled'].includes(record.status)) return false
  if (['storeManager', 'admin'].includes(currentRole.value)) return true
  return statusMeta[record.status]?.owner === currentRole.value && record.assignments[currentRole.value] === currentRoleMeta.value.name
}

function canManage(record) {
  if (record?.source === 'history-demo') return false
  return ['storeManager', 'admin', 'director'].includes(currentRole.value)
}

function canRollback(record) {
  return canManage(record) && Boolean(previousStatus[record.status])
}

function currentOwner(record) {
  const role = statusMeta[record.status]?.owner
  if (!role) return record.status === 'completed' ? '流程已结束' : '无'
  return record.assignments[role] || '待分配'
}

function countByStatus(status) {
  const source = status === 'all' ? dayRecords.value : dayRecords.value.filter((x) => x.status === status)
  return source.length
}

function actionLabel(status) {
  return {
    floorControl: '进行场控排诊', doctorDiagnosis: '进行医生排诊',
    invited: '处理邀约', reception: '登记接待', triage: '进行分诊',
    scheduling: '安排排诊', service: '结束服务', followup: '完成回访'
  }[status] || '处理'
}

function openDetail(record) {
  activeRecordId.value = record.id
  detailVisible.value = true
}

function handleConfigChange(config) {
  stores.splice(0, stores.length, ...config.stores)
  departments.splice(0, departments.length, ...config.departments)
  projectCatalog.splice(0, projectCatalog.length, ...config.projectCatalog)
  if (config.staff) employees.value = ensureAdminEmployee(config.staff)
  if (config.roles) roleDefinitions.value = ensureReportPermissions(config.roles)
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ stores: [...stores], departments: [...departments], projectCatalog: JSON.parse(JSON.stringify(projectCatalog)) }))
}

function ensureAdminEmployee(rows) {
  const normalized = rows.map((row) => ({ ...row, label: row.roleLabel || row.label || row.roleKey }))
  defaultEmployees.forEach((employee) => {
    if (!normalized.some((row) => row.code === employee.code || row.roleKey === employee.roleKey)) normalized.push({ ...employee, department: employee.roleLabel === '卡姐' ? '客户管理部' : employee.roleLabel === '美导' ? '运营部' : employee.roleLabel === '经理' ? '管理部' : '' })
  })
  return normalized
}

function projectFollowupDays(projectName) {
  const settings = JSON.parse(localStorage.getItem('cosmetic-settings-data-v1') || 'null')
  return Number(settings?.projects?.find((item) => item.name === projectName)?.followupDays || 60)
}

function calculateFollowupDate(projects) {
  const days = Math.max(...projects.map(projectFollowupDays), 60)
  return addDays(today, days)
}

function pushMessage(record, content) {
  const key = 'cosmetic-station-messages-v1'
  const rows = JSON.parse(localStorage.getItem(key) || '[]')
  rows.unshift({ id: `MSG-${Date.now()}`, recordId: record.id, customerName: record.vip1.name, content, time: nowText(), read: false })
  localStorage.setItem(key, JSON.stringify(rows.slice(0, 100)))
}

function ensureReportPermissions(rows) {
  const normalized = rows.map((role) => JSON.parse(JSON.stringify(role)))
  defaultRoles.forEach((role) => { if (!normalized.some((item) => item.key === role.key)) normalized.push(JSON.parse(JSON.stringify(role))) })
  return normalized.map((role) => {
    const permissions = JSON.parse(JSON.stringify(role.permissions || {}))
    ;['dashboard', 'dailyReports', 'dealReports'].forEach((key) => {
      if (!permissions[key]) permissions[key] = ['view', 'export']
      else if (!permissions[key].includes('view')) permissions[key].push('view')
    })
    if (role.key === 'admin') permissions.settings = permissions.settings?.length ? permissions.settings : ['view', 'edit']
    if (role.key === 'storeManager') permissions.settings = permissions.settings?.length ? permissions.settings : ['view', 'edit']
    return { ...role, label: role.key === 'admin' ? 'admin' : role.label, permissions }
  })
}


function resetObject(target, source) {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, source)
}

function openNodeDialog(record) {
  editingRecordId.value = record.id
  dialogStatus.value = record.status
  resetObject(nodeForm, {
    result: '', date: record.businessDate, time: record.appointmentTime,
    project: record.estimatedProject, diagnosisType: record.diagnosisType,
    department: record.department || '', level: '', manager: record.assignments.manager || '',
    butler: record.assignments.butler || '', consultant: record.assignments.consultant || '', director: record.assignments.director || '',
    doctor: record.doctorDiagnosis?.doctor || record.assignments.doctor || '', nurse: record.doctorDiagnosis?.nurse || record.assignments.nurse || '', numbingTime: record.doctorDiagnosis?.numbingTime || '', medication: record.doctorDiagnosis?.medication || '',
    estimatedAmount: record.estimatedAmount || 0, paymentType: record.paymentType || 'cash',
    revenue: record.revenue || 0, cardAmount: record.cardAmount || 0,
    projects: [...(record.projects || [record.estimatedProject].filter(Boolean))],
    followupDate: record.followupDate || addDays(today, 1),
    method: '', satisfaction: 5, nextDate: '', note: ''
  })
  nodeDialogVisible.value = true
  nextTick(() => nodeFormRef.value?.clearValidate())
}

async function submitNode() {
  if (!await nodeFormRef.value?.validate().catch(() => false)) return
  const record = records.value.find((x) => x.id === editingRecordId.value)
  if (!record) return
  const from = record.status
  let to = nextStatus[from]
  if (from === 'floorControl' && nodeForm.result === '未到店') {
    record.flags.push('未到店：需客服再次联系')
    addLog(record, '登记未到店', '顾客未按预约时间到店，流程保留在接待节点', from, from, 'warning')
    nodeDialogVisible.value = false
    ElMessage.warning('已登记未到店，任务仍保留在待接待')
    return
  }
  if (from === 'floorControl') {
    record.arrivalTime = nodeForm.time
    record.floorControl = { createdTime: record.floorControl?.createdTime || nowText(), arrivalTime: nodeForm.time, scheduledTime: nowText(), result: nodeForm.result, note: nodeForm.note, managerSuggestion: nodeForm.project }
    Object.assign(record.assignments, { butler: nodeForm.butler, consultant: nodeForm.consultant, director: nodeForm.director, manager: nodeForm.manager })
    record.estimatedProject = nodeForm.project
  }
  if (from === 'doctorDiagnosis') {
    record.department = nodeForm.department
    record.doctorDiagnosis = { doctor: nodeForm.doctor, nurse: nodeForm.nurse, numbingTime: nodeForm.numbingTime, medication: nodeForm.medication, note: nodeForm.note, scheduledTime: nowText() }
    Object.assign(record.assignments, { doctor: nodeForm.doctor, nurse: nodeForm.nurse })
  }
  if (from === 'invited') {
    record.businessDate = nodeForm.date
    record.appointmentTime = nodeForm.time
    record.estimatedProject = nodeForm.project
  }
  if (from === 'reception') record.diagnosisType = nodeForm.diagnosisType
  if (from === 'triage') {
    record.department = nodeForm.department
    record.estimatedProject = nodeForm.project
  }
  if (from === 'scheduling') {
    record.department = nodeForm.department
    record.assignments.manager = nodeForm.manager
    record.estimatedAmount = nodeForm.estimatedAmount
  }
  if (from === 'service') {
    const assetResult = consumeCustomerAssets(record, nodeForm.projects, nodeForm.paymentType, nodeForm.cardAmount)
    if (!assetResult.ok) { ElMessage.error(assetResult.message); return }
    const inventoryResult = consumeProjectMaterials(record, nodeForm.projects)
    if (!inventoryResult.ok) {
      ElMessage.error(inventoryResult.message)
      return
    }
    record.paymentType = nodeForm.paymentType
    record.revenue = nodeForm.paymentType === 'cash' ? nodeForm.revenue : 0
    record.cardAmount = ['card','member'].includes(nodeForm.paymentType) ? nodeForm.cardAmount : 0
    record.followupDate = calculateFollowupDate(nodeForm.projects)
    record.serviceExecution = { time: nowText(), projects: [...nodeForm.projects], paymentType: nodeForm.paymentType, note: nodeForm.note }
    pushMessage(record, `已按项目回访规则生成预计回访：${record.followupDate}`)
    record.businessDate = selectedDate.value
  }
  if (from === 'followup' && ['需再次跟进', '投诉待处理'].includes(nodeForm.result)) {
    record.flags.push(nodeForm.result)
  }
  if (from === 'followup') record.completedDate = selectedDate.value
  record.note = nodeForm.note || record.note
  record.projects = [...nodeForm.projects]
  record.estimatedProject = nodeForm.projects.join('、')
  record.status = to
  const detail = `${nodeDialogTitle.value}完成${nodeForm.result ? `：${nodeForm.result}` : ''}；项目：${nodeForm.projects.join('、')}${nodeForm.note ? `；${nodeForm.note}` : ''}`
  addLog(record, nodeDialogTitle.value, detail, from, to, to === 'completed' ? 'success' : 'primary')
  nodeDialogVisible.value = false
  ElMessage.success(`已推进至“${statusMeta[to].label}”`)
}

function handleCommand(command, record) {
  openCommonDialog(command, record)
}

function openCommonDialog(action, record) {
  commonAction.value = action
  editingRecordId.value = record.id
  resetObject(commonForm, {
    paymentType: record.paymentType || 'none', revenue: record.revenue || 0,
    cardAmount: record.cardAmount || 0,
    projects: [...(record.projects || [record.estimatedProject].filter(Boolean))],
    date: record.businessDate, time: record.appointmentTime, reason: '',
    cardConsultant: record.cardConsultant || '', beautyConsultant: record.beautyConsultant || '',
    market: record.assignments?.market || '', service: record.assignments?.service || '', butler: record.assignments?.butler || '', manager: record.assignments?.manager || '', director: record.assignments?.director || ''
  })
  commonDialogVisible.value = true
  nextTick(() => commonFormRef.value?.clearValidate())
}

async function submitCommon() {
  if (!await commonFormRef.value?.validate().catch(() => false)) return
  const record = records.value.find((x) => x.id === editingRecordId.value)
  if (!record) return
  const from = record.status
  if (commonAction.value === 'revenue') {
    record.paymentType = commonForm.paymentType
    record.revenue = commonForm.paymentType === 'cash' ? commonForm.revenue : 0
    record.cardAmount = commonForm.paymentType === 'card' ? commonForm.cardAmount : 0
    record.projects = [...commonForm.projects]
    record.estimatedProject = commonForm.projects.join('、')
    addLog(record, '更新消费业绩', `${paymentLabel(record)}${commonForm.reason ? `；${commonForm.reason}` : ''}`, from, from)
  }
  if (commonAction.value === 'staff') {
    record.cardConsultant = commonForm.cardConsultant
    record.beautyConsultant = commonForm.beautyConsultant
    record.assignments ||= {}
    ;['market', 'service', 'butler', 'manager', 'director'].forEach((role) => { record.assignments[role] = commonForm[role] })
    addLog(record, '设置人员归属', `卡姐：${record.cardConsultant || '未分配'}；美导：${record.beautyConsultant || '未分配'}；经理：${record.assignments.manager || '未分配'}`, from, from)
  }
  if (commonAction.value === 'reschedule') {
    record.businessDate = commonForm.date
    record.appointmentTime = commonForm.time
    record.flags.push(`已改期至 ${commonForm.date} ${commonForm.time}`)
    addLog(record, '业务改期', `${commonForm.reason}；新时间 ${commonForm.date} ${commonForm.time}`, from, from, 'warning')
  }
  if (commonAction.value === 'rollback') {
    const to = previousStatus[from]
    record.status = to
    record.flags.push(`由${statusMeta[from].label}退回`)
    addLog(record, '退回节点', commonForm.reason, from, to, 'warning')
  }
  if (commonAction.value === 'cancel') {
    record.status = 'cancelled'
    record.flags.push(`已取消：${commonForm.reason}`)
    addLog(record, '取消业务', commonForm.reason, from, 'cancelled', 'danger')
  }
  commonDialogVisible.value = false
  ElMessage.success('操作已保存并记录日志')
}

function addLog(record, action, detail, fromStatus, toStatus, type = 'primary') {
  record.logs.push({
    id: `${record.id}-${Date.now()}`, time: nowText(), operator: `${currentRoleMeta.value.label}·${currentRoleMeta.value.name}`,
    action, detail, fromStatus, toStatus, type
  })
}

function staffOptions(roleKey) {
  return employees.value.filter((employee) => employee.status === 'active' && employee.roleKey === roleKey)
}

async function resetData() {
  try {
    await ElMessageBox.confirm('将清除当前所有演示操作并恢复初始数据，是否继续？', '重置演示数据', { type: 'warning' })
    records.value = ensureAppointmentSamples(initialRecords().map(normalizeRecord))
    selectedDate.value = today
    activeStatus.value = 'all'
    localStorage.removeItem(STORAGE_KEY)
    dataResetToken.value += 1
    detailVisible.value = false
    ElMessage.success('演示数据已恢复')
  } catch {
    // user cancelled
  }
}

function shiftDate(days) {
  selectedDate.value = addDays(selectedDate.value, days)
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function nowText() {
  const date = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function maskPhone(phone) {
  return phone ? phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : '—'
}

function paymentLabel(record) {
  if (record.paymentType === 'cash') return `现金/支付 ¥${formatMoney(record.revenue)}`
  if (record.paymentType === 'card') return `耗卡 ¥${formatMoney(record.cardAmount)}`
  return '未消费'
}

function consumeProjectMaterials(record, selectedProjects) {
  const settings = JSON.parse(localStorage.getItem('cosmetic-settings-data-v1') || 'null')
  const inventory = JSON.parse(localStorage.getItem('cosmetic-inventory-data-v1') || 'null')
  if (!settings?.projects || !inventory?.materials || !inventory?.batches || !inventory?.materialTemplates) return { ok: true }
  const requirements = new Map()
  selectedProjects.forEach((projectName) => {
    const project = settings.projects.find((item) => item.name === projectName && item.status === 'active')
    ;(inventory.materialTemplates[project?.id] || []).forEach((row) => {
      requirements.set(row.materialId, (requirements.get(row.materialId) || 0) + Number(row.quantity || 0))
    })
  })
  if (!requirements.size) return { ok: true }
  for (const [materialId, quantity] of requirements) {
    const material = inventory.materials.find((item) => item.id === materialId)
    const available = inventory.batches
      .filter((batch) => batch.materialId === materialId && batch.store === record.store && batch.quantity > 0 && batch.expiryDate >= today)
      .reduce((sum, batch) => sum + Number(batch.quantity), 0)
    if (available < quantity) return { ok: false, message: `${material?.name || '项目耗材'}库存不足，需要${quantity}，当前可用${available}` }
  }
  requirements.forEach((quantity, materialId) => {
    let remaining = quantity
    const material = inventory.materials.find((item) => item.id === materialId)
    const batchesForUse = inventory.batches
      .filter((batch) => batch.materialId === materialId && batch.store === record.store && batch.quantity > 0 && batch.expiryDate >= today)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    batchesForUse.forEach((batch) => {
      if (remaining <= 0) return
      const used = Math.min(Number(batch.quantity), remaining)
      batch.quantity -= used
      remaining -= used
      inventory.inventoryLogs ||= []
      inventory.inventoryLogs.push({
        id: `IL-SERVICE-${record.id}-${materialId}-${batch.id}`,
        time: nowText(),
        type: 'projectConsume',
        typeLabel: '项目耗用',
        store: record.store,
        materialId,
        materialName: material?.name || '未知物资',
        quantity: used,
        batchNo: batch.batchNo,
        operator: currentRoleMeta.value.name,
        reason: `业务单${record.id}：${selectedProjects.join('、')}`
      })
    })
  })
  localStorage.setItem('cosmetic-inventory-data-v1', JSON.stringify(inventory))
  return { ok: true }
}

function consumeCustomerAssets(record, selectedProjects, paymentType, amount) {
  if (!['card','member'].includes(paymentType)) return { ok: true }
  const key = 'cosmetic-customer-archive-v1'
  const customers = JSON.parse(localStorage.getItem(key) || '[]')
  const customer = customers.find(item => String(item.phone || '').replace(/\D/g,'') === String(record.vip1?.phone || '').replace(/\D/g,''))
  if (!customer) return { ok: true }
  if (paymentType === 'member') {
    if (Number(customer.balance || 0) < Number(amount || 0)) return { ok:false, message:'会员充值余额不足' }
    customer.balance -= Number(amount || 0)
    customer.logs ||= []; customer.logs.push({ id:`LG${Date.now()}`, time:nowText(), action:'服务扣减会员余额', detail:`业务单${record.id}扣减¥${amount}`, type:'primary' })
  } else {
    const available = selectedProjects.map(project => customer.packages?.find(item => item.project === project && item.status === 'active' && item.used < item.purchased && item.expiry >= today)).filter(Boolean)
    if (available.length < selectedProjects.length) return { ok:false, message:'存在项目/套餐次数不足或已过期' }
    available.forEach(item => { item.used += 1 })
    customer.logs ||= []; customer.logs.push({ id:`LG${Date.now()}`, time:nowText(), action:'服务核销项目/套餐', detail:`业务单${record.id}核销：${selectedProjects.join('、')}`, type:'primary' })
  }
  localStorage.setItem(key, JSON.stringify(customers))
  return { ok: true }
}

function buildInitialLogs(id, status, index) {
  const route = ['invited', 'reception', 'triage', 'scheduling', 'service', 'followup', 'completed']
  const legacyOwners = { invited: 'market', reception: 'service', triage: 'butler', scheduling: 'director' }
  const actionNames = {
    invited: '市场邀约', reception: '客服接待', triage: '顾客分诊',
    scheduling: '总监排诊', service: '服务结束', followup: '客服回访'
  }
  const currentIndex = route.indexOf(status)
  const completedCount = status === 'cancelled' ? 1 : Math.max(0, currentIndex)
  const logs = [{
    id: `${id}-created`, time: `${today} 08:${String(10 + index).padStart(2, '0')}`,
    operator: '系统', action: '创建业务单', detail: '由预约记录生成当天业务任务',
    fromStatus: 'invited', toStatus: 'invited', type: 'primary'
  }]
  for (let step = 0; step < completedCount; step++) {
    const from = route[step]
    const to = route[step + 1]
    logs.push({
      id: `${id}-${from}`, time: `${today} ${String(8 + Math.floor((step + 1) / 2)).padStart(2, '0')}:${step % 2 ? '30' : '15'}`,
      operator: `${roles.value.find((role) => role.value === (statusMeta[from]?.owner || legacyOwners[from]))?.label || '员工'}·演示人员`,
      action: actionNames[from], detail: `${actionNames[from]}已完成，业务进入${statusName(to)}`,
      fromStatus: from, toStatus: to, type: to === 'completed' ? 'success' : 'primary'
    })
  }
  if (status === 'cancelled') {
    logs.push({
      id: `${id}-cancelled`, time: `${today} 09:20`, operator: '店长·周店长',
      action: '取消业务', detail: '顾客临时有事', fromStatus: 'reception', toStatus: 'cancelled', type: 'danger'
    })
  }
  return logs
}

function normalizeRecord(record) {
  const legacyStatus = { invited: 'floorControl', reception: 'floorControl', triage: 'floorControl', scheduling: 'doctorDiagnosis' }
  const normalized = {
    ...record,
    status: legacyStatus[record.status] || record.status,
    projects: record.projects?.length ? record.projects : [record.estimatedProject].filter(Boolean),
    cardAmount: Number(record.cardAmount || 0),
    assignments: { ...(record.assignments || {}), floorControl: record.assignments?.floorControl || '陈场控' },
    floorControl: record.floorControl || {}, doctorDiagnosis: record.doctorDiagnosis || {}, serviceExecution: record.serviceExecution || {}, followupRecords: record.followupRecords || []
  }
  const existingLogs = record.logs || []
  const baselineLogs = buildInitialLogs(record.id, record.status, 0)
  const existingTransitions = new Set(existingLogs.map((log) => `${log.fromStatus}-${log.toStatus}`))
  const missingBaselineLogs = baselineLogs.filter((log) => !existingTransitions.has(`${log.fromStatus}-${log.toStatus}`))
  if (missingBaselineLogs.length) {
    normalized.logs = [...missingBaselineLogs, ...existingLogs].sort((a, b) => a.time.localeCompare(b.time))
  }
  return normalized
}

function ensureAppointmentSamples(source) {
  const samples = createAppointmentSamples()
  const existingIds = new Set(source.map((record) => record.id))
  return [...source, ...samples.filter((record) => !existingIds.has(record.id))]
}

function createAppointmentSamples() {
  const cases = [
    { offset: -16, time: '09:30', name: '邱女士', phone: '13810001001', type: '复诊', project: '面部护理', status: 'completed', appointmentStatus: 'completed' },
    { offset: -12, time: '14:00', name: '蒋女士', phone: '13810001002', type: '新诊', project: '祛皱纹', status: 'cancelled', appointmentStatus: 'cancelled' },
    { offset: -8, time: '10:30', name: '陶女士', phone: '13810001003', type: '新诊', project: '光子嫩肤', status: 'completed', appointmentStatus: 'completed' },
    { offset: -4, time: '15:30', name: '魏女士', phone: '13810001004', type: '复诊', project: '眼周年轻化', status: 'followup', appointmentStatus: 'arrived' },
    { offset: 2, time: '09:00', name: '杜女士', phone: '13810001005', type: '新诊', project: '水光项目', status: 'reception', appointmentStatus: 'confirmed' },
    { offset: 2, time: '10:30', name: '潘女士', phone: '13810001006', type: '复诊', project: '补水保湿', status: 'invited', appointmentStatus: 'unconfirmed' },
    { offset: 5, time: '13:30', name: '彭女士', phone: '13810001007', type: '新诊', project: '轮廓提升', status: 'invited', appointmentStatus: 'pending' },
    { offset: 9, time: '16:00', name: '韩女士', phone: '13810001008', type: '复诊', project: '敏感肌修护', status: 'reception', appointmentStatus: 'confirmed' },
    { offset: 15, time: '09:30', name: '毛女士', phone: '13810001009', type: '新诊', project: '胶原焕活', status: 'invited', appointmentStatus: 'pending' },
    { offset: 22, time: '11:00', name: '范女士', phone: '13810001010', type: '新诊', project: '玻尿酸塑形', status: 'invited', appointmentStatus: 'unconfirmed' },
    { offset: 31, time: '14:30', name: '卢女士', phone: '13810001011', type: '复诊', project: '形体管理', status: 'reception', appointmentStatus: 'confirmed' }
  ]
  return cases.map((item, index) => {
    const date = addDays(today, item.offset)
    const id = `APPOINTMENT-DEMO-${String(index + 1).padStart(2, '0')}`
    const logs = buildInitialLogs(id, item.status, index).map((log) => ({ ...log, time: `${date}${log.time.slice(10)}` }))
    if (item.status === 'cancelled') {
      logs.push({
        id: `${id}-cancelled`,
        time: `${date} 08:40`,
        operator: '市场·苏晴',
        action: '取消预约',
        detail: '顾客行程临时调整',
        fromStatus: 'invited',
        toStatus: 'cancelled',
        type: 'danger'
      })
    }
    return {
      id,
      businessDate: date,
      appointmentTime: item.time,
      diagnosisType: item.type,
      store: '科臻澳总店',
      vip1: { name: item.name, phone: item.phone },
      vip2: index % 3 === 0 ? { name: '同行顾客', phone: `13910001${String(index).padStart(3, '0')}` } : null,
      cardConsultant: '',
      beautyConsultant: '',
      estimatedProject: item.project,
      projects: [item.project],
      estimatedAmount: 0,
      paymentType: item.status === 'completed' ? 'cash' : 'none',
      revenue: item.status === 'completed' ? 6800 + index * 300 : 0,
      cardAmount: 0,
      note: '预约日历演示案例',
      assignments: { market: '苏晴', service: '顾妍', butler: '安然', director: '林珊', manager: '韩经理' },
      storeManager: '周店长',
      department: index % 2 ? '皮肤管理科' : '抗衰中心',
      followupDate: addDays(date, 1),
      completedDate: item.status === 'completed' ? addDays(date, 1) : '',
      status: item.status,
      appointmentStatus: item.appointmentStatus,
      flags: item.status === 'cancelled' ? ['历史取消案例'] : [],
      source: 'appointment-demo',
      logs
    }
  })
}

function statusName(status) {
  return statusMeta[status]?.label || status
}

function staffDisplay(record) {
  return [
    { label: '卡姐', name: record.cardConsultant },
    { label: '美导', name: record.beautyConsultant },
    { label: '市场', name: record.assignments.market },
    { label: '客服', name: record.assignments.service },
    { label: '管家', name: record.assignments.butler },
    { label: '经理', name: record.assignments.manager },
    { label: '总监', name: record.assignments.director }
    ,{ label: '场控', name: record.assignments.floorControl }
    ,{ label: '咨询', name: record.assignments.consultant }
    ,{ label: '医生', name: record.assignments.doctor || record.doctorDiagnosis?.doctor }
    ,{ label: '护士', name: record.assignments.nurse || record.doctorDiagnosis?.nurse }
  ]
}

function attentionTone(record) {
  return record.status === 'cancelled' ? 'danger' : record.flags.some((x) => x.includes('改期')) ? 'warning' : 'info'
}

function attentionIcon(record) {
  return record.status === 'cancelled' ? '取' : record.flags.some((x) => x.includes('改期')) ? '改' : '!'
}
</script>
