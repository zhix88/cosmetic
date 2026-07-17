<template>
  <el-dialog v-model="visible" title="批量导入邀约记录" width="980px" destroy-on-close>
    <div class="batch-import-head">
      <el-alert title="支持 .xlsx、.xls、.csv；导入后将按预约日期自动进入未来每天的预约记录和工作台。" type="info" :closable="false" show-icon />
      <el-button type="primary" plain @click="downloadTemplate">下载导入模板</el-button>
    </div>

    <div v-if="!previewRows.length" class="batch-upload-zone">
      <el-icon><UploadFilled /></el-icon>
      <strong>选择邀约记录文件</strong>
      <p>单次最多导入500条，日期不得早于今天</p>
      <input type="file" accept=".xlsx,.xls,.csv" @change="handleFile" />
    </div>

    <template v-else>
      <div class="batch-import-summary">
        <el-tag type="success">可导入 {{ validRows.length }} 条</el-tag>
        <el-tag v-if="warningCount" type="warning">提醒 {{ warningCount }} 条</el-tag>
        <el-tag v-if="errorCount" type="danger">错误 {{ errorCount }} 条</el-tag>
        <span>{{ fileName }}</span>
        <el-button link type="primary" @click="clearFile">重新选择</el-button>
      </div>
      <el-table :data="pagedPreviewRows" stripe height="440">
        <el-table-column prop="rowNo" label="行号" width="65" />
        <el-table-column prop="date" label="预约日期" width="110" />
        <el-table-column prop="time" label="时间" width="75" />
        <el-table-column prop="customerName" label="顾客" width="90" />
        <el-table-column prop="customerPhone" label="手机号" width="125" />
        <el-table-column prop="store" label="门店" min-width="125" />
        <el-table-column prop="diagnosisType" label="类型" width="70" />
        <el-table-column prop="projectsText" label="预约项目" min-width="145" />
        <el-table-column prop="market" label="市场负责人" width="100" />
        <el-table-column label="校验结果" min-width="190">
          <template #default="{ row }">
            <el-tag :type="row.errors.length ? 'danger' : row.warnings.length ? 'warning' : 'success'" size="small">
              {{ row.errors.length ? row.errors.join('；') : row.warnings.length ? row.warnings.join('；') : '校验通过' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="batch-preview-pagination">
        <span>共 {{ previewRows.length }} 条</span>
        <el-pagination v-model:current-page="previewPage" background layout="prev, pager, next" :page-size="15" :total="previewRows.length" />
      </div>
    </template>

    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" :disabled="!validRows.length" @click="confirmImport">导入 {{ validRows.length }} 条记录</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const props=defineProps({modelValue:Boolean,records:{type:Array,required:true},role:{type:String,required:true},roleMeta:{type:Object,required:true},stores:{type:Array,required:true}})
const emit=defineEmits(['update:modelValue','imported'])
const visible=computed({get:()=>props.modelValue,set:value=>emit('update:modelValue',value)})
const previewRows=ref([]),fileName=ref(''),previewPage=ref(1)
const validRows=computed(()=>previewRows.value.filter(row=>!row.errors.length))
const errorCount=computed(()=>previewRows.value.filter(row=>row.errors.length).length)
const warningCount=computed(()=>previewRows.value.filter(row=>!row.errors.length&&row.warnings.length).length)
const pagedPreviewRows=computed(()=>previewRows.value.slice((previewPage.value-1)*15,previewPage.value*15))
const today=()=>new Date().toISOString().slice(0,10)

async function handleFile(event){
  const file=event.target.files?.[0];if(!file)return
  try{
    const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true})
    const sheet=workbook.Sheets[workbook.SheetNames[0]]
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false,dateNF:'yyyy-mm-dd'})
    if(!rows.length)return ElMessage.warning('文件中没有可导入的数据')
    if(rows.length>500)return ElMessage.error('单次最多导入500条记录')
    fileName.value=file.name
    previewRows.value=rows.map((row,index)=>normalizeRow(row,index+2)).map(validateRow)
    previewPage.value=1
  }catch(error){ElMessage.error(`文件解析失败：${error.message||'请检查模板格式'}`)}
  event.target.value=''
}
function pick(row,names){for(const name of names){if(row[name]!==undefined&&String(row[name]).trim()!=='')return String(row[name]).trim()}return ''}
function normalizeDate(value){
  const text=String(value||'').trim().replace(/[./年月]/g,'-').replace(/日/g,'')
  const match=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  return match?`${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`:''
}
function normalizeTime(value){const match=String(value||'').match(/(\d{1,2}):(\d{2})/);return match?`${match[1].padStart(2,'0')}:${match[2]}`:''}
function normalizePhone(value){return String(value||'').replace(/\D/g,'')}
function normalizeRow(row,rowNo){
  const projectsText=pick(row,['预约项目','项目','预计项目'])
  return {rowNo,date:normalizeDate(pick(row,['预约日期','到店日期','日期'])),time:normalizeTime(pick(row,['预约时间','到店时间','时间'])),customerName:pick(row,['顾客姓名','VIP1','主顾客']),customerPhone:normalizePhone(pick(row,['手机号','顾客电话','VIP1电话'])),companionName:pick(row,['同行顾客','VIP2']),companionPhone:normalizePhone(pick(row,['同行手机号','VIP2电话'])),store:pick(row,['门店','店']),diagnosisType:pick(row,['诊疗类型','新诊/复诊','顾客状态']),projectsText,projects:projectsText.split(/[、,，;/；]/).map(x=>x.trim()).filter(Boolean),market:pick(row,['市场负责人','市场']),note:pick(row,['备注','邀约备注'])}
}
function validateRow(row){
  row.errors=[];row.warnings=[]
  if(!row.date)row.errors.push('日期格式错误');else if(row.date<today())row.errors.push('不能导入历史日期')
  if(!/^(0\d|1\d|2[0-3]):[0-5]\d$/.test(row.time))row.errors.push('时间格式错误')
  if(!row.customerName)row.errors.push('缺少顾客姓名')
  if(!/^1\d{10}$/.test(row.customerPhone))row.errors.push('手机号格式错误')
  if(!props.stores.includes(row.store))row.errors.push('门店无效')
  if(!['新诊','复诊'].includes(row.diagnosisType))row.errors.push('类型应为新诊或复诊')
  if(!row.projects.length)row.errors.push('缺少预约项目')
  if(props.role!=='admin'&&row.store!==props.roleMeta.store)row.errors.push('无该门店导入权限')
  if(props.role==='market'&&row.market&&row.market!==props.roleMeta.name)row.errors.push('只能导入本人负责记录')
  if(!row.market)row.market=props.role==='market'?props.roleMeta.name:'未分配'
  if(props.records.some(x=>x.businessDate===row.date&&normalizePhone(x.vip1?.phone)===row.customerPhone&&x.status!=='cancelled'))row.warnings.push('当天已有预约')
  const slotCount=props.records.filter(x=>x.businessDate===row.date&&x.appointmentTime===row.time&&x.store===row.store&&x.status!=='cancelled').length
  if(slotCount>=3)row.warnings.push('该时段已超容量')
  return row
}
function confirmImport(){
  const stamp=Date.now()
  const imported=validRows.value.map((row,index)=>createRecord(row,stamp,index))
  emit('imported',imported)
  ElMessage.success(`成功导入${imported.length}条邀约记录`)
  clearFile();visible.value=false
}
function createRecord(row,stamp,index){
  const id=`BI${row.date.replaceAll('-','')}${String(stamp).slice(-5)}${String(index+1).padStart(3,'0')}`
  const staff={科臻澳总店:{service:'顾妍',butler:'安然',director:'林珊',manager:'周店长'},金水形象店:{service:'宋佳',butler:'夏薇',director:'顾宁',manager:'林经理'},东区旗舰店:{service:'唐欣',butler:'温然',director:'许诺',manager:'许经理'}}[row.store]||{}
  return {id,businessDate:row.date,appointmentTime:row.time,diagnosisType:row.diagnosisType,store:row.store,vip1:{name:row.customerName,phone:row.customerPhone},vip2:row.companionName?{name:row.companionName,phone:row.companionPhone}:null,cardConsultant:'',beautyConsultant:'',estimatedProject:row.projects.join('、'),projects:row.projects,estimatedAmount:0,paymentType:'none',revenue:0,cardAmount:0,note:row.note,assignments:{market:row.market,...staff},storeManager:staff.manager||'',department:'',followupDate:addDays(row.date,1),status:'invited',appointmentStatus:'pending',flags:row.warnings.map(x=>`导入提醒：${x}`),source:'batch-import',logs:[{id:`${id}-created`,time:nowText(),operator:`${props.roleMeta.label}·${props.roleMeta.name}`,action:'批量导入预约',detail:`预约${row.date} ${row.time}到店`,fromStatus:'invited',toStatus:'invited',type:'primary'}]}
}
function downloadTemplate(){
  const headers=['预约日期','预约时间','顾客姓名','手机号','同行顾客','同行手机号','门店','新诊/复诊','预约项目','市场负责人','备注']
  const examples=[[addDays(today(),1),'10:00','示例顾客','13800000001','','','科臻澳总店','新诊','面部护理、祛皱纹','苏晴','首次邀约']]
  const sheet=XLSX.utils.aoa_to_sheet([headers,...examples])
  sheet['!cols']=[12,10,12,14,12,14,16,12,24,14,24].map(w=>({wch:w}))
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,'邀约导入模板')
  XLSX.writeFile(workbook,'邀约记录批量导入模板.xlsx')
}
function clearFile(){previewRows.value=[];fileName.value='';previewPage.value=1}
function addDays(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function nowText(){const d=new Date(),p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
</script>
