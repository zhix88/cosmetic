<template>
  <section class="daily-report-page">
    <div class="report-summary">
      <article><p>本月日报</p><strong>{{ monthReports.length }}</strong><small>已确认 {{ monthReports.filter(x => x.status === 'confirmed').length }} 份</small></article>
      <article><p>本月销售业绩</p><strong>¥{{ money(monthSales) }}</strong><small>现金＋耗卡</small></article>
      <article><p>本月实际收款</p><strong>¥{{ money(monthCash) }}</strong><small>已保存日报口径</small></article>
      <article><p>待处理日报</p><strong>{{ visibleReports.filter(x => x.status !== 'confirmed').length }}</strong><small>草稿或已退回</small></article>
    </div>

    <div class="report-list-panel">
      <div class="report-filters">
        <el-date-picker v-model="filterMonth" type="month" value-format="YYYY-MM" format="YYYY年MM月" :clearable="false" />
        <el-select v-model="filterStore" :disabled="role !== 'admin'"><el-option v-if="role === 'admin'" label="全部门店" value="all" /><el-option v-for="store in stores" :key="store" :label="store" :value="store" /></el-select>
        <el-select v-model="filterStatus"><el-option label="全部状态" value="all" /><el-option label="草稿" value="draft" /><el-option label="已确认" value="confirmed" /><el-option label="已退回" value="returned" /></el-select>
        <el-button v-if="role === 'storeManager'" class="toolbar-action" type="primary" :icon="Plus" @click="openCreate">新增日报</el-button>
      </div>
      <el-table :data="pagedReports" stripe empty-text="暂无日报，店长可点击“新增日报”生成">
        <el-table-column prop="reportDate" label="日期" width="115" />
        <el-table-column prop="storeNameSnapshot" label="门店" min-width="135" />
        <el-table-column label="销售业绩" width="115" align="right"><template #default="{ row }">¥{{ money(metricTotal(row, 'sales')) }}</template></el-table-column>
        <el-table-column label="实际收款" width="115" align="right"><template #default="{ row }">¥{{ money(metricTotal(row, 'cash')) }}</template></el-table-column>
        <el-table-column label="耗卡" width="105" align="right"><template #default="{ row }">¥{{ money(metricTotal(row, 'cardAmount')) }}</template></el-table-column>
        <el-table-column label="预约人数" width="90" align="center"><template #default="{ row }">{{ metricTotal(row, 'appointments') }}</template></el-table-column>
        <el-table-column label="见诊人数" width="90" align="center"><template #default="{ row }">{{ metricTotal(row, 'consultations') }}</template></el-table-column>
        <el-table-column label="成交率" width="85" align="center"><template #default="{ row }">{{ Number(metricTotal(row, 'conversion')).toFixed(1) }}%</template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="statusMeta[row.status].type">{{ statusMeta[row.status].label }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="230" fixed="right"><template #default="{ row }"><el-button link @click="openReport(row, true)">查看</el-button><el-button link type="success" @click="exportReport(row)">导出</el-button><el-button v-if="canEdit(row)" link type="primary" @click="openReport(row)">编辑</el-button><el-button v-if="role === 'admin' && row.status === 'confirmed'" link type="warning" @click="unlockReport(row)">解锁</el-button><el-button v-if="role === 'admin' && row.status === 'confirmed'" link type="danger" @click="returnReport(row)">退回</el-button></template></el-table-column>
      </el-table>
      <div v-if="filteredReports.length > pageSize" class="customer-pagination"><span>共 {{ filteredReports.length }} 条，每页15条</span><el-pagination v-model:current-page="currentPage" background layout="prev, pager, next" :page-size="pageSize" :total="filteredReports.length" /></div>
    </div>

    <el-dialog v-model="createVisible" title="生成每日经营报表" width="520px">
      <el-form label-position="top"><el-form-item label="报表门店"><el-input :model-value="roleMeta.store" disabled /></el-form-item><el-form-item label="报表日期"><el-date-picker v-model="createDate" type="date" value-format="YYYY-MM-DD" :disabled-date="disableFuture" /></el-form-item><el-alert title="系统将读取本店当日正式业务记录，自动计算经营指标。" type="info" :closable="false" /></el-form>
      <template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" @click="createReport">生成并核对</el-button></template>
    </el-dialog>

    <el-drawer v-model="editorVisible" size="900px" :with-header="false">
      <template v-if="editingReport">
        <div class="report-editor-head">
          <div><p>{{ editingReport.storeNameSnapshot }}</p><h2>{{ formatDate(editingReport.reportDate) }} 每日经营报表</h2><small>数据更新时间：{{ editingReport.sourceSnapshot.generatedAt }}</small></div>
          <div><el-tag v-if="sourceChanged && editingReport.status !== 'confirmed'" type="warning">源数据已变化</el-tag><el-tag :type="statusMeta[editingReport.status].type">{{ statusMeta[editingReport.status].label }}</el-tag></div>
        </div>

        <el-alert v-if="editingReport.status === 'returned'" :title="`退回原因：${editingReport.returnReason || '未填写'}`" type="warning" :closable="false" show-icon />
        <div class="daily-sheet">
          <div class="daily-sheet-title"><span>序号</span><strong>经营项目</strong><b>{{ editingReport.reportDate }}</b><em>备注</em></div>
          <div class="daily-sheet-subhead"><span></span><strong></strong><i>新诊</i><i>复诊</i><i>合计</i><em></em></div>
          <div v-for="(item, index) in metricRows" :key="item.key" class="daily-sheet-row">
            <span>{{ index + 1 }}</span><button :disabled="!item.detail" @click="item.detail && openMetricRecords(item.key)">{{ item.label }}{{ item.unit ? `（${item.unit}）` : '' }}</button>
            <template v-if="item.manual">
              <el-input-number v-model="editingReport.manualInputs[item.key].new" :min="0" :controls="false" :disabled="readOnly" @change="syncManual(item.key)" />
              <el-input-number v-model="editingReport.manualInputs[item.key].returning" :min="0" :controls="false" :disabled="readOnly" @change="syncManual(item.key)" />
              <strong>{{ displayValue(item, manualTotal(item.key)) }}</strong>
            </template>
            <template v-else>
              <el-input-number v-model="editingReport.metrics[item.key].final.new" :min="0" :precision="item.percent ? 1 : 0" :controls="false" :disabled="readOnly || item.calculated" @change="recalculateDerived" />
              <el-input-number v-model="editingReport.metrics[item.key].final.returning" :min="0" :precision="item.percent ? 1 : 0" :controls="false" :disabled="readOnly || item.calculated" @change="recalculateDerived" />
              <strong>{{ displayValue(item, editingReport.metrics[item.key].final.total) }}</strong>
            </template>
            <em>{{ item.note || '' }}</em>
          </div>
        </div>

        <div class="monthly-report-grid">
          <article><span>本月累计新诊实收</span><strong>¥{{ money(monthlyTotals.newCash) }}</strong></article>
          <article><span>本月累计复诊实收</span><strong>¥{{ money(monthlyTotals.returningCash) }}</strong></article>
          <article><span>本月合计成交</span><strong>¥{{ money(monthlyTotals.sales) }}</strong></article>
          <article><span>本月累计退卡</span><strong>¥{{ money(monthlyTotals.returnCard) }}</strong></article>
          <article><span>本月累计退款</span><strong>¥{{ money(monthlyTotals.refund) }}</strong></article>
        </div>

        <div class="report-manual-form">
          <el-form label-position="top"><el-form-item label="经营备注"><el-input v-model="editingReport.manualInputs.note" type="textarea" :rows="3" :disabled="readOnly" placeholder="填写打版、特殊退款或其他经营说明" /></el-form-item><el-form-item v-if="hasAdjustedMetrics" label="指标调整原因" required><el-input v-model="adjustmentReason" type="textarea" :rows="2" :disabled="readOnly" placeholder="自动计算指标发生调整时必须说明原因" /></el-form-item></el-form>
        </div>

        <div class="report-log"><h3>操作记录</h3><el-timeline><el-timeline-item v-for="log in [...editingReport.logs].reverse()" :key="log.id" :timestamp="log.time"><strong>{{ log.action }}</strong><p>{{ log.operator }} · {{ log.detail }}</p></el-timeline-item></el-timeline></div>
        <div class="report-editor-actions"><el-button @click="editorVisible=false">关闭</el-button><el-button type="success" plain @click="exportReport(editingReport)">导出Excel</el-button><el-button v-if="!readOnly && sourceChanged" @click="refreshSource">重新获取数据</el-button><el-button v-if="!readOnly" type="primary" plain @click="saveDraft">保存草稿</el-button><el-button v-if="!readOnly" type="primary" @click="confirmReport">确认并锁定</el-button></div>
      </template>
    </el-drawer>

    <el-drawer v-model="detailVisible" size="760px" :title="detailTitle">
      <el-table :data="detailRecords" stripe><el-table-column prop="businessDate" label="日期" width="110" /><el-table-column label="顾客" min-width="110"><template #default="{ row }">{{ customerNames(row) }}</template></el-table-column><el-table-column prop="diagnosisType" label="类型" width="70" /><el-table-column label="项目" min-width="150"><template #default="{ row }">{{ row.projects?.join('、') || row.estimatedProject }}</template></el-table-column><el-table-column label="金额" width="100" align="right"><template #default="{ row }">¥{{ money(recordAmount(row)) }}</template></el-table-column><el-table-column label="操作" width="72"><template #default="{ row }"><el-button link type="primary" @click="$emit('open-record', row)">详情</el-button></template></el-table-column></el-table>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props=defineProps({records:{type:Array,required:true},role:{type:String,required:true},roleMeta:{type:Object,required:true},stores:{type:Array,required:true},resetToken:{type:Number,default:0}})
