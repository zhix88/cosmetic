<template>
  <section class="settings-page">
    <div class="settings-shell">
      <aside class="settings-menu">
        <button v-for="item in modules" :key="item.key" :class="{ active: activeModule === item.key }" @click="activeModule = item.key">
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span><small>{{ item.desc }}</small>
        </button>
      </aside>

      <main class="settings-content">
        <template v-if="activeModule === 'org'">
          <SettingsHeader title="组织架构" subtitle="按公司、区域、门店、部门逐级维护" action="新增组织" :disabled="!isAdmin" @action="openEntity('org')" />
          <div class="org-summary horizontal">
            <article><p>区域</p><strong>{{ orgRegions.length }}</strong></article><article><p>门店</p><strong>{{ flatStores.length }}</strong></article><article><p>部门节点</p><strong>{{ departmentNodeCount }}</strong></article><article><p>在职员工</p><strong>{{ staff.filter(x => x.status === 'active').length }}</strong></article>
          </div>
          <el-table :data="orgTreeRows" row-key="id" default-expand-all :tree-props="{ children: 'children' }" class="org-tree-table">
            <el-table-column prop="name" label="组织名称" min-width="300"><template #default="{ row }"><div :class="`org-name-cell level-${row.type}`"><span :class="`org-type ${row.type}`">{{ orgTypeLabel(row.type) }}</span><strong>{{ row.name }}</strong></div></template></el-table-column>
            <el-table-column prop="manager" label="负责人" width="110"><template #default="{ row }">{{ row.manager || '—' }}</template></el-table-column>
            <el-table-column prop="phone" label="联系电话" width="135"><template #default="{ row }">{{ row.phone || '—' }}</template></el-table-column>
            <el-table-column label="员工数" width="85" align="center"><template #default="{ row }">{{ orgHeadcount(row) }}</template></el-table-column>
            <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="140"><template #default="{ row }"><el-button v-if="row.type === 'store' || row.type === 'department'" link type="primary" :disabled="!canEditOrgRow(row)" @click="openEntity('org', row)">编辑</el-button><el-button v-if="row.type === 'store'" link type="primary" :disabled="!canEditOrgRow(row)" @click="openDepartmentForStore(row)">新增部门</el-button></template></el-table-column>
          </el-table>
        </template>

        <template v-else-if="activeModule === 'staff'">
          <SettingsHeader title="员工管理" subtitle="员工归属、角色、兼岗与账号状态" action="新增员工" @action="openEntity('staff')" />
          <div class="staff-management-layout">
            <aside class="staff-org-panel">
              <div class="rule-org-head"><strong>组织部门</strong><small>按组织范围筛选员工</small></div>
              <el-tree :data="staffOrgTree" node-key="id" default-expand-all highlight-current :current-node-key="selectedStaffNodeId" :expand-on-click-node="false" @node-click="selectStaffNode">
                <template #default="{ data }"><div class="rule-tree-node"><span :class="`rule-node-icon ${data.type}`">{{ orgTypeLabel(data.type).slice(0, 1) }}</span><span>{{ data.label }}</span><small>{{ staffNodeCount(data) }}</small></div></template>
              </el-tree>
            </aside>
            <section class="staff-list-panel">
              <div class="staff-scope-head"><div><span>当前组织</span><strong>{{ selectedStaffNode?.label || '全部组织' }}</strong></div><el-tag type="info">{{ filteredStaff.length }}名员工</el-tag></div>
              <div class="settings-filters"><el-input v-model="search" placeholder="搜索姓名、工号或手机号" clearable /><el-select v-model="statusFilter"><el-option label="全部状态" value="all" /><el-option label="在职" value="active" /><el-option label="离职/停用" value="disabled" /></el-select><el-select v-model="staffRoleFilter"><el-option label="全部角色" value="all" /><el-option v-for="item in roles" :key="item.key" :label="item.label" :value="item.key" /></el-select><el-date-picker v-model="hireDateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="入职开始日期" end-placeholder="入职结束日期" /><el-button @click="exportCsv('staff')">导出</el-button><el-button @click="importVisible = true">导入</el-button></div>
              <el-table :data="pagedStaff" stripe>
                <el-table-column prop="code" label="工号" width="90" /><el-table-column label="员工" width="125"><template #default="{ row }"><strong>{{ row.name }}</strong><small class="table-subline">{{ row.gender || '未填写' }} · {{ row.age || ageFromBirthday(row.birthday) || '—' }}岁</small></template></el-table-column><el-table-column prop="phone" label="手机号" width="125" /><el-table-column prop="store" label="主门店" min-width="130" /><el-table-column prop="department" label="主部门" width="110" /><el-table-column prop="roleLabel" label="角色" width="90" /><el-table-column label="从业年限" width="90" align="center"><template #default="{ row }">{{ row.yearsExperience || 0 }}年</template></el-table-column><el-table-column prop="hireDate" label="入职日期" width="110"><template #default="{ row }">{{ row.hireDate || '—' }}</template></el-table-column><el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '在职' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="190" fixed="right"><template #default="{ row }"><el-button link @click="showStaffDetail(row)">详情</el-button><el-button link type="primary" @click="openEntity('staff', row)">编辑</el-button><el-button link :type="row.status === 'active' ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 'active' ? '停用' : '启用' }}</el-button></template></el-table-column>
              </el-table>
              <ListPagination :total="filteredStaff.length" v-model="listPage" />
            </section>
          </div>
        </template>

        <template v-else-if="activeModule === 'projects'">
          <SettingsHeader title="项目管理" subtitle="项目、套餐、价格及标准耗材模板" action="新增项目" :disabled="!isAdmin" @action="openEntity('project')" />
          <div class="settings-filters"><el-input v-model="search" placeholder="搜索项目名称或编码" clearable /><el-select v-model="categoryFilter"><el-option label="全部分类" value="all" /><el-option v-for="item in projectCatalog" :key="item.label" :label="item.label" :value="item.label" /></el-select><el-button @click="exportCsv('projects')">导出</el-button><el-button :disabled="!isAdmin" @click="importVisible = true">导入</el-button></div>
          <el-table :data="pagedProjects" stripe>
            <el-table-column prop="code" label="编码" width="105" /><el-table-column prop="name" label="项目名称" min-width="140" /><el-table-column prop="category" label="分类" width="100" /><el-table-column prop="department" label="科室" width="110" /><el-table-column prop="price" label="标准价" width="95"><template #default="{ row }">¥{{ money(row.price) }}</template></el-table-column><el-table-column prop="cardPrice" label="耗卡价" width="95"><template #default="{ row }">¥{{ money(row.cardPrice) }}</template></el-table-column><el-table-column prop="duration" label="时长" width="75"><template #default="{ row }">{{ row.duration }}分钟</template></el-table-column><el-table-column label="标准耗材成本" width="120"><template #default="{ row }">¥{{ money(projectMaterialCost(row)) }}</template></el-table-column><el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="150"><template #default="{ row }"><el-button link type="primary" :disabled="!isAdmin" @click="openEntity('project', row)">编辑</el-button><el-button link @click="openMaterialTemplate(row)">耗材模板</el-button></template></el-table-column>
          </el-table>
          <ListPagination :total="filteredProjects.length" v-model="listPage" />
        </template>

        <template v-else-if="activeModule === 'performance'">
          <SettingsHeader title="业绩配置" subtitle="按用户角色、项目类型、消费方式和耗材成本配置业绩提成" action="新增配置" :disabled="!isAdmin" @action="openPerformanceConfig()" />
          <div class="performance-kpis">
            <article><p>有效配置</p><strong>{{ performanceConfigs.filter(x => x.status === 'active').length }}</strong></article>
            <article><p>覆盖角色</p><strong>{{ new Set(performanceConfigs.map(x => x.roleKey)).size }}</strong></article>
            <article><p>覆盖项目类型</p><strong>{{ new Set(performanceConfigs.map(x => x.projectCategory)).size }}</strong></article>
            <article><p>扣除耗材配置</p><strong>{{ performanceConfigs.filter(x => x.deductMaterial).length }}</strong></article>
          </div>
          <div class="settings-filters performance-filters"><el-input v-model="search" placeholder="搜索角色或项目类型" clearable /><el-select v-model="performanceRoleFilter"><el-option label="全部角色" value="all" /><el-option v-for="x in performanceRoleOptions" :key="x.key" :label="x.label" :value="x.key" /></el-select><el-select v-model="performanceCategoryFilter"><el-option label="全部项目类型" value="all" /><el-option v-for="x in projectCatalog" :key="x.label" :label="x.label" :value="x.label" /></el-select></div>
          <el-table :data="pagedPerformanceConfigs" stripe>
            <el-table-column label="角色" width="100"><template #default="{ row }"><strong>{{ performanceRoleLabel(row.roleKey) }}</strong></template></el-table-column>
            <el-table-column prop="projectCategory" label="项目类型" min-width="120" />
            <el-table-column label="业绩基数" width="110"><template #default="{ row }">{{ basisLabel(row.basis) }}</template></el-table-column>
            <el-table-column label="耗材扣除" width="115"><template #default="{ row }"><el-tag :type="row.deductMaterial ? 'warning' : 'info'">{{ row.deductMaterial ? materialModeLabel(row.materialCostMode) : '不扣除' }}</el-tag></template></el-table-column>
            <el-table-column label="现金·新诊" width="95" align="center"><template #default="{ row }">{{ row.cashNewRate }}%</template></el-table-column>
            <el-table-column label="现金·复诊" width="95" align="center"><template #default="{ row }">{{ row.cashReturningRate }}%</template></el-table-column>
            <el-table-column label="耗卡·新诊" width="95" align="center"><template #default="{ row }">{{ row.cardNewRate }}%</template></el-table-column>
            <el-table-column label="耗卡·复诊" width="95" align="center"><template #default="{ row }">{{ row.cardReturningRate }}%</template></el-table-column>
            <el-table-column label="适用门店" min-width="150"><template #default="{ row }">{{ row.stores?.length === stores.length ? '全部门店' : row.stores?.join('、') }}</template></el-table-column>
            <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" :disabled="!isAdmin" @click="openPerformanceConfig(row)">编辑</el-button></template></el-table-column>
          </el-table>
          <ListPagination :total="filteredPerformanceConfigs.length" v-model="listPage" />
          <div class="performance-rule-note"><strong>计算说明</strong><span>提成金额 = max(0，业绩基数 − 耗材成本) × 对应“消费方式＋新诊/复诊”提成比例。多项目业务按项目金额占比分摊后分别匹配配置。</span></div>
        </template>

        <template v-else-if="activeModule === 'inventory'">
          <SettingsHeader title="耗材管理" subtitle="门店库存、批次效期、出入库与耗用流水" action="新增耗材" :disabled="!isAdmin" @action="openEntity('material')" />
          <div class="inventory-kpis"><article><p>库存耗材</p><strong>{{ allowedMaterials.length }}</strong></article><article><p>库存金额</p><strong>¥{{ money(inventoryValue) }}</strong></article><article><p>低库存</p><strong>{{ lowStockCount }}</strong></article><article><p>近效期/过期</p><strong>{{ expiryAlertCount }}</strong></article></div>
          <el-tabs v-model="inventoryTab">
            <el-tab-pane label="库存余额" name="stock">
              <div class="settings-filters"><el-input v-model="search" placeholder="搜索物资名称或编码" clearable /><el-select v-model="storeFilter"><el-option label="全部门店" value="all" /><el-option v-for="store in allowedStores" :key="store" :label="store" :value="store" /></el-select><el-select v-model="materialCategoryFilter"><el-option label="全部分类" value="all" /><el-option v-for="x in materialCategories" :key="x" :label="x" :value="x" /></el-select><el-button type="primary" @click="openStockAction('in')">入库</el-button><el-button @click="openStockAction('out')">领用</el-button><el-button @click="openStockAction('return')">退库</el-button><el-button @click="openStockAction('transfer')">调拨</el-button><el-button @click="openStockAction('count')">盘点</el-button><el-button @click="openStockAction('damage')">报损</el-button></div>
              <el-table :data="pagedStock" stripe>
                <el-table-column prop="code" label="编码" width="105" /><el-table-column prop="name" label="物资名称" min-width="140" /><el-table-column prop="category" label="分类" width="100" /><el-table-column prop="spec" label="规格" width="100" /><el-table-column prop="unit" label="单位" width="65" /><el-table-column prop="store" label="门店" min-width="125" /><el-table-column prop="stock" label="可用库存" width="90" align="right" /><el-table-column prop="locked" label="锁定" width="70" align="right" /><el-table-column label="库存金额" width="105" align="right"><template #default="{ row }">¥{{ money(row.stock * row.cost) }}</template></el-table-column><el-table-column label="库存状态" width="100"><template #default="{ row }"><el-tag :type="row.stock <= row.minStock ? 'danger' : row.stock >= row.maxStock ? 'warning' : 'success'">{{ row.stock <= row.minStock ? '库存不足' : row.stock >= row.maxStock ? '库存偏高' : '正常' }}</el-tag></template></el-table-column>
              </el-table>
              <ListPagination :total="filteredStock.length" v-model="listPage" />
            </el-tab-pane>
            <el-tab-pane label="批次效期" name="batches">
              <el-table :data="pagedBatches" stripe><el-table-column prop="batchNo" label="批号" width="120" /><el-table-column label="物资" min-width="140"><template #default="{ row }">{{ materialName(row.materialId) }}</template></el-table-column><el-table-column prop="store" label="门店" min-width="125" /><el-table-column prop="quantity" label="剩余数量" width="90" /><el-table-column prop="productionDate" label="生产日期" width="110" /><el-table-column prop="expiryDate" label="有效期" width="110" /><el-table-column prop="supplier" label="供应商" min-width="130" /><el-table-column label="效期状态" width="100"><template #default="{ row }"><el-tag :type="expiryType(row.expiryDate, row.store)">{{ expiryLabel(row.expiryDate, row.store) }}</el-tag></template></el-table-column></el-table>
              <ListPagination :total="allowedBatches.length" v-model="listPage" />
            </el-tab-pane>
            <el-tab-pane label="库存流水" name="logs">
              <el-table :data="pagedInventoryLogs" stripe><el-table-column prop="time" label="时间" width="150" /><el-table-column prop="typeLabel" label="业务类型" width="90" /><el-table-column prop="store" label="门店" min-width="120" /><el-table-column prop="materialName" label="物资" min-width="130" /><el-table-column prop="quantity" label="数量" width="80" /><el-table-column prop="batchNo" label="批次" width="115" /><el-table-column prop="operator" label="操作人" width="110" /><el-table-column prop="reason" label="用途/原因" min-width="180" /></el-table>
              <ListPagination :total="allowedInventoryLogs.length" v-model="listPage" />
            </el-tab-pane>
            <el-tab-pane label="预警中心" name="alerts">
              <div class="inventory-alerts"><article v-for="item in inventoryAlerts" :key="item.key" :class="item.tone"><span>{{ item.icon }}</span><div><strong>{{ item.title }}</strong><p>{{ item.detail }}</p></div><b>{{ item.value }}</b></article></div>
            </el-tab-pane>
          </el-tabs>
        </template>

        <template v-else-if="activeModule === 'roles'">
          <SettingsHeader title="角色权限" subtitle="按栏目分别配置查看、新增、编辑、删除、导入和导出权限" action="新增角色" :disabled="!isAdmin" @action="openEntity('role')" />
          <el-table :data="pagedRoles" stripe><el-table-column prop="label" label="角色" width="140" /><el-table-column prop="dataScope" label="数据范围" width="110" /><el-table-column label="已授权栏目" min-width="220"><template #default="{ row }"><el-tag v-for="x in authorizedModules(row)" :key="x.key" size="small">{{ x.label }}</el-tag></template></el-table-column><el-table-column label="功能权限数" width="110" align="center"><template #default="{ row }">{{ permissionCount(row) }}</template></el-table-column><el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="primary" :disabled="!isAdmin" @click="openEntity('role', row)">配置权限</el-button></template></el-table-column></el-table>
          <ListPagination :total="roles.length" v-model="listPage" />
        </template>

        <template v-else-if="activeModule === 'rules'">
          <SettingsHeader title="业务规则" subtitle="按门店维护预约、会员、库存和编号规则" />
          <div class="business-rule-layout">
            <aside class="rule-org-panel">
              <div class="rule-org-head"><strong>组织部门</strong><small>选择门店或部门</small></div>
              <el-tree :data="ruleOrgTree" node-key="id" default-expand-all highlight-current :current-node-key="selectedRuleNodeId" :expand-on-click-node="false" @node-click="selectRuleNode">
                <template #default="{ data }"><div class="rule-tree-node"><span :class="`rule-node-icon ${data.type}`">{{ orgTypeLabel(data.type).slice(0, 1) }}</span><span>{{ data.label }}</span><small v-if="data.type === 'department'">沿用门店</small></div></template>
              </el-tree>
            </aside>
            <section class="rule-config-panel">
              <div class="rule-store-bar"><div><span>当前配置节点</span><strong>{{ selectedRuleNode?.label || ruleStore }}</strong><small v-if="selectedRuleNode?.type === 'department'">{{ selectedRuleNode.label }}沿用“{{ ruleStore }}”规则</small></div><el-tag type="info">{{ selectedRuleNode?.type === 'department' ? '门店规则继承' : '规则独立生效' }}</el-tag></div>
              <div class="rule-grid">
                <article><h3>预约容量</h3><p>每30分钟允许预约的顾客组数</p><el-input-number v-model="currentStoreRule.appointmentCapacity" :min="1" :max="20" :disabled="!canEditRules" @change="saveSettings('更新预约容量')" /></article>
                <article><h3>库存近效期预警</h3><p>距离有效期多少天触发预警</p><el-input-number v-model="currentStoreRule.expiryWarningDays" :min="7" :max="365" :disabled="!canEditRules" @change="saveSettings('更新效期规则')" /></article>
                <article><h3>会员积分比例</h3><p>每消费100元赠送积分</p><el-input-number v-model="currentStoreRule.pointsPer100" :min="0" :max="100" :disabled="!canEditRules" @change="saveSettings('更新积分规则')" /></article>
                <article><h3>业务编号前缀</h3><p>本门店新建业务与预约使用的编号前缀</p><el-input v-model="currentStoreRule.businessPrefix" :disabled="!canEditRules" @change="saveSettings('更新编号规则')" /></article>
              </div>
              <div class="workflow-config"><h3>服务流程节点</h3><div><span v-for="(node, index) in workflowNodes" :key="node.key"><b>{{ index + 1 }}</b>{{ node.label }}<small>{{ node.owner }}</small></span></div></div>
            </section>
          </div>
        </template>

        <template v-else-if="activeModule === 'dictionary'">
          <SettingsHeader title="基础字典" subtitle="会员等级、顾客来源、原因与结果选项" />
          <div class="dictionary-grid"><article v-for="dict in dictionaries" :key="dict.key"><h3>{{ dict.label }}</h3><div><el-tag v-for="item in dict.items" :key="item" closable :disable-transitions="true" @close="removeDict(dict, item)">{{ item }}</el-tag></div><el-input v-model="dict.newValue" placeholder="新增选项" :disabled="!isAdmin" @keyup.enter="addDict(dict)"><template #append><el-button @click="addDict(dict)">添加</el-button></template></el-input></article></div>
        </template>

        <template v-else>
          <SettingsHeader title="操作日志" subtitle="配置与库存变更审计记录" />
          <div class="settings-filters"><el-input v-model="search" placeholder="搜索对象、操作人或内容" clearable /><el-select v-model="logModule"><el-option label="全部模块" value="all" /><el-option v-for="item in modules.slice(0,-1)" :key="item.key" :label="item.label" :value="item.key" /></el-select></div>
          <el-table :data="pagedAuditLogs" stripe><el-table-column prop="time" label="时间" width="155" /><el-table-column prop="moduleLabel" label="模块" width="100" /><el-table-column prop="action" label="操作" width="120" /><el-table-column prop="object" label="对象" min-width="130" /><el-table-column prop="operator" label="操作人" width="130" /><el-table-column prop="detail" label="变更内容" min-width="240" /></el-table>
          <ListPagination :total="filteredAuditLogs.length" v-model="listPage" />
        </template>
      </main>
    </div>

    <el-dialog v-model="entityVisible" :title="entityDialogTitle" :width="entityType === 'staff' || entityType === 'role' ? '900px' : '680px'">
      <el-form ref="entityFormRef" :model="entityForm" :rules="entityRules" label-position="top">
        <template v-if="entityType === 'staff'">
          <h3 class="form-section-title">个人基本信息</h3>
          <div class="settings-form-grid three"><el-form-item label="工号" prop="code"><el-input v-model="entityForm.code" /></el-form-item><el-form-item label="姓名" prop="name"><el-input v-model="entityForm.name" /></el-form-item><el-form-item label="性别"><el-select v-model="entityForm.gender"><el-option label="女" value="女" /><el-option label="男" value="男" /></el-select></el-form-item><el-form-item label="出生日期"><el-date-picker v-model="entityForm.birthday" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="手机号"><el-input v-model="entityForm.phone" /></el-form-item><el-form-item label="身份证号"><el-input v-model="entityForm.idNumber" /></el-form-item><el-form-item label="邮箱"><el-input v-model="entityForm.email" /></el-form-item><el-form-item label="紧急联系人"><el-input v-model="entityForm.emergencyContact" /></el-form-item><el-form-item label="紧急联系电话"><el-input v-model="entityForm.emergencyPhone" /></el-form-item><el-form-item label="现居地址" class="full"><el-input v-model="entityForm.address" /></el-form-item></div>
          <h3 class="form-section-title">任职与专业信息</h3>
          <div class="settings-form-grid three"><el-form-item label="主门店" prop="store"><el-select v-model="entityForm.store" :disabled="role !== 'admin'"><el-option v-for="x in allowedStores" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="主部门"><el-select v-model="entityForm.department"><el-option v-for="x in departments" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="主角色"><el-select v-model="entityForm.roleKey"><el-option v-for="x in roles" :key="x.key" :label="x.label" :value="x.key" /></el-select></el-form-item><el-form-item label="入职日期"><el-date-picker v-model="entityForm.hireDate" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="从业年限"><el-input-number v-model="entityForm.yearsExperience" :min="0" :max="50" /></el-form-item><el-form-item label="最高学历"><el-select v-model="entityForm.education"><el-option v-for="x in ['高中/中专','大专','本科','硕士及以上']" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="专业/擅长"><el-input v-model="entityForm.specialty" /></el-form-item><el-form-item label="职业证书"><el-input v-model="entityForm.certificates" /></el-form-item><el-form-item label="状态"><el-select v-model="entityForm.status"><el-option label="在职" value="active" /><el-option label="停用" value="disabled" /></el-select></el-form-item><el-form-item label="兼任门店" class="full"><el-select v-model="entityForm.secondaryStores" multiple><el-option v-for="x in stores" :key="x" :label="x" :value="x" /></el-select></el-form-item></div>
          <div class="experience-head"><h3 class="form-section-title">从业经历</h3><el-button link type="primary" @click="addExperience">添加经历</el-button></div>
          <div v-for="(item, index) in entityForm.experiences" :key="index" class="experience-row"><el-input v-model="item.company" placeholder="任职机构" /><el-input v-model="item.position" placeholder="岗位" /><el-date-picker v-model="item.startDate" type="month" value-format="YYYY-MM" placeholder="开始时间" /><el-date-picker v-model="item.endDate" type="month" value-format="YYYY-MM" placeholder="结束时间" /><el-input v-model="item.description" placeholder="主要工作内容" /><el-button link type="danger" @click="entityForm.experiences.splice(index, 1)">删除</el-button></div>
        </template>
        <template v-else-if="entityType === 'project'"><div class="settings-form-grid"><el-form-item label="项目编码" prop="code"><el-input v-model="entityForm.code" /></el-form-item><el-form-item label="项目名称" prop="name"><el-input v-model="entityForm.name" /></el-form-item><el-form-item label="分类"><el-select v-model="entityForm.category"><el-option v-for="x in projectCatalog" :key="x.label" :label="x.label" :value="x.label" /></el-select></el-form-item><el-form-item label="科室"><el-select v-model="entityForm.department"><el-option v-for="x in departments" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="标准价"><el-input-number v-model="entityForm.price" :min="0" /></el-form-item><el-form-item label="耗卡价"><el-input-number v-model="entityForm.cardPrice" :min="0" /></el-form-item><el-form-item label="服务时长"><el-input-number v-model="entityForm.duration" :min="10" :step="10" /></el-form-item><el-form-item label="疗程次数"><el-input-number v-model="entityForm.courseCount" :min="1" /></el-form-item></div></template>
        <template v-else-if="entityType === 'material'"><div class="settings-form-grid"><el-form-item label="物资编码" prop="code"><el-input v-model="entityForm.code" /></el-form-item><el-form-item label="物资名称" prop="name"><el-input v-model="entityForm.name" /></el-form-item><el-form-item label="分类"><el-select v-model="entityForm.category"><el-option v-for="x in materialCategories" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="规格"><el-input v-model="entityForm.spec" /></el-form-item><el-form-item label="单位"><el-input v-model="entityForm.unit" /></el-form-item><el-form-item label="品牌"><el-input v-model="entityForm.brand" /></el-form-item><el-form-item label="供应商"><el-input v-model="entityForm.supplier" /></el-form-item><el-form-item label="参考成本"><el-input-number v-model="entityForm.cost" :min="0" /></el-form-item><el-form-item label="最低库存"><el-input-number v-model="entityForm.minStock" :min="0" /></el-form-item><el-form-item label="最高库存"><el-input-number v-model="entityForm.maxStock" :min="1" /></el-form-item></div></template>
        <template v-else-if="entityType === 'org'"><div class="settings-form-grid"><el-form-item label="组织类型"><el-select v-model="entityForm.nodeType" :disabled="Boolean(editingId)"><el-option label="门店" value="store" /><el-option label="部门" value="department" /></el-select></el-form-item><el-form-item v-if="entityForm.nodeType === 'store'" label="所属区域"><el-select v-model="entityForm.region"><el-option v-for="x in orgRegions" :key="x.id" :label="x.name" :value="x.name" /></el-select></el-form-item><el-form-item v-else label="所属门店"><el-select v-model="entityForm.storeId"><el-option v-for="x in flatStores" :key="x.id" :label="x.name" :value="x.id" /></el-select></el-form-item><el-form-item :label="entityForm.nodeType === 'department' ? '部门名称' : '门店名称'" prop="name"><el-input v-model="entityForm.name" /></el-form-item><el-form-item label="负责人"><el-input v-model="entityForm.manager" /></el-form-item><el-form-item label="联系电话"><el-input v-model="entityForm.phone" /></el-form-item><el-form-item label="状态"><el-select v-model="entityForm.status"><el-option label="启用" value="active" /><el-option label="停用" value="disabled" /></el-select></el-form-item><el-form-item v-if="entityForm.nodeType === 'store'" label="地址" class="full"><el-input v-model="entityForm.address" /></el-form-item></div></template>
        <template v-else>
          <div class="settings-form-grid"><el-form-item label="角色名称" prop="label"><el-input v-model="entityForm.label" /></el-form-item><el-form-item label="数据范围"><el-select v-model="entityForm.dataScope"><el-option label="本人" value="本人" /><el-option label="本店" value="本店" /><el-option label="全部门店" value="全部门店" /></el-select></el-form-item></div>
          <div class="permission-matrix"><div class="permission-matrix-head"><strong>栏目</strong><span v-for="action in permissionActions" :key="action.key">{{ action.label }}</span></div><div v-for="module in permissionModules" :key="module.key" class="permission-matrix-row"><strong>{{ module.label }}</strong><span v-for="action in permissionActions" :key="action.key"><el-checkbox :model-value="hasPermission(module.key, action.key)" @change="setPermission(module.key, action.key, $event)" /></span></div></div>
        </template>
      </el-form>
      <template #footer><el-button @click="entityVisible = false">取消</el-button><el-button type="primary" @click="saveEntity">保存</el-button></template>
    </el-dialog>

    <el-drawer v-model="staffDetailVisible" title="员工详情" size="520px">
      <template v-if="activeStaff"><div class="staff-profile-head"><div>{{ activeStaff.name.slice(0, 1) }}</div><section><h2>{{ activeStaff.name }}</h2><p>{{ activeStaff.code }} · {{ activeStaff.roleLabel }} · {{ activeStaff.store }}</p></section><el-tag :type="activeStaff.status === 'active' ? 'success' : 'info'">{{ activeStaff.status === 'active' ? '在职' : '停用' }}</el-tag></div>
      <div class="staff-detail-grid"><span>性别<strong>{{ activeStaff.gender || '—' }}</strong></span><span>出生日期<strong>{{ activeStaff.birthday || '—' }}</strong></span><span>手机号<strong>{{ activeStaff.phone || '—' }}</strong></span><span>邮箱<strong>{{ activeStaff.email || '—' }}</strong></span><span>主部门<strong>{{ activeStaff.department }}</strong></span><span>入职日期<strong>{{ activeStaff.hireDate || '—' }}</strong></span><span>从业年限<strong>{{ activeStaff.yearsExperience || 0 }}年</strong></span><span>最高学历<strong>{{ activeStaff.education || '—' }}</strong></span><span class="wide">专业/擅长<strong>{{ activeStaff.specialty || '—' }}</strong></span><span class="wide">职业证书<strong>{{ activeStaff.certificates || '—' }}</strong></span><span class="wide">现居地址<strong>{{ activeStaff.address || '—' }}</strong></span></div>
      <h3 class="drawer-section-title">从业经历</h3><el-timeline v-if="activeStaff.experiences?.length"><el-timeline-item v-for="(item, index) in activeStaff.experiences" :key="index" :timestamp="`${item.startDate || '—'} 至 ${item.endDate || '至今'}`"><strong>{{ item.company }} · {{ item.position }}</strong><p>{{ item.description || '未填写工作内容' }}</p></el-timeline-item></el-timeline><el-empty v-else description="暂无从业经历" :image-size="70" /></template>
    </el-drawer>

    <el-dialog v-model="performanceVisible" :title="performanceEditingId ? '编辑业绩配置' : '新增业绩配置'" width="760px">
      <el-form ref="performanceFormRef" :model="performanceForm" :rules="performanceRules" label-position="top">
        <div class="settings-form-grid">
          <el-form-item label="用户角色" prop="roleKey"><el-select v-model="performanceForm.roleKey"><el-option v-for="x in performanceRoleOptions" :key="x.key" :label="x.label" :value="x.key" /></el-select></el-form-item>
          <el-form-item label="项目类型" prop="projectCategory"><el-select v-model="performanceForm.projectCategory"><el-option v-for="x in projectCatalog" :key="x.label" :label="x.label" :value="x.label" /></el-select></el-form-item>
          <el-form-item label="业绩计算基数" prop="basis"><el-select v-model="performanceForm.basis"><el-option label="成交业绩（现金＋耗卡）" value="totalConsumption" /><el-option label="实际收款（仅现金）" value="cashReceived" /><el-option label="毛利业绩（成交业绩－耗材）" value="grossProfit" /></el-select></el-form-item>
          <el-form-item label="最低计提业绩（元）"><el-input-number v-model="performanceForm.minimumAmount" :min="0" :step="100" /></el-form-item>
          <el-form-item label="是否扣除耗材成本"><el-switch v-model="performanceForm.deductMaterial" active-text="扣除" inactive-text="不扣除" /></el-form-item>
          <el-form-item label="耗材成本口径"><el-select v-model="performanceForm.materialCostMode" :disabled="!performanceForm.deductMaterial"><el-option label="项目标准耗材成本" value="standard" /><el-option label="服务实际耗用成本" value="actual" /></el-select></el-form-item>
          <el-form-item label="现金新诊提成比例"><el-input-number v-model="performanceForm.cashNewRate" :min="0" :max="100" :precision="2"><template #suffix>%</template></el-input-number></el-form-item>
          <el-form-item label="现金复诊提成比例"><el-input-number v-model="performanceForm.cashReturningRate" :min="0" :max="100" :precision="2"><template #suffix>%</template></el-input-number></el-form-item>
          <el-form-item label="耗卡新诊提成比例"><el-input-number v-model="performanceForm.cardNewRate" :min="0" :max="100" :precision="2"><template #suffix>%</template></el-input-number></el-form-item>
          <el-form-item label="耗卡复诊提成比例"><el-input-number v-model="performanceForm.cardReturningRate" :min="0" :max="100" :precision="2"><template #suffix>%</template></el-input-number></el-form-item>
          <el-form-item label="适用门店" class="full" prop="stores"><el-select v-model="performanceForm.stores" multiple collapse-tags collapse-tags-tooltip><el-option v-for="x in stores" :key="x" :label="x" :value="x" /></el-select></el-form-item>
          <el-form-item label="状态"><el-select v-model="performanceForm.status"><el-option label="启用" value="active" /><el-option label="停用" value="disabled" /></el-select></el-form-item>
          <el-form-item label="配置备注"><el-input v-model="performanceForm.note" placeholder="例如：抗衰类项目按毛利计提" /></el-form-item>
        </div>
      </el-form>
      <template #footer><el-button @click="performanceVisible=false">取消</el-button><el-button type="primary" @click="savePerformanceConfig">保存配置</el-button></template>
    </el-dialog>

    <el-dialog v-model="stockVisible" :title="stockActionTitle" width="650px">
      <el-form ref="stockFormRef" :model="stockForm" :rules="stockRules" label-position="top">
        <div class="settings-form-grid"><el-form-item label="门店" prop="store"><el-select v-model="stockForm.store" :disabled="role !== 'admin'"><el-option v-for="x in allowedStores" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item v-if="stockAction === 'transfer'" label="调入门店" prop="targetStore"><el-select v-model="stockForm.targetStore"><el-option v-for="x in stores.filter(s => s !== stockForm.store)" :key="x" :label="x" :value="x" /></el-select></el-form-item><el-form-item label="物资" prop="materialId"><el-select v-model="stockForm.materialId"><el-option v-for="x in materials.filter(m => m.status === 'active')" :key="x.id" :label="`${x.name} · ${x.spec}`" :value="x.id" /></el-select></el-form-item><el-form-item :label="stockAction === 'count' ? '盘点实数' : '数量'" prop="quantity"><el-input-number v-model="stockForm.quantity" :min="0" /></el-form-item><template v-if="stockAction === 'in'"><el-form-item label="批号" prop="batchNo"><el-input v-model="stockForm.batchNo" /></el-form-item><el-form-item label="生产日期"><el-date-picker v-model="stockForm.productionDate" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="有效期" prop="expiryDate"><el-date-picker v-model="stockForm.expiryDate" type="date" value-format="YYYY-MM-DD" /></el-form-item><el-form-item label="供应商"><el-input v-model="stockForm.supplier" /></el-form-item><el-form-item label="入库单价"><el-input-number v-model="stockForm.cost" :min="0" /></el-form-item></template></div><el-form-item label="用途/原因" prop="reason"><el-input v-model="stockForm.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="stockVisible = false">取消</el-button><el-button type="primary" @click="submitStockAction">确认并生效</el-button></template>
    </el-dialog>

    <el-dialog v-model="templateVisible" title="项目标准耗材模板" width="650px">
      <div class="template-title">{{ templateProject?.name }} · 单次标准成本 ¥{{ money(projectMaterialCost(templateProject || {})) }}</div>
      <el-table :data="templateRows"><el-table-column label="物资"><template #default="{ row }"><el-select v-model="row.materialId"><el-option v-for="x in materials.filter(m => m.status === 'active')" :key="x.id" :label="x.name" :value="x.id" /></el-select></template></el-table-column><el-table-column label="标准用量" width="130"><template #default="{ row }"><el-input-number v-model="row.quantity" :min="0.01" :step="1" /></template></el-table-column><el-table-column label="允许浮动%" width="120"><template #default="{ row }"><el-input-number v-model="row.tolerance" :min="0" :max="100" /></template></el-table-column><el-table-column width="70"><template #default="{ $index }"><el-button link type="danger" @click="templateRows.splice($index,1)">删除</el-button></template></el-table-column></el-table>
      <el-button class="add-template-row" @click="templateRows.push({ materialId: '', quantity: 1, tolerance: 20 })">添加耗材</el-button>
      <template #footer><el-button @click="templateVisible = false">取消</el-button><el-button type="primary" @click="saveMaterialTemplate">保存模板</el-button></template>
    </el-dialog>

    <el-dialog v-model="importVisible" title="Excel导入演示" width="560px"><el-alert title="原型将校验编码重复、门店、角色、单位和必填字段；不会上传文件到网络。" type="info" :closable="false" /><div class="import-zone"><el-icon><UploadFilled /></el-icon><strong>选择员工或项目Excel文件</strong><p>支持 .xlsx / .csv，当前原型展示校验流程</p><input type="file" accept=".xlsx,.csv" @change="simulateImport" /></div><template #footer><el-button @click="importVisible = false">关闭</el-button></template></el-dialog>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, resolveComponent, watch } from 'vue'
