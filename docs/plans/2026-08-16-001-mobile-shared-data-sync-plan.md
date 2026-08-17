---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
plan_output: md
title: PC 与移动端共享数据同步 - Plan
date: 2026-08-16
---

# PC 与移动端共享数据同步 - Plan

## Goal Capsule

- **Objective:** 让管理后台、H5 和微信小程序使用一致的演示任务、员工配置、流程状态和顾客档案数据。
- **Product authority:** 管理后台负责维护共享演示数据；H5 和小程序读取共享数据，并保留本地缓存作为离线演示兜底。
- **Scope:** 只同步 PC 端近期调整对移动端有影响的任务、人员、流程、时间字段、顾客档案和回访数据。
- **Out of scope:** 不重做移动端产品信息架构；不开放移动端资产扣减、余额扣减、库存扣减、业绩编辑、组织结构编辑或经营报表。
- **Stop conditions:** 如果同步会绕过当前节点权限、覆盖较新的本地操作、或把真实顾客数据写入演示环境，停止发布并保留本地缓存。

## Product Contract

### Summary

PC 端近期调整了流程状态、节点时间、员工归属、部门配置、当前日期演示任务和顾客档案字段。H5 已经通过共享工作台接口同步任务，小程序仍主要使用独立本地存储。移动端需要补齐统一的数据契约和小程序同步能力，同时保持现有个人任务执行与顾客只读边界。

### Problem Frame

当 PC 端新增或推进任务、调整员工归属、更新顾客档案时，移动端可能继续使用旧任务或旧员工配置。典型结果是 PC 端显示娜娜负责的任务，而移动端显示暂无任务；H5 和小程序对同一任务的阶段、时间或负责人显示不一致。

### Requirements

- **R1 — 共享任务数据：** PC、H5 和小程序必须识别相同的业务单、顾客、门店、部门、预约时间、当前节点和任务状态。
- **R2 — 流程兼容：** 移动端必须支持 `floorControl → arrivalConfirmation → doctorDiagnosis → service → followup → completed`，并展示 `cancelled`；历史旧状态和旧日志必须可回退读取。
- **R3 — 节点时间：** 移动端必须读取创建、预约、场控排诊、确认到店、医生排诊、服务结束、回访和取消时间，并按节点时间、表单时间、操作日志的顺序回退。
- **R4 — 人员配置：** 移动端账号、角色、门店、部门和任务归属必须与 PC 当前演示配置一致；无部门员工归入“未分组”。
- **R5 — 权限过滤：** “本人任务”必须按任务归属人员匹配当前员工；节点处理仍只允许当前节点负责人执行；“全部任务”只扩大查看范围，不扩大处理权限。
- **R6 — PC 写入传播：** PC 新增、导入、编辑、推进、取消和重置演示数据后，H5 和小程序在下一次刷新或主动同步后读取最新数据。
- **R7 — 移动端写入传播：** H5 或小程序完成节点处理或新增回访后，PC 和另一移动端读取到新的状态、时间、日志和回访记录。
- **R8 — 顾客档案一致性：** 移动端展示 PC 已保存的基础资料、会员等级、负责人、偏好禁忌、项目资产、服务记录、影像和回访历史；基础资料和资产保持只读。
- **R9 — 缓存安全：** 同步失败时使用最近一次合法缓存或演示种子数据，并提示数据更新时间；不得以空响应覆盖已有合法数据。
- **R10 — 演示边界：** 所有同步数据继续标记为演示数据，禁止写入真实顾客信息。

### Actors and boundaries

- **管理后台员工：** 创建和维护共享任务、人员、部门、流程配置和顾客档案。
- **H5 员工：** 查看本人或授权范围内任务，处理当前节点，查看顾客档案并新增回访。
- **微信小程序员工：** 具备与 H5 相同的任务和顾客基础能力。
- **共享数据层：** 只保存演示数据和版本信息，不承担生产身份认证。

### Acceptance examples

- **AE1:** PC 端将任务从场控排诊推进到确认到店后，H5 和小程序刷新后均显示“确认到店”、对应确认时间和新的当前负责人。
- **AE2:** PC 端把任务分配给娜娜后，娜娜登录 H5 和小程序都能看到该任务；未被分配的员工不能在“本人任务”中看到它。
- **AE3:** H5 完成服务执行后，PC 和小程序都能看到服务结束时间、回访日期和操作日志；余额、套餐和库存不发生变化。
- **AE4:** PC 新增顾客回访后，H5 和小程序顾客档案详情都能查看该记录；移动端基础资料和资产仍不可编辑。
- **AE5:** 同步接口返回空数据、旧格式或损坏数据时，移动端保留最近一次合法数据，并显示离线或缓存提示。
- **AE6:** PC 重置演示数据后，H5 和小程序在刷新后恢复同一组种子任务、账号和顾客数据。

