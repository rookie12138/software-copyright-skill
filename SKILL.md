---
name: software-copyright-skill
description: >
  软著申请全流程自动化技能。四阶段流水线：需求确认 → 前端先行生成（App Shell→View组件→契约提取）
  → 后端代码生成（紧贴openapi.yaml）→ 审查清洗+交付组装。
  支持模块自定义、UI风格选择(ui-ux-pro-max)、去AI化代码生成，
  最终输出60页源代码文档、操作手册、UI截图集和完整源码包。
  触发条件：软著申请、软件著作权、申请软著、软著材料准备、copyright application。
agent_created: true
---

# Soft Copyright Application Skill - 软件著作权申请全流程技能

## 概述

本技能将软著申请拆解为四个阶段，按严格串行流水线执行：

```
Phase 0 ────────→ Phase 1 ──────────────────────────→ Phase 2 ────────→ Phase 3
需求+设计系统生成  前端先行（四步递进）                  后端代码生成       审查清洗+交付
                 1.0 App Shell (使用设计系统)
                 1.1 View Components (业务+Mock数据)
                 1.1b 视觉修饰 (ui-ux-pro-max 精装修)
                 1.2 契约提取
```

**核心设计理念**：
- 前端先行确定所有页面和数据展示 → 从生成的前端代码中自动提取 API 契约 → 后端紧贴契约生成代码
- 前后端天然对齐，无需事后校验接口一致性
- 前端采用原生 JS SPA 架构，无框架依赖

---

## Phase 0：需求确认 + 全局设计系统生成

**目标**：确认产品参数，并由 `ui-ux-pro-max` 生成完整的全局设计系统。

**流程**：
1. 询问用户：产品名称、版本号（默认 V1.0）
2. 展示模块清单，让用户勾选（默认全选）
3. **调用 `ui-ux-pro-max` 生成全局设计系统**（见下方详细说明）
4. 汇总生成 `spec.json` + `design-system/` 目录

**Step 3 — ui-ux-pro-max 的职责是"定调子"，不碰业务代码：**

| 产出物 | 文件路径 | 说明 |
|--------|---------|------|
| 色彩矩阵 CSS 变量 | `design-system/colors.css` | 主色 → 辅助色 → 中性色，每色 9 级透明度映射 |
| 玻璃拟态特效 CSS | `design-system/effects.css` | `.glass-card`、`.glass-panel`、`.glass-sidebar` 等毛玻璃类 |
| 状态标签系统 | `design-system/badges.css` | `.badge-critical`、`.badge-high`、`.badge-warning`、`.badge-info` 渐变背景 |
| ECharts 暗黑主题 | `design-system/echarts-dark-theme.json` | 完整 ECharts 主题 JSON，配色与全局变量一致 |
| 卡片层级系统 | `design-system/layers.css` | `.card-layer-1`、`.card-layer-2`、`.card-layer-3` 背景色差体现 Z 轴层级 |
| 表格高级样式 | `design-system/table-advanced.css` | 斑马纹 `.data-table--striped`、表头冻结 `.data-table--sticky`、图标高亮 |

**重要**：这些设计系统文件是 Phase 1.0 App Shell 和 Phase 1.1b 视觉修饰的输入。`index.html` 必须在 `<head>` 中引入全部 design-system CSS。

**spec.json 结构**：
```json
{
  "product_name": "禁卫网络数字资产安全运营平台",
  "version": "V1.0",
  "ui_style": "dark-cyber-security",
  "ui_keywords": "深色科幻, 网络安全仪表盘, 毛玻璃效果, Glassmorphism, 霓虹边界",
  "design_system_dir": "design-system/",
  "css_variables": { "...从ui-ux-pro-max获取..." },
  "modules": [ ... ]
}
```

注意：`ui_keywords` 字段会传给 ui-ux-pro-max，确保它生成的设计系统精准匹配所选风格的核心视觉特征。

**执行指令**：加载 `prompts/phase0_requirements.md`。

---

## Phase 1：前端先行生成（四步递进）

### Step 1.0 — App Shell 基座生成

**目标**：搭建全局舞台，生成所有页面共用的外壳。

**输入**：`spec.json` + `design-system/` 全部文件

**由主控前端 Agent 执行，禁止并行。**