import { Box, Briefcase, Coin, Connection, DataBoard, Document, Goods, Key, OfficeBuilding, Setting, UploadFilled, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  role: { type: String, required: true },
  roleMeta: { type: Object, required: true },
  stores: { type: Array, required: true },
  departments: { type: Array, required: true },
  projectCatalog: { type: Array, required: true }
})
const emit = defineEmits(['config-change'])
const SETTINGS_KEY = 'cosmetic-settings-data-v1'
const INVENTORY_KEY = 'cosmetic-inventory-data-v1'
const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
const inventorySaved = JSON.parse(localStorage.getItem(INVENTORY_KEY) || 'null')
const activeModule = ref('org')
const search = ref('')
const storeFilter = ref('all')
const statusFilter = ref('all')
const staffRoleFilter = ref('all')
const hireDateRange = ref([])
const categoryFilter = ref('all')
const materialCategoryFilter = ref('all')
const logModule = ref('all')
const inventoryTab = ref('stock')
const entityVisible = ref(false)
const entityType = ref('')
const entityFormRef = ref()
const entityForm = reactive({})
const editingId = ref(null)
const stockVisible = ref(false)
const stockFormRef = ref()
const stockForm = reactive({})
const stockAction = ref('in')
const templateVisible = ref(false)
const templateProject = ref(null)
const templateRows = reactive([])
const importVisible = ref(false)
const listPage = ref(1)
const pageSize = 15
const staffDetailVisible = ref(false)
const activeStaff = ref(null)
const ruleStore = ref(props.role === 'admin' ? props.stores[0] : props.roleMeta.store)
const selectedRuleNodeId = ref(`rule-store-${ruleStore.value}`)
const selectedStaffNodeId = ref(props.role === 'admin' ? 'staff-company' : `staff-store-${props.roleMeta.store}`)
const performanceVisible = ref(false)
const performanceFormRef = ref()
const performanceForm = reactive({})
const performanceEditingId = ref(null)
const performanceRoleFilter = ref('all')
const performanceCategoryFilter = ref('all')