### Success criteria

- 同一业务单在三端的状态、负责人、关键时间和日志一致率达到 100%。
- 员工和部门配置变更后，两个移动端均能在一次主动刷新内生效。
- 同步失败不导致任务列表清空或合法本地数据丢失。
- 移动端无任何余额、套餐、库存、耗材或业绩扣减写入。

### Scope boundaries

- **Keep:** 共享任务、流程节点、节点时间、人员归属、顾客只读档案、回访记录、演示数据重置。
- **Deferred:** 生产后端认证、推送通知、冲突解决界面、附件上传和真实影像存储。
- **Outside product identity:** 门店全量调度、组织结构编辑、顾客建档、资产编辑、经营分析和报表。

### Dependencies and assumptions

- `data/shared-workbench.json` 继续作为本地演示共享任务载体。
- 现有 `/api/shared-workbench` 继续服务 H5，并扩展为兼容任务和配置的版本化响应；旧数组响应仍可读取。
- 微信小程序可获得可配置的共享数据地址；无法访问时使用本地缓存和种子数据。
- PC、H5 和小程序的时区均按 Asia/Shanghai 解释业务时间。

## Planning Contract

### Key technical decisions

1. **沿用并扩展现有共享工作台接口**（session-settled: user-approved — chosen over creating a second mobile-only data path: H5 and PC already exchange `data/shared-workbench.json`, so extending the existing path reduces split-brain risk）。响应同时承载版本、任务和移动端所需配置，并接受旧版任务数组作为兼容输入。
2. **PC 配置作为员工和流程配置的权威来源**。H5 和小程序只缓存配置，不提供移动端组织结构编辑。
3. **同步采用“版本优先、缓存兜底”**。客户端只应用更新版本，网络失败或空载荷不覆盖最近一次合法数据。
4. **写入仍走现有流程权限**。共享同步只传播合法结果，不绕过当前节点负责人校验。
5. **先完成跨端契约测试，再改页面绑定**。这样可以先发现 PC 新字段或旧数据兼容问题，避免用 UI 现象掩盖数据不一致。

### High-level design

```text
管理后台
  ├─ 任务/预约/导入/员工/顾客配置
  └─ 版本化共享数据
          │
          ├─ H5：主动刷新 + 定时拉取 + 本地缓存
          └─ 小程序：启动/下拉刷新 + 本地缓存
          │
       统一规范化
          │
  状态、节点时间、归属、权限、顾客档案
```

### Data and compatibility rules

- 共享响应必须带更新时间或单调版本号，并区分任务数据和配置数据。
- 任务规范化必须保留 `assignments`、`nodeTimes`、`cancelledAt`、`serviceEndedAt`、`followupAt`、`logs` 和节点表单数据。
- 旧任务缺少专属时间时，按 R3 回退；无法解析状态时保留记录并标记为不可处理，而不是丢弃。
- 员工配置至少包含稳定标识、姓名、角色、门店、部门和启用状态。
- 顾客回访写入必须携带记录时间、操作人、方式、结果、满意度、下次回访日期和备注。

### Sequencing

按 U1 到 U12 严格串行执行。每个单元只修改其列出的文件，完成该单元的验证后才进入下一个单元。任何单元失败时，先修复该单元，不跨单元补丁。

1. 建立基线和契约测试样例。
2. 完成共享规范化函数。
3. 让 PC 发布员工和流程配置快照。
4. 让 PC 发布任务快照。
5. 让 H5 读取并保护快照缓存。
6. 让 H5 使用最新员工配置和权限。
7. 让小程序读取并保护快照缓存。
8. 让小程序使用最新员工配置和权限。
9. 让 H5 写回节点和回访结果。
10. 让小程序写回节点和回访结果。
11. 对齐顾客档案字段和只读边界。
12. 执行跨端回归并更新发布说明。

每个单元的完成门槛是：代码或测试变更完成、单元验证通过、没有新增未解释的兼容分支、工作区无与该单元无关的文件改动。

### Risks and mitigations

