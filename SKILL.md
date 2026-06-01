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
- 前端驱动后端：先生成前端 → 从 `apiFetch` Mock 分支提取 API 契约 → 后端紧贴契约生成
- 双模 API 适配器：`USE_MOCK=true` 时本地算法化生成海量数据，`USE_MOCK=false` 时发起真实 `fetch()`
- 算法化数据引擎：种子数组 + for 循环 + Math.sin()/random() → 极低 Token 消耗生成 30-60 条工业级数据
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

**⚠ spec.json 子模块名称对齐**：`spec.json` 中每个模块的 `sub_modules` 名称必须严格遵循 `references/page_*.md` 中的章节标题（如"风险台账"而非"漏洞列表"，"深度漏洞扫描引擎"而非"漏洞扫描"）。

**Step 3 — ui-ux-pro-max 的职责是"定调子"，不碰业务代码：**

| 产出物 | 文件路径 | 说明 |
|--------|---------|------|
| 色彩矩阵 CSS 变量 | `design-system/colors.css` | 主色 → 辅助色 → 中性色，每色 9 级透明度映射 |
| 玻璃拟态特效 CSS | `design-system/effects.css` | `.glass-card`、`.glass-panel`、`.glass-sidebar` 等毛玻璃类 |
| 状态标签系统 | `design-system/badges.css` | `.badge-critical`、`.badge-high`、`.badge-warning`、`.badge-info` 渐变背景 |
| ECharts 暗黑主题 | `design-system/echarts-dark-theme.js` | 完整 ECharts 主题 JS（挂载为 window.ECHARTS_DARK_CYBER_THEME），配色与全局变量一致 |
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

**输入**：`spec.json` + App Shell 已生成的 `index.html`、`css/variables.css`、`js/router.js` + **`references/page_*.md` 业务内容规格**

**⚠ 内容与样式双轨驱动**：
- **样式**（怎么画）由 `ui-ux-pro-max` 设计系统决定（颜色、间距、毛玻璃效果）
- **内容**（画什么）由 `references/page_*.md` 业务规格决定（子Tab名称、KPI指标、表格列、图表类型、特殊业务字段如 ESI/暗链/OOB）

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
3. **强制双模 + 算法化数据解耦（apiFetch 契约）**：
   - `USE_MOCK=true` → 算法化动态生成海量 Mock 数据（for 循环 + 种子数组 + Math.sin/random）
   - `USE_MOCK=false` → 发起真实 `fetch()` HTTP 请求
   - 严禁手写 JSON 数组、严禁 `// ... 省略` 注释
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

### Step 1.1b — 视觉装饰器注入（DOM Decorator 模式）

**目标**：生成无侵入式的 DOM 装饰器脚本，在业务渲染完成后动态注入高级 CSS 类名。

**核心设计**：**不修改原始 View Component 代码**。装饰器是独立的 JS 文件，通过标准 DOM API 查找元素并注入 class。

```
Step 1.1: renderXxx(container, params)     → 纯业务渲染
Step 1.1b: decorateXxx(container)           → 视觉装饰（由 ui-ux-pro-max 产出）
```

**产出文件**：`js/decorators/{module}_decorator.js`（每个模块一个装饰器）

**装饰器函数签名**：`window.decorateXxx = function(container) {}`

**装饰维度**：

| # | 目标元素 | 装饰动作 |
|---|---------|---------|
| 1 | `.stat-card` | 替换为 `.glass-card.card-layer-1` + hover 悬浮微动效 |
| 2 | `.data-table` | 追加 `.data-table--striped.data-table--sticky`，动态包裹 `.card-layer-3` |
| 3 | 含"危急/高危/正常"等文本的 span | 动态注入 `.badge-*` 类，清除旧内联样式 |
| 4 | `.btn-primary` | 追加 `box-shadow` 霓虹光晕 |
| 5 | `.col-threat` | critical→红色加粗，high→橙色加粗 |

**路由器集成**（在 `router.js` 的 `_render` 中，渲染后自动调用对应装饰器）：

```javascript
var decoratorMap = {
    '/dashboard': window.decorateDashboard,
    '/asset':     window.decorateAsset,
    // ...
};
var handler = Router._routes[route];
if (handler) {
    await handler(container, params);
    var decorator = decoratorMap[route];
    if (decorator) { decorator(container); }
}
```

