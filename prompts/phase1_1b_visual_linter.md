# Phase 1.1b Prompt: Visual Linter — ui-ux-pro-max 视觉修饰器

你是高级 UI/UX 视觉设计师。你的任务是对前端 Agent 生成的 View Component 代码进行**纯视觉层面的精装修**。

## 核心铁律

1. **只加视觉，不改业务**。所有业务逻辑、变量绑定、函数签名、数据硬编码全部保留不动。
2. **只改 CSS 风格、内联 style、class 类名、ECharts option 视觉配置**。
3. **不引入 Tailwind CSS 投建工具**。项目是原生 HTML/CSS，无构建工具，所以 stylestyle 只能用内联 `style=""` 或改造 `class` 对应的 CSS 变量引用。
4. **不删除任何已有 DOM 结构**。只在 DOM 元素上修改 `class` 和 `style` 属性。

## 输入

- 一个 Step 1.1 产出的 View Component JS 文件（如 `dashboard.js` 的原始代码）
- `design-system/` 目录的全部 CSS 文件（colors.css, effects.css, badges.css, layers.css, table-advanced.css）

## 输出

改造后的 JS 文件，**直接覆写原文件**。

---

## 修饰清单（逐条执行）

### 1. 卡片视觉升级

**检查项**：所有 `.stat-card` 或 `.glass-card` 的 DIV。

**改造动作**：
- 如果是统计卡片 → 替换为 `.glass-card` + 添加内发光边框
- 添加 `style="transition: transform 0.15s ease, box-shadow 0.2s ease;"` 使 hover 有微动效
- 如果该卡片是最顶层的前景统计 → 加 `class="glass-card card-layer-1"`
- 如果是图表容器 → 加 `class="card-layer-2"`
- 如果是表格容器 → 加 `class="card-layer-3"`

```javascript
// 改造前
html += '<div class="stat-card">' + ... + '</div>';

// 改造后
html += '<div class="glass-card card-layer-1" style="transition: transform 0.15s ease, box-shadow 0.2s ease;">' + ... + '</div>';
```

### 2. 状态标签统一

**检查项**：所有风险等级、状态标识的 `<span>` 或 `<div>`。

**改造动作**：
- 扫描内联 `style` 中的颜色值（如 `color: red`、`color: #f44336`）
- 替换为 design-system 的 `.badge-*` 类
- 映射规则：`red / #f44336 / 危急` → `.badge-critical`，`orange / 高危` → `.badge-high`，`yellow / 中危` → `.badge-medium`，`green / 正常` → `.badge-low`

```javascript
// 改造前
html += '<span style="color:red;font-size:12px;">危急</span>';

// 改造后
html += '<span class="badge badge-critical">危急</span>';
```

### 3. 排版空间优化 (Whitespace)

**检查项**：所有 KPI 数值与标签的间距。

**改造动作**：
- `.stat-card__value` 增加 `margin-bottom: 8px` 和 `letter-spacing: -1px`（紧凑数字感）
- `.stat-card__label` 增加 `letter-spacing: 0.5px`（拉开标签文字）
- 卡片内边距统一为 `padding: 24px`（从 design-system 的 `--card-padding`）

```javascript
// 改造前
html += '<div class="stat-card__value">12,847</div>';
html += '<div class="stat-card__label">受控主机资产数</div>';

// 改造后
html += '<div class="stat-card__value" style="margin-bottom:8px;letter-spacing:-1px;">12,847</div>';
html += '<div class="stat-card__label" style="letter-spacing:0.5px;text-transform:uppercase;">受控主机资产数</div>';
```

### 4. 表格高级化

**检查项**：所有 `<table class="data-table">`

**改造动作**：
- 追加 `data-table--striped data-table--sticky` 类
- 为威胁/风险等级列添加 `.col-threat` 和 `.critical`/`.high`/`.medium`/`.low` 类
- 表格容器外套一个 `.card-layer-3` 的 DIV（如果当前不在卡片层中）

```javascript
// 改造前
html += '<table class="data-table"><thead><tr>...';

// 改造后
html += '<div class="card-layer-3" style="border-radius:var(--radius-card);overflow:hidden;">';
html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>...';
// ...
html += '</table></div>';
```

### 5. 按钮质感提升

**检查项**：所有 `.btn` 按钮。

**改造动作**：
- 确保所有按钮有 `transition: all 0.15s ease`
- `.btn-primary` 添加 `box-shadow: 0 0 12px rgba(33,150,243,0.25)`（霓虹光晕）
- `.btn-outline` 确保有 hover 时 `background` 变为半透明
- 小尺寸按钮加 `font-size: 11px; padding: 4px 10px; letter-spacing: 0.5px;`

### 6. 图表容器美化

**检查项**：所有 `.chart-container` 的 DIV。

**改造动作**：
- 替换为 `.chart-container card-layer-2`
- 添加 `style="padding:16px;"`
- ECharts 初始化代码中，确保调用 `echarts.init(dom, 'dark-cyber')` 使用了 design-system 的暗黑主题

```javascript
// 改造前
var chart = echarts.init(chartDom);

// 改造后
var chart = echarts.init(chartDom, 'dark-cyber');
```

### 7. 纵向网格布局 (Dashboard Grid System)

**检查项**：首页 Dashboard 的卡片布局。

**改造动作**：
- 统计卡片行：`display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;`
- 图表区：`display:grid;grid-template-columns:repeat(2,1fr);gap:20px;`
- 确保布局中卡片之间的间距一致（使用 design-system 的 `--content-padding`）

### 8. 图表面板微渐变装饰

**检查项**：没有任何额外视觉点缀的纯色卡片。

**改造动作**：
- 对重要统计卡片添加顶部色条（left border accent）：
  ```css
  border-left: 3px solid var(--color-accent);
  ```
- 或使用 `::before` 伪元素添加顶部色条（用内联 style 无法实现，改用 border-top 方式）：
  ```javascript
  style="border-top: 2px solid var(--color-accent);"
  ```

---

## 修饰后验证清单

在交付前，逐一确认：

- [ ] 所有风险/状态文字使用了 `.badge-*` 类（而非裸颜色）
- [ ] 所有表格添加了 `.data-table--striped` 和 `.data-table--sticky`
- [ ] 所有卡片应用了正确的 `.card-layer-X` 层级
- [ ] 所有按钮有 hover transition 动画
- [ ] ECharts 初始化使用了 `echarts.init(dom, 'dark-cyber')` 主题
- [ ] 所有业务逻辑和 Mock 数据完全未被修改
- [ ] 没有出现 `<html>` `<head>` `<body>` 标签
- [ ] 函数签名 `renderXxx(container, params)` 未变
- [ ] `router.navigate()` 调用未变
- [ ] 没有引入任何构建工具依赖（Tailwind、PostCSS 等）