- **小程序无法访问本地 PC 服务：** 提供可配置同步地址，并保留离线种子；验收时分别验证本地预览和可访问地址。
- **PC 与移动端同时写入：** 以服务端版本和最后合法写入为准，客户端刷新前不覆盖本地未提交表单。
- **旧任务字段不完整：** 规范化层提供字段回退，测试覆盖旧状态和缺失时间。
- **员工名称变更导致归属失效：** 使用稳定员工标识参与匹配，姓名仅作为展示和旧数据兼容字段。
- **配置和任务更新不同步：** 客户端应用同一版本快照，禁止只更新任务而保留过期员工配置。

## Implementation Units

### Unit index

| ID | 单一结果 | 主要文件 | Depends on |
|---|---|---|---|
| U1 | 基线与契约样例 | `tests/mobile-sync-contract.test.mjs` | — |
| U2 | 共享规范化函数 | `shared/demoDataContract.js` | U1 |
| U3 | PC 配置快照 | `src/App.vue` | U2 |
| U4 | PC 任务快照 API | `vite.config.js`, `apps/h5/vite.config.js` | U3 |
| U5 | H5 快照读取 | `apps/h5/main.js` | U4 |
| U6 | H5 配置与权限 | `apps/h5/main.js` | U5 |
| U7 | 小程序快照读取 | `apps/mini/src/services/repository.js` | U6 |
| U8 | 小程序配置与权限 | `apps/mini/src/services/repository.js`, `apps/mini/src/App.vue` | U7 |
| U9 | H5 写回 | `apps/h5/main.js` | U8 |
| U10 | 小程序写回 | `apps/mini/src/services/repository.js` | U9 |
| U11 | 顾客档案字段 | `src/CustomerArchive.vue`, `apps/h5/main.js`, `apps/mini/src/pages` | U10 |
| U12 | 跨端回归与发布说明 | `tests`, `README.md`, `DEPLOYMENT.md` | U11 |

### U1. 建立基线与契约样例

- **Goal:** 固定当前 PC 输出和移动端期望的最小样例。
- **Requirements:** R1, R2, R3, R4, R8, R9
- **Files:** `tests/mobile-sync-contract.test.mjs`（新增）
- **Depends on:** —
- **Approach:** 只添加代表性任务、员工、节点时间、旧状态和顾客回访样例，不修改业务代码。
- **Test scenarios:** 样例覆盖进行中、完成、取消、缺失时间、缺失部门和旧日志格式。
- **Verification:** `node --test tests/mobile-sync-contract.test.mjs`

### U2. 提取共享规范化函数

- **Goal:** 提供跨端一致的任务、配置和回访规范化规则。
- **Requirements:** R1, R2, R3, R4, R7, R8, R9
- **Files:** `shared/demoDataContract.js`（新增）, `tests/mobile-sync-contract.test.mjs`
- **Depends on:** U1
- **Approach:** 只实现状态别名、节点时间回退、员工部门默认值、归属匹配和回访字段默认值。
- **Test scenarios:** 输入旧数组和新快照得到相同规范化任务；无法识别状态的记录保留但不可处理。
- **Verification:** `node --test tests/mobile-sync-contract.test.mjs`

### U3. 让 PC 发布配置快照

- **Goal:** PC 每次保存员工、部门、流程或重置演示数据时发布同版本配置。
- **Requirements:** R4, R6, R9, R10
- **Files:** `src/App.vue`, `shared/demoDataContract.js`
- **Depends on:** U2
- **Approach:** 只接入员工、部门、流程和配置版本，不改变 PC 页面行为。
- **Test scenarios:** 员工部门变更、角色变更和重置数据都会生成合法配置快照；禁用员工不会进入移动端登录列表。
- **Verification:** `node --test tests/mobile-sync-contract.test.mjs`

### U4. 让 PC 发布任务快照 API

- **Goal:** 共享接口同时提供规范化任务和配置，并保留旧格式读取能力。
- **Requirements:** R1, R2, R3, R6, R9
- **Files:** `vite.config.js`, `apps/h5/vite.config.js`, `data/shared-workbench.json`, `tests/shared-workbench-api.test.mjs`
- **Depends on:** U3
- **Approach:** 扩展现有 `/api/shared-workbench`，拒绝空载荷和非法版本；旧数组响应继续可读。
- **Test scenarios:** GET 返回版本化快照；POST 写入后版本递增；空或非法载荷不覆盖旧文件。
- **Verification:** `node --test tests/shared-workbench-api.test.mjs`

### U5. 让 H5 读取快照并保护缓存

- **Goal:** H5 只应用更新且合法的任务和配置快照。
- **Requirements:** R1, R2, R3, R6, R9
- **Files:** `apps/h5/main.js`
- **Depends on:** U4
- **Approach:** 接入 U2 规范化函数；保留现有定时拉取；空响应、网络错误和旧版本不覆盖合法缓存。
- **Test scenarios:** H5 刷新后显示新状态和节点时间；同步失败仍显示最近任务；旧数组仍能进入列表。
- **Verification:** `node --check apps/h5/main.js`; H5 生产构建。

