<template>
  <section class="customer-page">
    <section class="customer-kpis">
      <article><span class="blue"><el-icon><UserFilled /></el-icon></span><div><p>顾客总数</p><strong>{{ activeCustomerCount }}</strong></div></article>
      <article><span class="purple"><el-icon><Medal /></el-icon></span><div><p>高等级会员</p><strong>{{ premiumCount }}</strong></div></article>
      <article><span class="green"><el-icon><Wallet /></el-icon></span><div><p>储值余额</p><strong>¥{{ money(totalBalance) }}</strong></div></article>
      <article><span class="orange"><el-icon><Tickets /></el-icon></span><div><p>剩余项目</p><strong>{{ totalRemaining }}</strong></div></article>
    </section>

    <section class="customer-list-panel">
      <div class="customer-filters">
        <el-input v-model="keyword" clearable placeholder="搜索姓名或手机号">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="storeFilter" :disabled="role !== 'admin'">
          <el-option v-if="role === 'admin'" label="全部门店" value="all" />
          <el-option v-for="store in stores" :key="store" :label="store" :value="store" />
        </el-select>
        <el-select v-model="levelFilter">
          <el-option label="全部会员等级" value="all" />
          <el-option v-for="level in memberLevels" :key="level" :label="level" :value="level" />
        </el-select>
        <el-select v-model="statusFilter">
          <el-option label="启用中" value="active" />
          <el-option label="已暂停" value="paused" />
          <el-option v-if="role === 'admin'" label="已删除" value="deleted" />
          <el-option label="全部状态" value="all" />
        </el-select>
        <el-date-picker v-model="visitRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="最近到店起" end-placeholder="最近到店止" clearable />
        <el-button class="toolbar-action" type="primary" :icon="Plus" @click="openCustomerForm()">新增顾客</el-button>
      </div>

      <el-table :data="pagedCustomers" stripe @sort-change="handleSort">
        <el-table-column label="顾客" min-width="160">
          <template #default="{ row }">
            <button class="customer-name-cell" @click="openCustomerDetail(row)">
              <span>{{ row.name.slice(0, 1) }}</span>
              <div><strong>{{ row.name }}</strong><small>{{ maskPhone(row.phone) }}</small></div>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="memberLevel" label="会员等级" width="105">
          <template #default="{ row }"><el-tag :type="levelType(row.memberLevel)" round>{{ row.memberLevel }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="store" label="所属门店" min-width="130" />
        <el-table-column prop="balance" label="储值金额" width="115" sortable="custom" align="right">
          <template #default="{ row }">¥{{ money(row.balance) }}</template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="85" sortable="custom" align="right" />
        <el-table-column label="剩余项目" width="95" align="center">
          <template #default="{ row }">{{ remainingCount(row) }}</template>
        </el-table-column>
        <el-table-column prop="lastVisit" label="最近到店" width="112" sortable="custom">
          <template #default="{ row }">{{ row.lastVisit || '暂无' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="86">
          <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openCustomerDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 'deleted'" link @click="openCustomerForm(row)">编辑</el-button>
            <el-button v-if="canManageAssets && row.status === 'active'" link type="warning" @click="changeStatus(row, 'paused')">暂停</el-button>
            <el-button v-if="canManageAssets && row.status !== 'active'" link type="success" @click="changeStatus(row, 'active')">恢复</el-button>
            <el-button v-if="canManageAssets && row.status !== 'deleted'" link type="danger" @click="removeCustomer(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="customer-pagination">
        <span>共 {{ filteredCustomers.length }} 位顾客</span>
        <el-pagination v-model:current-page="currentPage" background layout="prev, pager, next" :page-size="pageSize" :total="filteredCustomers.length" />
      </div>
    </section>

    <el-drawer v-model="detailVisible" size="780px" :with-header="false" class="customer-detail-drawer">
      <template v-if="activeCustomer">
        <div class="archive-drawer-head">
          <div class="archive-profile">
            <span>{{ activeCustomer.name.slice(0, 1) }}</span>
            <div><p>顾客编号 {{ activeCustomer.id }}</p><h2>{{ activeCustomer.name }}</h2><small>{{ maskPhone(activeCustomer.phone) }} · {{ activeCustomer.store }}</small></div>
          </div>
          <div class="archive-head-actions"><el-tag :type="statusType(activeCustomer.status)">{{ statusLabel(activeCustomer.status) }}</el-tag></div>
        </div>

        <div class="asset-overview">
          <article><p>储值余额</p><strong>¥{{ money(activeCustomer.balance) }}</strong></article>
          <article><p>会员积分</p><strong>{{ activeCustomer.points }}</strong></article>
          <article><p>累计消费</p><strong>¥{{ money(customerSpend(activeCustomer)) }}</strong><small>{{ customerRecords(activeCustomer).length }} 次到店</small></article>
          <article><p>剩余项目</p><strong>{{ remainingCount(activeCustomer) }}</strong></article>
        </div>

        <el-tabs v-model="detailTab">
          <el-tab-pane label="基础信息" name="basic">
            <div class="archive-section">
              <h3>个人基本信息</h3>
              <dl class="archive-detail-grid">
                <div><dt>姓名</dt><dd>{{ activeCustomer.name }}</dd></div>
                <div><dt>性别</dt><dd>{{ activeCustomer.gender || '未填写' }}</dd></div>
                <div><dt>生日</dt><dd>{{ activeCustomer.birthday || '未填写' }}</dd></div>
                <div><dt>电话</dt><dd>{{ activeCustomer.phone }}</dd></div>
                <div><dt>会员等级</dt><dd>{{ activeCustomer.memberLevel }}</dd></div>
                <div><dt>顾客来源</dt><dd>{{ activeCustomer.source || '业务单同步' }}</dd></div>
              </dl>
            </div>
            <div class="archive-section">
              <h3>人员归属</h3>
              <dl class="archive-detail-grid">
                <div v-for="roleItem in ownerRoles" :key="roleItem.key"><dt>{{ roleItem.label }}</dt><dd>{{ activeCustomer.owners?.[roleItem.key] || '未分配' }}</dd></div>
              </dl>
            </div>
            <div class="archive-section">
              <h3>服务偏好与铺垫</h3>
              <dl class="archive-notes">
                <div><dt>特殊喜好</dt><dd>{{ activeCustomer.preferences || '暂无记录' }}</dd></div>
                <div><dt>禁忌事项</dt><dd>{{ activeCustomer.taboos || '暂无记录' }}</dd></div>
                <div><dt>铺垫内容</dt><dd>{{ activeCustomer.preparation || '暂无记录' }}</dd></div>
                <div><dt>内部备注</dt><dd>{{ activeCustomer.note || '暂无记录' }}</dd></div>
              </dl>
            </div>
          </el-tab-pane>

          <el-tab-pane label="项目资产" name="packages">
            <div class="tab-action-row"><p>套餐次数只能通过购买或核销调整，并保留完整日志。</p><el-button v-if="canManageAssets" type="primary" @click="openPackageDialog()">购买套餐</el-button></div>
            <el-table :data="activeCustomer.packages" empty-text="暂无已购项目">
              <el-table-column prop="project" label="项目" min-width="150" />
              <el-table-column label="资产来源" min-width="125"><template #default="{ row }">{{ row.sourceType === 'activityPackage' ? row.packageName || '活动套餐' : '单项目次数' }}</template></el-table-column>
              <el-table-column prop="purchased" label="购买次数" width="90" align="center" />
              <el-table-column prop="used" label="已用" width="70" align="center" />
              <el-table-column label="剩余" width="70" align="center"><template #default="{ row }">{{ row.purchased - row.used }}</template></el-table-column>
              <el-table-column prop="amount" label="购买金额" width="105"><template #default="{ row }">¥{{ money(row.amount) }}</template></el-table-column>
              <el-table-column prop="expiry" label="有效期" width="110" />
              <el-table-column v-if="canManageAssets" label="操作" width="82"><template #default="{ row }"><el-button link type="primary" :disabled="activeCustomer.status !== 'active' || row.used >= row.purchased" @click="openPackageDialog(row)">核销</el-button></template></el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="服务记录" name="records">
            <el-table :data="customerRecords(activeCustomer)" empty-text="暂无业务记录">
              <el-table-column prop="businessDate" label="日期" width="110" />
              <el-table-column prop="diagnosisType" label="类型" width="70" />
              <el-table-column label="项目" min-width="190"><template #default="{ row }">{{ row.projects?.join('、') || row.estimatedProject }}</template></el-table-column>
              <el-table-column label="消费" width="110"><template #default="{ row }">¥{{ money(Number(row.revenue || 0) + Number(row.cardAmount || 0)) }}</template></el-table-column>
              <el-table-column label="操作" width="72"><template #default="{ row }"><el-button link type="primary" @click="$emit('open-record', row)">业务单</el-button></template></el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="术前术后照片" name="photos">
            <div class="photo-notice"><el-icon><Lock /></el-icon>照片仅压缩保存在当前浏览器，不会上传网络。</div>
            <div class="tab-action-row"><p>按项目归档顾客术前、术后影像。</p><el-button type="primary" @click="photoDialogVisible = true">上传照片</el-button></div>
            <div v-if="customerPhotos.length" class="photo-grid">
              <article v-for="photo in customerPhotos" :key="photo.id">
                <el-image :src="photo.dataUrl" :preview-src-list="customerPhotos.map(x => x.dataUrl)" fit="cover" />
                <div><el-tag size="small" :type="photo.type === 'before' ? 'warning' : 'success'">{{ photo.type === 'before' ? '术前' : '术后' }}</el-tag><strong>{{ photo.project }}</strong></div>
                <p>{{ photo.date }} · {{ photo.note || '无备注' }}</p>
                <el-button link type="danger" @click="deletePhoto(photo)">删除</el-button>
              </article>
            </div>
            <el-empty v-else description="暂无影像资料" />
          </el-tab-pane>

          <el-tab-pane label="回访记录" name="followups">
            <div class="tab-action-row"><p>沉淀顾客术后沟通、满意度、消费力评级及回访影像。</p><el-button type="primary" @click="openFollowupDialog">新增回访记录</el-button></div>
            <el-timeline v-if="customerFollowups.length" class="followup-timeline">
              <el-timeline-item v-for="item in customerFollowups" :key="item.id" :timestamp="item.date" type="success">
                <div class="followup-record-head"><strong>{{ item.method }}回访</strong><el-tag size="small" :type="satisfactionType(item.satisfaction)">{{ item.satisfaction }}</el-tag><el-tag size="small" effect="plain">{{ item.spendingPower }}</el-tag></div>
                <p>{{ item.note }}</p><small v-if="item.nextDate">下次跟进：{{ item.nextDate }}</small>
                <div v-if="followupPhotosFor(item.id).length" class="followup-photo-list"><el-image v-for="photo in followupPhotosFor(item.id)" :key="photo.id" :src="photo.dataUrl" :preview-src-list="followupPhotos.map(x=>x.dataUrl)" fit="cover" /></div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无回访记录" />
          </el-tab-pane>

          <el-tab-pane label="资产与操作日志" name="logs">
            <el-timeline>
              <el-timeline-item v-for="log in sortedLogs(activeCustomer)" :key="log.id" :timestamp="log.time" :type="log.type || 'primary'">
                <strong>{{ log.action }}</strong><p>{{ log.operator }} · {{ log.detail }}</p>
                <small v-if="log.before !== undefined">{{ log.before }} → {{ log.after }}</small>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
        <div class="archive-action-footer">
          <el-button @click="openCustomerForm(activeCustomer)">编辑资料</el-button>
          <template v-if="canManageAssets">
            <el-button @click="openAssetDialog('balance')">调整储值</el-button>
            <el-button @click="openAssetDialog('points')">调整积分</el-button>
            <el-button @click="openPackageDialog(null, 'activityPackage')">购买活动套餐</el-button>
            <el-button type="primary" @click="openRechargeDialog">会员充值</el-button>
          </template>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="customerFormVisible" :title="editingCustomerId ? '编辑顾客资料' : '新增顾客'" width="720px">
      <el-form ref="customerFormRef" :model="customerForm" :rules="customerRules" label-position="top">
        <div class="archive-form-grid">
          <el-form-item label="姓名" prop="name"><el-input v-model="customerForm.name" /></el-form-item>
          <el-form-item label="手机号" prop="phone"><el-input v-model="customerForm.phone" :disabled="Boolean(editingCustomerId)" /></el-form-item>
          <el-form-item label="性别"><el-select v-model="customerForm.gender"><el-option label="女" value="女" /><el-option label="男" value="男" /><el-option label="未填写" value="" /></el-select></el-form-item>
          <el-form-item label="生日"><el-date-picker v-model="customerForm.birthday" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="所属门店" prop="store"><el-select v-model="customerForm.store" :disabled="role !== 'admin'"><el-option v-for="store in stores" :key="store" :label="store" :value="store" /></el-select></el-form-item>
          <el-form-item label="会员等级"><el-select v-model="customerForm.memberLevel"><el-option v-for="level in memberLevels" :key="level" :label="level" :value="level" /></el-select></el-form-item>
          <el-form-item label="顾客来源"><el-input v-model="customerForm.source" /></el-form-item>
          <el-form-item label="客户标签"><el-select v-model="customerForm.tags" multiple filterable allow-create default-first-option><el-option v-for="tag in ['高消费力','中消费力','潜力客户','高度满意','满意','需关注']" :key="tag" :label="tag" :value="tag" /></el-select></el-form-item>
          <el-form-item label="特殊喜好"><el-input v-model="customerForm.preferences" /></el-form-item>
        </div>
        <div class="archive-form-grid customer-owner-form">
          <el-form-item v-for="roleItem in ownerRoles" :key="roleItem.key" :label="roleItem.label"><el-select v-model="customerForm.owners[roleItem.key]" clearable placeholder="请选择员工"><el-option v-for="employee in staffOptionsFor(roleItem.key)" :key="employee.code" :label="employee.name" :value="employee.name" /></el-select></el-form-item>
        </div>
        <el-form-item label="禁忌事项"><el-input v-model="customerForm.taboos" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="铺垫内容"><el-input v-model="customerForm.preparation" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="内部备注"><el-input v-model="customerForm.note" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="customerFormVisible = false">取消</el-button><el-button type="primary" @click="saveCustomer">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="assetDialogVisible" :title="assetType === 'balance' ? '储值调整单' : '积分调整单'" width="520px">
      <el-form ref="assetFormRef" :model="assetForm" :rules="assetRules" label-position="top">
        <el-form-item label="调整类型" prop="action"><el-select v-model="assetForm.action"><el-option v-for="x in ['充值','扣减','赠送','冲正']" :key="x" :label="x" :value="x" /></el-select></el-form-item>
        <el-form-item label="调整数量" prop="amount"><el-input-number v-model="assetForm.amount" :min="1" :step="assetType === 'balance' ? 100 : 10" /></el-form-item>
        <el-form-item label="调整原因" prop="reason"><el-input v-model="assetForm.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="assetDialogVisible = false">取消</el-button><el-button type="primary" @click="submitAssetAdjustment">提交调整单</el-button></template>
    </el-dialog>

    <el-dialog v-model="rechargeVisible" title="会员充值" width="520px">
      <el-form :model="rechargeForm" label-position="top">
        <div class="archive-form-grid"><el-form-item label="充值金额"><el-input-number v-model="rechargeForm.amount" :min="1" :step="1000" @change="syncRechargePaid" /></el-form-item><el-form-item label="折扣比例"><el-input-number v-model="rechargeForm.discount" :min="0.01" :max="1" :step="0.01" @change="syncRechargePaid" /></el-form-item><el-form-item label="实际付款金额"><el-input-number v-model="rechargeForm.paid" :min="0" :step="100" @change="markRechargePaidManual" /><small class="form-help">默认按充值金额 × 折扣比例计算</small></el-form-item><el-form-item label="VIP等级"><el-select v-model="rechargeForm.memberLevel"><el-option v-for="level in memberLevels" :key="level" :label="level" :value="level" /></el-select></el-form-item></div>
        <el-form-item label="操作备注"><el-input v-model="rechargeForm.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="rechargeVisible=false">取消</el-button><el-button type="primary" @click="submitRecharge">确认充值</el-button></template>
    </el-dialog>

    <el-dialog v-model="packageDialogVisible" :title="packageMode === 'purchase' ? '购买项目套餐' : '核销项目套餐'" width="540px">
      <el-form ref="packageFormRef" :model="packageForm" :rules="packageRules" label-position="top">
        <template v-if="packageMode === 'purchase'">
          <el-form-item label="资产类型"><el-radio-group v-model="packageForm.sourceType"><el-radio-button value="singleProject">单项目次数</el-radio-button><el-radio-button value="activityPackage">活动套餐</el-radio-button></el-radio-group></el-form-item>
          <el-form-item v-if="packageForm.sourceType === 'activityPackage'" label="活动套餐"><el-select v-model="packageForm.activityPackageId" @change="applyActivityPackage"><el-option v-for="item in activityPackageOptions" :key="item.id" :label="`${item.name}（¥${money(item.packagePrice)}）`" :value="item.id" /></el-select></el-form-item>
          <el-form-item v-if="packageForm.sourceType === 'singleProject'" label="项目" prop="project"><el-select v-model="packageForm.project" filterable allow-create><el-option-group v-for="group in projectCatalog" :key="group.label" :label="group.label"><el-option v-for="project in group.options" :key="project" :label="project" :value="project" /></el-option-group></el-select></el-form-item>
          <el-form-item v-if="packageForm.sourceType === 'singleProject'" label="购买次数" prop="count"><el-input-number v-model="packageForm.count" :min="1" /></el-form-item>
          <el-form-item v-else label="套餐包含项目"><el-text>{{ selectedActivityPackage?.projects?.map(item => `${item.name} × ${item.count}`).join('、') || '请选择活动套餐' }}</el-text></el-form-item>
          <el-form-item label="购买金额" prop="amount"><el-input-number v-model="packageForm.amount" :min="0" :step="1000" /></el-form-item>
          <el-form-item label="有效期"><el-date-picker v-model="packageForm.expiry" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        </template>
        <template v-else>
          <el-alert :title="`${packageForm.project} 当前剩余 ${packageForm.remaining} 次`" type="info" :closable="false" />
          <el-form-item class="reason-field" label="核销次数" prop="count"><el-input-number v-model="packageForm.count" :min="1" :max="packageForm.remaining" /></el-form-item>
        </template>
        <el-form-item label="备注/原因" prop="reason"><el-input v-model="packageForm.reason" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="packageDialogVisible = false">取消</el-button><el-button type="primary" @click="submitPackage">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="photoDialogVisible" title="上传顾客影像" width="560px">
      <el-form ref="photoFormRef" :model="photoForm" :rules="photoRules" label-position="top">
        <el-form-item label="照片类型" prop="type"><el-radio-group v-model="photoForm.type"><el-radio-button value="before">术前照片</el-radio-button><el-radio-button value="after">术后照片</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="关联项目" prop="project"><el-select v-model="photoForm.project" filterable allow-create><el-option v-for="project in allProjects" :key="project" :label="project" :value="project" /></el-select></el-form-item>
        <el-form-item label="拍摄日期" prop="date"><el-date-picker v-model="photoForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="选择图片" prop="file"><input type="file" accept="image/*" @change="onPhotoSelected" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="photoForm.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="photoDialogVisible = false">取消</el-button><el-button type="primary" @click="savePhoto">压缩并保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="followupDialogVisible" title="新增顾客回访" width="620px">
      <el-form ref="followupFormRef" :model="followupForm" :rules="followupRules" label-position="top">
        <div class="archive-form-grid"><el-form-item label="回访日期" prop="date"><el-date-picker v-model="followupForm.date" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="回访方式" prop="method"><el-select v-model="followupForm.method"><el-option v-for="item in ['电话','微信','到店']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="顾客满意度" prop="satisfaction"><el-select v-model="followupForm.satisfaction"><el-option v-for="item in ['高度满意','满意','一般','不满意']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="消费力评级" prop="spendingPower"><el-select v-model="followupForm.spendingPower"><el-option v-for="item in ['高消费力','中消费力','潜力客户']" :key="item" :label="item" :value="item" /></el-select></el-form-item><el-form-item label="下次跟进"><el-date-picker v-model="followupForm.nextDate" type="date" value-format="YYYY-MM-DD" /></el-form-item></div>
        <el-form-item label="回访记录" prop="note"><el-input v-model="followupForm.note" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="回访照片"><input type="file" accept="image/*" @change="onFollowupPhotoSelected" /><small>可选；照片仅保存在当前浏览器。</small></el-form-item>
      </el-form>
      <template #footer><el-button @click="followupDialogVisible=false">取消</el-button><el-button type="primary" @click="saveFollowup">保存回访记录</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Lock, Medal, Plus, Search, Tickets, UserFilled, Wallet } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  records: { type: Array, required: true },
  role: { type: String, required: true },
  roleMeta: { type: Object, required: true },
  stores: { type: Array, required: true },
  staffOptions: { type: Array, default: () => [] },
  projectCatalog: { type: Array, required: true },
  focusPhone: { type: String, default: '' },
  focusRequest: { type: Number, default: 0 }
})
defineEmits(['open-record'])

const STORAGE_KEY = 'cosmetic-customer-archive-v1'
const memberLevels = ['普通会员', '银卡', '金卡', '铂金', '黑金']
const ownerRoles = [{ key: 'cardConsultant', label: '卡姐' }, { key: 'beautyConsultant', label: '美导' }, { key: 'market', label: '市场' }, { key: 'service', label: '客服' }, { key: 'butler', label: '管家' }, { key: 'manager', label: '经理' }, { key: 'director', label: '总监' }]
const keyword = ref('')
const storeFilter = ref(props.role === 'admin' ? 'all' : props.roleMeta.store)
const levelFilter = ref('all')
const statusFilter = ref('active')
const visitRange = ref(null)
const currentPage = ref(1)
const pageSize = 15
const sortState = ref({ prop: 'lastVisit', order: 'descending' })
const detailVisible = ref(false)
const detailTab = ref('basic')
const activeCustomerId = ref(null)
const customerFormVisible = ref(false)
const customerFormRef = ref()
const editingCustomerId = ref(null)
const assetDialogVisible = ref(false)
const rechargeVisible = ref(false)
const rechargePaidManually = ref(false)
const assetFormRef = ref()
const assetType = ref('balance')
const packageDialogVisible = ref(false)
const packageFormRef = ref()
const packageMode = ref('purchase')
const photoDialogVisible = ref(false)
const photoFormRef = ref()
const selectedPhotoFile = ref(null)
const customerPhotos = ref([])
const followupPhotos = ref([])
const followupDialogVisible = ref(false)
const followupFormRef = ref()
const selectedFollowupPhotoFile = ref(null)

const customerForm = reactive({})
const assetForm = reactive({})
const rechargeForm = reactive({ amount: 1000, discount: 1, paid: 1000, memberLevel: '普通会员', note: '' })
const packageForm = reactive({})
const photoForm = reactive({ type: 'before', project: '', date: today(), note: '', file: '' })
const followupForm = reactive({ date: today(), method: '电话', satisfaction: '满意', spendingPower: '中消费力', nextDate: '', note: '' })
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
const customers = ref(mergeBusinessCustomers(saved, props.records))

const activeCustomer = computed(() => customers.value.find((x) => x.id === activeCustomerId.value))
const canManageAssets = computed(() => ['storeManager', 'admin'].includes(props.role))
const scopedCustomers = computed(() => customers.value.filter((x) => props.role === 'admin' || x.store === props.roleMeta.store))
const filteredCustomers = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  const rows = scopedCustomers.value.filter((x) => {
    if (storeFilter.value !== 'all' && x.store !== storeFilter.value) return false
    if (levelFilter.value !== 'all' && x.memberLevel !== levelFilter.value) return false
    if (statusFilter.value !== 'all' && x.status !== statusFilter.value) return false
    if (visitRange.value && x.lastVisit && (x.lastVisit < visitRange.value[0] || x.lastVisit > visitRange.value[1])) return false
    return !q || x.name.toLowerCase().includes(q) || x.phone.includes(q)
  })
  return rows.sort((a, b) => {
    const { prop, order } = sortState.value
    const result = String(a[prop] ?? '').localeCompare(String(b[prop] ?? ''), 'zh-CN', { numeric: true })
    return order === 'ascending' ? result : -result
  })
})
const pagedCustomers = computed(() => filteredCustomers.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const activeCustomerCount = computed(() => scopedCustomers.value.filter((x) => x.status === 'active').length)
const premiumCount = computed(() => scopedCustomers.value.filter((x) => ['金卡', '铂金', '黑金'].includes(x.memberLevel) && x.status === 'active').length)
const totalBalance = computed(() => scopedCustomers.value.reduce((sum, x) => sum + Number(x.balance || 0), 0))
const totalRemaining = computed(() => scopedCustomers.value.reduce((sum, x) => sum + remainingCount(x), 0))
const allProjects = computed(() => [...new Set(props.projectCatalog.flatMap((x) => x.options))])
const customerFollowups = computed(() => [...(activeCustomer.value?.followups || [])].sort((a,b) => b.date.localeCompare(a.date)))
const activityPackageOptions = computed(() => JSON.parse(localStorage.getItem('cosmetic-settings-data-v1') || 'null')?.activityPackages?.filter(item => item.status === 'active') || [])
const selectedActivityPackage = computed(() => activityPackageOptions.value.find(item => item.id === packageForm.activityPackageId))

const customerRules = {
  name: [{ required: true, message: '请填写顾客姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入11位手机号', trigger: 'blur' }
  ],
  store: [{ required: true, message: '请选择所属门店', trigger: 'change' }]
}
const assetRules = {
  action: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  amount: [{ required: true, message: '请填写调整数量', trigger: 'change' }],
  reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
}
const packageRules = {
  project: [{ required: true, message: '请选择项目', trigger: 'change' }],
  count: [{ required: true, message: '请填写次数', trigger: 'change' }],
  amount: [{ required: true, message: '请填写金额', trigger: 'change' }],
  reason: [{ required: true, message: '请填写原因', trigger: 'blur' }]
}
const photoRules = {
  type: [{ required: true, message: '请选择照片类型', trigger: 'change' }],
  project: [{ required: true, message: '请选择关联项目', trigger: 'change' }],
  date: [{ required: true, message: '请选择拍摄日期', trigger: 'change' }],
  file: [{ validator: (_r, _v, cb) => selectedPhotoFile.value ? cb() : cb(new Error('请选择图片')), trigger: 'change' }]
}
const followupRules = { date:[{required:true,message:'请选择回访日期',trigger:'change'}], method:[{required:true,message:'请选择回访方式',trigger:'change'}], satisfaction:[{required:true,message:'请选择满意度',trigger:'change'}], spendingPower:[{required:true,message:'请选择消费力评级',trigger:'change'}], note:[{required:true,message:'请填写回访记录',trigger:'blur'}] }

watch(customers, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })
watch(() => props.records, (value) => { customers.value = mergeBusinessCustomers(customers.value, value) }, { deep: true })
watch(() => props.role, () => { storeFilter.value = props.role === 'admin' ? 'all' : props.roleMeta.store })
watch(() => props.focusRequest, () => {
  if (!props.focusPhone) return
  const customer = customers.value.find((x) => normalizePhone(x.phone) === normalizePhone(props.focusPhone))
  if (customer) openCustomerDetail(customer)
}, { immediate: true })
watch([keyword, storeFilter, levelFilter, statusFilter, visitRange], () => { currentPage.value = 1 })

function mergeBusinessCustomers(existing, records) {
  const map = new Map(existing.map((x) => [normalizePhone(x.phone), x]))
  records.forEach((record) => {
    ;[record.vip1, record.vip2].filter(Boolean).forEach((person, index) => {
      const phone = normalizePhone(person.phone)
      if (!/^1\d{10}$/.test(phone)) return
      const current = map.get(phone)
      if (!current) {
        map.set(phone, {
          id: `C${phone.slice(-6)}`, name: person.name, phone, gender: '女', birthday: '',
          store: record.store, source: index === 0 ? 'VIP1业务同步' : 'VIP2同行同步',
          memberLevel: recordAmount(record) >= 10000 ? '金卡' : '普通会员', status: 'active',
          preferences: '', taboos: '', preparation: '', note: '', owners: ownerSnapshot(record), balance: 0,
          points: Math.round(recordAmount(record) / 10), packages: seedPackages(record),
          createdAt: nowText(), logs: [makeLog('自动建档', `由${index === 0 ? 'VIP1' : 'VIP2'}业务单 ${record.id} 自动生成`, 'success')]
        })
      } else {
        current.name ||= person.name
        current.store ||= record.store
        current.packages ||= []
        current.logs ||= []
      }
    })
  })
  map.forEach((customer) => {
    const related = records.filter((record) => [record.vip1, record.vip2].filter(Boolean).some((person) => normalizePhone(person.phone) === normalizePhone(customer.phone)))
    customer.lastVisit = related.map((record) => record.businessDate).sort().at(-1) || customer.lastVisit || ''
    customer.owners ||= {}
    const latestRecord = [...related].sort((a, b) => `${a.businessDate}${a.appointmentTime}`.localeCompare(`${b.businessDate}${b.appointmentTime}`)).at(-1)
    if (latestRecord) Object.entries(ownerSnapshot(latestRecord)).forEach(([key, value]) => { if (!customer.owners[key] && value) customer.owners[key] = value })
    customer.visitCount = related.length
    customer.totalSpend = related.reduce((sum, record) => sum + recordAmount(record), 0)
    const projectUsage = new Map()
    related.filter((record) => recordAmount(record) > 0).forEach((record) => {
      ;(record.projects || [record.estimatedProject]).filter(Boolean).forEach((project) => {
        projectUsage.set(project, (projectUsage.get(project) || 0) + 1)
      })
    })
    customer.packages ||= []
    customer.packages.forEach((pkg) => { pkg.sourceType ||= 'singleProject' })
    projectUsage.forEach((used, project) => {
      const synced = customer.packages.find((pkg) => pkg.origin === 'business-sync' && pkg.project === project)
      if (synced) {
        synced.used = used
        synced.purchased = Math.max(synced.purchased, used)
      } else {
        customer.packages.push({
          id: `PKSYNC${customer.id}${project}`,
          project,
          purchased: Math.max(5, used),
          used,
          amount: related.filter((record) => (record.projects || []).includes(project)).reduce((sum, record) => sum + recordAmount(record), 0),
          expiry: addDays(today(), 365),
          status: 'active',
          origin: 'business-sync'
        })
      }
    })
    customer.points = Number(customer.points || 0)
    customer.balance = Number(customer.balance || 0)
    customer.status ||= 'active'
    customer.memberLevel ||= '普通会员'
  })
  return [...map.values()]
}
function seedPackages(record) {
  if (!record.projects?.length || !recordAmount(record)) return []
  return record.projects.slice(0, 1).map((project) => ({ id: `PK${Date.now()}${project}`, project, purchased: 5, used: 1, amount: recordAmount(record), expiry: addDays(today(), 365), status: 'active', origin: 'business-sync' }))
}
function openCustomerDetail(customer) {
  activeCustomerId.value = customer.id
  detailTab.value = 'basic'
  detailVisible.value = true
  loadPhotos()
}
function openCustomerForm(customer) {
  editingCustomerId.value = customer?.id || null
  Object.keys(customerForm).forEach((key) => delete customerForm[key])
  Object.assign(customerForm, customer ? { ...customer, tags:[...(customer.tags || [])], owners: { ...(customer.owners || {}) } } : {
    name: '', phone: '', gender: '女', birthday: '', store: props.role === 'admin' ? props.stores[0] : props.roleMeta.store,
    memberLevel: '普通会员', source: '手工建档', tags:[], preferences: '', taboos: '', preparation: '', note: '', owners: {}
  })
  customerFormVisible.value = true
}
async function saveCustomer() {
  if (!await customerFormRef.value?.validate().catch(() => false)) return
  const duplicate = customers.value.find((x) => normalizePhone(x.phone) === normalizePhone(customerForm.phone) && x.id !== editingCustomerId.value)
  if (duplicate) {
    customerFormVisible.value = false
    openCustomerDetail(duplicate)
    ElMessage.warning('该手机号已有档案，已为您打开')
    return
  }
  if (editingCustomerId.value) {
    const target = customers.value.find((x) => x.id === editingCustomerId.value)
    const oldStore = target.store
    Object.assign(target, customerForm)
    target.logs.push(makeLog('编辑顾客资料', oldStore !== target.store ? `顾客转店：${oldStore} → ${target.store}` : '更新基础资料'))
  } else {
    const phone = normalizePhone(customerForm.phone)
    customers.value.push({
      ...customerForm, phone, id: `C${phone.slice(-6)}`, status: 'active', balance: 0, points: 0,
      packages: [], createdAt: nowText(), logs: [makeLog('手工建档', '新增顾客档案', 'success')]
    })
  }
  customerFormVisible.value = false
  ElMessage.success('顾客档案已保存')
}
async function changeStatus(customer, status) {
  const label = status === 'active' ? '恢复' : '暂停'
  await ElMessageBox.confirm(`确认${label}顾客“${customer.name}”？`, `${label}档案`, { type: status === 'active' ? 'success' : 'warning' })
  customer.status = status
  customer.logs.push(makeLog(`${label}档案`, `档案状态调整为${statusLabel(status)}`, status === 'active' ? 'success' : 'warning'))
}
async function removeCustomer(customer) {
  const hasRelations = customerRecords(customer).length || customer.packages?.length || customer.balance || customer.points || (await photoCount(customer.id))
  if (hasRelations) {
    await ElMessageBox.confirm('该顾客已有业务、资产或照片，只能移入已删除档案，是否继续？', '软删除档案', { type: 'warning' })
    customer.status = 'deleted'
    customer.logs.push(makeLog('软删除档案', '档案移入已删除列表', 'danger'))
  } else {
    await ElMessageBox.confirm('该手工档案无关联数据，将被彻底删除。', '彻底删除', { type: 'error' })
    customers.value = customers.value.filter((x) => x.id !== customer.id)
  }
}
function openAssetDialog(type) {
  if (activeCustomer.value.status !== 'active') return ElMessage.warning('暂停或已删除顾客不能调整资产')
  assetType.value = type
  Object.assign(assetForm, { action: type === 'balance' ? '充值' : '赠送', amount: type === 'balance' ? 1000 : 100, reason: '' })
  assetDialogVisible.value = true
}
function openRechargeDialog() {
  const customer = activeCustomer.value
  Object.assign(rechargeForm, { amount: 1000, discount: 1, paid: 1000, memberLevel: customer.memberLevel || '普通会员', note: '' })
  rechargePaidManually.value = false
  rechargeVisible.value = true
}
function syncRechargePaid() {
  if (!rechargePaidManually.value) rechargeForm.paid = Number((Number(rechargeForm.amount || 0) * Number(rechargeForm.discount || 0)).toFixed(2))
}
function markRechargePaidManual() { rechargePaidManually.value = true }
function submitRecharge() {
  const customer = activeCustomer.value
  const expected = Number((rechargeForm.amount * rechargeForm.discount).toFixed(2))
  if (Number(rechargeForm.paid) !== expected && !rechargeForm.note.trim()) return ElMessage.warning('实际付款与折扣计算不一致时，请填写操作备注')
  const before = Number(customer.balance || 0)
  customer.balance = before + Number(rechargeForm.amount || 0)
  customer.memberLevel = rechargeForm.memberLevel
  customer.logs.push({ ...makeLog('会员充值', `充值¥${money(rechargeForm.amount)}；折扣${rechargeForm.discount}；实付¥${money(rechargeForm.paid)}；${rechargeForm.note || '标准折扣'}`, 'success'), before, after: customer.balance })
  rechargeVisible.value = false
  ElMessage.success('会员充值已到账并记录流水')
}
async function submitAssetAdjustment() {
  if (!await assetFormRef.value?.validate().catch(() => false)) return
  const customer = activeCustomer.value
  const field = assetType.value === 'balance' ? 'balance' : 'points'
  const before = Number(customer[field] || 0)
  const negative = ['扣减', '冲正'].includes(assetForm.action)
  const after = before + (negative ? -assetForm.amount : assetForm.amount)
  if (after < 0) return ElMessage.error('调整后余额不能小于0')
  customer[field] = after
  customer.logs.push({ ...makeLog(`${assetForm.action}${assetType.value === 'balance' ? '储值' : '积分'}`, assetForm.reason), before, after })
  assetDialogVisible.value = false
  ElMessage.success('资产调整单已生效')
}
function openPackageDialog(pkg, sourceType = 'singleProject') {
  if (activeCustomer.value.status !== 'active') return ElMessage.warning('暂停或已删除顾客不能调整套餐')
  packageMode.value = pkg ? 'consume' : 'purchase'
  Object.keys(packageForm).forEach((key) => delete packageForm[key])
  Object.assign(packageForm, pkg ? { id: pkg.id, project: pkg.project, count: 1, remaining: pkg.purchased - pkg.used, reason: '' } : { sourceType, activityPackageId: '', project: '', count: 1, amount: 0, expiry: addDays(today(), 365), reason: '' })
  packageDialogVisible.value = true
}
function applyActivityPackage() {
  const selected = selectedActivityPackage.value
  if (!selected) return
  packageForm.amount = selected.packagePrice
  packageForm.expiry = addMonths(today(), Number(selected.validMonths || Number(selected.validYears || 1) * 12))
}
async function submitPackage() {
  if (!await packageFormRef.value?.validate().catch(() => false)) return
  const customer = activeCustomer.value
  if (packageMode.value === 'purchase') {
    if (packageForm.sourceType === 'activityPackage') {
      const selected = selectedActivityPackage.value
      if (!selected) return ElMessage.warning('请选择活动套餐')
      selected.projects.forEach((item, index) => customer.packages.push({ id: `PK${Date.now()}-${index}`, project: item.name, purchased: item.count, used: 0, amount: Number(item.count * item.unitPrice), expiry: packageForm.expiry, status: 'active', sourceType: 'activityPackage', packageId: selected.id, packageName: selected.name }))
      customer.logs.push(makeLog('购买活动套餐', `${selected.name}，套餐价¥${money(packageForm.amount)}；${packageForm.reason}`, 'success'))
    } else {
      customer.packages.push({ id: `PK${Date.now()}`, project: packageForm.project, purchased: packageForm.count, used: 0, amount: packageForm.amount, expiry: packageForm.expiry, status: 'active', sourceType: 'singleProject' })
      customer.logs.push(makeLog('购买单项目次数', `${packageForm.project} ${packageForm.count}次，金额¥${money(packageForm.amount)}；${packageForm.reason}`, 'success'))
    }
  } else {
    const pkg = customer.packages.find((x) => x.id === packageForm.id)
    if (packageForm.count > pkg.purchased - pkg.used) return ElMessage.error('核销次数不能超过剩余次数')
    const before = pkg.purchased - pkg.used
    pkg.used += packageForm.count
    customer.logs.push({ ...makeLog('核销项目套餐', `${pkg.project} 核销${packageForm.count}次；${packageForm.reason}`), before, after: pkg.purchased - pkg.used })
  }
  packageDialogVisible.value = false
  ElMessage.success('项目资产已更新')
}
function onPhotoSelected(event) {
  selectedPhotoFile.value = event.target.files?.[0] || null
  photoForm.file = selectedPhotoFile.value?.name || ''
  photoFormRef.value?.validateField('file')
}
function openFollowupDialog() {
  Object.assign(followupForm, { date: today(), method: '电话', satisfaction: '满意', spendingPower: '中消费力', nextDate: '', note: '' })
  selectedFollowupPhotoFile.value = null
  followupDialogVisible.value = true
}
function onFollowupPhotoSelected(event) { selectedFollowupPhotoFile.value = event.target.files?.[0] || null }
async function saveFollowup() {
  if (!await followupFormRef.value?.validate().catch(() => false)) return
  const customer = activeCustomer.value
  const followup = { id:`FU${Date.now()}`, ...followupForm, operator:`${props.roleMeta.label}·${props.roleMeta.name}`, createdAt:nowText() }
  customer.followups ||= []
  customer.followups.push(followup)
  customer.tags = [...new Set([...(customer.tags || []), followup.satisfaction, followup.spendingPower])]
  customer.logs.push(makeLog('新增顾客回访', `${followup.method}回访；${followup.satisfaction}；${followup.spendingPower}；${followup.note}`, 'success'))
  if (selectedFollowupPhotoFile.value) {
    const dataUrl = await compressImage(selectedFollowupPhotoFile.value)
    await putPhoto({ id:`FUPH${Date.now()}`, customerId:customer.id, followupId:followup.id, type:'followup', project:'回访照片', date:followup.date, note:followup.note, dataUrl, createdAt:nowText() })
  }
  await loadPhotos()
  followupDialogVisible.value = false
  ElMessage.success('回访记录已保存')
}
function followupPhotosFor(followupId) { return followupPhotos.value.filter(photo => photo.followupId === followupId) }
function satisfactionType(value) { return ({ '高度满意':'success', '满意':'primary', '一般':'warning', '不满意':'danger' })[value] || 'info' }
async function savePhoto() {
  if (!await photoFormRef.value?.validate().catch(() => false)) return
  const dataUrl = await compressImage(selectedPhotoFile.value)
  await putPhoto({ id: `PH${Date.now()}`, customerId: activeCustomer.value.id, type: photoForm.type, project: photoForm.project, date: photoForm.date, note: photoForm.note, dataUrl, createdAt: nowText() })
  activeCustomer.value.logs.push(makeLog('上传顾客影像', `${photoForm.project} ${photoForm.type === 'before' ? '术前' : '术后'}照片`))
  photoDialogVisible.value = false
  selectedPhotoFile.value = null
  Object.assign(photoForm, { type: 'before', project: '', date: today(), note: '', file: '' })
  await loadPhotos()
  ElMessage.success('照片已压缩并保存到本机浏览器')
}
async function deletePhoto(photo) {
  await ElMessageBox.confirm('确认删除该照片？', '删除影像', { type: 'warning' })
  await deletePhotoDb(photo.id)
  activeCustomer.value.logs.push(makeLog('删除顾客影像', `${photo.project}照片已删除`, 'warning'))
  await loadPhotos()
}
async function loadPhotos() { const rows = activeCustomer.value ? await getPhotos(activeCustomer.value.id) : []; customerPhotos.value = rows.filter(photo => photo.type !== 'followup'); followupPhotos.value = rows.filter(photo => photo.type === 'followup') }
function customerRecords(customer) {
  return props.records.filter((record) => [record.vip1, record.vip2].filter(Boolean).some((person) => normalizePhone(person.phone) === normalizePhone(customer.phone)))
    .sort((a, b) => `${b.businessDate} ${b.appointmentTime}`.localeCompare(`${a.businessDate} ${a.appointmentTime}`))
}
function staffOptionsFor(roleKey) {
  return props.staffOptions.filter((employee) => employee.status === 'active' && employee.roleKey === roleKey)
}

function ownerSnapshot(record) {
  return {
    cardConsultant: record.cardConsultant || '',
    beautyConsultant: record.beautyConsultant || '',
    market: record.assignments?.market || '',
    service: record.assignments?.service || '',
    butler: record.assignments?.butler || '',
    manager: record.assignments?.manager || '',
    director: record.assignments?.director || ''
  }
}

function customerSpend(customer) { return customerRecords(customer).reduce((sum, record) => sum + recordAmount(record), 0) }
function remainingCount(customer) { return (customer.packages || []).reduce((sum, pkg) => sum + Math.max(0, pkg.purchased - pkg.used), 0) }
function sortedLogs(customer) { return [...(customer.logs || [])].sort((a, b) => b.time.localeCompare(a.time)) }
function handleSort({ prop, order }) { sortState.value = { prop: prop || 'lastVisit', order: order || 'descending' } }
function normalizePhone(phone) { return String(phone || '').replace(/\D/g, '') }
function recordAmount(record) { return Number(record.revenue || 0) + Number(record.cardAmount || 0) }
function money(value) { return Number(value || 0).toLocaleString('zh-CN') }
function maskPhone(phone) { return phone ? phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : '—' }
function statusLabel(status) { return { active: '启用', paused: '暂停', deleted: '已删除' }[status] }
function statusType(status) { return { active: 'success', paused: 'warning', deleted: 'danger' }[status] }
function levelType(level) { return { 普通会员: 'info', 银卡: '', 金卡: 'warning', 铂金: 'success', 黑金: 'danger' }[level] || 'info' }
function makeLog(action, detail, type = 'primary') { return { id: `LG${Date.now()}${Math.random()}`, time: nowText(), operator: `${props.roleMeta.label}·${props.roleMeta.name}`, action, detail, type } }
function today() { return new Date().toISOString().slice(0, 10) }
function nowText() { return new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-') }
function addDays(dateString, days) { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
function addMonths(dateString, months) { const date = new Date(`${dateString}T12:00:00`); date.setMonth(date.getMonth() + Number(months || 0)); return date.toISOString().slice(0, 10) }

async function compressImage(file) {
  const source = await fileToDataUrl(file)
  const image = await loadImage(source)
  const max = 1280
  const scale = Math.min(1, max / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.78)
}
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) }) }
function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src }) }
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cosmetic-customer-media', 1)
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('photos')) { const store = db.createObjectStore('photos', { keyPath: 'id' }); store.createIndex('customerId', 'customerId') } }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function putPhoto(photo) { const db = await openDb(); return new Promise((resolve, reject) => { const request = db.transaction('photos', 'readwrite').objectStore('photos').put(photo); request.onsuccess = resolve; request.onerror = () => reject(request.error) }) }
async function getPhotos(customerId) { const db = await openDb(); return new Promise((resolve, reject) => { const request = db.transaction('photos').objectStore('photos').index('customerId').getAll(customerId); request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))); request.onerror = () => reject(request.error) }) }
async function deletePhotoDb(id) { const db = await openDb(); return new Promise((resolve, reject) => { const request = db.transaction('photos', 'readwrite').objectStore('photos').delete(id); request.onsuccess = resolve; request.onerror = () => reject(request.error) }) }
async function photoCount(customerId) { return (await getPhotos(customerId)).length }
</script>