**执行指令**：加载 `prompts/phase1_1b_visual_linter.md`。

---

### Step 1.2 — API 契约自动提取 (apiFetch Mock 分支静态分析)

**目标**：全自动扫描前端 `apiFetch` Mock 分支代码，提取 API 端点、响应 Schema 和数据库表结构。

**执行方式**：启动契约提取 Agent

**提取逻辑**：
1. 扫描 `js/views/*.js` 中所有 `url.includes('...')` 分支 → 提取全部 API 端点路径
2. 解析每个分支的 `return { code, data: {...} }` → 提取响应 Schema（字段名+类型）
3. 从字段名和值反推数据库表结构（snake_case 字段 → MySQL 列）
4. 输出 `openapi.yaml`（与 apiFetch Mock 分支 100% 对应）和 `database_schema.sql`（字段名完全一致）

**关键原则**：不凭空创造接口。从 `apiFetch` 的 Mock 分支中提取。`openapi.yaml` 中的每个 path 必须能在前端 `apiFetch` Mock 分支中找到对应 `url.includes()`。

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
| 2.1 | `GENERATE_MODELS` | `model/*.go` (18个实体) | GORM tags + JSON snake_case tags，与前端 apiFetch Mock 数据字段名一致 |
| 2.2 | `GENERATE_REPOSITORIES` | `repository/*.go` (18个 DAO) | 分页查询、条件筛选、批量插入(事务)、ErrRecordNotFound 处理 |
| 2.3 | `GENERATE_SERVICES` | `service/*.go` + `controller/*.go` + `main.go` | 业务聚合、errgroup/WaitGroup 并发、slog 日志、Gin 路由注册 |

**去 AI 化**：每层生成时即加载 `references/deai_rules.md` 强制执行。

**执行指令**：加载 `prompts/phase2_backend_agent.md`，调度者传入对应触发指令。

---

## Phase 3：自动化审查 + 软著交付（Python 脚本化）

### Step 3.1 — 代码审计（Python 静态分析脚本）

**目标**：生成 `audit_tool.py`，在本地 Python 环境运行，精确执行代码质量审查。

**不再让 LLM 数行号或徒手审代码。改为生成自动化脚本。**

**脚本检查项**：
1. 精确行数统计（排除空行和解释性注释，**保留 Docstring**——大写字母开头/`@`标签/`/** */` 块注释，判断 >= 10000）
2. Go 代码通用异常捕获扫描（`if err != nil { return err }` 无日志版本，向前看4行检测）
3. 解释性注释正则扫描（20 个中文动词模式：定义/获取/设置/创建/删除/更新/查询/连接/初始化/遍历/判断/计算/返回/声明/赋值/配置/注册/处理/调用/发送/接收/解析/格式化/实例化/打开/关闭）
4. 前端 apiFetch Mock 数据充分性检查（算法化生成模式下检测 for 循环 + 种子数组存在性）
5. 路由联动完整性检查（Router.on 注册 + router.navigate 目标 + window.renderXxx 定义三方交叉验证）

**退出码**：全部 PASS → `sys.exit(0)`，任一 FAIL → `sys.exit(1)`。

**执行指令**：加载 `prompts/phase3_audit_agent.md`。

### Step 3.2 — 软著材料组装（python-docx 自动化脚本）

**目标**：生成 `build_copyright_docs.py`，利用 `python-docx` 完成精确排版。

**不再让 LLM 手工拼接文本排 Word 文档。改为生成自动化打包脚本。**

**脚本功能**：
1. **`source_code.docx`**：取前 1500 行（前 30 页）+ 后 1500 行（后 30 页），Courier New 9pt，精确 50 行/页。**含去AI化处理**：自动剥离解释性注释、注入工程师口吻的文件头描述（HUMAN_DESCRIPTIONS）和层级描述
2. **`screenshots.docx`**：遍历 `./screenshots` 目录，每页 1 张图 + 中文描述标题 + 分页符（16 张截图标准映射表）
3. **`user_manual.docx`**：5 章操作手册（首页/资产测绘/主机检测/网站检测/攻击事件），每章 2-6 个子节，含详细功能描述文案
4. **`source_code.zip`**：完整源码打包 + 自动生成 README.txt
5. **`manifest.json`**：构建清单，记录去AI化处理标记和产出物路径

**产物输出到 `output/` 目录。**

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