const modules = [
  { key: 'org', label: '组织架构', desc: '区域、门店、部门', icon: OfficeBuilding },
  { key: 'staff', label: '员工管理', desc: '员工、岗位、兼任', icon: User },
  { key: 'projects', label: '项目管理', desc: '项目、套餐、价格', icon: Briefcase },
  { key: 'performance', label: '业绩配置', desc: '角色、项目、提成', icon: Coin },
  { key: 'inventory', label: '耗材管理', desc: '库存、批次、流水', icon: Goods },
  { key: 'roles', label: '角色权限', desc: '页面与操作权限', icon: Key },
  { key: 'rules', label: '业务规则', desc: '流程与业务参数', icon: Setting },
  { key: 'dictionary', label: '基础字典', desc: '下拉选项维护', icon: DataBoard },
  { key: 'logs', label: '操作日志', desc: '配置审计记录', icon: Document }
]
const isAdmin = computed(() => props.role === 'admin')
const canEditRules = computed(() => ['admin','storeManager'].includes(props.role))
const allowedStores = computed(() => isAdmin.value ? props.stores : [props.roleMeta.store])
const permissionModules = [{key:'workbench',label:'工作台'},{key:'customers',label:'顾客档案'},{key:'appointments',label:'预约记录'},{key:'dashboard',label:'经营看板'},{key:'dailyReports',label:'每日报表'},{key:'dealReports',label:'成交报表'},...modules.map(x=>({key:x.key,label:x.label}))]
const pageOptions = permissionModules
const permissionActions = [{key:'view',label:'查看'},{key:'create',label:'新增'},{key:'edit',label:'编辑'},{key:'delete',label:'删除'},{key:'import',label:'导入'},{key:'export',label:'导出'},{key:'confirm',label:'确认'},{key:'return',label:'退回'},{key:'unlock',label:'解锁'},{key:'operate',label:'业务操作'}]
const actionOptions = permissionActions.map(x=>x.key)
const materialCategories = ['注射耗材','护理产品','医疗器械','一次性用品','办公物资']
const performanceRoleOptions = [
  {key:'cardConsultant',label:'卡姐'},{key:'beautyConsultant',label:'美导'},{key:'market',label:'市场'},
  {key:'service',label:'客服'},{key:'butler',label:'管家'},{key:'director',label:'总监'},{key:'manager',label:'经理'}
]