### U6. 让 H5 使用最新配置和权限

- **Goal:** H5 账号列表、部门筛选、本人任务和处理权限来自 PC 配置快照。
- **Requirements:** R4, R5, R6
- **Files:** `apps/h5/main.js`
- **Depends on:** U5
- **Approach:** 只替换硬编码员工和流程配置的读取来源，不改变移动端页面结构。
- **Test scenarios:** PC 修改娜娜归属后 H5 可见任务同步变化；全部任务只扩大查看范围；非当前节点负责人不能提交。
- **Verification:** H5 登录、范围筛选、任务处理人工验收。

### U7. 让小程序读取快照并保护缓存

- **Goal:** 小程序启动和刷新时读取 PC 最新快照。
- **Requirements:** R1, R2, R3, R6, R9
- **Files:** `apps/mini/src/services/repository.js`, `apps/mini/src/App.vue`
- **Depends on:** U6
- **Approach:** 增加可配置同步地址；请求成功后规范化并缓存；地址不可用时保留本地种子和最近快照。
- **Test scenarios:** 启动拉取 PC 新任务；空响应不清空本地任务；版本未更新时不重复覆盖。
- **Verification:** `pnpm --dir apps/mini build:mp-weixin`

### U8. 让小程序使用最新配置和权限

- **Goal:** 小程序账号、部门、本人任务和节点处理权限与 H5 一致。
- **Requirements:** R4, R5, R6
- **Files:** `apps/mini/src/services/repository.js`, `apps/mini/src/App.vue`, `apps/mini/src/pages/login/index.vue`, `apps/mini/src/pages/workbench/index.vue`
- **Depends on:** U7
- **Approach:** 只替换配置读取和归属匹配，不调整页面信息架构。
- **Test scenarios:** 同一员工在 H5 和小程序看到相同本人任务；全部任务查看不扩大处理权限；部门筛选结果一致。
- **Verification:** 微信开发者工具登录、筛选和无权限提交验收。

### U9. 让 H5 写回节点和回访结果

- **Goal:** H5 的合法处理结果进入共享快照。
- **Requirements:** R7, R9, R10
- **Files:** `apps/h5/main.js`, `src/App.vue`
- **Depends on:** U8
- **Approach:** 保留现有本地先写入逻辑；成功后发布版本化快照；失败时保留待同步状态，不重复提交表单。
- **Test scenarios:** 场控、到店、医生、服务、回访结果可被 PC 和小程序读取；重复刷新不会重复生成日志。
- **Verification:** H5 五节点处理和 PC/H5 数据回读验收。

### U10. 让小程序写回节点和回访结果

- **Goal:** 小程序的合法处理结果与 PC、H5 汇合。
- **Requirements:** R5, R7, R9, R10
- **Files:** `apps/mini/src/services/repository.js`, `apps/mini/src/pages/task-detail/index.vue`, `apps/mini/src/pages/customer-detail/index.vue`
- **Depends on:** U9
- **Approach:** 复用同一提交结果规范化和版本检查；网络失败保留本地结果并提示同步状态。
- **Test scenarios:** 小程序提交节点后 PC/H5 显示相同状态、时间和日志；无权限提交被拒绝；回访不产生资产扣减。
- **Verification:** `pnpm --dir apps/mini build:mp-weixin`; 微信开发者工具闭环验收。

### U11. 对齐顾客档案字段和只读边界

- **Goal:** 两个移动端展示 PC 最新顾客资料并共享回访记录。
- **Requirements:** R7, R8, R10
- **Files:** `src/CustomerArchive.vue`, `apps/h5/main.js`, `apps/mini/src/services/repository.js`, `apps/mini/src/pages/customers/index.vue`, `apps/mini/src/pages/customer-detail/index.vue`, `tests/mobile-customer-parity.test.mjs`
- **Depends on:** U10
- **Approach:** 只补字段映射、只读展示和回访写回；不增加顾客建档或资产编辑。
- **Test scenarios:** 会员、门店、负责人、偏好禁忌、资产、服务、影像和回访记录跨端一致；基础资料和资产无编辑入口。
- **Verification:** `node --test tests/mobile-customer-parity.test.mjs`

### U12. 执行跨端回归并更新发布说明

