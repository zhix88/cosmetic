const DEMO_DATE = '2026-07-28'
const ADMIN_WORKBENCH_KEY = 'cosmetic-workbench-v2'
const SHARED_WORKBENCH_API = '/api/shared-workbench'
const employees = [
  { id: '10001', name: '王晓歌', role: '院长', roleKey: 'storeManager', store: '科臻澳总店', department: '院办', account: 'wangxiaoge', password: '123456' },
  { id: '10002', name: '娜娜', role: '场控', roleKey: 'floorControl', store: '科臻澳总店', department: '客户服务部', account: 'nana', password: '123456' },
  { id: '10003', name: '张璐', role: '护士长', roleKey: 'headNurse', store: '科臻澳总店', department: '护理部', account: 'zhanglu', password: '123456' },
  { id: '10004', name: '洋洋', role: '护士长', roleKey: 'headNurse', store: '科臻澳总店', department: '护理部', account: 'yangyang', password: '123456' },
  { id: '10005', name: '舒婷', role: '售后', roleKey: 'aftersales', store: '科臻澳总店', department: '客户服务部', account: 'shuting', password: '123456' },
  { id: '10006', name: '小洁', role: '财务', roleKey: 'finance', store: '科臻澳总店', department: '财务部', account: 'xiaojie', password: '123456' }
]
const employeeProfileDefaults = {
  E1001: { code: 'E1001', store: '科臻澳总店', department: '院办', hireDate: '2021-03-15', yearsExperience: 8, gender: '女', birthday: '1990-05-18', phone: '13800138101', email: 'wangxiaoge@example.com', emergencyContact: '王先生', emergencyPhone: '13900138101', address: '上海市静安区', education: '本科', specialty: '门店运营管理', certificates: '医疗美容管理师' },
  E1002: { code: 'E1002', store: '科臻澳总店', department: '客户服务部', hireDate: '2022-06-01', yearsExperience: 5, gender: '女', birthday: '1993-08-12', phone: '13800138102', email: 'nana@example.com', emergencyContact: '李女士', emergencyPhone: '13900138102', address: '上海市徐汇区', education: '大专', specialty: '现场接待与排诊', certificates: '客户服务培训证书' },
  E1003: { code: 'E1003', store: '科臻澳总店', department: '护理部', hireDate: '2020-09-08', yearsExperience: 9, gender: '女', birthday: '1989-11-21', phone: '13800138103', email: 'zhanglu@example.com', emergencyContact: '张先生', emergencyPhone: '13900138103', address: '上海市普陀区', education: '本科', specialty: '护理服务管理', certificates: '护士执业证书' },
  E1004: { code: 'E1004', store: '科臻澳总店', department: '护理部', hireDate: '2021-07-12', yearsExperience: 7, gender: '女', birthday: '1991-02-16', phone: '13800138104', email: 'yangyang@example.com', emergencyContact: '杨女士', emergencyPhone: '13900138104', address: '上海市闵行区', education: '大专', specialty: '皮肤护理', certificates: '护士执业证书' },
  E1005: { code: 'E1005', store: '科臻澳总店', department: '客户服务部', hireDate: '2022-02-20', yearsExperience: 6, gender: '女', birthday: '1992-06-28', phone: '13800138105', email: 'shuting@example.com', emergencyContact: '舒先生', emergencyPhone: '13900138105', address: '上海市长宁区', education: '本科', specialty: '售后回访', certificates: '客户关系管理证书' },
  E1006: { code: 'E1006', store: '科臻澳总店', department: '财务部', hireDate: '2023-01-10', yearsExperience: 4, gender: '女', birthday: '1994-04-09', phone: '13800138106', email: 'xiaojie@example.com', emergencyContact: '谢女士', emergencyPhone: '13900138106', address: '上海市浦东新区', education: '本科', specialty: '财务结算', certificates: '初级会计职称' }
}
const profileOverrides = JSON.parse(localStorage.getItem('h5-profile-overrides') || '{}')
const profileFor = employee => ({ ...employee, ...(employeeProfileDefaults[employee.id] || {}), ...(profileOverrides[employee.id] || {}) })
const loginTheme = `
  .login{position:relative;isolation:isolate;min-height:100vh;overflow:hidden;padding:0 24px 46px;background:radial-gradient(circle at 84% 8%,#e4efff 0,rgba(228,239,255,.72) 13%,transparent 32%),linear-gradient(145deg,#f6faff 0%,#fff 48%,#f2f7ff 100%);color:#10285d}
  .login::before{content:"";position:absolute;z-index:-1;left:-28%;top:-94px;width:112%;height:480px;border-radius:0 0 52% 45%;background:linear-gradient(135deg,rgba(217,233,255,.76),rgba(255,255,255,.12));filter:blur(1px)}
  .login::after{content:"";position:absolute;z-index:-1;left:-18%;top:390px;width:138%;height:210px;border-radius:50%;border-top:2px solid rgba(67,141,255,.58);box-shadow:0 -14px 0 rgba(197,219,255,.34),0 -30px 0 rgba(239,246,255,.82);transform:rotate(5deg)}
  .login-hero{position:relative;padding:118px 0 74px;color:#10285d;text-align:center}
  .login-hero::before,.login-hero::after{content:"+";position:absolute;color:#4a97ff;font:700 42px/1 Arial;opacity:.92}.login-hero::before{left:9%;top:88px}.login-hero::after{left:22%;bottom:45px;font-size:52px}
  .login .brand{display:none}.login h1{margin:0;font-size:clamp(34px,10.8vw,48px);letter-spacing:2px;line-height:1.18;font-weight:800;color:#0d2861;text-shadow:0 4px 16px rgba(85,128,196,.08)}
  .login-hero p{display:flex;align-items:center;justify-content:center;gap:14px;margin:24px 0 0;color:#294370;font-size:20px;letter-spacing:4px;opacity:1}.login-hero p::before,.login-hero p::after{content:"";width:44px;height:2px;background:linear-gradient(90deg,transparent,#1772ff)}.login-hero p::after{transform:scaleX(-1)}
  .login-sheet{position:relative;margin:0 auto;padding:24px 22px 22px;max-width:460px;border:1px solid rgba(255,255,255,.88);border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 18px 46px rgba(36,84,151,.14),inset 0 1px 0 #fff;backdrop-filter:blur(12px)}
  .login-sheet h2{display:flex;align-items:center;justify-content:center;gap:14px;margin:0;color:#11275a;font-size:20px;font-weight:650;letter-spacing:1px}.login-sheet h2::before,.login-sheet h2::after{content:"• •";color:#1a78ff;font-size:15px;letter-spacing:6px}.login-sheet h2::after{color:#a7c9ff}
  .login-sheet>p{margin:10px 0 18px;text-align:center;color:#7182a1;font-size:13px}.login-form{gap:14px}.login-form label{gap:7px;color:#536584;font-size:13px;font-weight:600}.login-form input{box-sizing:border-box!important;width:100%!important;height:48px!important;padding:0 14px!important;border:1px solid #d7e3f4!important;border-radius:12px!important;background:#fdfefe!important;color:#10285d!important;font:inherit!important;outline:none;box-shadow:inset 0 1px 2px rgba(34,82,150,.03)}.login-form input:focus{border-color:#377ffc!important;box-shadow:0 0 0 3px rgba(41,121,255,.12)!important}.account-picker-wrap{position:relative}.account-picker{display:flex;align-items:center;justify-content:space-between;width:100%;height:48px;padding:0 14px;border:1px solid #d7e3f4!important;border-radius:12px!important;background:#fff!important;color:#10285d!important;font:inherit!important;font-weight:650;text-align:left;box-shadow:inset 0 1px 2px rgba(34,82,150,.03)!important;appearance:none;-webkit-appearance:none;transition:border-color .16s ease,box-shadow .16s ease}.account-picker:hover{border-color:#b8cae4!important;background:#fff!important}.account-picker:focus,.account-picker:focus-visible{border-color:#377ffc!important;background:#fff!important;box-shadow:0 0 0 3px rgba(41,121,255,.12)!important;outline:none}.account-picker:active{background:#f8fbff!important}.account-picker i{color:#7687a4;font-size:18px;font-style:normal;transform:rotate(90deg)}.account-options{position:absolute;z-index:12;top:55px;left:0;right:0;overflow:hidden;border:1px solid #e0e8f4;border-radius:12px;background:#fff;box-shadow:0 12px 26px rgba(32,66,119,.18)}.account-option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:47px;padding:9px 13px;border:0;border-bottom:1px solid #edf1f6;background:#fff!important;color:#1e345e!important;text-align:left}.account-option:last-child{border-bottom:0}.account-option:hover,.account-option.selected{background:#f1f7ff!important}.account-option b{font-size:14px}.account-option small{color:#7a879b;font-size:12px;white-space:nowrap}.login-form>button{margin-top:4px;height:50px;padding:0;border:0;border-radius:13px;background:linear-gradient(100deg,#166eff,#4397ff);box-shadow:0 10px 18px rgba(31,113,255,.23);color:#fff;font-size:16px;font-weight:700;letter-spacing:3px}.login-error{border-radius:10px}.demo-password{margin:14px 0 0!important;color:#8492ad!important;font-size:12px!important}.privacy{display:flex;align-items:center;justify-content:center;gap:14px;margin:80px auto 0;color:#63789c;font-size:13px}.privacy::before,.privacy::after{content:"";width:42px;height:1px;background:#bdcce3}
  @media (max-width:360px){.login{padding:0 16px 34px}.login-hero{padding-top:88px;padding-bottom:58px}.login h1{font-size:33px}.login-hero p{font-size:17px;letter-spacing:3px}.login-sheet{padding:22px 18px}.login-hero::after{left:15%}}
`
function ensureLoginTheme() {
  const style = document.querySelector('#login-reference-theme') || document.createElement('style')
  style.id = 'login-reference-theme'
  style.textContent = loginTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const workbenchTheme = `
  .workbench-page{min-height:calc(100vh - 74px);padding:14px 16px 38px;background:radial-gradient(ellipse at 96% 9%,rgba(218,232,255,.72),transparent 28%),linear-gradient(140deg,#f9fbff 0%,#fff 51%,#f5f9ff 100%)}
  .wb-notice{display:flex;align-items:center;justify-content:center;gap:10px;margin:28px 0 14px;padding:12px;border-radius:14px;background:linear-gradient(100deg,#fff6e8,#fffaf2);color:#ba7811;font-size:13px}.wb-notice b{display:grid;place-items:center;width:21px;height:21px;border-radius:50% 50% 50% 12px;background:#d59722;color:#fff;font-size:13px}
  .wb-greeting{position:relative;margin:0 0 28px;padding:0 8px}.wb-greeting h1{margin:0;color:#10285e;font-size:32px;letter-spacing:1px}.wb-greeting p{margin:10px 0 0;color:#7a88a2;font-size:15px}.wb-pending{position:absolute;right:6px;top:-6px;display:grid;place-items:center;width:58px;height:58px;border-radius:17px;background:linear-gradient(145deg,#e6f0ff,#f7faff);color:#176df0;text-align:center;box-shadow:0 8px 22px rgba(39,111,219,.1)}.wb-pending b{font-size:23px;line-height:1}.wb-pending span{margin-top:-7px;font-size:12px}
  .wb-search{display:flex;align-items:center;gap:12px;margin:0;padding:0 16px;height:56px;border:1px solid #dbe3ef;border-radius:17px;background:rgba(255,255,255,.92);box-shadow:0 5px 13px rgba(46,88,145,.04)}.wb-search::before{content:"⌕";color:#7889a6;font:36px/1 Arial;transform:rotate(-20deg)}.wb-search input{width:0;flex:1;border:0;outline:0;background:transparent;color:#172b56;font-size:16px}.wb-search input::placeholder{color:#9aa8c0}
  .wb-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:22px 0 28px;padding:0}.wb-filters button{width:100%;min-width:0;height:42px;padding:0 6px;border:1px solid #e1e6ef;border-radius:22px;background:#fff;color:#4a5b7a;font-size:14px;white-space:nowrap}.wb-filters button.selected{border-color:#176df0;background:linear-gradient(110deg,#0866f2,#2b7dff);box-shadow:0 7px 15px rgba(21,105,243,.22);color:#fff}.wb-filters .wb-filter-more{display:flex;align-items:center;justify-content:center;gap:5px;color:#172b56}.wb-filters .wb-filter-more::before{content:"⌕";font-size:18px;transform:rotate(90deg)}
  .wb-task-list{display:grid;gap:14px}.wb-card{display:block;width:100%;padding:22px 18px 18px;border:1px solid #e1e7f0;border-radius:20px;background:rgba(255,255,255,.93);box-shadow:0 10px 22px rgba(40,78,133,.07);color:#142957;text-align:left}.wb-card-top{display:flex;align-items:center;gap:14px}.wb-avatar{display:grid;place-items:center;width:58px;height:58px;flex:0 0 58px;border-radius:50%;background:radial-gradient(circle at 50% 34%,#fff 0 14%,transparent 15%),linear-gradient(145deg,#e7f1ff,#d9e8ff);color:#2779f7;font-size:25px;font-weight:800;box-shadow:inset 0 0 0 1px #e4eeff}.wb-person{min-width:0;flex:1}.wb-person b{display:block;font-size:22px}.wb-person span{display:inline-block;margin-top:6px;padding:4px 9px;border-radius:12px;background:#edf4ff;color:#176df0;font-size:13px}.wb-person span.revisit{background:#e8f8f3;color:#16876d}.wb-time{margin-left:auto;color:#176df0;font-size:26px;font-weight:650;white-space:nowrap}.wb-arrow{margin-left:3px;color:#8493ab;font-size:34px;font-weight:300;line-height:1}
  .wb-card-mid{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;padding:16px 0;border-top:1px solid #eef1f5;border-bottom:1px solid #eef1f5}.wb-project{display:flex;align-items:center;gap:9px;font-size:18px}.wb-project i{display:grid;place-items:center;width:29px;height:29px;border-radius:10px;background:#eef4ff;color:#2477f8;font-style:normal;font-size:16px}.wb-stage{flex:0 0 auto;padding:6px 10px;border-radius:9px;background:#fff2e5;color:#ec8114;font-size:14px}.wb-stage.blue{background:#eaf2ff;color:#1769e4}.wb-stage.purple{background:#f0edff;color:#6852c5}.wb-stage.green{background:#e5f8ef;color:#16875e}.wb-stage.gray{background:#eff2f6;color:#6d7889}.wb-stage.red{background:#fff0f0;color:#d64f4f}.wb-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px 14px;margin-top:14px}.wb-info-grid div{min-width:0}.wb-info-grid small,.wb-info-grid span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wb-info-grid small{color:#8491a6;font-size:12px}.wb-info-grid span{margin-top:3px;color:#304569;font-size:13px}
  .wb-progress-head{display:flex;justify-content:space-between;align-items:center;margin-top:16px;color:#73829a;font-size:15px}.wb-progress-head b{color:#246cf0;font-size:19px;font-weight:500}.wb-progress{height:8px;margin-top:12px;overflow:hidden;border-radius:10px;background:#e9edf3}.wb-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0c67ed,#367ff8)}
  .workbench-page .empty-state{margin:0 0 26px;background:#fff}.tabbar{padding:10px 0 9px;box-shadow:0 -8px 24px rgba(30,57,97,.04)}.tabbar button{display:grid;gap:5px;justify-items:center;font-size:13px}.tabbar .nav-icon{width:23px;height:23px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.tabbar button.on .nav-icon{stroke:#176df0}
  .wb-filters{display:grid;gap:10px;margin:20px 0 25px}.wb-filter-group{display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:7px;min-width:0}.wb-filter-group>label{color:#8794aa;font-size:12px;white-space:nowrap}.wb-filter-scroll{display:flex;gap:8px;min-width:0;overflow-x:auto;padding:2px 1px 4px;scrollbar-width:none}.wb-filter-scroll::-webkit-scrollbar{display:none}.wb-filters .wb-filter-chip{width:auto;min-width:max-content;height:34px;padding:0 13px;border:1px solid #e1e6ef;border-radius:18px;background:#fff;color:#52627d;font-size:13px}.wb-filters .wb-filter-chip.selected{border-color:#176df0;background:#eaf2ff;box-shadow:none;color:#176df0;font-weight:600}.wb-filters .wb-filter-more{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;height:38px;border:1px dashed #b8c8df;border-radius:12px;background:#f8fbff;color:#176df0;font-size:13px}.wb-filters .wb-filter-more::before{content:'⌕';font-size:17px;transform:rotate(90deg)}
  .filter-drawer-backdrop{position:fixed;z-index:20;inset:0;background:rgba(18,35,65,.34)}.filter-drawer{position:absolute;left:50%;bottom:0;display:flex;flex-direction:column;width:min(480px,100%);max-height:82vh;overflow:hidden;border-radius:22px 22px 0 0;background:#f6f9fe;box-shadow:0 -12px 35px rgba(24,54,103,.2);transform:translateX(-50%)}.filter-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 12px;background:#fff;border-bottom:1px solid #e5ebf4}.filter-drawer-grabber{position:absolute;top:7px;left:50%;width:36px;height:4px;border-radius:4px;background:#c6d0de;transform:translateX(-50%)}.filter-drawer-head h2{margin:7px 0 0;font-size:18px;color:#142957}.filter-drawer-head h2 small{margin-left:7px;color:#176df0;font-size:12px;font-weight:500}.filter-drawer-close{border:0;background:transparent;color:#6f7f98;font-size:25px;line-height:1}.filter-drawer-body{overflow-y:auto;padding:0 14px 92px}.filter-drawer .filter-section{margin-top:10px;padding:15px 13px}.filter-drawer .filter-section h2{font-size:15px}.filter-drawer .filter-options{gap:8px}.filter-drawer .filter-options button{padding:8px 11px;font-size:13px}.filter-drawer-actions{position:absolute;right:0;bottom:0;left:0;display:grid;grid-template-columns:100px 1fr;gap:10px;padding:11px 14px 15px;background:rgba(255,255,255,.96);box-shadow:0 -7px 18px rgba(38,68,115,.1)}.filter-drawer-actions button{height:46px;border:1px solid #dce5f1;border-radius:11px;background:#fff;color:#4c5e7a;font-size:15px}.filter-drawer-actions button:last-child{border-color:#176df0;background:#176df0;color:#fff;font-weight:700}
  .wb-filters{display:flex;align-items:center;gap:0;margin:20px 0 25px;overflow-x:auto;border-bottom:1px solid #edf0f5;padding:0;scrollbar-width:none}.wb-filters::-webkit-scrollbar{display:none}.wb-filter-box{display:flex;align-items:center;justify-content:center;gap:7px;flex:1 0 20%;height:48px;padding:0 7px;border:0;border-radius:0;background:transparent;box-shadow:none;color:#2d3f60;font-size:13px;white-space:nowrap}.wb-filters button.wb-filter-box{border:0;border-radius:0;background:transparent;box-shadow:none}.wb-filter-box strong{color:inherit;font-weight:500}.wb-filter-box em{display:none}.wb-filter-box::after{content:'';width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid #8f9caf;transform:translateY(1px)}.wb-filter-box.active,.wb-filters button.wb-filter-box.active{background:transparent;color:#176df0;border:0}.wb-filter-box.active strong{color:#176df0;font-weight:600}.wb-filter-box.more{color:#2d3f60}.wb-filter-group,.wb-filter-more,.wb-filter-chip{display:none!important}
  .filter-picker-list{display:flex;flex-wrap:wrap;gap:9px;padding:14px}.filter-picker-list button{min-height:40px;padding:0 14px;border:1px solid #dfe6f0;border-radius:20px;background:#fff;color:#52627d;font-size:14px}.filter-picker-list button.selected{border-color:#176df0;background:#eaf2ff;color:#176df0;font-weight:600}
  @media(max-width:350px){.wb-filter-box{padding:0 2px;font-size:12px}.filter-drawer-body{padding-right:10px;padding-left:10px}}
`
function ensureWorkbenchTheme() {
  const style = document.querySelector('#workbench-reference-theme') || document.createElement('style')
  style.id = 'workbench-reference-theme'
  style.textContent = workbenchTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const taskDetailTheme = `
  .task-detail-page{min-height:100vh;padding:0 14px 106px;background:radial-gradient(circle at 100% 4%,#edf4ff 0,transparent 31%),linear-gradient(145deg,#f8fbff,#f3f7fd);color:#142957}.task-detail-head{display:grid;grid-template-columns:42px minmax(0,1fr) 92px;align-items:center;height:76px;margin:0 -14px 14px;padding:0 18px;background:rgba(255,255,255,.88);box-shadow:0 1px 0 rgba(225,233,244,.85);backdrop-filter:blur(12px)}.task-detail-head h1{margin:0;text-align:center;font-size:24px;letter-spacing:1px}.task-detail-head button{width:42px;border:0;background:transparent;color:#122758;font-size:42px;font-weight:300;line-height:1}.task-detail-head .detail-stage{display:inline-flex;align-items:center;justify-content:center;justify-self:end;min-width:76px;height:30px;padding:0 9px;border-radius:15px;background:#fff2e5;color:#ee7912;font-size:15px;font-weight:600;line-height:1;white-space:nowrap}.task-detail-head .detail-stage.blue{background:#eaf2ff;color:#1769e4}.task-detail-head .detail-stage.purple{background:#f0edff;color:#6852c5}.task-detail-head .detail-stage.green{background:#e5f8ef;color:#16875e}.task-detail-head .detail-stage.gray{background:#eff2f6;color:#6d7889}.task-detail-head .detail-stage.red{background:#fff0f0;color:#d64f4f}
  .detail-order-card,.detail-panel{margin-bottom:12px;border:1px solid rgba(229,235,244,.9);border-radius:20px;background:rgba(255,255,255,.92);box-shadow:0 9px 23px rgba(42,74,119,.045)}.detail-order-card{padding:22px 20px}.detail-order-card p{margin:0;color:#7b88a0;font-size:16px}.detail-order-card p b{margin-left:10px;color:#1266ea;letter-spacing:.5px}.detail-order-card h2{margin:15px 0 0;font-size:28px;line-height:1.25}.detail-panel{padding:20px 14px}.detail-panel h2{display:flex;align-items:center;gap:10px;margin:0 0 16px;color:#172a58;font-size:21px}.detail-panel h2::before{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#e8f1ff;color:#176df0;font-size:17px}.detail-panel.customer h2::before{content:"●"}.detail-panel.business h2::before{content:"▣"}.detail-panel.flow h2::before{content:"⌘"}.detail-panel.staff h2::before{content:"♟"}
  .vip-stack{display:grid;gap:12px}.vip-card{position:relative;overflow:hidden;min-height:126px;padding:15px 82px 14px 16px;border-radius:17px;background:linear-gradient(105deg,#f8fbff,#edf4ff)}.vip-card::after{content:"♛";position:absolute;right:78px;bottom:3px;color:#e5efff;font-size:67px;line-height:1}.vip-tags{display:flex;gap:7px}.vip-tags span{padding:4px 9px;border:1px solid #8ab4ff;border-radius:14px;background:#fff;color:#176df0;font-size:13px}.vip-tags span:first-child{border-color:#f1d6a5;background:#fff9ef;color:#bd7b1b}.vip-card b,.vip-card small{display:block;position:relative;z-index:1}.vip-card b{margin-top:10px;font-size:25px}.vip-card small{margin-top:3px;color:#293e68;font-size:17px}.vip-avatar{position:absolute;right:18px;top:33px;z-index:1;display:grid;place-items:center;width:58px;height:58px;border:1px solid #d5e5ff;border-radius:50%;background:radial-gradient(circle at 50% 35%,#fff 0 13%,transparent 14%),linear-gradient(145deg,#d6e6ff,#8ab9ff);color:#fff;font-size:25px;font-weight:800}
  .detail-business-grid{display:grid;grid-template-columns:1fr 1fr;overflow:hidden;border:1px solid #e1e7ef;border-radius:15px}.detail-business-grid>div{display:flex;align-items:center;gap:12px;min-height:100px;padding:16px;border-right:1px solid #e5eaf1;border-bottom:1px solid #e5eaf1}.detail-business-grid>div:nth-child(2n){border-right:0}.detail-business-grid>div:nth-last-child(-n+2){border-bottom:0}.detail-icon{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:11px;background:#eaf2ff;color:#176df0;font-size:21px}.detail-business-grid small,.detail-business-grid b{display:block}.detail-business-grid small{color:#7d899f;font-size:13px}.detail-business-grid b{margin-top:6px;font-size:16px;line-height:1.3}
  .detail-timeline{position:relative;margin:0;padding:0;list-style:none}.detail-timeline::before{content:"";position:absolute;left:9px;top:12px;bottom:18px;width:2px;background:repeating-linear-gradient(to bottom,#dbe2ed 0 7px,transparent 7px 12px)}.detail-timeline li{position:relative;display:grid;grid-template-columns:76px 1fr;gap:10px;min-height:62px;padding-left:30px}.detail-timeline li::before{content:"";position:absolute;left:0;top:5px;width:14px;height:14px;border:3px solid #d2d7e1;border-radius:50%;background:#fff}.detail-timeline li.active::before{border-color:#176df0;background:#176df0;box-shadow:0 0 0 3px #e9f2ff}.detail-timeline time{color:#8994a7;font-size:14px}.detail-timeline li.active time{color:#176df0}.detail-timeline b{display:inline-block;font-size:16px}.detail-timeline span{margin-left:7px;color:#7d879a;font-size:13px;line-height:1.5}.detail-timeline li.active b{color:#172a58}
  .staff-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;overflow:hidden}.staff-card{min-width:0;padding:12px 3px 10px;border-radius:13px;background:linear-gradient(145deg,#fbfdff,#f1f5fb);text-align:center}.staff-card small{display:block;overflow:hidden;color:#176df0;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.staff-card i{display:grid;place-items:center;width:39px;height:39px;margin:10px auto 8px;border:1px solid #e1e9f6;border-radius:50%;background:#fff;color:#1f72ef;font-style:normal;font-size:19px}.staff-card b{display:block;overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.staff-card.empty small,.staff-card.empty b{color:#8993a4}.staff-card.empty i{color:#a8adb7}.detail-action-bar{position:fixed;z-index:7;bottom:0;left:50%;width:min(480px,100%);padding:12px 14px 16px;background:rgba(255,255,255,.94);box-shadow:0 -8px 24px rgba(39,70,119,.08);transform:translateX(-50%)}.detail-action-bar button{width:100%;height:55px;border:0;border-radius:13px;background:linear-gradient(100deg,#0965ef,#2a7cff);box-shadow:0 10px 18px rgba(18,103,238,.24);color:#fff;font-size:20px;font-weight:700;letter-spacing:1px}
  @media(max-width:350px){.detail-order-card h2{font-size:25px}.detail-business-grid>div{gap:8px;padding:12px}.detail-business-grid b{font-size:14px}.detail-timeline li{grid-template-columns:62px 1fr}.detail-timeline span{display:block;margin:3px 0 0}.staff-card b{font-size:12px}}
`
function ensureTaskDetailTheme() {
  const style = document.querySelector('#task-detail-reference-theme') || document.createElement('style')
  style.id = 'task-detail-reference-theme'
  style.textContent = taskDetailTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const filterTheme = `
  .task-filter-page{min-height:100vh;padding:0 16px 102px;background:linear-gradient(145deg,#f8fbff,#f2f6fc);color:#142957}.task-filter-head{display:flex;align-items:center;justify-content:space-between;height:70px;margin:0 -16px 18px;padding:0 16px;background:rgba(255,255,255,.9);border-bottom:1px solid #e8edf4}.task-filter-head h1{display:flex;align-items:center;gap:8px;margin:0;font-size:21px}.task-filter-head h1 small{padding:4px 7px;border-radius:10px;background:#eaf2ff;color:#176df0;font-size:11px;font-weight:500}.task-filter-head button{border:0;background:transparent;color:#15316a;font-size:38px;line-height:1}.task-filter-head span{width:32px}.filter-section{margin-top:14px;padding:19px 16px;border:1px solid #e3e9f2;border-radius:18px;background:#fff}.filter-section h2{margin:0 0 14px;font-size:17px}.filter-section h3{margin:15px 0 9px;color:#71809a;font-size:13px;font-weight:600}.filter-options{display:flex;flex-wrap:wrap;gap:10px}.filter-options button{padding:9px 13px;border:1px solid #dfe6f0;border-radius:18px;background:#fff;color:#52627d;font-size:14px}.filter-options button.selected{border-color:#176df0;background:#eaf2ff;color:#176df0;font-weight:600}.filter-date-input,.filter-keyword{box-sizing:border-box;width:100%;height:44px;margin-top:12px;padding:0 12px;border:1px solid #dfe6f0;border-radius:11px;background:#fbfdff;color:#294267;font:14px inherit;outline:none}.filter-keyword:focus,.filter-date-input:focus{border-color:#6b9ff5;box-shadow:0 0 0 3px rgba(41,121,255,.1)}.filter-empty{color:#9aa7b9;font-size:13px}.filter-tip{margin:12px 0 0;color:#8390a5;font-size:12px}.filter-action-bar{position:fixed;z-index:8;bottom:0;left:50%;display:grid;grid-template-columns:100px 1fr;gap:12px;width:min(480px,100%);padding:12px 16px 16px;background:rgba(255,255,255,.95);box-shadow:0 -8px 22px rgba(37,68,112,.08);transform:translateX(-50%)}.filter-action-bar button{height:50px;border:1px solid #dce5f1;border-radius:12px;background:#fff;color:#4c5e7a;font-size:16px}.filter-action-bar button:last-child{border-color:#176df0;background:linear-gradient(100deg,#0965ef,#2a7cff);color:#fff;font-weight:700}
`
function ensureFilterTheme() {
  const style = document.querySelector('#task-filter-theme') || document.createElement('style')
  style.id = 'task-filter-theme'
  style.textContent = filterTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const customerTheme = `
  .customer-page{min-height:calc(100vh - 74px);padding:48px 16px 38px;background:radial-gradient(circle at 85% 0%,#eaf2ff 0,transparent 25%),linear-gradient(145deg,#fafcff,#f4f8fe);color:#122857}.customer-page-head{padding:0 8px}.customer-page-head h1{margin:0;font-size:35px;letter-spacing:1px}.customer-page-head p{margin:13px 0 34px;color:#687894;font-size:17px}.customer-search-box{display:flex;align-items:center;gap:12px;height:72px;margin:0 0 22px;padding:0 20px;border:1px solid rgba(234,238,245,.9);border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 10px 24px rgba(42,73,119,.08)}.customer-search-box::before{content:"⌕";color:#7e8ba1;font:43px/1 Arial;transform:rotate(-20deg)}.customer-search-box input{width:0;flex:1;border:0;outline:0;background:transparent;color:#162c59;font-size:18px}.customer-search-box input::placeholder{color:#9ca8ba}.archive-list{overflow:hidden;border:1px solid rgba(231,236,244,.9);border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 12px 25px rgba(42,73,119,.07)}.archive-item{display:flex;align-items:center;gap:14px;width:100%;min-height:128px;padding:18px 16px;border:0;border-bottom:1px solid #e8edf4;background:transparent;color:#142957;text-align:left}.archive-item:last-child{border-bottom:0}.archive-avatar{display:grid;place-items:center;width:64px;height:64px;flex:0 0 64px;border-radius:50%;background:radial-gradient(circle at 50% 34%,#fff 0 14%,transparent 15%),linear-gradient(145deg,#edf4ff,#dceaff);color:#2677f4;font-size:29px;font-weight:800}.archive-person{min-width:0;flex:1}.archive-person b{display:block;font-size:23px}.archive-person small{display:block;margin-top:10px;overflow:hidden;color:#707e96;font-size:15px;text-overflow:ellipsis;white-space:nowrap}.archive-status{display:flex;align-items:center;gap:6px;flex:0 0 auto;padding:8px 10px;border-radius:18px;background:#edf4ff;color:#176df0;font-size:15px;font-weight:600}.archive-status i{font-style:normal;font-size:17px}.archive-status.green{background:#e7f8ee;color:#1aa56e}.archive-status.orange{background:#fff1e2;color:#e88420}.archive-status.purple{background:#f0edff;color:#6954c6}.archive-status.gray{background:#f0f2f5;color:#6d7889}.archive-status.red{background:#fff0f0;color:#d64f4f}.archive-arrow{margin-left:0;color:#7988a0;font-size:34px;font-weight:300;line-height:1}.archive-privacy{display:flex;align-items:flex-start;gap:9px;margin:28px 10px 0;color:#77859c;font-size:13px;line-height:1.55}.archive-privacy b{display:grid;place-items:center;width:20px;height:20px;flex:0 0 20px;border:1px solid #2877ef;border-radius:6px;color:#2877ef;font-size:12px}
  .archive-member{flex:0 0 auto;padding:7px 9px;border:1px solid #f0cf91;border-radius:14px;background:#fff8ea;color:#bd7c1b;font-size:13px;font-weight:600;white-space:nowrap}
  @media(max-width:350px){.customer-page{padding-left:12px;padding-right:12px}.customer-page-head h1{font-size:31px}.customer-search-box{height:62px}.archive-item{gap:10px;padding:15px 12px}.archive-avatar{width:55px;height:55px;flex-basis:55px}.archive-member{padding:6px;font-size:12px}.archive-person b{font-size:20px}}
`
function ensureCustomerTheme() {
  const style = document.querySelector('#customer-reference-theme') || document.createElement('style')
  style.id = 'customer-reference-theme'
  style.textContent = customerTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const customerDetailTheme = `
  .archive-detail-page{min-height:100vh;padding:0 14px 104px;background:radial-gradient(circle at 100% 2%,#e6f1ff 0,transparent 28%),linear-gradient(145deg,#fafcff,#f2f7fe);color:#102653}.archive-detail-head{display:flex;align-items:center;justify-content:space-between;height:78px;margin:0 -14px;padding:0 16px;background:rgba(255,255,255,.9);box-shadow:0 1px 0 rgba(226,233,243,.85)}.archive-detail-head h1{margin:0;font-size:25px;letter-spacing:1px}.archive-detail-head button{border:0;background:transparent;color:#102653;font-size:42px;font-weight:300;line-height:1}.archive-detail-head span{width:40px}.archive-readonly-top{margin:15px 0 20px;color:#7e97c1;text-align:center;font-size:14px}.archive-readonly-top::before{content:"♧";margin-right:7px;color:#417ee8}.archive-profile-card{position:relative;display:flex;align-items:center;gap:14px;min-height:118px;overflow:hidden;margin-bottom:20px;padding:18px 106px 18px 18px;border:1px solid #d9e9ff;border-radius:18px;background:linear-gradient(115deg,#f4faff,#e6f2ff)}.archive-profile-card::after{content:"✚";position:absolute;right:23px;top:29px;display:grid;place-items:center;width:55px;height:55px;border:7px solid rgba(191,220,255,.58);border-radius:19px;box-shadow:0 0 0 7px rgba(231,243,255,.8);color:#fff;font-size:31px;text-shadow:0 2px 7px #67a5f8;transform:rotate(12deg)}.archive-profile-avatar{display:grid;place-items:center;width:58px;height:58px;flex:0 0 58px;border-radius:50%;background:linear-gradient(145deg,#84b6ff,#2e7be8);box-shadow:inset 0 2px 10px rgba(255,255,255,.3);color:#fff;font-size:27px;font-weight:800}.archive-profile-info{min-width:0}.archive-profile-card h2{margin:0;font-size:22px}.archive-profile-card p{margin:4px 0 8px;color:#233b68;font-size:15px;white-space:nowrap}.member-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border:1px solid #efbc61;border-radius:7px;background:#fff9ef;color:#b27418;font-size:13px;font-weight:600}.member-tag::before{content:"♛"}
  .archive-detail-section{margin:0 0 16px;padding:20px 14px;border:1px solid #e1e8f2;border-radius:19px;background:rgba(255,255,255,.94);box-shadow:0 8px 18px rgba(45,76,119,.04)}.archive-detail-section h2{display:flex;align-items:center;gap:10px;margin:0 0 17px;font-size:21px}.archive-detail-section h2 small{padding:4px 8px;border-radius:6px;background:#eaf3ff;color:#2672e7;font-size:13px;font-weight:500}.archive-detail-section h2::before{display:grid;place-items:center;width:29px;height:29px;border-radius:8px;background:#e9f2ff;color:#176df0;font-size:17px}.archive-detail-section.base h2::before{content:"●"}.archive-detail-section.assets h2::before{content:"▱"}.archive-detail-section.service h2::before{content:"▣"}.archive-detail-section.followup h2::before{content:"☎"}
  .archive-fields{margin:0}.archive-fields>div{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:62px;border-bottom:1px solid #e8edf4}.archive-fields>div:last-child{border-bottom:0}.archive-fields dt{display:flex;align-items:center;gap:10px;color:#142957;font-size:17px}.archive-fields dt i{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#eef5ff;color:#2475ed;font-style:normal;font-size:19px}.archive-fields dd{margin:0;color:#172a58;font-size:17px;text-align:right}.readonly-note{margin:13px 0 0;padding:10px 12px;border-radius:9px;background:#edf5ff;color:#6680b0;font-size:13px;line-height:1.5}.readonly-note::before{content:"ⓘ";margin-right:7px;color:#1d75ee}
  .asset-row{display:flex;align-items:center;gap:14px;padding:11px;border:1px solid #dceaff;border-radius:14px;background:linear-gradient(105deg,#eff7ff,#e7f2ff)}.asset-cover{display:grid;place-items:center;width:65px;height:65px;border-radius:50%;background:radial-gradient(circle at 43% 40%,#fff0dc 0 13%,#e6b99d 14% 19%,#fff7ee 20% 37%,#c8e1ff 38%);color:#5086ce;font-size:25px}.asset-row b,.asset-row small{display:block}.asset-row b{font-size:19px}.asset-row small{margin-top:7px;color:#6d82a7;font-size:15px}.asset-row i{margin-left:auto;color:#1670ef;font-size:38px;font-style:normal;font-weight:300}.archive-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.archive-stat{padding:14px 8px;border-radius:13px;background:linear-gradient(145deg,#f3f8ff,#e9f3ff);text-align:center}.archive-stat i{display:grid;place-items:center;width:34px;height:34px;margin:0 auto 8px;border-radius:8px;background:linear-gradient(145deg,#5b9bff,#1670ee);color:#fff;font-style:normal;font-size:19px}.archive-stat small,.archive-stat b{display:block}.archive-stat small{color:#526684;font-size:13px}.archive-stat b{margin-top:6px;font-size:19px}.archive-followups{min-height:115px}.followup-empty{display:grid;place-items:center;min-height:104px;color:#8392a9;text-align:center}.followup-empty i{display:grid;place-items:center;width:56px;height:56px;margin:auto;border-radius:18px;background:#edf4ff;color:#8fb6f1;font-style:normal;font-size:31px}.followup-empty span{display:block;margin-top:8px}.followup-record{padding:10px 0;border-bottom:1px solid #e7edf5}.followup-record:last-child{border-bottom:0}.followup-record b,.followup-record span,.followup-record small{display:block}.followup-record span,.followup-record small{margin-top:4px;color:#72819a;font-size:13px}.archive-followup-action{position:fixed;z-index:8;bottom:0;left:50%;width:min(480px,100%);padding:12px 14px 16px;background:rgba(255,255,255,.94);box-shadow:0 -8px 23px rgba(36,69,117,.08);transform:translateX(-50%)}.archive-followup-action button{width:100%;height:56px;border:0;border-radius:14px;background:linear-gradient(100deg,#0863ec,#2b7bff);box-shadow:0 10px 18px rgba(18,103,238,.23);color:#fff;font-size:21px;font-weight:700}.archive-followup-action button::before{content:"＋";margin-right:9px;font-size:27px;font-weight:400}
  .archive-summary-grid,.archive-owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.archive-summary-grid div,.archive-owner-grid div{padding:10px;border-radius:11px;background:#f6f9fe}.archive-summary-grid small,.archive-owner-grid small{display:block;color:#7585a0;font-size:12px}.archive-summary-grid b,.archive-owner-grid b{display:block;margin-top:4px;overflow:hidden;color:#18315f;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.archive-note-list{display:grid;gap:9px}.archive-note-list div{padding:11px;border-left:3px solid #78a9ff;border-radius:0 10px 10px 0;background:#f6f9fe}.archive-note-list small,.archive-note-list b{display:block}.archive-note-list small{color:#7585a0;font-size:12px}.archive-note-list b{margin-top:4px;color:#30486f;font-size:13px;font-weight:500;line-height:1.5}.asset-stack{display:grid;gap:9px}.asset-stack .asset-row{padding:10px}.asset-stack .asset-cover{width:48px;height:48px;font-size:20px}.asset-stack .asset-row b{font-size:15px}.asset-stack .asset-row small{margin-top:3px;font-size:12px}.archive-service-list{display:grid;gap:8px}.archive-service-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:11px;background:#f6f9fe}.archive-service-row time{width:70px;color:#6e83a5;font-size:12px}.archive-service-row span{min-width:0;flex:1}.archive-service-row b,.archive-service-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.archive-service-row b{color:#18315f;font-size:14px}.archive-service-row small{margin-top:3px;color:#74839a;font-size:12px}.archive-log-list{display:grid;gap:8px}.archive-log-list div{padding:10px;border-left:3px solid #d8e8ff;background:#fbfdff}.archive-log-list b,.archive-log-list small{display:block}.archive-log-list b{color:#29436e;font-size:13px}.archive-log-list small{margin-top:3px;color:#7b8aa1;font-size:12px}.archive-followups{min-height:115px}.followup-empty{display:grid;place-items:center;min-height:104px;color:#8392a9;text-align:center}.followup-empty i{display:grid;place-items:center;width:56px;height:56px;margin:auto;border-radius:18px;background:#edf4ff;color:#8fb6f1;font-style:normal;font-size:31px}.followup-empty span{display:block;margin-top:8px}.followup-record{padding:10px 0;border-bottom:1px solid #e7edf5}.followup-record:last-child{border-bottom:0}.followup-record b,.followup-record span,.followup-record small{display:block}.followup-record span,.followup-record small{margin-top:4px;color:#72819a;font-size:13px}.archive-followup-action{position:fixed;z-index:8;bottom:0;left:50%;width:min(480px,100%);padding:12px 14px 16px;background:rgba(255,255,255,.94);box-shadow:0 -8px 23px rgba(36,69,117,.08);transform:translateX(-50%)}.archive-followup-action button{width:100%;height:56px;border:0;border-radius:14px;background:linear-gradient(100deg,#0863ec,#2b7bff);box-shadow:0 10px 18px rgba(18,103,238,.23);color:#fff;font-size:21px;font-weight:700}.archive-followup-action button::before{content:"＋";margin-right:9px;font-size:27px;font-weight:400}
  @media(max-width:350px){.archive-profile-card{gap:11px;min-height:106px;padding:16px 84px 16px 15px}.archive-profile-card::after{right:17px;top:29px;width:45px;height:45px;border-width:6px;font-size:25px}.archive-profile-avatar{width:52px;height:52px;flex-basis:52px;font-size:24px}.archive-profile-card h2{font-size:20px}.archive-fields dt,.archive-fields dd{font-size:15px}.archive-fields dt i{width:33px;height:33px}.archive-stat small{font-size:12px}}
`
function ensureCustomerDetailTheme() {
  const style = document.querySelector('#customer-detail-reference-theme') || document.createElement('style')
  style.id = 'customer-detail-reference-theme'
  style.textContent = customerDetailTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const followupFormTheme = `
  .followup-form-page{min-height:100vh;padding:0 16px 118px;background:radial-gradient(circle at 100% 0%,#d9ebff 0,transparent 24%),linear-gradient(145deg,#f9fcff,#f2f7fe);color:#102653}.followup-form-head{display:flex;align-items:center;justify-content:space-between;height:78px;margin:0 -16px 34px;padding:0 16px;border-bottom:1px solid #e4ebf4;background:rgba(255,255,255,.76)}.followup-form-head h1{margin:0;font-size:25px;letter-spacing:1px}.followup-form-head button{border:0;background:transparent;color:#102653;font-size:42px;font-weight:300;line-height:1}.followup-form-head span{width:40px}.followup-customer-strip{display:flex;align-items:center;gap:17px;margin:0 0 26px;padding:19px 18px;border:1px solid #e8edf5;border-radius:19px;background:rgba(255,255,255,.95);box-shadow:0 10px 22px rgba(47,78,122,.07)}.followup-customer-avatar{display:grid;place-items:center;width:62px;height:62px;flex:0 0 62px;border-radius:13px;background:radial-gradient(circle at 50% 34%,#fff 0 14%,transparent 15%),linear-gradient(145deg,#e6f0ff,#bdd6ff);color:#2779f7;font-size:27px;font-weight:800}.followup-customer-strip b{font-size:22px}.followup-customer-strip span{margin-left:auto;color:#273e6a;font-size:16px;white-space:nowrap}.followup-customer-strip span+span{margin-left:0}.followup-lock{display:flex;align-items:center;justify-content:center;gap:9px;width:max-content;max-width:100%;margin:0 auto 26px;padding:10px 19px;border-radius:25px;background:linear-gradient(100deg,#e9f3ff,#f6faff);color:#234577;font-size:15px}.followup-lock b{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:linear-gradient(145deg,#5d9fff,#1771ef);color:#fff;font-size:17px}.followup-card{padding:8px 18px 18px;border:1px solid #e5ebf3;border-radius:20px;background:rgba(255,255,255,.96);box-shadow:0 10px 22px rgba(47,78,122,.05)}.followup-card label{display:grid;grid-template-columns:142px 1fr;align-items:center;min-height:74px;border-bottom:1px solid #e8edf4;color:#142957;font-size:18px;font-weight:650}.followup-card label:last-of-type{display:block;padding-top:20px;border-bottom:0}.followup-card label>span::after{content:" *";color:#176df0}.followup-card select,.followup-card input{width:100%;border:0;outline:0;background:transparent;color:#152b5b;font:inherit}.followup-card select{appearance:none;padding-right:24px;background:linear-gradient(45deg,transparent 48%,#6f7f98 49% 53%,transparent 54%) right 7px center/12px 12px no-repeat,linear-gradient(-45deg,transparent 48%,#6f7f98 49% 53%,transparent 54%) right 0 center/12px 12px no-repeat}.followup-card input[type=date]{padding-right:2px}.followup-card textarea{box-sizing:border-box;width:100%;height:206px;margin-top:14px;padding:16px;border:1px solid #d7e0ec;border-radius:12px;resize:none;outline:0;color:#142957;font:inherit;line-height:1.6}.followup-card textarea::placeholder{color:#9ca9bd}.followup-note-count{display:block;margin-top:-30px;margin-right:13px;color:#8b98ac;text-align:right;font-size:13px;pointer-events:none}.followup-demo-warning{display:flex;gap:12px;margin:28px 0 0;padding:14px 16px;border-radius:13px;background:linear-gradient(100deg,#fff7e7,#fffaf2);color:#9e6b1c;font-size:14px;line-height:1.55}.followup-demo-warning b{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid #f1c66f;border-radius:50%;color:#d69621;font-size:20px}.followup-save-bar{position:fixed;z-index:8;bottom:0;left:50%;width:min(480px,100%);padding:12px 16px 16px;background:rgba(255,255,255,.94);box-shadow:0 -8px 24px rgba(38,68,115,.08);transform:translateX(-50%)}.followup-save-bar button{width:100%;height:56px;border:0;border-radius:13px;background:linear-gradient(100deg,#0863ec,#2b7bff);box-shadow:0 10px 18px rgba(18,103,238,.23);color:#fff;font-size:21px;font-weight:700}.followup-save-bar button::before{content:"▣";margin-right:10px;font-size:19px}
  @media(max-width:350px){.followup-customer-strip{gap:10px;padding:15px 12px}.followup-customer-strip b{font-size:19px}.followup-customer-strip span{font-size:14px}.followup-card{padding-left:14px;padding-right:14px}.followup-card label{grid-template-columns:118px 1fr;font-size:16px}}
`
function ensureFollowupFormTheme() {
  const style = document.querySelector('#followup-form-reference-theme') || document.createElement('style')
  style.id = 'followup-form-reference-theme'
  style.textContent = followupFormTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const mineTheme = `
  .mine-page{min-height:calc(100vh - 74px);padding:46px 16px 38px;background:radial-gradient(circle at 86% 2%,#e6f1ff 0,transparent 25%),linear-gradient(145deg,#fafcff,#f3f7fd);color:#102653}.mine-head{display:flex;align-items:center;justify-content:space-between;margin:0 8px 36px}.mine-head h1{margin:0;font-size:35px;letter-spacing:1px}.mine-head i{display:grid;place-items:center;width:38px;height:38px;color:#102653;font-size:33px;font-style:normal}.mine-profile-card{overflow:hidden;margin-bottom:45px;border:1px solid #e3ebf6;border-radius:23px;background:#fff;box-shadow:0 12px 26px rgba(46,77,120,.08)}.mine-profile-top{position:relative;display:flex;align-items:center;gap:22px;min-height:194px;padding:36px 28px;background:linear-gradient(112deg,#f7fbff,#e7f2ff)}.mine-profile-top::after{content:"";position:absolute;right:-45px;top:44px;width:192px;height:192px;border:1px solid rgba(255,255,255,.72);border-radius:50%;background:radial-gradient(circle at 45% 45%,rgba(169,207,255,.55),rgba(218,237,255,.22) 58%,transparent 59%)}.mine-avatar{position:relative;z-index:1;display:grid;place-items:center;width:94px;height:94px;flex:0 0 94px;border-radius:50%;background:linear-gradient(145deg,#85b6ff,#2478ed);box-shadow:inset 0 2px 10px rgba(255,255,255,.3);color:#fff;font-size:43px;font-weight:800}.mine-profile-top h2{position:relative;z-index:1;margin:0;font-size:29px}.mine-profile-top p{position:relative;z-index:1;margin:12px 0 0;color:#31486f;font-size:18px}.mine-stats{display:grid;grid-template-columns:1fr 1fr}.mine-stat{display:flex;align-items:center;justify-content:center;gap:16px;min-height:128px;text-align:center}.mine-stat+.mine-stat{border-left:1px solid #dde5f0}.mine-stat b{display:block;color:#1269ef;font-size:40px;line-height:1}.mine-stat small{display:block;margin-top:10px;color:#334767;font-size:16px}.mine-stat i{display:grid;place-items:center;width:50px;height:50px;border-radius:50%;background:linear-gradient(145deg,#f0f6ff,#e3efff);color:#1971ed;font-style:normal;font-size:27px}
  .mine-settings-title{margin:0 8px 18px;font-size:28px}.mine-setting-card{overflow:hidden;border:1px solid #e3eaf3;border-radius:20px;background:#fff;box-shadow:0 10px 22px rgba(46,77,120,.06)}.mine-setting-row{display:flex;align-items:center;gap:18px;width:100%;min-height:100px;padding:18px;border:0;border-bottom:1px solid #e6ecf3;background:#fff;color:#152a58;text-align:left}.mine-setting-row:last-child{border-bottom:0}.mine-setting-icon{display:grid;place-items:center;width:54px;height:54px;flex:0 0 54px;border-radius:50%;background:linear-gradient(145deg,#f0f6ff,#e5f0ff);color:#1670ed;font-size:27px;font-style:normal}.mine-setting-row span{flex:1;font-size:20px}.mine-setting-row em{color:#8996aa;font-size:37px;font-style:normal;font-weight:300}.mine-setting-row.logout span{color:#ef2828}.mine-setting-row.logout .mine-setting-icon{background:#fff0f0;color:#e82c2c}.mine-safety{display:flex;gap:13px;margin-top:28px;padding:18px;border:1px solid #d6e6ff;border-radius:17px;background:linear-gradient(110deg,#f3f8ff,#fafcff);color:#64758f;font-size:15px;line-height:1.65}.mine-safety b{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border:2px solid #1c75ee;border-radius:12px;color:#1c75ee;font-size:22px}
  @media(max-width:350px){.mine-page{padding-left:12px;padding-right:12px}.mine-profile-top{gap:15px;padding:28px 20px}.mine-avatar{width:78px;height:78px;flex-basis:78px;font-size:35px}.mine-profile-top h2{font-size:25px}.mine-profile-top p{font-size:16px}.mine-stat{gap:9px}.mine-stat b{font-size:34px}.mine-setting-row span{font-size:18px}}
`
function ensureMineTheme() {
  const style = document.querySelector('#mine-reference-theme') || document.createElement('style')
  style.id = 'mine-reference-theme'
  style.textContent = mineTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const profileTheme = `
  .profile-page{min-height:100vh;padding:0 16px 112px;background:radial-gradient(circle at 100% 0%,#e6f1ff 0,transparent 27%),linear-gradient(145deg,#fbfdff,#f2f7fe);color:#102653}.profile-head{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;height:76px;margin:0 -16px 18px;padding:0 16px;border-bottom:1px solid #e4ebf4;background:rgba(255,255,255,.8)}.profile-head h1{margin:0;text-align:center;font-size:22px}.profile-head button{border:0;background:transparent;color:#102653;font-size:42px;font-weight:300;line-height:1}.profile-summary{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:18px;border:1px solid #dceafb;border-radius:18px;background:linear-gradient(105deg,#f8fbff,#e9f3ff);box-shadow:0 8px 18px rgba(45,78,123,.05)}.profile-summary-avatar{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:linear-gradient(145deg,#86b7ff,#2878ee);color:#fff;font-size:26px;font-weight:800}.profile-summary b{display:block;font-size:18px}.profile-summary span{display:block;margin-top:5px;color:#526b95;font-size:13px}.profile-section{margin-top:14px;padding:4px 16px 16px;border:1px solid #e3eaf3;border-radius:18px;background:#fff;box-shadow:0 8px 18px rgba(45,76,119,.04)}.profile-section h2{margin:16px 0 4px;font-size:17px}.profile-hint{margin:0 0 7px;color:#7d8ca5;font-size:12px}.profile-field{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:8px;min-height:58px;border-bottom:1px solid #e8edf4;color:#1b3461;font-size:14px;font-weight:600}.profile-field:last-child{border-bottom:0}.profile-field input,.profile-field select{width:100%;height:40px;padding:0 10px;border:1px solid #dce5ef;border-radius:10px;background:#fbfdff;color:#1c3562;font:inherit;outline:0}.profile-readonly{color:#6b7b95;font-size:13px;font-weight:400;text-align:right}.profile-save-bar{position:fixed;z-index:8;bottom:0;left:50%;width:min(480px,100%);padding:12px 16px 16px;background:rgba(255,255,255,.95);box-shadow:0 -8px 24px rgba(38,68,115,.08);transform:translateX(-50%)}.profile-save-bar button{width:100%;height:54px;border:0;border-radius:13px;background:linear-gradient(100deg,#0863ec,#2b7bff);box-shadow:0 10px 18px rgba(18,103,238,.23);color:#fff;font-size:16px;font-weight:700}
  @media(max-width:350px){.profile-page{padding-left:12px;padding-right:12px}.profile-head{margin-left:-12px;margin-right:-12px}.profile-field{grid-template-columns:98px minmax(0,1fr);font-size:13px}}
`
function ensureProfileTheme() {
  const style = document.querySelector('#profile-theme') || document.createElement('style')
  style.id = 'profile-theme'
  style.textContent = profileTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const nodeActionTheme = `
  .node-action-page{min-height:100vh;padding:0 16px 118px;background:radial-gradient(circle at 100% 7%,rgba(205,226,255,.86),transparent 27%),linear-gradient(145deg,#fbfdff,#f2f7fe);color:#102a5b}
  .node-action-head{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;height:76px;margin:0 -16px 16px;padding:0 16px;border-bottom:1px solid #e2eaf5;background:rgba(255,255,255,.78)}.node-action-head h1{margin:0;color:#102a5b;text-align:center;font-size:24px;letter-spacing:1px}.node-action-head button{border:0;background:transparent;color:#102a5b;font-size:42px;font-weight:300;line-height:1}
  .node-customer-strip{display:flex;align-items:center;gap:11px;min-height:78px;margin:0 0 24px;padding:14px 16px;border:1px solid #d7e7fb;border-radius:17px;background:linear-gradient(100deg,#fff,#f2f8ff);box-shadow:0 8px 18px rgba(40,83,145,.05);color:#173365}.node-customer-avatar{display:grid;place-items:center;width:46px;height:46px;flex:0 0 46px;border-radius:50%;background:linear-gradient(145deg,#b7d7ff,#3b8af1);color:#fff;font-size:21px;font-weight:800}.node-customer-strip b{font-size:17px;white-space:nowrap}.node-customer-strip span{color:#415a86;font-size:14px;white-space:nowrap}.node-customer-strip .node-customer-meta{overflow:hidden;text-overflow:ellipsis}
  .node-action-card{overflow:hidden;padding:4px 16px 18px;border:1px solid #e5ebf3;border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 12px 26px rgba(45,76,120,.08)}.node-field{display:grid;grid-template-columns:132px minmax(0,1fr);align-items:center;gap:10px;min-height:68px;border-bottom:1px solid #e8edf4;color:#142e61;font-size:16px;font-weight:650}.node-field.is-textarea{display:block;padding:18px 0 16px}.node-field>span.required::before{content:"*";margin-right:5px;color:#f15b57}.node-field select,.node-field input{width:100%;height:46px;padding:0 13px;border:1px solid #dbe4ef;border-radius:12px;background:#fbfdff;color:#162f60;font:inherit;outline:0}.node-field select{appearance:auto}.node-field input:disabled{color:#66758f;background:#f4f7fb}.node-field textarea{width:100%;min-height:150px;margin-top:13px;padding:14px;border:1px solid #dbe4ef;border-radius:13px;background:#fbfdff;color:#162f60;font:14px/1.65 inherit;resize:vertical;outline:0}.node-field textarea::placeholder{color:#9ba9bc}.node-projects{margin:0;padding:18px 0 0;border:0}.node-projects legend{padding:0;color:#142e61;font-size:16px;font-weight:650}.node-projects .project-picker{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px;padding:11px;border:1px solid #dbe4ef;border-radius:13px;background:#fbfdff}.node-projects .check{display:inline-flex!important;grid-template-columns:none!important;align-items:center;margin:0!important;padding:7px 10px;border-radius:16px;background:#eaf3ff;color:#176df0;font-size:14px;font-weight:500!important}.node-projects .check input{width:auto!important;height:auto!important;margin:0 6px 0 0}.node-action-warning{display:flex;align-items:center;gap:10px;margin:22px 2px 0;padding:13px 15px;border-radius:13px;background:linear-gradient(100deg,#fff7e8,#fffaf3);color:#d48518;font-size:13px;line-height:1.5}.node-action-warning b{display:grid;place-items:center;width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:#f1aa38;color:#fff}.node-submit-bar{position:fixed;z-index:8;bottom:0;left:50%;width:min(480px,100%);padding:12px 16px 16px;background:rgba(255,255,255,.95);box-shadow:0 -8px 24px rgba(38,68,115,.08);transform:translateX(-50%)}.node-submit-bar button{width:100%;height:56px;border:0;border-radius:13px;background:linear-gradient(100deg,#0863ec,#2b7bff);box-shadow:0 10px 18px rgba(18,103,238,.23);color:#fff;font-size:17px;font-weight:700}
  @media(max-width:350px){.node-action-page{padding-left:12px;padding-right:12px}.node-action-head{margin-left:-12px;margin-right:-12px}.node-action-head h1{font-size:21px}.node-customer-strip{gap:8px;padding:12px}.node-customer-strip b{font-size:16px}.node-customer-strip span{font-size:12px}.node-field{grid-template-columns:110px minmax(0,1fr);font-size:14px}.node-projects legend{font-size:14px}}
`
function ensureNodeActionTheme() {
  const style = document.querySelector('#node-action-theme') || document.createElement('style')
  style.id = 'node-action-theme'
  style.textContent = nodeActionTheme
  if (!style.parentNode) document.head.appendChild(style)
}
const typographyTheme = `
  :root{--font-caption:12px;--font-label:12px;--font-body:14px;--font-card-title:17px;--font-section-title:20px;--font-page-title:24px;--font-number:24px}
  body{font-size:var(--font-body);line-height:1.5}
  .login h1{font-size:clamp(30px,9.2vw,40px)}.login-hero p{font-size:16px}.login-sheet h2{font-size:18px}.login-sheet>p,.login-form label,.privacy{font-size:var(--font-caption)}.login-form button{font-size:15px}
  .wb-notice,.wb-notice b{font-size:var(--font-caption)}.wb-greeting h1{font-size:28px}.wb-greeting p{font-size:var(--font-body)}.wb-pending b{font-size:22px}.wb-pending span{font-size:var(--font-caption)}.wb-search input{font-size:var(--font-body)}.wb-filters button{font-size:13px}.wb-avatar{font-size:22px}.wb-person b{font-size:var(--font-card-title)}.wb-person span,.wb-stage{font-size:var(--font-caption)}.wb-time{font-size:var(--font-number)}.wb-project{font-size:15px}.wb-project i{font-size:14px}.wb-progress-head{font-size:13px}.wb-progress-head b{font-size:18px}.tabbar button{font-size:var(--font-caption)}
  .task-detail-head h1,.archive-detail-head h1,.followup-form-head h1{font-size:22px}.task-detail-head .detail-stage{font-size:15px}.detail-order-card p{font-size:14px}.detail-order-card h2{font-size:22px}.detail-panel h2,.archive-detail-section h2{font-size:var(--font-section-title)}.detail-panel h2::before,.archive-detail-section h2::before{font-size:16px}.vip-tags span{font-size:var(--font-caption)}.vip-card b{font-size:20px}.vip-card small{font-size:14px}.detail-business-grid small,.detail-timeline time,.detail-timeline span,.staff-card small,.staff-card b{font-size:var(--font-caption)}.detail-business-grid b,.detail-timeline b{font-size:14px}.detail-action-bar button,.archive-followup-action button{font-size:16px}
  .task-filter-head h1{font-size:var(--font-section-title)}.filter-section h2{font-size:16px}.filter-options button,.filter-date-input{font-size:var(--font-body)}.filter-tip{font-size:var(--font-caption)}.filter-action-bar button{font-size:15px}
  .customer-page-head h1,.mine-head h1{font-size:28px}.customer-page-head p{font-size:var(--font-body)}.customer-search-box input{font-size:var(--font-body)}.archive-person b{font-size:var(--font-card-title)}.archive-person small,.archive-status,.archive-privacy{font-size:var(--font-caption)}.archive-status i{font-size:15px}
  .archive-readonly-top{font-size:var(--font-caption)}.archive-profile-card h2{font-size:22px}.archive-profile-card p{font-size:15px}.member-tag{font-size:13px}.archive-detail-section h2 small,.readonly-note,.asset-row small,.archive-stat small,.followup-record span,.followup-record small{font-size:var(--font-caption)}.archive-fields dt,.archive-fields dd{font-size:14px}.asset-row b,.archive-stat b{font-size:16px}.archive-followup-action button::before{font-size:21px}
  .followup-customer-strip b{font-size:var(--font-card-title)}.followup-customer-strip span{font-size:14px}.followup-lock{font-size:13px}.followup-card label{font-size:15px}.followup-card textarea{font-size:var(--font-body)}.followup-note-count,.followup-demo-warning{font-size:var(--font-caption)}.followup-save-bar button{font-size:16px}
  .mine-profile-top h2{font-size:22px}.mine-profile-top p{font-size:15px}.mine-stat b{font-size:32px}.mine-stat small{font-size:14px}.mine-settings-title{font-size:var(--font-section-title)}.mine-setting-row span{font-size:16px}.mine-safety{font-size:13px}
  @media(max-width:350px){body{font-size:13px}.login h1{font-size:29px}.wb-greeting h1,.customer-page-head h1,.mine-head h1{font-size:25px}.wb-person b,.archive-person b{font-size:16px}.wb-time{font-size:22px}.detail-order-card h2,.archive-profile-card h2,.mine-profile-top h2{font-size:20px}.detail-panel h2,.archive-detail-section h2,.mine-settings-title{font-size:18px}.followup-card label{grid-template-columns:112px minmax(0,1fr);font-size:14px}.mine-setting-row span{font-size:15px}}
`
function ensureTypographyTheme() {
  const style = document.querySelector('#mobile-typography-theme') || document.createElement('style')
  style.id = 'mobile-typography-theme'
  style.textContent = typographyTheme
  document.head.appendChild(style)
}
const stageMeta = {
  floorControl: ['场控排诊', 'orange'], arrivalConfirmation: ['确认到店', 'blue'], doctorDiagnosis: ['医生排诊', 'blue'], service: ['服务执行', 'purple'], followup: ['顾客回访', 'green'], completed: ['服务完成', 'gray'], cancelled: ['已取消', 'red']
}
const nextStage = { floorControl: 'arrivalConfirmation', arrivalConfirmation: 'doctorDiagnosis', doctorDiagnosis: 'service', service: 'followup', followup: 'completed' }
const ownerKey = { floorControl: 'floorControl', arrivalConfirmation: 'floorControl', doctorDiagnosis: 'doctor', service: 'aftersales', followup: 'aftersales' }
const projects = ['光子嫩肤', '面部抗衰', '轮廓提升', '补水保湿', '术后护理']
const seed = [
  record('B20260728001', '林女士', '13800138001', '赵女士', '13900139001', '09:00', '新诊', '光子嫩肤', 'floorControl', '今日到店，请提前完成排诊'),
  record('B20260728002', '周女士', '13800138002', '', '', '13:30', '复诊', '面部抗衰', 'doctorDiagnosis', '顾客已到店，等待医生排诊'),
  record('B20260726003', '孙女士', '13800138003', '', '', '15:00', '新诊', '轮廓提升', 'followup', '回访已到期，请优先跟进', '2026-07-26'),
  record('B20260725004', '林女士', '13800138001', '', '', '11:00', '复诊', '补水保湿', 'cancelled', '顾客临时有事，预约已取消', '2026-07-25'),
  record('B20260727005', '吴女士', '13800138005', '', '', '11:30', '复诊', '术后护理', 'arrivalConfirmation', '本周首日测试任务，待确认顾客到店', '2026-07-27')
]
function record(id, name, phone, companion, companionPhone, time, type, project, status, notice, businessDate = DEMO_DATE) {
  return { id, name, phone, companion, companionPhone, time, type, project, estimatedProject: project, projects: [project], businessDate, status, notice, store: '科臻澳总店', department: '皮肤管理科', assignments: { floorControl: '娜娜', doctor: '小医', service: '舒婷', aftercare: '舒婷', butler: '林悦', consultant: '小咨', director: '陈楠', manager: '赵阳', nurse: '张璐', storeManager: '王晓歌' }, floorControl: {}, arrivalConfirmation: {}, doctorDiagnosis: {}, serviceExecution: {}, followups: [], logs: [{ time: `${businessDate} 08:10`, action: '创建业务单', operator: '系统', detail: '由预约记录生成当天业务任务' }] }
}
const savedUser = JSON.parse(localStorage.getItem('h5-user') || 'null')
let user = savedUser?.name ? profileFor(employees.find(item => item.id === savedUser.id || item.name === savedUser.name) || savedUser) : null
function readSharedRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(ADMIN_WORKBENCH_KEY) || 'null')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}
const sharedRecords = readSharedRecords()
let records = normalize(sharedRecords.length ? sharedRecords : JSON.parse(localStorage.getItem('h5-data') || 'null') || structuredClone(seed))
if (!sharedRecords.length) seed.forEach(item => { if (!records.some(record => record.id === item.id)) records.push(structuredClone(item)) })
let view = 'home', selectedId = null, actionMode = '', customerKeyword = '', homeKeyword = '', homeFilter = 'all', filters = { date: '', type: '', keyword: '' }
const emptyTaskFilters = () => ({ scope: 'mine', stage: '', taskStatus: '', timeField: '', serviceDate: '', departments: [], staff: [], type: '', keyword: '' })
let taskFilterState = emptyTaskFilters()
let filterDrawerOpen = false
let filterDraft = null
let filterDrawerMode = 'more'
const rememberedLoginId = localStorage.getItem('h5-login-choice')
let loginChoice = Math.max(0, employees.findIndex(item => item.id === rememberedLoginId)), loginError = '', accountPickerOpen = false
const app = document.querySelector('#app')
const save = () => {
  const serialized = JSON.stringify(records)
  localStorage.setItem('h5-data', serialized)
  localStorage.setItem(ADMIN_WORKBENCH_KEY, serialized)
  void pushSharedWorkbench(records)
}
function normalize(items) {
  const legacy = { floor: 'floorControl', doctor: 'doctorDiagnosis', invited: 'floorControl', reception: 'arrivalConfirmation', triage: 'doctorDiagnosis', scheduling: 'doctorDiagnosis' }
  return items.map((item, index) => {
    const fallback = seed[index % seed.length]
    const name = item.name || item.vip1?.name || fallback.name
    const phone = item.phone || item.vip1?.phone || fallback.phone
    const companion = item.companion || item.vip2?.name || '—'
    const companionPhone = item.companionPhone || item.vip2?.phone || ''
    const project = item.project || item.estimatedProject || item.projects?.[0] || fallback.project
    return {
      ...fallback, ...item, name, phone, companion, companionPhone, project,
      time: item.time || item.appointmentTime || fallback.time,
      type: item.type || item.diagnosisType || fallback.type,
      status: legacy[item.status] || item.status || 'floorControl',
      businessDate: item.businessDate || DEMO_DATE,
      estimatedProject: item.estimatedProject || project,
      projects: item.projects?.length ? item.projects : [project],
      assignments: { ...fallback.assignments, ...(item.assignments || {}) },
      floorControl: item.floorControl || {},
      arrivalConfirmation: item.arrivalConfirmation || {},
      doctorDiagnosis: item.doctorDiagnosis || {},
      serviceExecution: item.serviceExecution || {},
      nodeTimes: { ...(fallback.nodeTimes || {}), ...(item.nodeTimes || {}) },
      cancelledAt: item.cancelledAt || item.cancelTime || '',
      serviceEndedAt: item.serviceEndedAt || item.serviceEndTime || '',
      followupAt: item.followupAt || item.followupDateTime || '',
      followups: item.followups || item.followupRecords || [],
      logs: item.logs || []
    }
  })
}
if (!sharedRecords.length) save()
const taskSignature = rows => JSON.stringify(rows.map(item => ({ id: item.id, status: item.status, logs: item.logs?.length, followups: item.followups?.length, updated: item.floorControl?.completedAt || item.arrivalConfirmation?.confirmedAt || '' })))
let lastSharedTaskSignature = taskSignature(records)
async function pushSharedWorkbench(rows) {
  try {
    await fetch(SHARED_WORKBENCH_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: rows }) })
    lastSharedTaskSignature = taskSignature(rows)
  } catch {
    // Static deployment and offline preview continue to use browser-local demo data.
  }
}
async function pullSharedWorkbench() {
  try {
    const response = await fetch(SHARED_WORKBENCH_API, { cache: 'no-store' })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return
    const payload = await response.json()
    if (!Array.isArray(payload.data) || !payload.data.length) return
    const incoming = normalize(payload.data)
    const signature = taskSignature(incoming)
    if (signature === lastSharedTaskSignature) return
    lastSharedTaskSignature = signature
    records = incoming
    localStorage.setItem('h5-data', JSON.stringify(records))
    localStorage.setItem(ADMIN_WORKBENCH_KEY, JSON.stringify(records))
    if (selectedId && !records.some(item => item.id === selectedId)) selectedId = null
    render()
  } catch {
    // The shared local service is optional outside the development preview.
  }
}
window.addEventListener('storage', event => {
  if (event.key !== ADMIN_WORKBENCH_KEY || !event.newValue) return
  try {
    const incoming = JSON.parse(event.newValue)
    if (!Array.isArray(incoming)) return
    records = normalize(incoming)
    if (selectedId && !records.some(item => item.id === selectedId)) selectedId = null
    render()
  } catch {
    // Ignore malformed external demo data and retain the last valid task set.
  }
})
const mask = value => value ? `${value.slice(0, 3)}****${value.slice(-4)}` : '—'
const current = () => records.find(item => item.id === selectedId)
const meta = status => stageMeta[status] || ['待处理', 'gray']
const owner = item => item.assignments[ownerKey[item.status]] || '—'
const isCurrentTask = item => ownerKey[item.status] === user?.roleKey && owner(item) === user?.name
const belongsToUser = item => Object.values(item.assignments || {}).includes(user?.name) || isCurrentTask(item)
const visibleRecords = () => records.filter(belongsToUser)
const createdAt = item => item.logs?.find(log => String(log.action || '').includes('创建'))?.time || item.logs?.[0]?.time || `${item.businessDate || ''} ${item.time || ''}`
const newestFirst = (a, b) => String(createdAt(b)).localeCompare(String(createdAt(a)))
const taskStageOptions = [['floorControl', '场控排诊'], ['arrivalConfirmation', '确认到店'], ['doctorDiagnosis', '医生排诊'], ['service', '服务执行'], ['followup', '顾客回访']]
const taskStatusOptions = [['notStarted', '未开始'], ['inProgress', '进行中'], ['completed', '已结束'], ['cancelled', '已取消']]
const taskTimeOptions = [['created', '创建时间'], ['appointment', '预约时间'], ['floorControl', '场控排诊时间'], ['arrivalConfirmation', '确认到店时间'], ['doctorDiagnosis', '医生排诊时间'], ['serviceEnded', '服务结束时间'], ['followup', '服务回访时间'], ['cancelled', '服务取消时间']]
const taskStatus = item => item.status === 'floorControl' ? 'notStarted' : item.status === 'completed' ? 'completed' : item.status === 'cancelled' ? 'cancelled' : 'inProgress'
const dateOnly = value => String(value || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || ''
const logTime = (item, words) => item.logs?.find(log => words.some(word => String(log.action || '').includes(word)))?.time || ''
const serviceTimeValue = (item, field) => {
  if (field === 'created') return createdAt(item)
  if (field === 'appointment') return item.appointmentAt || item.appointmentTime ? `${item.businessDate} ${item.appointmentAt || item.appointmentTime || item.time}` : `${item.businessDate} ${item.time}`
  const nodeKeys = { floorControl: ['floorControl', 'invited'], arrivalConfirmation: ['arrivalConfirmation', 'reception'], doctorDiagnosis: ['doctorDiagnosis', 'triage', 'scheduling'], serviceEnded: ['serviceEnded', 'service'], followup: ['followup'], cancelled: ['cancelled'] }
  const direct = field === 'floorControl' ? item.floorControl?.completedAt : field === 'arrivalConfirmation' ? item.arrivalConfirmation?.confirmedAt : field === 'doctorDiagnosis' ? item.doctorDiagnosis?.completedAt : field === 'serviceEnded' ? item.serviceExecution?.completedAt || item.serviceExecution?.endedAt || item.serviceEndedAt : field === 'followup' ? item.followups?.[0]?.time || item.followupAt : item.cancelledAt
  if (direct) return direct
  const nodeValue = (nodeKeys[field] || []).map(key => item.nodeTimes?.[key]).find(Boolean)
  if (nodeValue) return nodeValue
  const logWords = { floorControl: ['完成场控排诊'], arrivalConfirmation: ['到店确认'], doctorDiagnosis: ['完成医生排诊'], serviceEnded: ['完成服务', '服务完成'], followup: ['新增回访记录', '完成顾客回访'], cancelled: ['取消业务', '任务取消'] }
  return logTime(item, logWords[field] || [])
}
const taskDepartments = () => [...new Set(records.map(item => item.department).filter(Boolean).concat(employees.map(item => item.department).filter(Boolean), ['未分组']))].sort()
const assignmentEntries = item => Object.values(item.assignments || {}).filter(Boolean)
const taskStaff = () => {
  const fromEmployees = employees.map(employee => ({ name: employee.name, department: employee.department || '未分组' }))
  const fromTasks = records.flatMap(item => assignmentEntries(item).map(name => ({ name, department: item.department || '未分组' })))
  return [...new Map([...fromEmployees, ...fromTasks].map(item => [item.name, item])).values()].sort((a, b) => a.name.localeCompare(b.name))
}
const taskFilterMatches = item => {
  const filter = taskFilterState
  const scopeMatch = filter.scope === 'all' || belongsToUser(item)
  const stageMatch = !filter.stage || item.status === filter.stage
  const statusMatch = !filter.taskStatus || taskStatus(item) === filter.taskStatus
  const serviceDateMatch = !filter.timeField || !filter.serviceDate || dateOnly(serviceTimeValue(item, filter.timeField)) === filter.serviceDate
  const departmentMatch = !filter.departments.length || filter.departments.includes(item.department || '未分组')
  const staffMatch = !filter.staff.length || filter.staff.some(name => assignmentEntries(item).includes(name))
  const typeMatch = !filter.type || item.type === filter.type
  const keyword = filter.keyword.trim().toLowerCase()
  const text = `${item.name || ''}${item.phone || ''}${item.project || ''}${item.estimatedProject || ''}${item.notice || ''}${item.note || ''}${item.id || ''}`.toLowerCase()
  return scopeMatch && stageMatch && statusMatch && serviceDateMatch && departmentMatch && staffMatch && typeMatch && (!keyword || text.includes(keyword))
}
const taskFilteredRecords = () => records.filter(taskFilterMatches)
const taskFilterSummary = () => {
  const f = taskFilterState
  const labels = []
  labels.push(f.scope === 'all' ? '全部任务' : '本人任务')
  if (f.stage) labels.push(taskStageOptions.find(([key]) => key === f.stage)?.[1])
  if (f.taskStatus) labels.push(taskStatusOptions.find(([key]) => key === f.taskStatus)?.[1])
  if (f.timeField && f.serviceDate) labels.push(`${taskTimeOptions.find(([key]) => key === f.timeField)?.[1]} ${f.serviceDate}`)
  if (f.departments.length) labels.push(`部门 ${f.departments.join('、')}`)
  if (f.staff.length) labels.push(`人员 ${f.staff.join('、')}`)
  if (f.type) labels.push(f.type)
  if (f.keyword) labels.push(`关键词 ${f.keyword}`)
  return labels.join(' · ')
}
const dateLabel = date => date === DEMO_DATE ? '今天' : date.slice(5).replace('-', '/')
function go(next, id = selectedId) { view = next; selectedId = id; render() }

function render() {
  if (!user) return login()
  const pages = { home, taskList, taskFilters, taskDetail, nodeAction, customers, customerDetail, mine, profile: personalProfile }
  const page = pages[view]()
  ensureTypographyTheme()
  app.innerHTML = page
  bind()
}
function login() {
  ensureLoginTheme()
  ensureTypographyTheme()
  const selected = employees[loginChoice]
  app.innerHTML = `<main class="login"><div class="login-hero"><div class="brand">美</div><h1>医美服务助手</h1><p>个人待办演示版</p></div><section class="login-sheet"><h2>请选择账号登录</h2><p>选择演示账号后，密码将自动填入</p><form id="login-form" class="login-form"><label>账号<div class="account-picker-wrap"><input name="account" type="hidden" value="${selected.account}"><button id="account-picker" class="account-picker" type="button"><span>${selected.name}</span><i>›</i></button>${accountPickerOpen ? `<div class="account-options">${employees.map((item, index) => `<button class="account-option ${index === loginChoice ? 'selected' : ''}" type="button" data-account-choice="${index}"><b>${item.name}</b><small>${item.role} · ${item.store}</small></button>`).join('')}</div>` : ''}</div></label><label>密码<input name="password" type="password" value="${selected.password}" autocomplete="current-password"></label>${loginError ? `<p class="login-error">${loginError}</p>` : ''}<button type="submit">登录</button></form><p class="demo-password">演示账号统一密码：123456</p></section><small class="privacy">演示数据，请勿录入真实顾客信息</small></main>`
  document.querySelector('#account-picker').onclick = () => { accountPickerOpen = !accountPickerOpen; login() }
  document.querySelectorAll('[data-account-choice]').forEach(button => { button.onclick = () => { loginChoice = Number(button.dataset.accountChoice); localStorage.setItem('h5-login-choice', employees[loginChoice].id); loginError = ''; accountPickerOpen = false; login() } })
  document.querySelector('#login-form').onsubmit = event => { event.preventDefault(); const form = Object.fromEntries(new FormData(event.target)); const matched = employees.find(item => item.account === form.account.trim() && item.password === form.password); if (!matched) { loginError = '账号或密码不正确，请重新选择演示账号。'; login(); return } loginChoice = employees.findIndex(item => item.id === matched.id); localStorage.setItem('h5-login-choice', matched.id); user = profileFor(matched); localStorage.setItem('h5-user', JSON.stringify(user)); render() }
}
const navIcons = {
  home: '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>',
  customers: '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2.2"></circle><path d="M5.8 16c.8-2.2 5.5-2.2 6.4 0M15 10h3M15 14h3M15 17h2"></path></svg>',
  mine: '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c.8-5.1 15.2-5.1 16 0"></path></svg>'
}
function shell(content, active = view, showNav = true) { return `<main class="screen">${content}</main>${showNav ? `<nav class="tabbar">${[['home','工作台'],['customers','顾客档案'],['mine','我的']].map(([key,label]) => `<button class="${active === key ? 'on' : ''}" data-tab="${key}">${navIcons[key]}<span>${label}</span></button>`).join('')}</nav>` : ''}` }
const filterSelectionCount = filter => [filter.scope !== 'mine', filter.taskStatus, filter.stage, filter.type, filter.timeField && filter.serviceDate, filter.departments.length, filter.staff.length, filter.keyword].filter(Boolean).length
function filterDrawer() {
  ensureFilterTheme()
  const f = filterDraft || taskFilterState
  if (filterDrawerMode !== 'more') {
    const picker = filterDrawerMode === 'scope'
      ? [['mine', '本人任务'], ['all', '全部任务']]
      : filterDrawerMode === 'status'
        ? [['', '全部状态'], ...taskStatusOptions]
        : filterDrawerMode === 'stage'
          ? [['', '全部阶段'], ...taskStageOptions]
          : [['', '全部类型'], ['新诊', '新诊'], ['复诊', '复诊']]
    const current = filterDrawerMode === 'scope' ? f.scope : filterDrawerMode === 'status' ? f.taskStatus : filterDrawerMode === 'stage' ? f.stage : f.type
    const title = filterDrawerMode === 'scope' ? '任务范围' : filterDrawerMode === 'status' ? '任务状态' : filterDrawerMode === 'stage' ? '任务阶段' : '任务类型'
    return `<div class="filter-drawer-backdrop" data-filter-close><section class="filter-drawer filter-picker-drawer" role="dialog" aria-modal="true" aria-label="${title}" data-filter-panel><div class="filter-drawer-grabber"></div><header class="filter-drawer-head"><h2>${title}</h2><button class="filter-drawer-close" data-filter-close type="button">×</button></header><div class="filter-picker-list">${picker.map(([key, label]) => `<button class="${current === key ? 'selected' : ''}" data-picker-option="${key}">${label}</button>`).join('')}</div></section></div>`
  }
  const staff = taskStaff().filter(item => !f.departments.length || f.departments.includes(item.department))
  const optionButtons = (options, attr, selected) => options.map(([key, label]) => `<button class="${selected === key ? 'selected' : ''}" data-${attr}="${key}">${label}</button>`).join('')
  const multiButtons = (options, attr, selected) => options.map(item => `<button class="${selected.includes(item) ? 'selected' : ''}" data-${attr}="${item}">${item}</button>`).join('')
  const count = filterSelectionCount(f)
  return `<div class="filter-drawer-backdrop" data-filter-close><section class="filter-drawer" role="dialog" aria-modal="true" aria-label="更多筛选" data-filter-panel><div class="filter-drawer-grabber"></div><header class="filter-drawer-head"><h2>更多筛选${count ? `<small>${count}项已选</small>` : ''}</h2><button class="filter-drawer-close" data-filter-close type="button">×</button></header><div class="filter-drawer-body"><section class="filter-section"><h2>任务范围</h2><div class="filter-options">${optionButtons([['mine','本人任务'],['all','全部任务']], 'draft-scope', f.scope)}</div></section><section class="filter-section"><h2>服务日期</h2><div class="filter-options">${optionButtons([['','不限时间'], ...taskTimeOptions], 'draft-time-field', f.timeField)}</div>${f.timeField ? `<input id="drawer-service-date" class="filter-date-input" type="date" value="${f.serviceDate}"><p class="filter-tip">请选择${taskTimeOptions.find(([key]) => key === f.timeField)?.[1]}对应日期</p>` : ''}</section><section class="filter-section"><h2>部门（可多选）</h2><div class="filter-options">${multiButtons(taskDepartments(), 'draft-department', f.departments)}</div></section><section class="filter-section"><h2>人员（可多选）</h2><div class="filter-options">${staff.length ? staff.map(item => `<button class="${f.staff.includes(item.name) ? 'selected' : ''}" data-draft-staff="${item.name}">${item.name}</button>`).join('') : '<span class="filter-empty">暂无匹配人员</span>'}</div></section></div><footer class="filter-drawer-actions"><button id="drawer-reset" type="button">重置</button><button id="drawer-apply" type="button">确认筛选</button></footer></section></div>`
}
function home() {
  ensureWorkbenchTheme()
  const tomorrow = new Date(`${DEMO_DATE}T00:00:00`); tomorrow.setDate(tomorrow.getDate() + 1); const tomorrowText = tomorrow.toISOString().slice(0, 10)
  const weekStart = new Date(`${DEMO_DATE}T00:00:00`); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); const weekStartText = weekStart.toISOString().slice(0, 10); const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); const weekEndText = weekEnd.toISOString().slice(0, 10)
  const dateMatch = item => homeFilter === 'all' || (homeFilter === 'today' && item.businessDate === DEMO_DATE) || (homeFilter === 'tomorrow' && item.businessDate === tomorrowText) || (homeFilter === 'week' && item.businessDate >= weekStartText && item.businessDate <= weekEndText) || (homeFilter === 'consulting' && item.status === 'doctorDiagnosis')
  const list = taskFilteredRecords().filter(dateMatch).sort(newestFirst)
  const pending = taskFilteredRecords().filter(isCurrentTask).length
  const moreFilterActive = taskFilterState.scope !== 'mine' || Boolean(taskFilterState.timeField && taskFilterState.serviceDate) || taskFilterState.departments.length > 0 || taskFilterState.staff.length > 0
  const quickFilters = `<button class="wb-filter-box ${taskFilterState.scope === 'all' ? 'active' : ''}" data-filter-picker="scope"><strong>范围</strong><em></em></button><button class="wb-filter-box ${taskFilterState.taskStatus ? 'active' : ''}" data-filter-picker="status"><strong>状态</strong><em></em></button><button class="wb-filter-box ${taskFilterState.type ? 'active' : ''}" data-filter-picker="type"><strong>类型</strong><em></em></button><button class="wb-filter-box ${taskFilterState.stage ? 'active' : ''}" data-filter-picker="stage"><strong>阶段</strong><em></em></button><button class="wb-filter-box more ${moreFilterActive ? 'active' : ''}" data-open-filter><strong>更多</strong><em></em></button>`
  return shell(`<section class="workbench-page"><header class="wb-greeting"><h1>你好，${user.name}</h1><p>专注服务每一位顾客</p><div class="wb-pending"><b>${pending}</b><span>待办</span></div></header><form id="home-search" class="wb-search"><input value="${homeKeyword || taskFilterState.keyword}" placeholder="搜索顾客姓名、手机号、项目或备注"></form><div class="wb-filters">${quickFilters}</div>${list.length ? `<section class="wb-task-list">${list.map(workbenchCard).join('')}</section>` : `<div class="empty-state"><b>暂无符合条件的任务</b><p>${taskFilterSummary()}</p><button data-open-filter>调整筛选条件</button></div>`}<div class="wb-notice"><b>!</b><span>演示数据，请勿录入真实顾客信息</span></div>${filterDrawerOpen ? filterDrawer() : ''}</section>`, 'home') }
function workbenchMilestone(item) {
  const logs = item.logs || []
  const scheduled = item.floorControl?.completedAt || logs.find(log => String(log.action || '').includes('完成场控排诊'))?.time
  const arrived = item.arrivalConfirmation?.confirmedAt || (item.arrivalConfirmation?.result === '已到店' && (item.arrivalConfirmation.time || logs.find(log => String(log.action || '').includes('到店确认'))?.time))
  if (scheduled) return { label: '场控排诊时间', value: scheduled }
  if (arrived) return { label: '到店时间', value: arrived }
  return { label: '创建时间', value: logs[0]?.time || `${item.businessDate} 08:10` }
}
function workbenchCard(item) {
  const stageIndex = { floorControl: [1, 4], arrivalConfirmation: [1, 4], doctorDiagnosis: [2, 3], service: [2, 3], followup: [3, 4], completed: [4, 4], cancelled: [0, 4] }[item.status] || [1, 4]
  const percent = Math.round(stageIndex[0] / stageIndex[1] * 100)
  const [stage, tone] = meta(item.status)
  const milestone = workbenchMilestone(item)
  return `<article class="wb-card" data-task="${item.id}"><div class="wb-card-top"><div class="wb-avatar">${item.name.slice(0,1)}</div><div class="wb-person"><b>${item.name}</b><span class="${item.type === '复诊' ? 'revisit' : ''}">${item.type}</span></div><time class="wb-time">${item.time}</time><i class="wb-arrow">›</i></div><div class="wb-card-mid"><div class="wb-project"><i>◇</i><span>${item.estimatedProject || item.project}</span></div><span class="wb-stage ${tone}">${stage}</span></div><div class="wb-info-grid"><div><small>同行顾客</small><span>${item.companion || '无同行顾客'}</span></div><div><small>预约项目</small><span>${item.estimatedProject || item.project}</span></div><div><small>${milestone.label}</small><span>${milestone.value}</span></div><div><small>场控负责人</small><span>${item.assignments?.floorControl || '待分配'}</span></div></div><div class="wb-progress-head"><span>${stageIndex[0] ? '接诊流程进度' : '任务已取消'}</span><b>${stageIndex[0]}/${stageIndex[1]}</b></div><div class="wb-progress"><i style="width:${percent}%"></i></div></article>`
}
function taskRow(item) { return `<button class="task-row" data-task="${item.id}"><time>${item.time}<small>${meta(item.status)[0]}</small></time><span><b>${item.name}</b><small>${item.project} · ${item.type}</small></span><i>›</i></button>` }
function taskList() {
  const list = taskFilteredRecords().filter(item => (!filters.date || dateOnly(serviceTimeValue(item, 'appointment')) === filters.date) && (!filters.type || item.type === filters.type) && (!filters.keyword || `${item.name}${item.phone}${item.project}${item.notice}${item.note}${item.id}`.includes(filters.keyword))).sort(newestFirst)
  return shell(`<header class="sub-head"><button data-back>‹</button><h1>我的任务</h1><span>${list.length} 项</span></header><section class="content list-content"><form id="search-form" class="search"><input value="${filters.keyword || taskFilterState.keyword}" placeholder="搜索顾客、项目、手机号或备注"><button>搜索</button></form><div class="chips"><button class="${!filters.date?'selected':''}" data-date="">全部日期</button><button class="${filters.date===DEMO_DATE?'selected':''}" data-date="${DEMO_DATE}">今天</button><button id="choose-date" class="${filters.date && filters.date!==DEMO_DATE?'selected':''}">${filters.date && filters.date!==DEMO_DATE ? filters.date.slice(5) : '选择日期'}</button><i></i><button class="${!filters.type?'selected':''}" data-type="">全部</button><button class="${filters.type==='新诊'?'selected':''}" data-type="新诊">新诊</button><button class="${filters.type==='复诊'?'selected':''}" data-type="复诊">复诊</button><button data-open-filter>更多筛选${filterSelectionCount(taskFilterState) ? `（${filterSelectionCount(taskFilterState)}）` : ''}</button></div><input id="date-input" type="date" value="${filters.date}">${list.length ? `<section class="task-list">${list.map(item => `<article class="list-card" data-task="${item.id}"><div><b>${item.name}</b><small>${item.type} · ${item.businessDate} ${item.time}</small></div><span class="status ${meta(item.status)[1]}">${meta(item.status)[0]} · ${taskStatus(item) === 'notStarted' ? '未开始' : taskStatus(item) === 'inProgress' ? '进行中' : taskStatus(item) === 'completed' ? '已结束' : '已取消'}</span><p>${item.project} · 当前负责人：${owner(item)}</p><small>${item.notice}</small></article>`).join('')}</section>` : `<div class="empty-state"><b>没有符合条件的任务</b><p>${taskFilterSummary()}</p><button data-open-filter>调整筛选条件</button></div>`}</section>${filterDrawerOpen ? filterDrawer() : ''}`, 'home') }
function taskFilters() {
  ensureFilterTheme()
  const f = taskFilterState
  const count = [f.scope !== 'mine', f.stage, f.taskStatus, f.timeField && f.serviceDate, f.departments.length, f.staff.length, f.type, f.keyword].filter(Boolean).length
  const staff = taskStaff().filter(item => !f.departments.length || f.departments.includes(item.department))
  const optionButtons = (options, attr, selected) => options.map(([key, label]) => `<button class="${selected === key ? 'selected' : ''}" data-${attr}="${key}">${label}</button>`).join('')
  const multiButtons = (options, attr, selected) => options.map(item => `<button class="${selected.includes(item) ? 'selected' : ''}" data-${attr}="${item}">${item}</button>`).join('')
  return shell(`<section class="task-filter-page"><header class="task-filter-head"><button data-back>‹</button><h1>筛选任务${count ? `<small>${count}项已选</small>` : ''}</h1><span></span></header><section class="filter-section"><h2>任务范围</h2><div class="filter-options">${optionButtons([['mine','本人任务'],['all','全部任务']], 'filter-scope', f.scope)}</div><p class="filter-tip">本人任务按所有人员归属字段匹配当前账号。</p></section><section class="filter-section"><h2>任务阶段</h2><div class="filter-options">${optionButtons([['','全部阶段'], ...taskStageOptions], 'filter-stage', f.stage)}</div></section><section class="filter-section"><h2>任务状态</h2><div class="filter-options">${optionButtons([['','全部状态'], ...taskStatusOptions], 'filter-status', f.taskStatus)}</div></section><section class="filter-section"><h2>服务时间</h2><div class="filter-options">${optionButtons([['','不限时间'], ...taskTimeOptions], 'filter-time-field', f.timeField)}</div>${f.timeField ? `<input id="service-date-input" class="filter-date-input" type="date" value="${f.serviceDate}"><p class="filter-tip">请选择${taskTimeOptions.find(([key]) => key === f.timeField)?.[1] || '服务时间'}对应日期。</p>` : ''}</section><section class="filter-section"><h2>门店 / 人员</h2><h3>部门（可多选）</h3><div class="filter-options">${multiButtons(taskDepartments(), 'filter-department', f.departments)}</div><h3>人员（可多选）</h3><div class="filter-options">${staff.length ? staff.map(item => `<button class="${f.staff.includes(item.name) ? 'selected' : ''}" data-filter-staff="${item.name}">${item.name}</button>`).join('') : '<span class="filter-empty">暂无匹配人员</span>'}</div></section><section class="filter-section"><h2>任务类型</h2><div class="filter-options">${optionButtons([['','全部类型'],['新诊','新诊'],['复诊','复诊']], 'filter-type', f.type)}</div></section><section class="filter-section"><h2>内容搜索</h2><input id="filter-keyword" class="filter-keyword" value="${f.keyword}" placeholder="顾客姓名、手机号、项目名称、备注信息"><p class="filter-tip">支持与其他筛选条件组合查询。</p></section><footer class="filter-action-bar"><button id="reset-task-filter">重置</button><button id="apply-task-filter">确认筛选</button></footer></section>`, 'home', false)
}
function taskDetail() {
  const item = current(); if (!item) return home(); const canHandle = isCurrentTask(item)
  ensureTaskDetailTheme()
  const [stage, tone] = meta(item.status)
  const stageIndex = { floorControl: 0, arrivalConfirmation: 0, doctorDiagnosis: 2, service: 3, followup: 4, completed: 4, cancelled: -1 }[item.status] ?? 0
  const flow = [['到店接待', '顾客到店后，确认预约信息，安排接待'], ['咨询沟通', '了解顾客需求，确认方案及注意事项'], ['医生面诊', '医生面诊评估，确定治疗方案'], ['项目治疗', '进行项目治疗与服务执行'], ['术后护理与交付', '术后护理指导，回访安排']]
  const timeAt = offset => { const [hour, minute] = item.time.split(':').map(Number); const total = hour * 60 + minute + offset; return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }
  const times = [timeAt(0), `${timeAt(0)}–${timeAt(15)}`, `${timeAt(15)}–${timeAt(30)}`, `${timeAt(30)}–${timeAt(60)}`, `${timeAt(60)}后`]
  const business = [['◷','预约时间',`${item.businessDate} ${item.time}`], ['◇','诊疗类型',item.type], ['▦','到店门店',item.store], ['✚','项目/服务',item.project]]
  const staff = [['场控', item.assignments.floorControl], ['管家', item.assignments.butler], ['总监', item.assignments.director], ['经理', item.assignments.manager], ['医生', item.assignments.doctor]]
  return shell(`<section class="task-detail-page"><header class="task-detail-head"><button data-back>‹</button><h1>任务详情</h1><span class="detail-stage ${tone}">${stage}</span></header><section class="detail-order-card"><p>业务单 <b>${item.id}</b></p><h2>${item.name}的到店服务</h2></section><section class="detail-panel customer"><h2>顾客信息</h2><div class="vip-stack"><article class="vip-card"><div class="vip-tags"><span>VIP1</span><span>主顾客</span></div><b>${item.name}</b><small>${mask(item.phone)}</small><i class="vip-avatar">${item.name.slice(0,1)}</i></article><article class="vip-card"><div class="vip-tags"><span>VIP2</span><span>同行顾客</span></div><b>${item.companion || '—'}</b><small>${mask(item.companionPhone)}</small><i class="vip-avatar">${item.companion?.slice(0,1) || '—'}</i></article></div></section><section class="detail-panel business"><h2>业务信息</h2><div class="detail-business-grid">${business.map(([icon,label,value]) => `<div><i class="detail-icon">${icon}</i><span><small>${label}</small><b>${value}</b></span></div>`).join('')}</div></section><section class="detail-panel flow"><h2>服务流程</h2><ol class="detail-timeline">${flow.map(([name, description], index) => `<li class="${index === stageIndex ? 'active' : ''}"><time>${times[index]}</time><div><b>${name}</b><span>${description}</span></div></li>`).join('')}</ol></section><section class="detail-panel staff"><h2>服务人员</h2><div class="staff-grid">${staff.map(([role, name]) => `<article class="staff-card ${name ? '' : 'empty'}"><small>${role}</small><i>${name ? name.slice(0,1) : '○'}</i><b>${name || '待分配'}</b></article>`).join('')}</div></section></section>${canHandle ? `<footer class="detail-action-bar"><button data-action>进行${stage}</button></footer>` : ''}`, 'home', false) }
function archiveFollowupForm(item) {
  ensureFollowupFormTheme()
  return shell(`<section class="followup-form-page"><header class="followup-form-head"><button data-back>‹</button><h1>新增回访记录</h1><span></span></header><section class="followup-customer-strip"><b class="followup-customer-avatar">${item.name.slice(0,1)}</b><b>${item.name}</b><span>·　${mask(item.phone)}</span><span>·　${item.project}</span></section><p class="followup-lock"><b>♙</b>基础资料与资产不可编辑</p><form id="node-form" class="followup-card"><label><span>回访方式</span><select name="method"><option>电话</option><option>微信</option><option>短信</option></select></label><label><span>回访结果</span><select name="result"><option>已回访</option><option>待继续跟进</option><option>未接通</option></select></label><label><span>满意度</span><select name="satisfaction"><option>满意</option><option>一般</option><option>需改善</option></select></label><label><span>下次回访日期</span><input name="nextDate" type="date" value="2026-08-04" required></label><label><span>回访备注</span><textarea id="followup-note" name="note" maxlength="500" required placeholder="请填写回访备注（治疗效果、客户反馈、护理建议、后续需求等）"></textarea><small id="followup-note-count" class="followup-note-count">0/500</small></label></form><aside class="followup-demo-warning"><b>✓</b><span>本系统为演示数据，涉及客户隐私信息仅供系统演示使用，严禁泄露或用于任何商业用途。</span></aside></section><footer class="followup-save-bar"><button form="node-form" type="submit">保存回访记录</button></footer>`, 'customers', false)
}
function nodeAction() {
  const item = current(); if (!item) return home(); if (actionMode === 'archiveFollowup') return archiveFollowupForm(item)
  ensureNodeActionTheme()
  const field = (label, control, required = false, textarea = false) => `<label class="node-field ${textarea ? 'is-textarea' : ''}"><span class="${required ? 'required' : ''}">${label}</span>${control}</label>`
  const textarea = (name, placeholder, required = true) => `<textarea name="${name}" maxlength="200" ${required ? 'required' : ''} placeholder="${placeholder}"></textarea>`
  const titles = { floorControl: '场控排诊', arrivalConfirmation: '确认到店', doctorDiagnosis: '医生排诊', service: '服务执行', followup: '顾客回访' }
  const submitLabels = { floorControl: '完成排诊，等待顾客到店', arrivalConfirmation: '确认到店并推进流程', doctorDiagnosis: '完成医生排诊', service: '确认服务结果', followup: '保存回访记录' }
  const title = titles[item.status] || `处理${meta(item.status)[0]}`; let fields = ''
  if (item.status === 'followup') fields = [
    field('回访方式', '<select name="method"><option>电话</option><option>微信</option><option>短信</option></select>', true),
    field('回访结果', '<select name="result"><option>已回访</option><option>待继续跟进</option><option>未接通</option></select>', true),
    field('满意度', '<select name="satisfaction"><option>满意</option><option>一般</option><option>需改善</option></select>', true),
    field('下次回访日期', '<input name="nextDate" type="date" required>', true),
    field('回访备注', textarea('note', '请填写治疗效果、客户反馈、护理建议或后续需求'), true, true)
  ].join('')
  else if (item.status === 'floorControl') fields = [
    field('管家', '<select name="butler"><option>林悦</option></select>'),
    field('咨询', '<select name="consultant"><option value="">待分配</option><option>吴咨询</option></select>'),
    field('总监', '<select name="director"><option>陈楠</option></select>'),
    field('经理', '<select name="manager" required><option>赵阳</option></select>', true),
    field('经理建议项目', `<input name="project" value="${item.project}" required>`, true),
    field('场控排诊备注', textarea('note', '请填写排诊说明与顾客注意事项'), true, true),
    `<fieldset class="node-projects"><legend>顾客涉及项目</legend><div class="project-picker">${projects.map(project => `<label class="check"><input type="checkbox" name="projects" value="${project}" ${item.projects.includes(project) ? 'checked' : ''}>${project}</label>`).join('')}</div></fieldset>`
  ].join('')
  else if (item.status === 'arrivalConfirmation') fields = [
    field('到店结果', '<select name="result"><option>已到店</option><option>未到店</option><option>申请改期</option></select>', true),
    field('实际到店时间', `<input name="time" type="time" value="${item.time}">`),
    field('到店确认备注', textarea('note', '请填写到店、未到店或改期原因', false), false, true)
  ].join('')
  else if (item.status === 'doctorDiagnosis') fields = [
    field('医生', `<input value="${user.name}" disabled>`),
    field('配台护理', '<select name="nurse"><option>张璐</option><option>洋洋</option></select>', true),
    field('项目科室', `<input name="department" value="${item.department}">`),
    field('医生排诊备注', textarea('note', '请填写排诊安排与服务注意事项'), true, true)
  ].join('')
  else fields = [
    field('服务结果', '<select name="result"><option>服务已结束</option><option>需继续服务</option></select>', true),
    field('服务项目', `<input name="project" value="${item.project}">`, true),
    field('回访日期', '<input name="followupDate" type="date">'),
    field('服务小结', textarea('note', '请填写服务结果、顾客反馈与后续安排'), true, true)
  ].join('')
  return shell(`<section class="node-action-page"><header class="node-action-head"><button data-back>‹</button><h1>${title}</h1><span></span></header><section class="node-customer-strip"><b class="node-customer-avatar">${item.name.slice(0,1)}</b><b>${item.name}</b><span>${item.time}</span><span>${item.type}</span><span class="node-customer-meta">${item.project}</span></section><form id="node-form" class="node-action-card">${fields}</form><aside class="node-action-warning"><b>!</b><span>当前为演示数据，非真实顾客信息，请勿用于真实场景。</span></aside></section><footer class="node-submit-bar"><button form="node-form" type="submit">${submitLabels[item.status] || '确认并推进流程'}</button></footer>`, 'home', false) }
function customers() {
  ensureCustomerTheme()
  const recordsByRecent = visibleRecords().slice().sort((a, b) => `${b.businessDate}${b.time}`.localeCompare(`${a.businessDate}${a.time}`))
  const unique = new Map(); recordsByRecent.forEach(item => { if (!unique.has(item.phone)) unique.set(item.phone, item) })
  const list = [...unique.values()].filter(item => `${item.name}${item.phone}`.includes(customerKeyword))
  return shell(`<section class="customer-page"><header class="customer-page-head"><h1>顾客档案</h1><p>本人负责顾客的只读档案与回访记录</p></header><form id="customer-search" class="customer-search-box"><input value="${customerKeyword}" placeholder="搜索顾客姓名或手机号"></form>${list.length ? `<section class="archive-list">${list.map(item => `<button class="archive-item" data-customer="${item.id}"><b class="archive-avatar">${item.name.slice(0,1)}</b><span class="archive-person"><b>${item.name}</b><small>${mask(item.phone)} · ${item.store}</small></span><span class="archive-member">金卡会员</span><i class="archive-arrow">›</i></button>`).join('')}</section>` : '<div class="empty-state"><b>没有符合条件的顾客</b></div>'}<p class="archive-privacy"><b>⌾</b><span>隐私保护：顾客信息仅限授权人员查看，请勿泄露或用于其他用途。</span></p></section>`, 'customers')
}
function customerDetail() {
  const item = current(); if (!item) return customers()
  ensureCustomerDetailTheme()
  const related = records.filter(record => record.phone === item.phone).sort(newestFirst)
  const latest = related[0] || item
  const archive = latest.archive || latest.customerArchive || {}
  const memberLevel = archive.memberLevel || latest.memberLevel || '金卡会员'
  const basics = [['姓名', item.name], ['性别', archive.gender || '未填写'], ['生日', archive.birthday || '未填写'], ['手机号', mask(item.phone)], ['所属门店', latest.store], ['顾客来源', archive.source || '业务单同步']]
  const ownerLabels = [['场控','floorControl'],['管家','butler'],['咨询','consultant'],['总监','director'],['经理','manager'],['医生','doctor'],['护士','nurse'],['售后','aftersales']]
  const owners = ownerLabels.map(([label, key]) => `<div><small>${label}</small><b>${latest.assignments?.[key] || '未分配'}</b></div>`).join('')
  const noteFields = [['客户标签', (archive.tags || latest.tags || []).join('、') || '暂无记录'], ['特殊喜好', archive.preferences || latest.preferences || '暂无记录'], ['禁忌事项', archive.taboos || latest.taboos || '暂无记录'], ['铺垫内容', archive.preparation || latest.preparation || '暂无记录'], ['内部备注', archive.note || latest.note || '暂无记录']]
  const notes = noteFields.map(([label, value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('')
  const assetMap = new Map()
  related.forEach(record => (record.projects?.length ? record.projects : [record.estimatedProject || record.project]).filter(Boolean).forEach(project => assetMap.set(project, (assetMap.get(project) || 0) + 1)))
  const assets = [...assetMap].map(([project, count]) => `<div class="asset-row"><i class="asset-cover">◒</i><span><b>${project}</b><small>关联服务 ${count} 次 · 只读</small></span><i>›</i></div>`).join('') || `<div class="followup-empty"><div><i>▤</i><span>暂无项目资产</span></div></div>`
  const serviceRecords = related.slice(0, 8).map(record => `<div class="archive-service-row"><time>${record.businessDate}</time><span><b>${(record.projects || [record.estimatedProject || record.project]).filter(Boolean).join('、')}</b><small>${record.type || record.diagnosisType || '—'} · ${meta(record.status)[0]}</small></span></div>`).join('') || `<div class="followup-empty"><div><i>▤</i><span>暂无服务记录</span></div></div>`
  const allFollowups = related.flatMap(record => record.followups || record.followupRecords || []).sort((a,b) => String(b.date || b.time).localeCompare(String(a.date || a.time)))
  const followups = allFollowups.length ? allFollowups.map(f => `<article class="followup-record"><b>${f.result || '已回访'}</b><span>${f.date || f.time || '—'} · ${f.method || '电话'} · 满意度：${f.satisfaction || '—'}</span><small>${f.note || '未填写回访备注'}</small></article>`).join('') : `<div class="followup-empty"><div><i>▤</i><span>暂无回访记录</span></div></div>`
  const logs = related.flatMap(record => record.logs || []).sort((a,b) => String(b.time).localeCompare(String(a.time))).slice(0, 6).map(log => `<div><b>${log.action || '业务操作'}</b><small>${log.time || '—'} · ${log.operator || '系统'} · ${log.detail || '—'}</small></div>`).join('') || `<div class="followup-empty"><div><i>▤</i><span>暂无操作日志</span></div></div>`
  return shell(`<section class="archive-detail-page"><header class="archive-detail-head"><button data-back>‹</button><h1>顾客档案</h1><span></span></header><p class="archive-readonly-top">基础资料、资产、服务及影像均为只读内容</p><section class="archive-profile-card"><div class="archive-profile-avatar">${item.name.slice(0,1)}</div><div class="archive-profile-info"><h2>${item.name}</h2><p>${mask(item.phone)}　⌑</p><span class="member-tag">${memberLevel}</span></div></section><section class="archive-detail-section base"><h2>基础资料 <small>只读</small></h2><div class="archive-summary-grid">${basics.map(([label,value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('')}</div><p class="readonly-note">基础资料由管理后台维护，移动端仅可查看。</p></section><section class="archive-detail-section"><h2>人员归属 <small>只读</small></h2><div class="archive-owner-grid">${owners}</div></section><section class="archive-detail-section"><h2>服务偏好与备注 <small>只读</small></h2><div class="archive-note-list">${notes}</div></section><section class="archive-detail-section assets"><h2>项目资产 <small>只读</small></h2><div class="asset-stack">${assets}</div><p class="readonly-note">项目资产以后台档案与关联业务单为准，移动端不可编辑或核销。</p></section><section class="archive-detail-section service"><h2>服务与影像 <small>只读</small></h2><div class="archive-stat-grid"><div class="archive-stat"><i>▤</i><small>服务记录</small><b>${related.length} 次</b></div><div class="archive-stat"><i>▣</i><small>影像记录</small><b>${archive.imageCount || 0} 组</b></div><div class="archive-stat"><i>▶</i><small>回访记录</small><b>${allFollowups.length} 条</b></div></div><div class="archive-service-list">${serviceRecords}</div><p class="readonly-note">影像资料仅在后台留存与查看；移动端不提供上传或编辑操作。</p></section><section class="archive-detail-section followup"><h2>回访历史</h2><div class="archive-followups">${followups}</div></section><section class="archive-detail-section"><h2>操作日志 <small>只读</small></h2><div class="archive-log-list">${logs}</div></section></section><footer class="archive-followup-action"><button data-archive-followup>新增回访记录</button></footer>`, 'customers', false)
}
function personalProfile() {
  ensureProfileTheme()
  const value = key => String(user[key] || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const editable = (label, key, control) => `<label class="profile-field"><span>${label}</span>${control || `<input name="${key}" value="${value(key)}">`}</label>`
  const readonly = (label, content) => `<div class="profile-field"><span>${label}</span><span class="profile-readonly">${content || '—'}</span></div>`
  return shell(`<section class="profile-page"><header class="profile-head"><button data-back>‹</button><h1>个人信息管理</h1><span></span></header><section class="profile-summary"><b class="profile-summary-avatar">${user.name.slice(0,1)}</b><div><b>${user.name}</b><span>${user.role} · ${user.store}</span></div></section><form id="profile-form"><section class="profile-section"><h2>任职信息</h2><p class="profile-hint">以下组织与权限信息由管理后台维护</p>${readonly('工号', user.code)}${readonly('所属门店', user.store)}${readonly('主部门', user.department)}${readonly('角色', user.role)}${readonly('入职日期', user.hireDate)}${readonly('从业年限', `${user.yearsExperience || 0}年`)}</section><section class="profile-section"><h2>个人资料</h2>${editable('性别', 'gender', `<select name="gender"><option ${user.gender === '女' ? 'selected' : ''}>女</option><option ${user.gender === '男' ? 'selected' : ''}>男</option></select>`)}${editable('出生日期', 'birthday', `<input name="birthday" type="date" value="${value('birthday')}">`)}${editable('手机号', 'phone', `<input name="phone" type="tel" required value="${value('phone')}">`)}${editable('邮箱', 'email', `<input name="email" type="email" value="${value('email')}">`)}${editable('紧急联系人', 'emergencyContact')}${editable('紧急联系电话', 'emergencyPhone', `<input name="emergencyPhone" type="tel" value="${value('emergencyPhone')}">`)}${editable('现居地址', 'address')}</section><section class="profile-section"><h2>专业信息</h2>${editable('最高学历', 'education', `<select name="education">${['高中/中专','大专','本科','硕士及以上'].map(item => `<option ${user.education === item ? 'selected' : ''}>${item}</option>`).join('')}</select>`)}${editable('专业/擅长', 'specialty')}${editable('职业证书', 'certificates')}</section></form></section><footer class="profile-save-bar"><button form="profile-form" type="submit">保存个人信息</button></footer>`, 'mine', false)
}
function mine() {
  ensureMineTheme()
  const pending = visibleRecords().filter(isCurrentTask).length
  const related = visibleRecords().length
  return shell(`<section class="mine-page"><header class="mine-head"><h1>我的</h1><i>♧</i></header><section class="mine-profile-card"><div class="mine-profile-top"><b class="mine-avatar">${user.name.slice(0,1)}</b><div><h2>${user.name}</h2><p>${user.role} · ${user.store || '科臻澳总店'}</p></div></div><div class="mine-stats"><div class="mine-stat"><div><b>${pending}</b><small>当前待办</small></div><i>▤</i></div><div class="mine-stat"><div><b>${related}</b><small>关联任务</small></div><i>▣</i></div></div></section><h2 class="mine-settings-title">设置</h2><section class="mine-setting-card"><button class="mine-setting-row" type="button" data-profile><i class="mine-setting-icon">♙</i><span>个人信息管理</span><em>›</em></button><button class="mine-setting-row" type="button"><i class="mine-setting-icon">♙</i><span>演示数据仅保存在当前浏览器</span><em>›</em></button><button id="reset" class="mine-setting-row" type="button"><i class="mine-setting-icon">⟳</i><span>重置演示数据</span><em>›</em></button><button id="logout" class="mine-setting-row logout" type="button"><i class="mine-setting-icon">⇥</i><span>退出当前账号</span><em>›</em></button></section><aside class="mine-safety"><b>✓</b><span>为保障您的演示数据安全，演示数据仅保存在当前浏览器，清除浏览器数据或更换设备将无法恢复。</span></aside></section>`, 'mine')
}
function bind() {
  document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => go(button.dataset.tab))
  document.querySelectorAll('[data-profile]').forEach(button => button.onclick = () => go('profile'))
  document.querySelectorAll('[data-task]').forEach(button => button.onclick = () => go('taskDetail', button.dataset.task))
  document.querySelectorAll('[data-customer]').forEach(button => button.onclick = () => go('customerDetail', button.dataset.customer))
  document.querySelectorAll('[data-back]').forEach(button => button.onclick = () => go(view === 'customerDetail' ? 'customers' : view === 'profile' ? 'mine' : view === 'nodeAction' ? (actionMode === 'archiveFollowup' ? 'customerDetail' : 'taskDetail') : 'home'))
  document.querySelectorAll('[data-open-list]').forEach(button => button.onclick = () => go('taskList'))
  document.querySelectorAll('[data-open-filter]').forEach(button => button.onclick = () => { filterDraft = structuredClone(taskFilterState); filterDrawerMode = 'more'; filterDrawerOpen = true; render() })
  document.querySelectorAll('[data-filter-picker]').forEach(button => button.onclick = () => { filterDraft = structuredClone(taskFilterState); filterDrawerMode = button.dataset.filterPicker; filterDrawerOpen = true; render() })
  document.querySelectorAll('[data-home-filter]').forEach(button => button.onclick = () => { homeFilter = button.dataset.homeFilter; render() })
  document.querySelectorAll('[data-home-status]').forEach(button => button.onclick = () => { taskFilterState.taskStatus = button.dataset.homeStatus; render() })
  document.querySelectorAll('[data-home-stage]').forEach(button => button.onclick = () => { taskFilterState.stage = button.dataset.homeStage; render() })
  document.querySelectorAll('[data-home-type]').forEach(button => button.onclick = () => { taskFilterState.type = button.dataset.homeType; filters.type = taskFilterState.type; render() })
  document.querySelector('#home-search')?.addEventListener('submit', event => { event.preventDefault(); homeKeyword = event.target.querySelector('input').value.trim(); taskFilterState.keyword = homeKeyword; filters.keyword = homeKeyword; render() })
  document.querySelectorAll('[data-picker-option]').forEach(button => button.onclick = () => { const value = button.dataset.pickerOption; if (filterDrawerMode === 'scope') filterDraft.scope = value; if (filterDrawerMode === 'status') filterDraft.taskStatus = value; if (filterDrawerMode === 'stage') filterDraft.stage = value; if (filterDrawerMode === 'type') filterDraft.type = value; taskFilterState = structuredClone(filterDraft); filters.type = taskFilterState.type; filters.keyword = taskFilterState.keyword; filterDrawerOpen = false; filterDraft = null; filterDrawerMode = 'more'; render() })
  document.querySelectorAll('[data-draft-scope]').forEach(button => button.onclick = () => { filterDraft.scope = button.dataset.draftScope; render() })
  document.querySelectorAll('[data-draft-time-field]').forEach(button => button.onclick = () => { filterDraft.timeField = button.dataset.draftTimeField; if (!filterDraft.timeField) filterDraft.serviceDate = ''; render() })
  document.querySelectorAll('[data-draft-department]').forEach(button => button.onclick = () => { const value = button.dataset.draftDepartment; filterDraft.departments = filterDraft.departments.includes(value) ? filterDraft.departments.filter(item => item !== value) : [...filterDraft.departments, value]; filterDraft.staff = filterDraft.staff.filter(name => taskStaff().some(item => item.name === name && (!filterDraft.departments.length || filterDraft.departments.includes(item.department)))); render() })
  document.querySelectorAll('[data-draft-staff]').forEach(button => button.onclick = () => { const value = button.dataset.draftStaff; filterDraft.staff = filterDraft.staff.includes(value) ? filterDraft.staff.filter(item => item !== value) : [...filterDraft.staff, value]; render() })
  document.querySelector('#drawer-service-date')?.addEventListener('change', event => { filterDraft.serviceDate = event.target.value; render() })
  document.querySelectorAll('[data-filter-close]').forEach(button => button.onclick = event => { if (event.target.closest('[data-filter-panel]') && !event.target.closest('.filter-drawer-close')) return; filterDrawerOpen = false; filterDraft = null; filterDrawerMode = 'more'; render() })
  document.querySelector('#drawer-reset')?.addEventListener('click', () => { filterDraft = emptyTaskFilters(); render() })
  document.querySelector('#drawer-apply')?.addEventListener('click', () => { taskFilterState = structuredClone(filterDraft || emptyTaskFilters()); filters.type = taskFilterState.type; filters.keyword = taskFilterState.keyword; homeKeyword = taskFilterState.keyword; filterDrawerOpen = false; filterDraft = null; filterDrawerMode = 'more'; render() })
  document.querySelector('[data-action]')?.addEventListener('click', () => { actionMode = ''; go('nodeAction') })
  document.querySelector('[data-archive-followup]')?.addEventListener('click', () => { actionMode = 'archiveFollowup'; go('nodeAction') })
  document.querySelectorAll('[data-date]').forEach(button => button.onclick = () => { filters.date = button.dataset.date; render() })
  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => { filters.type = button.dataset.type; taskFilterState.type = button.dataset.type; render() })
  document.querySelector('#choose-date')?.addEventListener('click', () => document.querySelector('#date-input').showPicker?.())
  document.querySelector('#date-input')?.addEventListener('change', event => { filters.date = event.target.value; render() })
  document.querySelector('#search-form')?.addEventListener('submit', event => { event.preventDefault(); filters.keyword = event.target.querySelector('input').value.trim(); taskFilterState.keyword = filters.keyword; homeKeyword = filters.keyword; render() })
  document.querySelector('#customer-search')?.addEventListener('submit', event => { event.preventDefault(); customerKeyword = event.target.querySelector('input').value.trim(); render() })
  document.querySelector('#profile-form')?.addEventListener('submit', event => {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.target))
    const allowed = ['gender', 'birthday', 'phone', 'email', 'emergencyContact', 'emergencyPhone', 'address', 'education', 'specialty', 'certificates']
    const updated = Object.fromEntries(allowed.map(key => [key, String(form[key] || '').trim()]))
    profileOverrides[user.id] = { ...(profileOverrides[user.id] || {}), ...updated }
    localStorage.setItem('h5-profile-overrides', JSON.stringify(profileOverrides))
    user = profileFor(employees.find(item => item.id === user.id) || user)
    localStorage.setItem('h5-user', JSON.stringify(user))
    go('mine')
  })
  const followupNote = document.querySelector('#followup-note'); const followupCount = document.querySelector('#followup-note-count'); if (followupNote && followupCount) followupNote.addEventListener('input', () => { followupCount.textContent = `${followupNote.value.length}/500` })
  document.querySelector('#node-form')?.addEventListener('submit', submitAction)
  document.querySelector('#reset')?.addEventListener('click', () => { records = normalize(readSharedRecords().length ? readSharedRecords() : structuredClone(seed)); localStorage.removeItem('h5-data'); render() })
  document.querySelector('#logout')?.addEventListener('click', () => { if (user?.id) localStorage.setItem('h5-login-choice', user.id); localStorage.removeItem('h5-user'); user = null; view = 'home'; render() })
}
function submitAction(event) {
  event.preventDefault(); const item = current(); const form = Object.fromEntries(new FormData(event.target)); const now = `${DEMO_DATE} ${new Date().toTimeString().slice(0,5)}`
  if (actionMode === 'archiveFollowup' || item.status === 'followup') { const followup = { date: DEMO_DATE, ...form }; item.followups.push(followup); item.logs.push({ time: now, action: '新增回访记录', operator: user.name, detail: form.note }); if (actionMode === 'archiveFollowup') { save(); go('customerDetail'); return } }
  else if (item.status === 'floorControl') { item.floorControl = { ...form, completedAt: now }; item.projects = [...event.target.querySelectorAll('[name=projects]:checked')].map(input => input.value); item.project = form.project; Object.assign(item.assignments, { butler: form.butler, consultant: form.consultant, director: form.director, manager: form.manager }) }
  else if (item.status === 'arrivalConfirmation' && form.result !== '已到店') { item.arrivalConfirmation = form; item.notice = `${form.result}，保留在到店确认`; item.logs.push({ time: now, action: '到店确认', operator: user.name, detail: item.notice }); save(); go('taskDetail'); return }
  else if (item.status === 'arrivalConfirmation') item.arrivalConfirmation = { ...form, confirmedAt: now }
  else if (item.status === 'doctorDiagnosis') { item.doctorDiagnosis = form; item.assignments.doctor = user.name; item.assignments.nurse = form.nurse; item.department = form.department }
  else item.serviceExecution = form
  const from = item.status; item.status = nextStage[from] || item.status; item.notice = `${meta(from)[0]}已完成，已进入${meta(item.status)[0]}`; item.logs.push({ time: now, action: `完成${meta(from)[0]}`, operator: user.name, detail: item.notice }); save(); go('taskDetail')
}
render()
void pullSharedWorkbench()
window.setInterval(() => { void pullSharedWorkbench() }, 1500)