const orgRegions = reactive(saved?.orgRegions || seedOrg())
const staff = reactive(ensureDemoStaff(saved?.staff || seedStaff()).map(normalizeStaff))
const projects = reactive(saved?.projects || seedProjects())
const roles = reactive(ensureDemoRoles(saved?.roles || seedRoles()).map(normalizeRole))
const performanceConfigs = reactive(saved?.performanceConfigs || seedPerformanceConfigs())
const legacyRule = saved?.rules || { appointmentCapacity: 3, expiryWarningDays: 60, pointsPer100: 10, businessPrefix: 'B' }
const storeRules = reactive(saved?.storeRules || Object.fromEntries(props.stores.map((store,index)=>[store,{...legacyRule,businessPrefix:index===0?legacyRule.businessPrefix:`B${index+1}`}])) )
const dictionaries = reactive(saved?.dictionaries || seedDictionaries())
const auditLogs = reactive(saved?.auditLogs || [])
const materials = reactive(inventorySaved?.materials || seedMaterials())
const batches = reactive(inventorySaved?.batches || seedBatches())
const inventoryLogs = reactive(inventorySaved?.inventoryLogs || [])
const materialTemplates = reactive(inventorySaved?.materialTemplates || {})
const workflowNodes = [{key:'invited',label:'市场邀约',owner:'市场'},{key:'reception',label:'客服接待',owner:'客服'},{key:'triage',label:'管家分诊',owner:'管家'},{key:'scheduling',label:'总监排诊',owner:'总监'},{key:'service',label:'服务执行',owner:'总监'},{key:'followup',label:'客服回访',owner:'客服'}]