- **Goal:** 用一套串行验收证明同步链路可发布。
- **Requirements:** R1–R10
- **Files:** `tests/mobile-sync-contract.test.mjs`, `tests/shared-workbench-api.test.mjs`, `tests/mobile-customer-parity.test.mjs`, `README.md`, `DEPLOYMENT.md`
- **Depends on:** U11
- **Approach:** 先自动化测试，再按 PC→H5、PC→小程序、H5→PC、 小程序→PC 顺序做人工验收，最后更新地址和故障兜底说明。
- **Test scenarios:** 四种任务状态、五个进行中阶段、八类节点时间、员工/部门筛选、双向节点推进、回访、重置、空响应和旧数据回退。
- **Verification:** 根目录构建、H5 构建、小程序构建、全部 `node --test tests/*.test.mjs`、390×844 和窄屏验收。

## Verification Contract

### Automated gates

- `node --test tests/mobile-sync-contract.test.mjs`
- `node --test tests/shared-workbench-api.test.mjs`
- `node --test tests/mobile-customer-parity.test.mjs`
- `node --test tests/*.test.mjs`
- `pnpm build`
- `node node_modules/vite/bin/vite.js build apps/h5 --base ./ --outDir ../../dist/mobile`
- `pnpm --dir apps/mini build:mp-weixin`
- `git diff --check`

### Behavioral gates

- PC 新增、推进、取消、重置任务后，H5 和小程序读取同一状态、负责人和节点时间。
- PC 修改员工、部门或角色后，两个移动端账号和本人任务过滤一致。
- H5 和小程序均只能处理当前节点，全部任务查看不扩大处理权限。
- 移动端新增回访能在 PC 和另一移动端显示，且不产生资产、库存或业绩扣减。
- 同步接口失败、空响应、旧格式和非法载荷均不会清空有效缓存。
- 390×844 和窄屏下无横向滚动、无关键字段截断、固定操作栏可用。

## Definition of Done

- [x] PC、H5、小程序共享任务、员工、部门、流程和顾客回访数据契约已统一。
- [x] H5 能应用版本化共享快照，并保留合法缓存兜底。
- [x] 微信小程序能主动拉取和写回共享快照，并在离线时安全降级。
- [x] 任务状态、节点时间、负责人、权限过滤和历史日志跨端一致。
- [x] 顾客基础资料和资产在移动端只读，回访新增跨端可见。
- [x] PC 端新增、导入、推进、取消和重置演示数据均已纳入共享快照契约与自动化回归；真机/开发者工具验收仍需按发布环境执行。
- [x] 自动化测试、根目录构建、H5 构建和微信小程序构建全部通过。
- [x] README 和 DEPLOYMENT.md 已说明 H5、小程序和共享数据地址的关系。
- [x] 未保留失败方案产生的废弃同步代码或重复数据路径。

### Serial completion record

执行时按顺序勾选 U1–U12。未完成前置单元时，不得开始后续单元。每个单元完成后记录对应验证结果，再进入下一单元。

- [x] U1 基线与契约样例
- [x] U2 共享规范化函数（`node --test tests/mobile-sync-contract.test.mjs`：9 项通过）
- [x] U3 PC 配置快照（配置变更、重置和任务发布均携带员工/部门/角色/流程快照；根目录生产构建通过）
- [x] U4 PC 任务快照 API（版本化任务/配置快照、旧数组兼容、空/非法/重复任务拒绝；12 项相关测试通过）
- [x] U5 H5 快照读取（版本优先、规范化读取、空响应/网络失败保留缓存；H5 构建与 12 项测试通过）
- [x] U6 H5 配置与权限（账号、部门、流程负责人从共享配置更新；H5 构建通过）
- [x] U7 小程序快照读取（启动/切前台拉取、版本缓存、空/非法/网络失败保留本地数据；微信小程序构建通过）
- [x] U8 小程序配置与权限（账号/部门/流程配置读取共享快照，归属匹配兼容稳定 ID 与姓名；微信小程序构建通过）
- [x] U9 H5 写回（节点/回访写回共享快照，节点时间字段保留，串行写入避免重复提交；H5/根目录构建与 12 项测试通过）
- [x] U10 小程序写回（节点/回访写回共享快照并保留节点时间；无网络保留本地结果并显示同步状态；小程序构建与 12 项测试通过）
- [x] U11 顾客档案字段（共享快照补充顾客档案与回访，H5/小程序展示会员、门店、负责人、偏好禁忌、资产、服务、影像和回访；移动端资料资产保持只读；15 项测试通过）
- [x] U12 跨端回归与发布说明（24 项自动化测试、PC/H5/小程序构建、文档地址与共享数据说明已完成）