**产出文件**：

| 文件 | 内容 |
|------|------|
| `index.html` | 完整 HTML 入口，必须引入 `design-system/colors.css`、`design-system/effects.css`、`design-system/badges.css`、`design-system/layers.css`、`design-system/table-advanced.css` |
| `css/variables.css` | Phase 0 生成的色彩矩阵 CSS 变量（从 `design-system/colors.css` 提取核心变量） |
| `css/layout.css` | 全局布局样式（Sidebar、Header、Content 区域），使用 glassmorphism 效果 |
| `js/router.js` | 基于 hash 的 SPA 路由器，根据 `spec.json` 自动生成路由表 |
| `js/app-shell.js` | 应用初始化：加载路由、渲染侧边栏菜单、全局事件绑定、注册 ECharts 暗黑主题 |

**约束规则**：

1. **Sidebar 菜单**：使用 `.glass-sidebar` 类（毛玻璃效果），`enabled: true` 的模块动态生成菜单项
2. **Header 状态栏**：使用 `.glass-panel` 类，展示标题、用户信息、告警铃铛
3. **路由占位**：每个路由对应一个挂载函数，如 `router.on('/asset', renderAssetCenter)`
4. **CSS 变量**：全部来自 Phase 0 的 design-system，禁止自由发挥
5. **ECharts 主题**：在 `app-shell.js` 中调用 `echarts.registerTheme('dark-cyber', theme)` 注册 design-system 产出的暗黑主题
6. **数据指标卡片**：统一使用 `.glass-card` 类名（毛玻璃卡片效果）
7. **表格规范**：统一使用 `table.data-table` + `data-table--striped`（斑马纹）+ `data-table--sticky`（表头冻结）
8. **状态标签**：使用 design-system 的 `.badge-critical`、`.badge-high` 等类，禁止自创标签样式

**执行指令**：加载 `prompts/phase1_0_app_shell.md`。

---

### Step 1.1 — View Components 生成（并行）

**目标**：为每个启用模块生成纯页面级视图组件。

**输入**：`spec.json` + App Shell 已生成的 `index.html`、`css/variables.css`、`js/router.js`

**并行策略**：为每个一级模块启动独立的 FE-Agent（5 个并行）

| Agent | 模块 | 路由 | 产出文件 |
|-------|------|------|---------|
| FE-Agent-1 | 首页 | `/dashboard` | `js/views/dashboard.js` |
| FE-Agent-2 | 资产中心 | `/asset` | `js/views/asset.js` |
| FE-Agent-3 | 主机风险 | `/host-risk` | `js/views/host-risk.js` |
| FE-Agent-4 | 网站风险 | `/web-risk` | `js/views/web-risk.js` |
| FE-Agent-5 | 攻击事件+系统管理 | `/attack` `/system` | `js/views/attack.js` `js/views/system.js` |

**铁律（必须在 Prompt 中明确）：**

1. **禁止输出 `<html>`、`<head>`、`<body>` 标签** —— 只能输出一个 `async function renderXxx(container, params)`
2. **禁止自行编写侧边栏或顶栏** —— 这些已在 Step 1.0 生成
3. **强制数据解耦（mockFetch 契约）**：必须在文件头部定义 `async function mockFetch(url, options)`，所有数据通过它获取，禁止在 HTML 字符串中直接写死数据值
4. **路由跳转联动**：涉及"查看详情"或跨模块跳转时，必须调用 `router.navigate()` 并传递参数
5. **组件函数签名统一**：`window.renderXxx = async function(container, params)`，容器 DOM 节点，`params` 是路由参数对象

**路由跳转联动规则（增强截图连贯性）：**

```
首页"高危资产 TOP 5"的"详情"按钮 → router.navigate('/asset', { hostId: 'xxx' })
首页告警列表的"处置"按钮     → router.navigate('/attack', { alertId: 'xxx' })
资产中心主机列表的"风险详情"  → router.navigate('/host-risk', { hostId: 'xxx' })
资产中心网站列表的"漏洞详情"  → router.navigate('/web-risk', { siteId: 'xxx' })
```

接收方页面必须读取 `params` 并展示对应数据。

**Mock 数据规范**：

