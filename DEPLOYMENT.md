# 医美运营管理平台静态部署说明

## 交付边界

- 本系统是 Vue 3 纯前端静态演示站，不需要应用服务器、数据库或后端接口。
- 演示操作数据保存在访问者当前浏览器的 `localStorage` 中；不同电脑、浏览器或无痕窗口之间不会共享数据。
- Excel 导入、导出与图表计算都在浏览器本地执行。请勿导入真实客户资料。

## 构建发布包

建议使用 Node.js 20 LTS 和 pnpm。项目已统一使用 pnpm 锁定依赖。

```powershell
pnpm install --frozen-lockfile
pnpm build
```

构建成功后，将 `dist/` 中的全部文件上传到服务器站点目录，例如 `/var/www/medical-aesthetics-demo`。

默认构建使用相对静态资源路径，可部署到域名根目录或二级目录。若部署到固定二级路径，可在构建时显式指定：

```powershell
$env:VITE_BASE_PATH = '/medical-demo/'
pnpm build
```

## Nginx 域名配置

复制 [nginx.conf.example](deploy/nginx.conf.example) 到 Nginx 站点配置目录，并替换：

- `example.com`：实际访问域名；
- `/var/www/medical-aesthetics-demo`：`dist/` 文件上传位置；
- `ssl_certificate` 与 `ssl_certificate_key`：实际证书文件路径。

配置中已包含：HTTP 跳转 HTTPS、静态资源长期缓存、入口页不缓存，以及 `try_files $uri $uri/ /index.html` 单页应用兜底。

验证并重载 Nginx：

```bash
nginx -t && systemctl reload nginx
```

## 发布与回滚

1. 在构建机执行 `pnpm build`，并保留本次 `dist/` 压缩包作为版本归档。
2. 将新版本上传至新的版本目录，例如 `/var/www/releases/20260717`。
3. 将 Nginx 站点目录软链接或发布目录切换至新版本，再执行 Nginx 重载。
4. 若需要回滚，将站点目录切回上一版本并重新加载 Nginx。

## 验收清单

- 域名首页显示产品门户，并可进入工作台、客户、预约、经营看板、报表和系统设置。
- 角色切换、流程推进、筛选、图表、Excel 导入导出均在浏览器中完成。
- 刷新页面后操作结果保持；点击“重置演示数据”后恢复初始样例。
- 首次访问、刷新页面和 HTTPS 访问均可正确加载静态资源。
