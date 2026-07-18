<template>
  <section class="deal-report-page">
    <div class="deal-toolbar">
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" format="YYYY/MM/DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :clearable="false" :disabled-date="disableFuture" />
      <el-select v-model="selectedStore" :disabled="role !== 'admin'"><el-option v-if="role === 'admin'" label="全部门店" value="all" /><el-option v-for="store in stores" :key="store" :label="store" :value="store" /></el-select>
      <el-select v-model="selectedDimension"><el-option v-if="!personalView" label="全部岗位" value="all" /><el-option v-for="item in availableDimensions" :key="item.key" :label="item.label" :value="item.key" /></el-select>
      <el-tag type="info">实时数据</el-tag>
      <el-button class="toolbar-action" type="success" :icon="Download" @click="exportExcel">导出Excel</el-button>
    </div>

    <div class="deal-summary">
      <article><span>见诊人数</span><strong>{{ allSummary.total.consultations }}</strong><small>新诊 {{ allSummary.new.consultations }} · 复诊 {{ allSummary.returning.consultations }}</small></article>
      <article><span>成交人数</span><strong>{{ allSummary.total.deals }}</strong><small>成交率 {{ percent(allSummary.total.conversion) }}</small></article>
      <article><span>成交业绩</span><strong>¥{{ money(allSummary.total.performance) }}</strong><small>现金＋耗卡</small></article>
      <article><span>实际收款</span><strong>¥{{ money(allSummary.total.cash) }}</strong><small>客单价 ¥{{ money(allSummary.total.ticket) }}</small></article>
    </div>

    <section v-for="group in displayGroups" :key="group.store" class="deal-table-panel">
      <div class="deal-panel-head"><div><h2>{{ group.store }} · {{ dimensionLabel }}成交分析</h2><p>{{ rangeLabel }}，VIP1/VIP2按实际顾客人数统计</p></div><el-tag>{{ group.rows.length }}名人员</el-tag></div>
      <div class="deal-table-scroll">
        <table class="deal-analysis-table">
          <thead><tr><th rowspan="2">{{ selectedDimension === 'all' ? '人员 / 岗位' : dimensionLabel }}</th><th colspan="5">新诊</th><th colspan="4">复诊</th><th colspan="6">合计</th></tr><tr><th>见诊人数</th><th>成交人数</th><th>成交业绩<br>（万）</th><th>实收金额<br>（万）</th><th>成交率</th><th>见诊人数</th><th>成交人数</th><th>实收金额<br>（万）</th><th>成交率</th><th>见诊</th><th>成交人数</th><th>成交率</th><th>实收金额<br>（万）</th><th>成交业绩<br>（万）</th><th>客单价<br>（万）</th></tr></thead>
          <tbody>
            <tr v-for="row in pagedRows(group)" :key="row.name">
              <td><button @click="openDetails(group.store,row)">{{ row.name }}<small v-if="row.position"> {{ row.position }}</small></button></td>
              <td @click="openDetails(group.store,row,'new','consultations')">{{ row.new.consultations }}</td><td @click="openDetails(group.store,row,'new','deals')">{{ row.new.deals }}</td><td>{{ wan(row.new.performance) }}</td><td>{{ wan(row.new.cash) }}</td><td>{{ percent(row.new.conversion) }}</td>
              <td @click="openDetails(group.store,row,'returning','consultations')">{{ row.returning.consultations }}</td><td @click="openDetails(group.store,row,'returning','deals')">{{ row.returning.deals }}</td><td>{{ wan(row.returning.cash) }}</td><td>{{ percent(row.returning.conversion) }}</td>
              <td>{{ row.total.consultations }}</td><td>{{ row.total.deals }}</td><td>{{ percent(row.total.conversion) }}</td><td>{{ wan(row.total.cash) }}</td><td>{{ wan(row.total.performance) }}</td><td>{{ wan(row.total.ticket) }}</td>
            </tr>
            <tr class="deal-total-row"><td>合计</td><td>{{ group.summary.new.consultations }}</td><td>{{ group.summary.new.deals }}</td><td>{{ wan(group.summary.new.performance) }}</td><td>{{ wan(group.summary.new.cash) }}</td><td>{{ percent(group.summary.new.conversion) }}</td><td>{{ group.summary.returning.consultations }}</td><td>{{ group.summary.returning.deals }}</td><td>{{ wan(group.summary.returning.cash) }}</td><td>{{ percent(group.summary.returning.conversion) }}</td><td>{{ group.summary.total.consultations }}</td><td>{{ group.summary.total.deals }}</td><td>{{ percent(group.summary.total.conversion) }}</td><td>{{ wan(group.summary.total.cash) }}</td><td>{{ wan(group.summary.total.performance) }}</td><td>{{ wan(group.summary.total.ticket) }}</td></tr>
          </tbody>
        </table>
      </div>
      <div v-if="group.rows.length > pageSize" class="customer-pagination"><span>共 {{ group.rows.length }} 名人员，每页15条</span><el-pagination :current-page="pages[group.store] || 1" background layout="prev, pager, next" :page-size="pageSize" :total="group.rows.length" @update:current-page="pages[group.store]=$event" /></div>
    </section>

    <el-drawer v-model="detailVisible" size="800px" :title="detailTitle">
      <el-table :data="detailRecords" stripe><el-table-column prop="businessDate" label="日期" width="110" /><el-table-column label="顾客" min-width="120"><template #default="{ row }">{{ [row.vip1?.name,row.vip2?.name].filter(Boolean).join('、') }}</template></el-table-column><el-table-column prop="store" label="门店" min-width="130" /><el-table-column prop="diagnosisType" label="类型" width="70" /><el-table-column label="项目" min-width="150"><template #default="{ row }">{{ row.projects?.join('、') || row.estimatedProject }}</template></el-table-column><el-table-column label="负责人" width="90"><template #default="{ row }">{{ ownerFor(row,detailDimensionKey) }}</template></el-table-column><el-table-column label="现金" width="95" align="right"><template #default="{ row }">¥{{ money(row.revenue) }}</template></el-table-column><el-table-column label="耗卡" width="95" align="right"><template #default="{ row }">¥{{ money(row.cardAmount) }}</template></el-table-column><el-table-column label="操作" width="70"><template #default="{ row }"><el-button link type="primary" @click="$emit('open-record',row)">详情</el-button></template></el-table-column></el-table>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props=defineProps({records:{type:Array,required:true},role:{type:String,required:true},roleMeta:{type:Object,required:true},stores:{type:Array,required:true}})