| 场景 | 数据要求 |
|------|---------|
| 主机台账 | 包含真实 CVE 编号（如 CVE-2024-6387）、CVSS 评分（1.0-10.0）、发现时间 |
| IP 地址 | 使用真实 IP 段（如 192.168.1.x、10.0.0.x） |
| 端口 | 常见高危端口：22、3389、445、6379、3306 |
| 攻击类型 | SQL注入、XSS、CSRF、SSRF、RCE、暴力破解等真实攻击向量名称 |
| 图表数据 | 至少 30 天/24 小时/7 天的时序数据，非零值 |
| 操作按钮 | 每页至少 3 个可交互按钮，有 hover 态样式 |

**执行指令**：加载 `prompts/phase1_1_frontend_agent.md`。

**重要**：Step 1.1 产出的组件**不直接写入文件**。先暂存，待 Step 1.1b 视觉修饰后再写入。

---

### Step 1.1b — 视觉修饰精装修（ui-ux-pro-max 拦截器）

**目标**：ui-ux-pro-max 作为视觉拦截器，对每个 View Component 进行精装修。不加业务逻辑，只提升视觉品质。

**工作流**：
```
FE-Agent 输出纯逻辑+Mock数据组件
        ↓
ui-ux-pro-max 视觉修饰（保留所有逻辑和变量绑定）
        ↓
最终写入 js/views/xxx.js
```

**ui-ux-pro-max 对本步骤的职责（不做业务逻辑）：**

| 修饰维度 | 要求 |
|----------|------|
| 卡片装饰 | 为 `.stat-card` / `.glass-card` 添加内发光边框 `box-shadow: inset 0 0 0 1px rgba(33,150,243,0.15)` + 多层外阴影 |
| 排版留白 | 优化 `.stat-card__value` 与 `.stat-card__label` 的间距，为数值区增加虚拟空间呼吸感 |
| 状态标签 | 确保 "高危/危急/正常" 使用 design-system 的 `.badge-*` 类，带微渐变 + 高对比度文字 |
| Z 轴层级 | Dashboard 中使用 `.card-layer-1`（前景统计卡）、`.card-layer-2`（图表区）、`.card-layer-3`（表格区）区分视觉深度 |
| 表格质感 | 强制应用 `.data-table--striped`（斑马纹）、`.data-table--sticky`（表头冻结+深色背景） |
| 图表配色 | 图表中状态色严格使用 design-system 的 `--chart-critical`、`--chart-high` 等变量 |
| 按钮质感 | 确保所有 `.btn` 有 hover/active/focus 三态过渡动画，无原生丑陋样式 |

**执行指令**：加载 `prompts/phase1_1b_visual_linter.md`。

---

### Step 1.2 — API 契约自动提取 (mockFetch 静态分析)

**目标**：全自动扫描前端 `mockFetch` 代码，提取 API 端点、响应 Schema 和数据库表结构。

**执行方式**：启动契约提取 Agent

**提取逻辑**：
1. 扫描 `js/views/*.js` 中所有 `url.includes('...')` 分支 → 提取全部 API 端点路径
2. 解析每个分支的 `return { code, data: {...} }` → 提取响应 Schema（字段名+类型）
3. 从字段名和值反推数据库表结构（snake_case 字段 → MySQL 列）
4. 输出 `openapi.yaml`（与 mockFetch 接口 100% 对应）和 `database_schema.sql`（字段名完全一致）

**关键原则**：不凭空创造接口。`openapi.yaml` 中的每个 path 必须能在前端 mockFetch 中找到对应分支。

**执行指令**：加载 `prompts/phase1_2_contract_extractor.md`。

---

## Phase 2：后端代码生成（垂直切片三层架构）

**目标**：紧贴 `openapi.yaml` 和 `database_schema.sql`，分三个子阶段生成 10000+ 行工业级后端代码。

**核心策略**：不再让一个 Agent 一次性输出 2500 行必截断的代码。改为分三次调度，每次只生成一层：

```
调度者 → GENERATE_MODELS     → 产出 model/*.go (全部 GORM 结构体)
调度者 → GENERATE_REPOSITORIES → 产出 repository/*.go (全部 DAO 层)
调度者 → GENERATE_SERVICES     → 产出 service/*.go + controller/*.go + main.go
```

