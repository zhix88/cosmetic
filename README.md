# 医美运营管理平台（静态演示版）

基于 Vue 3 + Vite 构建的纯前端医美门店运营管理演示站。系统以顾客业务为主线，展示邀约、到店、分诊、服务、回访及经营分析等核心运营场景。

**在线演示：** https://zhix88.github.io/cosmetic/

> GitHub Pages 会在每次推送 `main` 分支后自动构建并更新演示站。

## 产品能力

- **产品门户**：展示核心能力、标准服务闭环与角色协同方式，并可直接进入后台演示。
- **业务工作台**：按角色汇聚待办、顾客进度、节点完成情况和异常提醒，支持流程推进。
- **顾客与预约管理**：维护顾客档案、服务偏好、项目资产与预约日历；支持本地 Excel 导入导出。
- **经营分析**：提供业务进度、转化漏斗、经营趋势、消费结构、日报和成交分析。
- **运营配置**：覆盖组织、门店、员工、项目、库存、权限与业务规则等演示配置。

## 技术栈

- Vue 3
- Vite 5
- Element Plus
- ECharts
- SheetJS（Excel 本地导入导出）

## 本地运行

建议使用 Node.js 20 LTS 与 pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

启动后访问终端显示的本地地址，默认是 `http://127.0.0.1:5173`。

## 生产构建

```bash
pnpm build
```

构建文件输出至 `dist/`。项目默认采用相对静态资源路径，支持部署到域名根目录或二级目录。

若需指定二级部署路径：

```powershell
$env:VITE_BASE_PATH = '/medical-demo/'
pnpm build
```

## 数据与演示边界

- 系统不连接后端服务、数据库或真实登录体系。
- 所有演示操作数据仅保存于当前浏览器的 `localStorage`，刷新页面后仍会保留。
- 使用“重置演示数据”可恢复初始样例。
- Excel 导入、导出与报表计算均在浏览器本地执行，请勿导入真实客户资料。

## 部署

将 `dist/` 内容上传至 Web 服务器站点目录即可。Nginx 部署、HTTPS、缓存、发布与回滚说明详见：

- [部署说明](DEPLOYMENT.md)
- [Nginx 配置示例](deploy/nginx.conf.example)

Nginx 单页应用兜底配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 项目结构

```text
src/                    Vue 页面、组件和样式
deploy/                 Nginx 部署配置示例
DEPLOYMENT.md           服务器部署与验收说明
vite.config.js          Vite 静态发布配置
```

## 验证

```bash
pnpm install --frozen-lockfile
pnpm build
```

验证重点包括：产品门户访问、模块导航、角色切换、业务流程推进、本地数据保存、Excel 导入导出及静态资源加载。