defineEmits(['open-record'])
const today=()=>new Date().toISOString().slice(0,10)
const dateRange=ref([today(),today()])
const selectedStore=ref(props.role==='admin'?'all':props.roleMeta.store)
const personalView=computed(()=>!['storeManager','director','admin'].includes(props.role))
const selectedDimension=ref(personalView.value?props.role:'all')
const pageSize=15
const pages=reactive({})
const detailVisible=ref(false),detailTitle=ref(''),detailRecords=ref([])
const detailDimensionKey=ref('director')
const dimensions=[{key:'cardConsultant',label:'卡姐'},{key:'beautyConsultant',label:'美导'},{key:'market',label:'市场'},{key:'service',label:'客服'},{key:'butler',label:'管家'},{key:'manager',label:'经理'},{key:'director',label:'总监'}]
const availableDimensions=computed(()=>personalView.value?dimensions.filter(item=>item.key===props.role):dimensions)
const dimensionLabel=computed(()=>selectedDimension.value==='all'?'全部岗位':dimensions.find(x=>x.key===selectedDimension.value)?.label||'人员')
const rangeLabel=computed(()=>dateRange.value[0]===dateRange.value[1]?displayDate(dateRange.value[0]):`${displayDate(dateRange.value[0])} 至 ${displayDate(dateRange.value[1])}`)
const dailyRecords=computed(()=>props.records.filter(x=>x.businessDate>=dateRange.value[0]&&x.businessDate<=dateRange.value[1]&&(selectedStore.value==='all'||x.store===selectedStore.value)))
const storeGroups=computed(()=>{const names=selectedStore.value==='all'?props.stores:[selectedStore.value];return names.map(store=>buildStoreGroup(store,dailyRecords.value.filter(x=>x.store===store)))})
const allSummary=computed(()=>sumRows(storeGroups.value.map(x=>x.summary)))
const displayGroups=computed(()=>selectedStore.value==='all'?[{store:'全部门店汇总',rows:mergePeople(storeGroups.value.flatMap(x=>x.rows)),summary:allSummary.value},...storeGroups.value]:storeGroups.value)
watch([dateRange,selectedStore,selectedDimension],()=>Object.keys(pages).forEach(k=>delete pages[k]),{deep:true})
watch(()=>props.role,()=>{selectedStore.value=props.role==='admin'?'all':props.roleMeta.store;selectedDimension.value=personalView.value?props.role:'all'})