defineEmits(['open-record'])
const STORAGE_KEY='cosmetic-daily-reports-v1'
const pageSize=15
const today=()=>new Date().toISOString().slice(0,10)
const reports=ref(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))
const filterMonth=ref(today().slice(0,7))
const filterStore=ref(props.role==='admin'?'all':props.roleMeta.store)
const filterStatus=ref('all')
const currentPage=ref(1)
const createVisible=ref(false)
const createDate=ref(today())
const editorVisible=ref(false)
const editingReport=ref(null)
const originalReport=ref(null)
const readOnly=ref(false)
const adjustmentReason=ref('')
const detailVisible=ref(false)
const detailTitle=ref('')
const detailRecords=ref([])
const statusMeta={draft:{label:'草稿',type:'info'},confirmed:{label:'已确认',type:'success'},returned:{label:'已退回',type:'warning'}}
const metricRows=[
  {key:'sales',label:'销售业绩',unit:'元',detail:true},{key:'cash',label:'实际收款',unit:'元',detail:true},{key:'debt',label:'欠款',unit:'元',manual:true},
  {key:'appointments',label:'预约人数',detail:true},{key:'cancellations',label:'取消人数',detail:true},{key:'cardAmount',label:'耗卡金额',unit:'元',detail:true},
  {key:'cardOrders',label:'耗卡单数',unit:'单',detail:true},{key:'returnCardAmount',label:'当日退卡金额',unit:'元',manual:true},{key:'returnCardPeople',label:'当日退卡人数',manual:true},
  {key:'consultations',label:'总见诊人数',detail:true},{key:'deals',label:'成交人数',detail:true},{key:'conversion',label:'成交率',unit:'%',percent:true,calculated:true},
  {key:'average',label:'客单价',unit:'元',calculated:true},{key:'svip',label:'SVIP',manual:true},{key:'refund',label:'今日退款金额',unit:'元',manual:true}
]