const flatStores = computed(() => orgRegions.flatMap(r => r.stores))
const orgTreeRows = computed(() => [{id:'company-root',name:'医美医疗美容集团',type:'company',status:'active',children:orgRegions.map(region=>({id:region.id,name:region.name,type:'region',status:'active',children:region.stores.map(store=>({id:store.id,name:store.name,type:'store',manager:store.manager,phone:store.phone,address:store.address,status:store.status,source:store,children:(store.departments||[]).map((dept,index)=>({id:`${store.id}-dept-${index}`,name:typeof dept==='string'?dept:dept.name,type:'department',manager:typeof dept==='string'?'':dept.manager,phone:typeof dept==='string'?'':dept.phone,status:typeof dept==='string'?'active':dept.status||'active',storeId:store.id,storeName:store.name,source:dept}))}))}))}])
const ruleOrgTree = computed(() => {
  const regions=orgRegions.map(region=>({id:`rule-${region.id}`,label:region.name,type:'region',children:region.stores.filter(store=>allowedStores.value.includes(store.name)).map(store=>({id:`rule-store-${store.name}`,label:store.name,type:'store',storeName:store.name,children:(store.departments||[]).map((dept,index)=>({id:`rule-${store.id}-dept-${index}`,label:typeof dept==='string'?dept:dept.name,type:'department',storeName:store.name}))}))})).filter(region=>region.children.length)
  return isAdmin.value?[{id:'rule-company',label:'医美医疗美容集团',type:'company',children:regions}]:regions
})
const staffOrgTree = computed(() => {
  const regions=orgRegions.map(region=>({id:`staff-${region.id}`,label:region.name,type:'region',storeNames:region.stores.filter(store=>allowedStores.value.includes(store.name)).map(store=>store.name),children:region.stores.filter(store=>allowedStores.value.includes(store.name)).map(store=>({id:`staff-store-${store.name}`,label:store.name,type:'store',storeName:store.name,children:(store.departments||[]).map((dept,index)=>({id:`staff-${store.id}-dept-${index}`,label:typeof dept==='string'?dept:dept.name,type:'department',storeName:store.name,departmentName:typeof dept==='string'?dept:dept.name}))}))})).filter(region=>region.children.length)
  return isAdmin.value?[{id:'staff-company',label:'医美医疗美容集团',type:'company',children:regions}]:regions
})
const selectedRuleNode = computed(() => {
  const walk=rows=>{for(const row of rows){if(row.id===selectedRuleNodeId.value)return row;const found=walk(row.children||[]);if(found)return found}}
  return walk(ruleOrgTree.value)
})
const selectedStaffNode = computed(() => findTreeNode(staffOrgTree.value,selectedStaffNodeId.value))
const departmentNodeCount = computed(() => flatStores.value.reduce((sum,x)=>sum+(x.departments?.length||0),0))
const filteredStaff = computed(() => staff.filter(x => allowedStores.value.includes(x.store) && staffMatchesNode(x,selectedStaffNode.value) && (statusFilter.value==='all'||x.status===statusFilter.value) && (staffRoleFilter.value==='all'||x.roleKey===staffRoleFilter.value) && hireDateMatches(x.hireDate) && matches(x,[x.name,x.code,x.phone])))
const filteredProjects = computed(() => projects.filter(x => (categoryFilter.value==='all'||x.category===categoryFilter.value) && matches(x,[x.name,x.code])))
const filteredPerformanceConfigs = computed(() => performanceConfigs.filter(x => (performanceRoleFilter.value==='all'||x.roleKey===performanceRoleFilter.value) && (performanceCategoryFilter.value==='all'||x.projectCategory===performanceCategoryFilter.value) && matches(x,[performanceRoleLabel(x.roleKey),x.projectCategory,x.note])))
const allowedMaterials = computed(() => materials.filter(x => x.stores.some(s => allowedStores.value.includes(s))))
const stockRows = computed(() => allowedMaterials.value.flatMap(material => allowedStores.value.map(store => ({...material,store,stock:batchStock(material.id,store),locked:0}))))
const filteredStock = computed(() => stockRows.value.filter(x => (storeFilter.value==='all'||x.store===storeFilter.value) && (materialCategoryFilter.value==='all'||x.category===materialCategoryFilter.value) && matches(x,[x.name,x.code])))
const allowedBatches = computed(() => batches.filter(x => allowedStores.value.includes(x.store)).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate)))
const allowedInventoryLogs = computed(() => inventoryLogs.filter(x => allowedStores.value.includes(x.store)).sort((a,b)=>b.time.localeCompare(a.time)))
const pagedStaff = computed(() => paginate(filteredStaff.value))
const pagedProjects = computed(() => paginate(filteredProjects.value))
const pagedPerformanceConfigs = computed(() => paginate(filteredPerformanceConfigs.value))
const pagedStock = computed(() => paginate(filteredStock.value))
const pagedBatches = computed(() => paginate(allowedBatches.value))
const pagedInventoryLogs = computed(() => paginate(allowedInventoryLogs.value))
const pagedRoles = computed(() => paginate(roles))
const pagedAuditLogs = computed(() => paginate(filteredAuditLogs.value))
const currentStoreRule = computed(() => {
  if (!storeRules[ruleStore.value]) storeRules[ruleStore.value] = { appointmentCapacity:3, expiryWarningDays:60, pointsPer100:10, businessPrefix:'B' }
  return storeRules[ruleStore.value]
})
const inventoryValue = computed(() => stockRows.value.reduce((sum,x)=>sum+x.stock*x.cost,0))
const lowStockCount = computed(() => stockRows.value.filter(x=>x.stock<=x.minStock).length)
const expiryAlertCount = computed(() => allowedBatches.value.filter(x=>daysUntil(x.expiryDate)<=ruleForStore(x.store).expiryWarningDays).length)
const inventoryAlerts = computed(() => [
  {key:'low',icon:'低',title:'低库存物资',detail:'库存低于最低库存，需要及时补货',value:`${lowStockCount.value}项`,tone:'danger'},
  {key:'expiry',icon:'期',title:'近效期批次',detail:'按各门店独立预警天数统计',value:`${allowedBatches.value.filter(x=>daysUntil(x.expiryDate)>=0&&daysUntil(x.expiryDate)<=ruleForStore(x.store).expiryWarningDays).length}批`,tone:'warning'},
  {key:'expired',icon:'过',title:'已过期批次',detail:'禁止领用，建议立即报损处理',value:`${allowedBatches.value.filter(x=>daysUntil(x.expiryDate)<0).length}批`,tone:'danger'}
])
const filteredAuditLogs = computed(() => auditLogs.filter(x => (logModule.value==='all'||x.module===logModule.value) && matches(x,[x.action,x.object,x.operator,x.detail])).sort((a,b)=>b.time.localeCompare(a.time)))
const entityDialogTitle = computed(() => `${editingId.value?'编辑':'新增'}${{staff:'员工',project:'项目',material:'物资',org:'组织',role:'角色'}[entityType.value]||''}`)
const stockActionTitle = computed(() => ({in:'物资入库',out:'领用出库',return:'物资退库',transfer:'门店调拨',count:'库存盘点',damage:'物资报损'}[stockAction.value]))
const entityRules = { code:[{required:true,message:'请填写编码',trigger:'blur'}], name:[{required:true,message:'请填写名称',trigger:'blur'}], label:[{required:true,message:'请填写角色名称',trigger:'blur'}], store:[{required:true,message:'请选择门店',trigger:'change'}] }
const stockRules = { store:[{required:true,message:'请选择门店',trigger:'change'}],targetStore:[{required:true,message:'请选择调入门店',trigger:'change'}],materialId:[{required:true,message:'请选择物资',trigger:'change'}],quantity:[{required:true,message:'请填写数量',trigger:'change'}],batchNo:[{required:true,message:'请填写批号',trigger:'blur'}],expiryDate:[{required:true,message:'请选择有效期',trigger:'change'}],reason:[{required:true,message:'请填写用途或原因',trigger:'blur'}] }
const performanceRules = { roleKey:[{required:true,message:'请选择用户角色',trigger:'change'}],projectCategory:[{required:true,message:'请选择项目类型',trigger:'change'}],basis:[{required:true,message:'请选择业绩计算基数',trigger:'change'}],stores:[{required:true,type:'array',min:1,message:'请至少选择一个门店',trigger:'change'}] }