function ownerFor(record,key){if(key==='cardConsultant')return record.cardConsultant||'未分配';if(key==='beautyConsultant')return record.beautyConsultant||'未分配';return record.assignments?.[key]||'未分配'}
function ownerName(record){return selectedDimension.value==='all'?'全部岗位':ownerFor(record,selectedDimension.value)}
function buildStoreGroup(store,records){const map=new Map();records.forEach(record=>{const roles=selectedDimension.value==='all'?availableDimensions.value:[availableDimensions.value.find(x=>x.key===selectedDimension.value)];roles.filter(Boolean).forEach(role=>{const name=personalView.value?props.roleMeta.name:ownerFor(record,role.key),key=`${role.key}:${name}`;if(!map.has(key))map.set(key,{name,position:role.label,dimensionKey:role.key,records:[]});map.get(key).records.push(record)})});const rows=[...map.values()].map(group=>({...group,...summarize(group.records)})).sort((a,b)=>b.total.performance-a.total.performance||a.name.localeCompare(b.name,'zh-CN'));return {store,rows,summary:summarize(records)}}
function summarize(records){const section=type=>{const source=records.filter(x=>(type==='new')===(x.diagnosisType==='新诊'));const consultationRows=source.filter(isConsultation),dealRows=source.filter(isDeal);const consultations=consultationRows.reduce((s,x)=>s+personCount(x),0),deals=dealRows.reduce((s,x)=>s+personCount(x),0),performance=dealRows.reduce((s,x)=>s+recordAmount(x),0),cash=dealRows.reduce((s,x)=>s+Number(x.revenue||0),0);return {consultations,deals,performance,cash,conversion:consultations?deals/consultations*100:0,ticket:deals?performance/deals:0}};const n=section('new'),r=section('returning');return {new:n,returning:r,total:combine(n,r)}}
function combine(a,b){const consultations=a.consultations+b.consultations,deals=a.deals+b.deals,performance=a.performance+b.performance,cash=a.cash+b.cash;return {consultations,deals,performance,cash,conversion:consultations?deals/consultations*100:0,ticket:deals?performance/deals:0}}
function sumRows(rows){return rows.reduce((acc,row)=>({new:combine(acc.new,row.new),returning:combine(acc.returning,row.returning),total:combine(acc.total,row.total)}),{new:zero(),returning:zero(),total:zero()})}
function zero(){return {consultations:0,deals:0,performance:0,cash:0,conversion:0,ticket:0}}
function personCount(record){return record.vip2?2:1}
function isConsultation(record){return ['service','followup','completed'].includes(record.status)}
function isDeal(record){return record.status!=='cancelled'&&record.appointmentStatus!=='cancelled'&&recordAmount(record)>0}
function recordAmount(record){return Number(record.revenue||0)+Number(record.cardAmount||0)}
function pagedRows(group){const page=pages[group.store]||1;return group.rows.slice((page-1)*pageSize,page*pageSize)}
function openDetails(store,row,type,metric){let records=row.records;if(type)records=records.filter(x=>(type==='new')===(x.diagnosisType==='新诊'));if(metric==='consultations')records=records.filter(isConsultation);if(metric==='deals')records=records.filter(isDeal);detailDimensionKey.value=row.dimensionKey||selectedDimension.value;detailRecords.value=records.sort((a,b)=>a.businessDate.localeCompare(b.businessDate)||a.appointmentTime.localeCompare(b.appointmentTime));detailTitle.value=`${store} · ${row.name}${row.position?`（${row.position}）`:''} · ${type==='new'?'新诊':type==='returning'?'复诊':'全部'}${metric==='consultations'?'见诊':metric==='deals'?'成交':'业务'}明细`;detailVisible.value=true}
function disableFuture(date){return date>new Date(`${today()}T23:59:59`)}
function money(v){return Number(v||0).toLocaleString('zh-CN',{maximumFractionDigits:2})}
function wan(v){return (Number(v||0)/10000).toFixed(2)}
function percent(v){return `${Number(v||0).toFixed(1)}%`}
function displayDate(value){return String(value||'').replaceAll('-','/')}
function exportExcel(){
  const groups=displayGroups.value
  let rowIndex=1
  const blocks=groups.map(group=>{const xmlBlock=excelBlock(group,rowIndex);rowIndex+=group.rows.length+5;return xmlBlock}).join('')
  const workbook=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel"><Styles>${excelStyles()}</Styles><Worksheet ss:Name="成交分析"><Table>${excelColumns()}${blocks}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><PageSetup><Layout x:Orientation="Landscape"/></PageSetup><FitToPage/><Print><FitWidth>1</FitWidth></Print></WorksheetOptions></Worksheet></Workbook>`
  const blob=new Blob(['\uFEFF',workbook],{type:'application/vnd.ms-excel;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${dateRange.value[0]}至${dateRange.value[1]}-${selectedStore.value==='all'?'全部门店':selectedStore.value}-${dimensionLabel.value}成交分析.xls`;a.click();URL.revokeObjectURL(url);ElMessage.success('成交分析Excel已导出')
}
function mergePeople(rows){const map=new Map();rows.forEach(row=>{const key=`${row.dimensionKey||''}:${row.name}`;if(!map.has(key))map.set(key,{name:row.name,position:row.position,dimensionKey:row.dimensionKey,records:[]});map.get(key).records.push(...row.records)});return [...map.values()].map(x=>({...x,...summarize(x.records)})).sort((a,b)=>b.total.performance-a.total.performance)}
function excelBlock(group,start){const title=`【${group.store}】${rangeLabel.value}${dimensionLabel.value}成交分析`;const data=group.rows.map(row=>excelRow(row)).join('');return `<Row ss:Index="${start}" ss:Height="28"><Cell ss:StyleID="Title" ss:MergeAcross="15"><Data ss:Type="String">${xml(title)}</Data></Cell></Row><Row><Cell ss:StyleID="Header" ss:MergeDown="1"><Data ss:Type="String">${xml(selectedDimension.value==='all'?'人员 / 岗位':dimensionLabel.value)}</Data></Cell><Cell ss:StyleID="Header" ss:MergeAcross="4"><Data ss:Type="String">新诊</Data></Cell><Cell ss:StyleID="Header" ss:MergeAcross="3"><Data ss:Type="String">复诊</Data></Cell><Cell ss:StyleID="Header" ss:MergeAcross="5"><Data ss:Type="String">合计</Data></Cell></Row><Row>${['见诊人数','成交人数','成交业绩（万）','实收金额（万）','成交率','见诊人数','成交人数','实收金额（万）','成交率','见诊','成交人数','成交率','实收金额（万）','成交业绩（万）','客单价（万）'].map((x,index)=>`<Cell${index===0?' ss:Index="2"':''} ss:StyleID="Header"><Data ss:Type="String">${x}</Data></Cell>`).join('')}</Row>${data}${excelRow({name:'合计',...group.summary},true)}<Row ss:Height="10"><Cell ss:MergeAcross="15"/></Row>`}
function excelRow(row,total=false){const c=(v,style='Number')=>`<Cell ss:StyleID="${total?`Total${style}`:style}"><Data ss:Type="Number">${Number(v||0)}</Data></Cell>`;const name=row.position?`${row.name}（${row.position}）`:row.name;return `<Row><Cell ss:StyleID="${total?'TotalName':'Name'}"><Data ss:Type="String">${xml(name)}</Data></Cell>${c(row.new.consultations)}${c(row.new.deals)}${c(row.new.performance/10000,'Decimal')}${c(row.new.cash/10000,'Decimal')}${c(row.new.conversion/100,'Percent')}${c(row.returning.consultations)}${c(row.returning.deals)}${c(row.returning.cash/10000,'Decimal')}${c(row.returning.conversion/100,'Percent')}${c(row.total.consultations)}${c(row.total.deals)}${c(row.total.conversion/100,'Percent')}${c(row.total.cash/10000,'Decimal')}${c(row.total.performance/10000,'Decimal')}${c(row.total.ticket/10000,'Decimal')}</Row>`}
function excelColumns(){return `<Column ss:Width="90"/>${Array.from({length:15},()=>'<Column ss:Width="72"/>').join('')}`}
function excelStyles(){const border='<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders>';const total=(id,format)=>`<Style ss:ID="${id}"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1"/><Interior ss:Color="#D7DEE8" ss:Pattern="Solid"/><NumberFormat ss:Format="${format}"/>${border}</Style>`;return `<Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Microsoft YaHei" ss:Size="10"/></Style><Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="12"/><Interior ss:Color="#A9B8CB" ss:Pattern="Solid"/>${border}</Style><Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1"/><Interior ss:Color="#B8C6D8" ss:Pattern="Solid"/>${border}</Style><Style ss:ID="Name"><Alignment ss:Horizontal="Center"/>${border}</Style><Style ss:ID="Number"><Alignment ss:Horizontal="Center"/><NumberFormat ss:Format="0"/>${border}</Style><Style ss:ID="Decimal"><Alignment ss:Horizontal="Center"/><NumberFormat ss:Format="0.00"/>${border}</Style><Style ss:ID="Percent"><Alignment ss:Horizontal="Center"/><NumberFormat ss:Format="0%"/>${border}</Style>${total('TotalName','@')}${total('TotalNumber','0')}${total('TotalDecimal','0.00')}${total('TotalPercent','0%')}`}
function xml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
</script>