const visibleReports=computed(()=>reports.value.filter(x=>props.role==='admin'||x.storeNameSnapshot===props.roleMeta.store))
const filteredReports=computed(()=>visibleReports.value.filter(x=>x.reportDate.startsWith(filterMonth.value)&&(filterStore.value==='all'||x.storeNameSnapshot===filterStore.value)&&(filterStatus.value==='all'||x.status===filterStatus.value)).sort((a,b)=>b.reportDate.localeCompare(a.reportDate)))
const pagedReports=computed(()=>filteredReports.value.slice((currentPage.value-1)*pageSize,currentPage.value*pageSize))
const monthReports=computed(()=>visibleReports.value.filter(x=>x.reportDate.startsWith(filterMonth.value)&&(filterStore.value==='all'||x.storeNameSnapshot===filterStore.value)))
const monthSales=computed(()=>monthReports.value.reduce((s,x)=>s+metricTotal(x,'sales'),0))
const monthCash=computed(()=>monthReports.value.reduce((s,x)=>s+metricTotal(x,'cash'),0))
const sourceChanged=computed(()=>editingReport.value&&editingReport.value.sourceSnapshot.signature!==sourceSignature(recordsFor(editingReport.value.storeNameSnapshot,editingReport.value.reportDate)))
const hasAdjustedMetrics=computed(()=>editingReport.value&&Object.values(editingReport.value.metrics).some(x=>JSON.stringify(x.system)!==JSON.stringify(x.final)))
const monthlyTotals=computed(()=>editingReport.value?calculateMonthTotals(editingReport.value):{newCash:0,returningCash:0,sales:0,returnCard:0,refund:0})
watch(reports,value=>localStorage.setItem(STORAGE_KEY,JSON.stringify(value)),{deep:true})
watch([filterMonth,filterStore,filterStatus],()=>currentPage.value=1)
watch(()=>props.role,()=>{filterStore.value=props.role==='admin'?'all':props.roleMeta.store})
watch(()=>props.resetToken,()=>{reports.value=[];localStorage.removeItem(STORAGE_KEY);editorVisible.value=false;detailVisible.value=false})