watch([orgRegions,staff,projects,roles,performanceConfigs,storeRules,dictionaries,auditLogs],persistSettings,{deep:true})
watch([materials,batches,inventoryLogs,materialTemplates],persistInventory,{deep:true})
watch([activeModule, search, storeFilter, statusFilter, staffRoleFilter, hireDateRange, categoryFilter, performanceRoleFilter, performanceCategoryFilter, materialCategoryFilter, logModule, inventoryTab],()=>{listPage.value=1})

function persistSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify({orgRegions,staff,projects,roles,performanceConfigs,storeRules,dictionaries,auditLogs}));emitConfig()}
function persistInventory(){localStorage.setItem(INVENTORY_KEY,JSON.stringify({materials,batches,inventoryLogs,materialTemplates}))}
function saveSettings(action){addAudit('rules',action,ruleStore.value,'门店独立规则已更新');emitConfig()}
function emitConfig(){const departmentNames=[...new Set(flatStores.value.flatMap(store=>(store.departments||[]).map(dept=>typeof dept==='string'?dept:dept.name)).filter(Boolean))];emit('config-change',{stores:flatStores.value.filter(x=>x.status==='active').map(x=>x.name),departments:departmentNames,projectCatalog:buildProjectCatalog(),staff:JSON.parse(JSON.stringify(staff)),roles:JSON.parse(JSON.stringify(roles))})}
function buildProjectCatalog(){const groups=new Map();projects.filter(x=>x.status==='active').forEach(x=>{if(!groups.has(x.category))groups.set(x.category,[]);groups.get(x.category).push(x.name)});return [...groups].map(([label,options])=>({label,options}))}
function matches(_row,values){const q=search.value.trim().toLowerCase();return !q||values.some(v=>String(v||'').toLowerCase().includes(q))}
function paginate(rows){const start=(listPage.value-1)*pageSize;return rows.slice(start,start+pageSize)}
function canEditStore(name){return isAdmin.value||name===props.roleMeta.store}
function canEditOrgRow(row){return isAdmin.value||row.storeName===props.roleMeta.store||row.name===props.roleMeta.store}
function orgTypeLabel(type){return {company:'公司',region:'区域',store:'门店',department:'部门'}[type]||type}
function orgHeadcount(row){if(row.type==='company')return staff.filter(x=>x.status==='active').length;if(row.type==='region'){const names=row.children.flatMap(x=>x.name);return staff.filter(x=>x.status==='active'&&names.includes(x.store)).length}if(row.type==='store')return staff.filter(x=>x.status==='active'&&x.store===row.name).length;return staff.filter(x=>x.status==='active'&&x.store===row.storeName&&x.department===row.name).length}
function openDepartmentForStore(row){openEntity('org');editingId.value=null;Object.assign(entityForm,{nodeType:'department',storeId:row.id,name:'',manager:'',phone:'',status:'active'});}
function showStaffDetail(row){activeStaff.value=row;staffDetailVisible.value=true}
function addExperience(){if(!Array.isArray(entityForm.experiences))entityForm.experiences=[];entityForm.experiences.push({company:'',position:'',startDate:'',endDate:'',description:''})}
function ageFromBirthday(date){if(!date)return '';const birth=new Date(`${date}T12:00:00`);const nowDate=new Date();return nowDate.getFullYear()-birth.getFullYear()-(nowDate<new Date(nowDate.getFullYear(),birth.getMonth(),birth.getDate())?1:0)}
function authorizedModules(role){return permissionModules.filter(x=>(role.permissions?.[x.key]||[]).length)}
function permissionCount(role){return Object.values(role.permissions||{}).reduce((sum,items)=>sum+items.length,0)}
function hasPermission(moduleKey,actionKey){return entityForm.permissions?.[moduleKey]?.includes(actionKey)}
function setPermission(moduleKey,actionKey,checked){if(!entityForm.permissions)entityForm.permissions={};if(!entityForm.permissions[moduleKey])entityForm.permissions[moduleKey]=[];const list=entityForm.permissions[moduleKey];if(checked&&!list.includes(actionKey))list.push(actionKey);if(!checked&&list.includes(actionKey))list.splice(list.indexOf(actionKey),1)}
function ruleForStore(store){return storeRules[store]||currentStoreRule.value}
function selectRuleNode(data){if(!['store','department'].includes(data.type))return;selectedRuleNodeId.value=data.id;ruleStore.value=data.storeName}
function findTreeNode(rows,id){for(const row of rows){if(row.id===id)return row;const found=findTreeNode(row.children||[],id);if(found)return found}return null}
function staffMatchesNode(employee,node){if(!node||node.type==='company')return true;if(node.type==='region')return node.storeNames.includes(employee.store);if(node.type==='store')return employee.store===node.storeName;return employee.store===node.storeName&&employee.department===node.departmentName}
function hireDateMatches(hireDate){if(!hireDateRange.value?.length)return true;const [start,end]=hireDateRange.value;return Boolean(hireDate)&&hireDate>=start&&hireDate<=end}
function staffNodeCount(node){return staff.filter(employee=>allowedStores.value.includes(employee.store)&&staffMatchesNode(employee,node)).length}
function selectStaffNode(data){selectedStaffNodeId.value=data.id;listPage.value=1}
function toggleStatus(row){row.status=row.status==='active'?'disabled':'active';addAudit('staff',row.status==='active'?'启用员工':'停用员工',row.name,`状态调整为${row.status}`)}
function openEntity(type,row){entityType.value=type;editingId.value=row?.id||null;Object.keys(entityForm).forEach(k=>delete entityForm[k]);const defaults={staff:{code:`E${String(staff.length+1).padStart(4,'0')}`,name:'',gender:'女',birthday:'',phone:'',idNumber:'',email:'',emergencyContact:'',emergencyPhone:'',address:'',store:allowedStores.value[0],department:props.departments[0],roleKey:'market',secondaryStores:[],hireDate:today(),yearsExperience:0,education:'大专',specialty:'',certificates:'',experiences:[],status:'active'},project:{code:`P${String(projects.length+1).padStart(4,'0')}`,name:'',category:props.projectCatalog[0]?.label,department:props.departments[0],price:0,cardPrice:0,duration:60,courseCount:1,status:'active'},material:{code:`M${String(materials.length+1).padStart(4,'0')}`,name:'',category:materialCategories[0],spec:'',unit:'盒',brand:'',supplier:'',cost:0,minStock:5,maxStock:100,status:'active',stores:[...props.stores]},org:{nodeType:'store',name:'',region:orgRegions[0].name,storeId:flatStores.value[0]?.id,manager:'',phone:'',address:'',status:'active'},role:{label:'',dataScope:'本店',permissions:{workbench:['view']}}};let source=row?JSON.parse(JSON.stringify(row)):defaults[type];if(type==='staff')source=normalizeStaff(source);if(type==='role')source=normalizeRole(source);if(type==='org'&&row){source.nodeType=row.nodeType||row.type||'store';source.storeId=row.storeId||source.storeId;if(row.source&&typeof row.source==='object')source={...source,...JSON.parse(JSON.stringify(row.source)),nodeType:row.type,storeId:row.storeId}}Object.assign(entityForm,source);entityVisible.value=true}
async function saveEntity(){if(!await entityFormRef.value?.validate().catch(()=>false))return;const target={staff,project:projects,material:materials,role:roles}[entityType.value];if(entityType.value==='org'){saveOrg();return}const duplicate=target.find(x=>(x.code&&x.code===entityForm.code||x.label&&x.label===entityForm.label)&&x.id!==editingId.value);if(duplicate)return ElMessage.error('编码或名称重复');if(editingId.value)Object.assign(target.find(x=>x.id===editingId.value),entityForm);else target.push({...entityForm,id:`${entityType.value}-${Date.now()}`});if(entityType.value==='staff'){const roleItem=roles.find(x=>x.key===entityForm.roleKey);const savedRow=target.find(x=>x.id===(editingId.value||target.at(-1).id));savedRow.roleLabel=roleItem?.label||entityForm.roleKey}addAudit(entityType.value,editingId.value?'编辑':'新增',entityForm.name||entityForm.label,JSON.stringify(entityForm));entityVisible.value=false;if(entityType.value==='project')emitConfig();ElMessage.success('已保存')}
function saveOrg(){if(entityForm.nodeType==='department'){const store=flatStores.value.find(x=>x.id===entityForm.storeId);if(!store)return ElMessage.error('请选择所属门店');const existingIndex=(store.departments||[]).findIndex((dept,index)=>`${store.id}-dept-${index}`===editingId.value);const department={name:entityForm.name,manager:entityForm.manager,phone:entityForm.phone,status:entityForm.status||'active'};if(existingIndex>=0)store.departments.splice(existingIndex,1,department);else store.departments.push(department);addAudit('org',existingIndex>=0?'编辑部门':'新增部门',department.name,store.name);entityVisible.value=false;emitConfig();return}let store;if(editingId.value){store=flatStores.value.find(x=>x.id===editingId.value);const oldName=store.name;Object.assign(store,{name:entityForm.name,manager:entityForm.manager,phone:entityForm.phone,address:entityForm.address,status:entityForm.status});if(oldName!==store.name){const index=props.stores.indexOf(oldName);if(index>=0)props.stores.splice(index,1,store.name)}}else{const region=orgRegions.find(x=>x.name===entityForm.region);store={id:`store-${Date.now()}`,name:entityForm.name,manager:entityForm.manager,phone:entityForm.phone,address:entityForm.address,departments:[],status:entityForm.status||'active'};region.stores.push(store)}addAudit('org',editingId.value?'编辑门店':'新增门店',store.name,store.address);entityVisible.value=false;emitConfig()}
function openMaterialTemplate(project){templateProject.value=project;templateRows.splice(0,templateRows.length,...JSON.parse(JSON.stringify(materialTemplates[project.id]||[])));templateVisible.value=true}
function saveMaterialTemplate(){materialTemplates[templateProject.value.id]=JSON.parse(JSON.stringify(templateRows.filter(x=>x.materialId&&x.quantity>0)));addAudit('projects','更新耗材模板',templateProject.value.name,`配置${templateRows.length}种标准耗材`);templateVisible.value=false;ElMessage.success('耗材模板已保存')}
function projectMaterialCost(project){return (materialTemplates[project.id]||[]).reduce((sum,row)=>sum+(materials.find(x=>x.id===row.materialId)?.cost||0)*row.quantity,0)}
function performanceRoleLabel(key){return performanceRoleOptions.find(x=>x.key===key)?.label||key}
function basisLabel(value){return {totalConsumption:'成交业绩',cashReceived:'实际收款',grossProfit:'毛利业绩'}[value]||value}
function materialModeLabel(value){return value==='actual'?'实际耗材':'标准耗材'}
function openPerformanceConfig(row){
  performanceEditingId.value=row?.id||null
  Object.keys(performanceForm).forEach(key=>delete performanceForm[key])
  Object.assign(performanceForm,row?JSON.parse(JSON.stringify(row)):{roleKey:'market',projectCategory:props.projectCatalog[0]?.label||'',basis:'totalConsumption',minimumAmount:0,deductMaterial:false,materialCostMode:'standard',cashNewRate:3,cashReturningRate:2,cardNewRate:2,cardReturningRate:1.5,stores:[...allowedStores.value],status:'active',note:''})
  performanceVisible.value=true
}
async function savePerformanceConfig(){
  if(!await performanceFormRef.value?.validate().catch(()=>false))return
  const duplicate=performanceConfigs.find(item=>item.id!==performanceEditingId.value&&item.roleKey===performanceForm.roleKey&&item.projectCategory===performanceForm.projectCategory&&item.stores.some(store=>performanceForm.stores.includes(store)))
  if(duplicate)return ElMessage.error('该角色、项目类型和门店范围已有业绩配置')
  const before=performanceEditingId.value?JSON.parse(JSON.stringify(performanceConfigs.find(x=>x.id===performanceEditingId.value))):null
  if(performanceEditingId.value)Object.assign(performanceConfigs.find(x=>x.id===performanceEditingId.value),performanceForm,{updatedAt:now()})
  else performanceConfigs.push({...performanceForm,id:`performance-${Date.now()}`,createdAt:now(),updatedAt:now()})
  addAudit('performance',performanceEditingId.value?'编辑业绩配置':'新增业绩配置',`${performanceRoleLabel(performanceForm.roleKey)}·${performanceForm.projectCategory}`,`变更前：${before?JSON.stringify(before):'无'}；变更后：${JSON.stringify(performanceForm)}`)
  performanceVisible.value=false
  ElMessage.success('业绩配置已保存')
}
function openStockAction(type){stockAction.value=type;Object.keys(stockForm).forEach(k=>delete stockForm[k]);Object.assign(stockForm,{store:allowedStores.value[0],targetStore:props.stores.find(x=>x!==allowedStores.value[0])||'',materialId:allowedMaterials.value[0]?.id||'',quantity:1,batchNo:`B${today().replaceAll('-','')}`,productionDate:today(),expiryDate:addDays(today(),365),supplier:'',cost:allowedMaterials.value[0]?.cost||0,reason:''});stockVisible.value=true}
async function submitStockAction(){if(!await stockFormRef.value?.validate().catch(()=>false))return;const material=materials.find(x=>x.id===stockForm.materialId);if(!material)return;const current=batchStock(material.id,stockForm.store);if(['out','damage','transfer'].includes(stockAction.value)&&current<stockForm.quantity)return ElMessage.error('库存不足，禁止负库存');if(stockAction.value==='in'){batches.push({id:`batch-${Date.now()}`,materialId:material.id,store:stockForm.store,batchNo:stockForm.batchNo,quantity:stockForm.quantity,productionDate:stockForm.productionDate,expiryDate:stockForm.expiryDate,supplier:stockForm.supplier||material.supplier,cost:stockForm.cost})}else if(stockAction.value==='count'){adjustToCount(material.id,stockForm.store,stockForm.quantity)}else if(stockAction.value==='return'){const target=earliestBatch(material.id,stockForm.store,true);if(target)target.quantity+=stockForm.quantity;else batches.push({id:`batch-${Date.now()}`,materialId:material.id,store:stockForm.store,batchNo:'RETURN',quantity:stockForm.quantity,productionDate:today(),expiryDate:addDays(today(),365),supplier:'退库',cost:material.cost})}else{deductFifo(material.id,stockForm.store,stockForm.quantity);if(stockAction.value==='transfer'){const target=earliestBatch(material.id,stockForm.targetStore,true);if(target)target.quantity+=stockForm.quantity;else batches.push({id:`batch-${Date.now()}`,materialId:material.id,store:stockForm.targetStore,batchNo:`TRANSFER-${Date.now()}`,quantity:stockForm.quantity,productionDate:today(),expiryDate:addDays(today(),365),supplier:'门店调拨',cost:material.cost})}}const label={in:'入库',out:'领用',return:'退库',transfer:'调拨',count:'盘点',damage:'报损'}[stockAction.value];inventoryLogs.push({id:`IL${Date.now()}`,time:now(),type:stockAction.value,typeLabel:label,store:stockForm.store,materialId:material.id,materialName:material.name,quantity:stockForm.quantity,batchNo:stockForm.batchNo||'按批次扣减',operator:props.roleMeta.name,reason:stockForm.reason});if(stockAction.value==='transfer')inventoryLogs.push({id:`IL${Date.now()}-2`,time:now(),type:'transferIn',typeLabel:'调拨入库',store:stockForm.targetStore,materialId:material.id,materialName:material.name,quantity:stockForm.quantity,batchNo:'调拨',operator:props.roleMeta.name,reason:stockForm.reason});addAudit('inventory',label,material.name,`${stockForm.store} ${stockForm.quantity}${material.unit}`);stockVisible.value=false;ElMessage.success('库存操作已生效')}
function deductFifo(materialId,store,quantity){let remaining=quantity;const rows=batches.filter(x=>x.materialId===materialId&&x.store===store&&x.quantity>0&&daysUntil(x.expiryDate)>=0).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));for(const row of rows){const use=Math.min(row.quantity,remaining);row.quantity-=use;remaining-=use;if(!remaining)break}if(remaining>0)throw new Error('可用批次库存不足')}
function adjustToCount(materialId,store,count){const current=batchStock(materialId,store);if(count<current)deductFifo(materialId,store,current-count);else if(count>current){const target=earliestBatch(materialId,store,true);if(target)target.quantity+=count-current}}
function earliestBatch(materialId,store,includeExpired=false){return batches.filter(x=>x.materialId===materialId&&x.store===store&&(includeExpired||daysUntil(x.expiryDate)>=0)).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate))[0]}
function batchStock(materialId,store){return batches.filter(x=>x.materialId===materialId&&x.store===store&&daysUntil(x.expiryDate)>=0).reduce((s,x)=>s+x.quantity,0)}
function materialName(id){return materials.find(x=>x.id===id)?.name||'未知物资'}
function expiryLabel(date,store){const d=daysUntil(date);return d<0?'已过期':d<=ruleForStore(store).expiryWarningDays?'近效期':'正常'}
function expiryType(date,store){const d=daysUntil(date);return d<0?'danger':d<=ruleForStore(store).expiryWarningDays?'warning':'success'}
function daysUntil(date){return Math.ceil((new Date(`${date}T12:00:00`)-new Date(`${today()}T12:00:00`))/86400000)}
function addDict(dict){if(!isAdmin.value||!dict.newValue?.trim())return;if(!dict.items.includes(dict.newValue.trim()))dict.items.push(dict.newValue.trim());addAudit('dictionary','新增字典项',dict.label,dict.newValue);dict.newValue=''}
function removeDict(dict,item){if(!isAdmin.value)return;dict.items.splice(dict.items.indexOf(item),1);addAudit('dictionary','删除字典项',dict.label,item)}
function addAudit(module,action,object,detail){auditLogs.push({id:`AL${Date.now()}${Math.random()}`,time:now(),module,moduleLabel:modules.find(x=>x.key===module)?.label||module,action,object,operator:`${props.roleMeta.label}·${props.roleMeta.name}`,detail})}
function pageLabel(key){return pageOptions.find(x=>x.key===key)?.label||key}
function exportCsv(type){const rows=type==='staff'?filteredStaff.value:filteredProjects.value;const keys=Object.keys(rows[0]||{}).filter(k=>!['id','secondaryStores'].includes(k));const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\n');const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${type}-${today()}.csv`;a.click();URL.revokeObjectURL(a.href);addAudit(type==='staff'?'staff':'projects','导出',`${rows.length}条数据`,'CSV导出')}
function simulateImport(event){if(!event.target.files?.length)return;setTimeout(()=>{ElMessage.success('文件校验完成：有效12行，重复编码1行，无效门店1行（演示）');addAudit(activeModule.value,'导入校验',event.target.files[0].name,'有效12行，错误2行')},300)}
function money(v){return Number(v||0).toLocaleString('zh-CN')}
function today(){return new Date().toISOString().slice(0,10)}
function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function now(){const d=new Date();const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
function normalizeStaff(row){return {gender:'',birthday:'',idNumber:'',email:'',emergencyContact:'',emergencyPhone:'',address:'',hireDate:'',yearsExperience:0,education:'',specialty:'',certificates:'',experiences:[],secondaryStores:[],...row,experiences:Array.isArray(row.experiences)?row.experiences:[]}}
function normalizeRole(row){const actionMap={'查看':'view','新增':'create','编辑':'edit','删除':'delete','导入':'import','导出':'export','库存操作':'operate'};const permissions=row.permissions?JSON.parse(JSON.stringify(row.permissions)):Object.fromEntries((row.pages||[]).map(page=>[page,(row.actions||[]).map(x=>actionMap[x]||x)]));['dashboard','dailyReports','dealReports'].forEach(key=>{if(!permissions[key])permissions[key]=['view','export'];else if(!permissions[key].includes('view'))permissions[key].push('view')});if(row.key==='storeManager'&&!permissions.dailyReports)permissions.dailyReports=['view','create','edit','confirm'];if(row.key==='admin'){permissionModules.forEach(module=>{permissions[module.key]=[...actionOptions]})}return {...row,label:row.key==='admin'?'admin':row.label,permissions}}
function seedOrg(){return [{id:'region-central',name:'华中区域',stores:[{id:'store-main',name:'科臻澳总店',manager:'周店长',phone:'0371-88880001',address:'郑州市金水区示范路88号',departments:['市场部','客服部','管家部','抗衰中心','皮肤管理科'],status:'active'},{id:'store-jinshui',name:'金水形象店',manager:'林经理',phone:'0371-88880002',address:'郑州市金水区商务路16号',departments:['市场部','客服部','皮肤管理科'],status:'active'}]},{id:'region-east',name:'东区区域',stores:[{id:'store-east',name:'东区旗舰店',manager:'许经理',phone:'0371-88880003',address:'郑州市郑东新区商务外环路9号',departments:['市场部','客服部','微整注射科','形体管理科'],status:'active'}]}]}
function seedStaff(){const rows=[['E0001','苏晴','13800010001','科臻澳总店','市场部','market','市场'],['E0002','顾妍','13800010002','科臻澳总店','客服部','service','客服'],['E0003','安然','13800010003','科臻澳总店','管家部','butler','管家'],['E0004','林珊','13800010004','科臻澳总店','抗衰中心','director','总监'],['E0005','周店长','13800010005','科臻澳总店','管理部','storeManager','店长'],['E0006','秦悦','13800010006','金水形象店','市场部','market','市场'],['E0007','宋佳','13800010007','金水形象店','客服部','service','客服'],['E0008','叶青','13800010008','东区旗舰店','市场部','market','市场'],['E0009','叶老师','13800010009','科臻澳总店','客户管理部','cardConsultant','卡姐'],['E0010','乔老师','13800010010','科臻澳总店','运营部','beautyConsultant','美导'],['E0011','韩经理','13800010011','科臻澳总店','管理部','manager','经理'],['admin','admin','13800010999','总部','平台管理','admin','admin']];return rows.map((x,i)=>normalizeStaff({id:`staff-${i}`,code:x[0],name:x[1],gender:i===4?'男':'女',birthday:`19${88+i}-0${i%8+1}-15`,phone:x[2],email:`staff${i+1}@lanmei.example`,emergencyContact:'家属',emergencyPhone:`1390002000${i}`,address:'郑州市金水区（演示地址）',store:x[3],department:x[4],roleKey:x[5],roleLabel:x[6],secondaryStores:[],hireDate:`202${i%5}-0${i%8+1}-01`,yearsExperience:3+i,education:i%3===0?'本科':'大专',specialty:['顾客邀约与关系维护','客户接待与术后回访','需求分析与分诊','抗衰项目排诊'][i%4],certificates:i%2?'医疗美容咨询师证书':'健康管理师证书',experiences:[{company:'某医疗美容机构',position:x[6],startDate:`201${7+i%3}-03`,endDate:`202${i%3}-12`,description:'负责顾客服务、项目协同及日常业务维护。'}],status:'active'}))}
function seedProjects(){let i=0;return props.projectCatalog.flatMap(group=>group.options.map(name=>({id:`project-${++i}`,code:`P${String(i).padStart(4,'0')}`,name,category:group.label,department:name.includes('形体')?'形体管理科':name.includes('私密')?'私密护理科':name.includes('玻尿酸')||name.includes('轮廓')?'微整注射科':'皮肤管理科',price:2800+(i%6)*1000,cardPrice:2200+(i%6)*800,duration:30+(i%4)*30,courseCount:i%3?1:5,status:'active'})))}
function seedPerformanceConfigs(){
  const categories=props.projectCatalog.map(x=>x.label)
  const seeds=[
    ['market',categories[0],3,2,2,1.5,false,'totalConsumption'],
    ['director',categories[1]||categories[0],5,4,4,3,true,'grossProfit'],
    ['beautyConsultant',categories[0],4,3,3,2,true,'totalConsumption'],
    ['cardConsultant',categories[2]||categories[0],3.5,3,2.5,2,true,'grossProfit'],
    ['manager',categories[3]||categories[0],2,2,1.5,1.5,false,'totalConsumption']
  ]
  return seeds.map((x,index)=>({id:`performance-seed-${index}`,roleKey:x[0],projectCategory:x[1],cashNewRate:x[2],cashReturningRate:x[3],cardNewRate:x[4],cardReturningRate:x[5],deductMaterial:x[6],basis:x[7],materialCostMode:'standard',minimumAmount:0,stores:[...props.stores],status:'active',note:index===1?'抗衰项目按扣除标准耗材后的毛利计提':'',createdAt:now(),updatedAt:now()}))
}
function seedRoles(){const reports=[['dashboard',['view','export']],['dailyReports',['view','export']],['dealReports',['view','export']]],make=(id,key,label,dataScope,items)=>({id,key,label,dataScope,permissions:Object.fromEntries([...items,...reports].map(([module,actions])=>[module,actions]))});return [make('role-market','market','市场','本人',[['workbench',['view','edit']],['customers',['view','create','edit']],['appointments',['view','create','edit']]]),make('role-service','service','客服','本人',[['workbench',['view','edit']],['customers',['view','edit']],['appointments',['view']]]),make('role-butler','butler','管家','本人',[['workbench',['view','edit']],['customers',['view']]]),make('role-card','cardConsultant','卡姐','本人',[['workbench',['view','edit']],['customers',['view']]]),make('role-beauty','beautyConsultant','美导','本人',[['workbench',['view','edit']],['customers',['view']]]),make('role-manager-staff','manager','经理','本人',[['workbench',['view','edit']],['customers',['view']]]),make('role-director','director','总监','本店',[['workbench',['view','edit']],['customers',['view']]]),make('role-manager','storeManager','店长','本店',[['workbench',['view','create','edit']],['customers',['view','create','edit','export']],['appointments',['view','create','edit']],['org',['view','edit']],['staff',['view','create','edit','export']],['inventory',['view','create','edit','operate']],['rules',['view','edit']]]),make('role-admin','admin','admin','全部门店',permissionModules.map(x=>[x.key,[...actionOptions]]))]}

function ensureDemoStaff(rows){const result=rows.map(row=>({...row}));seedStaff().forEach(row=>{if(!result.some(item=>item.code===row.code||item.roleKey===row.roleKey))result.push(row)});return result}
function ensureDemoRoles(rows){const result=rows.map(row=>({...row}));seedRoles().forEach(row=>{if(!result.some(item=>item.key===row.key))result.push(row)});return result}
function seedDictionaries(){return [{key:'member',label:'会员等级',items:['普通会员','银卡','金卡','铂金','黑金'],newValue:''},{key:'source',label:'顾客来源',items:['自然到店','朋友介绍','线上推广','门店转介'],newValue:''},{key:'cancel',label:'取消原因',items:['顾客临时有事','时间冲突','价格原因','项目调整'],newValue:''},{key:'followup',label:'回访结果',items:['满意','基本满意','需再次跟进','投诉待处理'],newValue:''},{key:'payment',label:'消费方式',items:['现金/支付','耗卡','未消费'],newValue:''}]}
function seedMaterials(){return [{id:'mat-1',code:'M0001',name:'一次性无菌针头',category:'一次性用品',spec:'32G×4mm/100支',unit:'盒',brand:'安适',supplier:'华康医疗',cost:180,minStock:10,maxStock:80,status:'active',stores:[...props.stores]},{id:'mat-2',code:'M0002',name:'医用玻尿酸敷料',category:'护理产品',spec:'5片/盒',unit:'盒',brand:'润颜',supplier:'美研生物',cost:95,minStock:15,maxStock:120,status:'active',stores:[...props.stores]},{id:'mat-3',code:'M0003',name:'注射用玻尿酸',category:'注射耗材',spec:'1ml/支',unit:'支',brand:'凝润',supplier:'华康医疗',cost:680,minStock:8,maxStock:50,status:'active',stores:[...props.stores]},{id:'mat-4',code:'M0004',name:'医用冷敷贴',category:'护理产品',spec:'10片/盒',unit:'盒',brand:'舒颜',supplier:'美研生物',cost:120,minStock:12,maxStock:100,status:'active',stores:[...props.stores]},{id:'mat-5',code:'M0005',name:'一次性治疗巾',category:'一次性用品',spec:'50片/包',unit:'包',brand:'洁护',supplier:'康洁用品',cost:45,minStock:20,maxStock:150,status:'active',stores:[...props.stores]}]}
function seedBatches(){const result=[];seedMaterials().forEach((m,mi)=>props.stores.forEach((store,si)=>result.push({id:`batch-${mi}-${si}`,materialId:m.id,store,batchNo:`BN260${mi+1}${si+1}`,quantity:12+mi*7+si*3,productionDate:addDays(today(),-90),expiryDate:addDays(today(),mi===4?25:180+mi*45),supplier:m.supplier,cost:m.cost})));return result}

const SettingsHeader=defineComponent({props:{title:String,subtitle:String,action:String,disabled:Boolean},emits:['action'],setup(p,{emit}){return()=>h('div',{class:'settings-section-head'},[h('div',[h('h2',p.title),h('p',p.subtitle)]),p.action?h('button',{class:'el-button el-button--primary',disabled:p.disabled,onClick:()=>emit('action')},p.action):null])}})
const ListPagination=defineComponent({props:{total:{type:Number,default:0},modelValue:{type:Number,default:1}},emits:['update:modelValue'],setup(p,{emit}){const Pagination=resolveComponent('el-pagination');return()=>p.total>pageSize?h('div',{class:'settings-pagination'},[h('span',`共 ${p.total} 条，每页 ${pageSize} 条`),h(Pagination,{currentPage:p.modelValue,'onUpdate:currentPage':value=>emit('update:modelValue',value),background:true,layout:'prev, pager, next',pageSize,total:p.total})]):null}})
</script>
