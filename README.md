# 医美运营管理平台

面向医美门店业务协同的本地演示项目，包含管理后台与一线员工移动端两套体验。所有数据均为浏览器本机演示数据，请勿录入真实顾客信息。

## 演示地址

| 端 | 地址 | 适用场景 |
| --- | --- | --- |
| 管理后台 | [https://zhix88.github.io/cosmetic/](https://zhix88.github.io/cosmetic/) | 门店运营、顾客与预约管理、业务调度、经营分析与运营配置演示 |
| 移动端个人待办 | [https://zhix88.github.io/cosmetic/mobile/](https://zhix88.github.io/cosmetic/mobile/) | 一线员工查看个人任务、处理当前节点、查看顾客档案与新增回访记录 |
| 微信小程序原型 | `apps/mini/dist/build/mp-weixin/`（导入微信开发者工具） | 与 H5 同等的个人任务处理、顾客档案只读查看和回访录入 |

> GitHub Pages 会在推送 `main` 分支后自动构建并更新两套演示站。

## 管理后台

管理后台基于 Vue 3 + Vite 构建，展示医美门店从邀约、到店、分诊、服务到回访的全流程运营协同。

- 产品门户与业务工作台
- 顾客、预约、项目资产与服务流程管理
- 角色协同、流程推进、异常提醒与本地数据保存
- Excel 本地导入导出、经营分析和运营配置

## 移动端个人待办

移动端为独立 H5 演示，专为一线员工个人执行闭环设计。

- 账号与密码演示登录，按账号展示和处理本人任务
- 工作台任务列表、日期/状态/项目筛选及关键词搜索
- 任务详情、场控排诊、到店确认、医生排诊、服务执行和顾客回访
- 顾客档案、项目资产、服务影像与回访历史
- 基础资料和项目资产只读，仅允许新增回访记录
- 不包含余额、套餐、耗材、库存或业绩扣减功能
- 与管理后台通过版本化共享快照同步任务、员工、部门、流程负责人、顾客档案和回访记录；网络不可用时保留本地缓存，恢复后再同步

移动端 H5 本地预览：`http://127.0.0.1:4174/`。项目提供 `scripts/start-h5-preview.ps1` 作为本地预览守护启动脚本。

微信小程序本地预览：执行 `pnpm --dir apps/mini build:mp-weixin`，再将 `apps/mini/dist/build/mp-weixin/` 导入微信开发者工具。小程序共享接口地址可在本地演示中配置，未配置时仅使用本机演示数据。

## 技术栈

- 管理后台：Vue 3、Vite 5、Element Plus、ECharts、SheetJS
- 移动端：原生 H5、Vite 静态构建、localStorage 演示数据
- 微信小程序：uni-app、Vue 3、本地存储与共享快照接口
- 发布：GitHub Pages

## 本地运行

建议使用 Node.js 20 LTS 及 pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

管理后台默认访问 `http://127.0.0.1:5173`。

移动端预览可在单独终端启动：

```bash
node node_modules/vite/bin/vite.js apps/h5 --host 127.0.0.1 --port 4174
```

## 构建与发布

```bash
pnpm build
node node_modules/vite/bin/vite.js build apps/h5 --base ./ --outDir ../../dist/mobile
pnpm --dir apps/mini build:mp-weixin
```

构建后：

- `dist/`：管理后台静态文件
- `dist/mobile/`：移动端 H5 静态文件
- `apps/mini/dist/build/mp-weixin/`：微信小程序开发者工具导入包

GitHub Actions 会将上述内容发布到同一个 Pages 站点，分别对应根路径与 `/mobile/` 路径。

共享数据说明：管理后台开发预览提供 `/api/shared-workbench` 读写接口；H5 通过同源接口同步，小程序通过配置的共享接口地址同步。接口返回空数据、旧数组格式或网络失败时，移动端不会清空已有有效缓存。

## 数据与演示边界

- 不接入真实后端、数据库或真实微信授权登录。
- 演示操作仅保存于当前浏览器的 `localStorage`。
- 使用“重置演示数据”可恢复初始样例。
- 请勿导入、录入、泄露或用于其他用途的真实顾客信息。

## 项目结构

```text
src/                    管理后台 Vue 页面、组件与样式
apps/h5/                移动端个人待办 H5
apps/mini/              uni-app 微信小程序原型
scripts/                本地移动端预览启动脚本
.github/workflows/      GitHub Pages 自动发布工作流
deploy/                 Nginx 部署配置示例
```

## 验证

```bash
pnpm build
node node_modules/vite/bin/vite.js build apps/h5 --base ./ --outDir ../../dist/mobile
pnpm --dir apps/mini build:mp-weixin
```

验证重点：管理后台静态构建、移动端 H5 构建、个人任务权限、节点推进、本地数据持久化及静态资源加载。