function recordsFor(store,date){return props.records.filter(x=>x.store===store&&x.businessDate===date)}
function personCount(record){return record.vip2?2:1}
function splitSum(rows,predicate,valueFn=personCount){const result={new:0,returning:0,total:0};rows.filter(predicate).forEach(row=>{const value=Number(valueFn(row)||0);if(row.diagnosisType==='新诊')result.new+=value;else result.returning+=value;result.total+=value});return result}
function calculateMetrics(store,date){
  const rows=recordsFor(store,date)
  const active=x=>x.status!=='cancelled'&&x.appointmentStatus!=='cancelled'
  const reachedConsult=x=>['service','followup','completed'].includes(x.status)
  const deal=x=>active(x)&&recordAmount(x)>0
  const metrics={
    sales:splitSum(rows,deal,recordAmount),cash:splitSum(rows,x=>active(x)&&Number(x.revenue)>0,x=>Number(x.revenue||0)),
    appointments:splitSum(rows,active),cancellations:splitSum(rows,x=>x.status==='cancelled'||x.appointmentStatus==='cancelled'),
    cardAmount:splitSum(rows,x=>active(x)&&Number(x.cardAmount)>0,x=>Number(x.cardAmount||0)),cardOrders:splitSum(rows,x=>active(x)&&Number(x.cardAmount)>0,()=>1),
    consultations:splitSum(rows,reachedConsult),deals:splitSum(rows,deal)
  }
  metrics.conversion=derivedRate(metrics.deals,metrics.consultations)
  metrics.average=derivedRate(metrics.sales,metrics.deals,false)
  return Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,{system:{...value},final:{...value}}]))
}
function derivedRate(numerator,denominator,percent=true){const calc=(a,b)=>b?(percent?a/b*100:a/b):0;return {new:calc(numerator.new,denominator.new),returning:calc(numerator.returning,denominator.returning),total:calc(numerator.total,denominator.total)}}
function recalculateDerived(){if(!editingReport.value)return;const m=editingReport.value.metrics;m.sales.final.total=m.sales.final.new+m.sales.final.returning;m.cash.final.total=m.cash.final.new+m.cash.final.returning;m.appointments.final.total=m.appointments.final.new+m.appointments.final.returning;m.cancellations.final.total=m.cancellations.final.new+m.cancellations.final.returning;m.cardAmount.final.total=m.cardAmount.final.new+m.cardAmount.final.returning;m.cardOrders.final.total=m.cardOrders.final.new+m.cardOrders.final.returning;m.consultations.final.total=m.consultations.final.new+m.consultations.final.returning;m.deals.final.total=m.deals.final.new+m.deals.final.returning;m.conversion.final=derivedRate(m.deals.final,m.consultations.final);m.average.final=derivedRate(m.sales.final,m.deals.final,false)}
function newManual(){return Object.fromEntries(['debt','returnCardAmount','returnCardPeople','svip','refund'].map(key=>[key,{new:0,returning:0,total:0}]).concat([['note','']]))}
function syncManual(key){editingReport.value.manualInputs[key].total=Number(editingReport.value.manualInputs[key].new||0)+Number(editingReport.value.manualInputs[key].returning||0)}
function manualTotal(key){return Number(editingReport.value.manualInputs[key]?.total||0)}
function sourceSignature(rows){return rows.map(x=>`${x.id}:${x.status}:${x.revenue||0}:${x.cardAmount||0}:${x.diagnosisType}:${x.vip2?.phone||''}:${x.logs?.at(-1)?.time||''}`).sort().join('|')}
function sourceSnapshot(store,date){const rows=recordsFor(store,date);return {recordIds:rows.map(x=>x.id),signature:sourceSignature(rows),generatedAt:now()}}
function openCreate(){createDate.value=today();createVisible.value=true}
function disableFuture(date){return date>new Date(`${today()}T23:59:59`)}
function createReport(){
  if(!createDate.value)return ElMessage.warning('请选择报表日期')
  if(createDate.value>today())return ElMessage.error('不能创建未来日期日报')
  const existing=reports.value.find(x=>x.storeNameSnapshot===props.roleMeta.store&&x.reportDate===createDate.value)
  createVisible.value=false
  if(existing)return openReport(existing)
  const report={id:`DR-${createDate.value.replaceAll('-','')}-${Date.now()}`,storeId:props.roleMeta.store,storeNameSnapshot:props.roleMeta.store,reportDate:createDate.value,status:'draft',createdBy:props.roleMeta.name,confirmedBy:'',createdAt:now(),updatedAt:now(),sourceSnapshot:sourceSnapshot(props.roleMeta.store,createDate.value),metrics:calculateMetrics(props.roleMeta.store,createDate.value),manualInputs:newManual(),adjustments:[],logs:[log('创建日报','自动获取本店当日经营数据')]}
  reports.value.push(report);openReport(report);ElMessage.success('日报已生成，请核对数据')
}
function openReport(report,view=false){editingReport.value=reactive(JSON.parse(JSON.stringify(report)));originalReport.value=JSON.parse(JSON.stringify(report));readOnly.value=view||report.status==='confirmed'||props.role==='admin';adjustmentReason.value='';editorVisible.value=true}
function persistEditing(action,detail){
  recalculateDerived()
  if(hasAdjustedMetrics.value&&!adjustmentReason.value.trim())return ElMessage.error('自动计算指标调整后必须填写调整原因'),false
  const index=reports.value.findIndex(x=>x.id===editingReport.value.id)
  if(hasAdjustedMetrics.value)editingReport.value.adjustments.push({id:`AD${Date.now()}`,time:now(),operator:props.roleMeta.name,reason:adjustmentReason.value,before:originalReport.value.metrics,after:JSON.parse(JSON.stringify(editingReport.value.metrics))})
  editingReport.value.updatedAt=now();editingReport.value.logs.push(log(action,detail));reports.value[index]=JSON.parse(JSON.stringify(editingReport.value));originalReport.value=JSON.parse(JSON.stringify(editingReport.value));adjustmentReason.value='';return true
}
function saveDraft(){if(persistEditing('保存草稿','店长完成日报核对并保存'))ElMessage.success('草稿已保存')}
function confirmReport(){if(!persistEditing('确认日报','日报已确认并锁定'))return;editingReport.value.status='confirmed';editingReport.value.confirmedBy=props.roleMeta.name;editingReport.value.confirmedAt=now();const index=reports.value.findIndex(x=>x.id===editingReport.value.id);reports.value[index]=JSON.parse(JSON.stringify(editingReport.value));readOnly.value=true;ElMessage.success('日报已确认并锁定')}
function refreshSource(){editingReport.value.metrics=calculateMetrics(editingReport.value.storeNameSnapshot,editingReport.value.reportDate);editingReport.value.sourceSnapshot=sourceSnapshot(editingReport.value.storeNameSnapshot,editingReport.value.reportDate);editingReport.value.logs.push(log('刷新源数据','重新获取当日业务数据'));originalReport.value=JSON.parse(JSON.stringify(editingReport.value));ElMessage.success('已重新获取业务数据')}
async function returnReport(report){const {value}=await ElMessageBox.prompt('请输入退回原因','退回日报',{inputType:'textarea',inputValidator:v=>Boolean(v?.trim())||'必须填写退回原因'}).catch(()=>({}));if(!value)return;report.status='returned';report.returnReason=value;report.logs.push(log('退回日报',value));ElMessage.success('日报已退回店长修改')}
async function unlockReport(report){await ElMessageBox.confirm('解锁后日报将变为草稿，店长可重新修改。','解锁日报',{type:'warning'});report.status='draft';report.confirmedBy='';report.logs.push(log('解锁日报','管理员解锁已确认日报'));ElMessage.success('日报已解锁')}
function log(action,detail){return {id:`DL${Date.now()}${Math.random()}`,time:now(),operator:`${props.roleMeta.label}·${props.roleMeta.name}`,action,detail}}
function canEdit(report){return props.role==='storeManager'&&report.storeNameSnapshot===props.roleMeta.store&&report.status!=='confirmed'}
function metricTotal(report,key){return Number(report.metrics?.[key]?.final?.total||0)}
function displayValue(item,value){return item.percent?`${Number(value||0).toFixed(1)}%`:item.unit==='元'?money(value):Number(value||0).toFixed(0)}
function recordAmount(row){return Number(row.revenue||0)+Number(row.cardAmount||0)}
function customerNames(row){return [row.vip1?.name,row.vip2?.name].filter(Boolean).join('、')}
function metricFilter(key,row){const active=row.status!=='cancelled'&&row.appointmentStatus!=='cancelled';return {sales:active&&recordAmount(row)>0,cash:active&&Number(row.revenue)>0,appointments:active,cancellations:row.status==='cancelled'||row.appointmentStatus==='cancelled',cardAmount:active&&Number(row.cardAmount)>0,cardOrders:active&&Number(row.cardAmount)>0,consultations:['service','followup','completed'].includes(row.status),deals:active&&recordAmount(row)>0}[key]}
function openMetricRecords(key){detailTitle.value=metricRows.find(x=>x.key===key)?.label||'业务明细';detailRecords.value=recordsFor(editingReport.value.storeNameSnapshot,editingReport.value.reportDate).filter(row=>metricFilter(key,row));detailVisible.value=true}
function exportReport(report){
  const monthTotals=calculateMonthTotals(report)
  const value=(key,type)=>report.metrics?.[key]?.final?.[type]??report.manualInputs?.[key]?.[type]??0
  const total=key=>report.metrics?.[key]?.final?.total??report.manualInputs?.[key]?.total??0
  const row=(index,label,key,{moneyValue=false,percent=false,note=''}={})=>{
    const cell=(v,style='Number')=>`<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(v||0)}</Data></Cell>`
    return `<Row><Cell ss:StyleID="Center"><Data ss:Type="Number">${index}</Data></Cell><Cell ss:StyleID="Label"><Data ss:Type="String">${xml(label)}</Data></Cell>${cell(value(key,'new'),percent?'Percent':moneyValue?'Money':'Number')}${cell(value(key,'returning'),percent?'Percent':moneyValue?'Money':'Number')}${cell(total(key),percent?'Percent':moneyValue?'Money':'Number')}<Cell ss:StyleID="Note"><Data ss:Type="String">${xml(note)}</Data></Cell></Row>`
  }
  const manualNote=report.manualInputs.note||''
  const rows=[
    row(1,'销售业绩（元）','sales',{moneyValue:true,note:manualNote}),row(2,'实际收款（元）','cash',{moneyValue:true}),
    row(3,'欠款（元）','debt',{moneyValue:true}),row(4,'预约人数','appointments'),row(5,'取消','cancellations'),
    row(6,'耗卡金额（元）','cardAmount',{moneyValue:true}),row(7,'耗卡单数','cardOrders'),row(8,'当日退卡金额（元）','returnCardAmount',{moneyValue:true}),
    row(9,'当日退卡人数','returnCardPeople'),row(10,'总见诊人数','consultations'),row(11,'成交人数','deals'),
    row(12,'成交率','conversion',{percent:true}),row(13,'客单价（元）','average',{moneyValue:true}),row(14,'SVIP','svip'),
    summaryRow(15,'本月累计新诊实收（元）',monthTotals.newCash,'Money'),
    summaryRow(16,'本月累计复诊实收（元）',monthTotals.returningCash,'Money'),
    summaryRow(17,'本月合计成交（元）',monthTotals.sales,'Money'),
    summaryRow(18,'今日退款（元）',total('refund'),'Money'),
    summaryRow(19,'本月退款（元）',monthTotals.refund,'Money'),
    summaryRow(20,'本月累计退卡（元）',monthTotals.returnCard,'Money')
  ].join('')
  const workbook=`<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel">
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:FontName="Microsoft YaHei" ss:Size="11"/></Style>
<Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Microsoft YaHei" ss:Size="12" ss:Bold="1"/><Interior ss:Color="#E2F0D9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="SubNew"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#E2F0D9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="SubReturn"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#FCE4D6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="SubTotal"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
<Style ss:ID="Center"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style><Style ss:ID="Label"><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Number"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><NumberFormat ss:Format="0"/></Style><Style ss:ID="Money"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0.00"/></Style><Style ss:ID="Percent"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><NumberFormat ss:Format="0.0&quot;%&quot;"/></Style><Style ss:ID="Note"><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
<Style ss:ID="SummaryLabel"><Alignment ss:Vertical="Center"/><Font ss:Bold="1"/></Style><Style ss:ID="SummaryValue"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><NumberFormat ss:Format="#,##0.00"/></Style>
</Styles>
<Worksheet ss:Name="${xml(report.reportDate)}"><Table><Column ss:Width="45"/><Column ss:Width="180"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="180"/>
<Row ss:Height="30"><Cell ss:StyleID="Header" ss:MergeDown="1"><Data ss:Type="String">序号</Data></Cell><Cell ss:StyleID="Header" ss:MergeDown="1"><Data ss:Type="String">${xml(report.storeNameSnapshot)} 会场项目</Data></Cell><Cell ss:StyleID="Header" ss:MergeAcross="2"><Data ss:Type="String">${xml(report.reportDate)}</Data></Cell><Cell ss:StyleID="Header" ss:MergeDown="1"><Data ss:Type="String">备注</Data></Cell></Row>
<Row ss:Height="25"><Cell ss:Index="3" ss:StyleID="SubNew"><Data ss:Type="String">新诊</Data></Cell><Cell ss:StyleID="SubReturn"><Data ss:Type="String">复诊</Data></Cell><Cell ss:StyleID="SubTotal"><Data ss:Type="String">合计</Data></Cell></Row>
${rows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><PageSetup><Layout x:Orientation="Landscape"/><Header x:Margin="0.3"/><Footer x:Margin="0.3"/><PageMargins x:Bottom="0.5" x:Left="0.4" x:Right="0.4" x:Top="0.5"/></PageSetup><FitToPage/><Print><FitWidth>1</FitWidth><FitHeight>1</FitHeight></Print><Selected/></WorksheetOptions></Worksheet></Workbook>`
  const blob=new Blob(['\uFEFF',workbook],{type:'application/vnd.ms-excel;charset=utf-8'})
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${report.storeNameSnapshot}-${report.reportDate}-每日经营报表.xls`;link.click();URL.revokeObjectURL(url);ElMessage.success('Excel报表已导出')
}
function summaryRow(index,label,value,style='Number'){return `<Row><Cell ss:StyleID="Center"><Data ss:Type="Number">${index}</Data></Cell><Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">${xml(label)}</Data></Cell><Cell ss:StyleID="SummaryValue" ss:MergeAcross="2"><Data ss:Type="Number">${Number(value||0)}</Data></Cell><Cell ss:StyleID="Note"><Data ss:Type="String"></Data></Cell></Row>`}
function xml(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;")}
function calculateMonthTotals(report){
  const month=report.reportDate.slice(0,7),store=report.storeNameSnapshot,end=report.reportDate
  const confirmed=reports.value.filter(x=>x.id!==report.id&&x.storeNameSnapshot===store&&x.reportDate.startsWith(month)&&x.reportDate<=end&&x.status==='confirmed')
  const covered=new Set([...confirmed.map(x=>x.reportDate),report.reportDate]);const live=props.records.filter(x=>x.store===store&&x.businessDate.startsWith(month)&&x.businessDate<=end&&!covered.has(x.businessDate))
  const current=[...confirmed,report]
  return {newCash:current.reduce((s,x)=>s+Number(x.metrics.cash.final.new||0),0)+live.filter(x=>x.diagnosisType==='新诊').reduce((s,x)=>s+Number(x.revenue||0),0),returningCash:current.reduce((s,x)=>s+Number(x.metrics.cash.final.returning||0),0)+live.filter(x=>x.diagnosisType!=='新诊').reduce((s,x)=>s+Number(x.revenue||0),0),sales:current.reduce((s,x)=>s+metricTotal(x,'sales'),0)+live.reduce((s,x)=>s+recordAmount(x),0),returnCard:current.reduce((s,x)=>s+Number(x.manualInputs.returnCardAmount.total||0),0),refund:current.reduce((s,x)=>s+Number(x.manualInputs.refund.total||0),0)}
}
function money(value){return Number(value||0).toLocaleString('zh-CN',{maximumFractionDigits:2})}
function now(){const d=new Date(),p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
function formatDate(date){const [y,m,d]=date.split('-');return `${y}年${Number(m)}月${Number(d)}日`}
</script>