| 切片 | 触发指令 | 产出 | 核心要求 |
|------|---------|------|---------|
| 2.1 | `GENERATE_MODELS` | `model/*.go` (18个实体) | GORM tags + JSON snake_case tags，与 mockFetch 字段名一致 |
| 2.2 | `GENERATE_REPOSITORIES` | `repository/*.go` (18个 DAO) | 分页查询、条件筛选、批量插入(事务)、ErrRecordNotFound 处理 |
| 2.3 | `GENERATE_SERVICES` | `service/*.go` + `controller/*.go` + `main.go` | 业务聚合、errgroup/WaitGroup 并发、slog 日志、Gin 路由注册 |

**去 AI 化**：每层生成时即加载 `references/deai_rules.md` 强制执行。

**执行指令**：加载 `prompts/phase2_backend_agent.md`，调度者传入对应触发指令。

---

## Phase 3：审查清洗 + 软著交付

### Step 3.1 — 代码审查

**执行方式**：启动审查 Agent

**审查项**：
1. 扫描注释残留（解释性注释、TODO、FIXME）
2. 扫描通用异常捕获
3. 确认总代码行数 >= 10000
4. 确认前端 Mock 数据非空、非占位

**执行指令**：加载 `prompts/phase3_audit_agent.md`。

### Step 3.2 — 软著材料组装

**执行方式**：启动组装 Agent

**交付产物**：

| 产物 | 格式 | 说明 |
|------|------|------|
| 源代码文档 | `.docx` | 前后端代码拼接 → 去空行 → 50行/页 → 取前30页+后30页=60页 |
| 系统截图集 | `.docx` | 每个子页面 1-2 张带数据截图 |
| 操作手册 | `.docx` | 基于截图按模块编写操作流程 |
| 完整源码包 | `.zip` | 全部代码归档 |

**执行指令**：加载 `prompts/phase3_assemble_agent.md`。

---

## 模块完整清单

| 一级模块 | 二级子模块 | 路由 |
|----------|-----------|------|
| 首页 | 态势总览（KPI卡片 + 攻击趋势图 + 风险分布 + 实时告警列表） | `/dashboard` |
| 资产中心 | 主机资产 / 网站资产 / 流量风险 / 攻击面 | `/asset` |
| 主机风险 | 风险台账 / 漏洞扫描 / 周期漏扫 / 配置核查 | `/host-risk` |
| 网站风险 | 网站台账 / 漏洞扫描 / 安全监测 / 渗透测试 | `/web-risk` |
| 攻击事件 | 监测中心 / 白名单 / 阻断策略 / Agent管理 / 威胁告警(8类) / 蜜罐配置(6类) | `/attack` |
| 系统管理 | 系统配置 / 在线升级 / 诊断工具 / 探针部署 / 参数管理 / 操作日志 / 联动策略 | `/system` |

## 技术栈约束

- 前端：纯原生 JS SPA（HTML5 + CSS3 + Vanilla JS + ECharts 5.4.3）
- 预览：本地 8080 端口 HTTP 服务
- 配色：由 Phase 0 选择（默认深蓝系 #021452）
- 无框架依赖、无构建工具

## Skill 文件结构

```
software-copyright-skill/
├── SKILL.md                              ← 本文件
├── prompts/
│   ├── phase0_requirements.md            ← Phase 0 需求确认 + 设计系统生成
│   ├── phase1_0_app_shell.md            ← Step 1.0: App Shell 生成（使用 design-system）
│   ├── phase1_1_frontend_agent.md       ← Step 1.1: View Component 生成（业务+Mock）
│   ├── phase1_1b_visual_linter.md       ← Step 1.1b: ui-ux-pro-max 视觉修饰（精装修）
│   ├── phase1_2_contract_extractor.md   ← Step 1.2: 契约提取
│   ├── phase2_backend_agent.md          ← Phase 2: 后端代码生成
│   ├── phase3_audit_agent.md            ← Step 3.1: 代码审查
│   └── phase3_assemble_agent.md         ← Step 3.2: 软著材料组装
├── references/
│   └── deai_rules.md                    ← 去AI化详细规则
└── templates/
    ├── spec_template.json               ← spec.json 模板
    ├── app_shell_template.html          ← App Shell 骨架模板
    └── view_component_template.js       ← View Component 代码模板
```
