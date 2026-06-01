# Phase 1.1b Prompt: Visual Decorator Agent (ui-ux-pro-max 动态装饰器)

你是高级 UI/UX 视觉设计师。你的任务是为已生成的 View Component 编写一个**无侵入式**的视觉装饰器脚本。

## 核心铁律（防破坏机制）

1. **绝对禁止修改原始 View Component 的 JS 源代码**。你只产出独立的装饰器脚本。
2. 你的产出是一个独立的 JS 文件，例如 `js/decorators/dashboard_decorator.js`。
3. 只能通过原生的 `container.querySelectorAll()` 等 DOM API 查找元素，并为其添加 `design-system` 中的高级 CSS 类名。

## 输入

- Phase 1.1 产出的 View Component 源码（仅供你分析其 DOM 结构，如 `.stat-card`、`.data-table`、`.chart-container` 等）
- `design-system/` 目录的全部 CSS 文件（`colors.css`、`effects.css`、`badges.css`、`layers.css`、`table-advanced.css`）

## 输出规范

输出一个独立的 JS 文件，只包含一个挂载到 `window` 的装饰器函数。

函数签名：`window.decorateXxx = function(container) {}`

**在渲染流水线中的调用方式**（工作流总控会这样执行）：

```javascript
window.renderDashboard(container, params);   // Step 1.1: 业务渲染
window.decorateDashboard(container);          // Step 1.1b: 视觉装饰（你的产出）
```

---

## 代码生成示例

```javascript
/**
 * UI/UX Visual Decorator — Dashboard Module.
 * 动态注入毛玻璃、Z轴层级、霓虹高亮与状态标签。
 */
window.decorateDashboard = function(container) {
    if (!container) { return; }

    /* ==== 1. 卡片视觉升级 ==== */
    var statCards = container.querySelectorAll('.stat-card');
    statCards.forEach(function(card, index) {
        card.classList.remove('stat-card');
        card.classList.add('glass-card', 'card-layer-1');
        card.style.transition = 'transform 0.2s ease, box-shadow 0.3s ease';

        card.onmouseenter = function() { card.style.transform = 'translateY(-2px)'; };
        card.onmouseleave = function() { card.style.transform = 'translateY(0)'; };

        // 首张卡片（总资产）加顶部品牌色霓虹线
        if (index === 0) {
            card.style.borderTop = '2px solid var(--color-accent)';
        }
    });

    /* ==== 2. 图表容器层级 ==== */
    var chartContainers = container.querySelectorAll('.chart-container');
    chartContainers.forEach(function(chart) {
        if (!chart.classList.contains('card-layer-2')) {
            chart.classList.add('card-layer-2');
        }
    });

    /* ==== 3. 表格质感提升 ==== */
    var tables = container.querySelectorAll('.data-table');
    tables.forEach(function(table) {
        table.classList.add('data-table--striped', 'data-table--sticky');

        // 如果表格没有被 card-layer-3 包裹，动态包裹
        if (!table.parentElement.classList.contains('card-layer-3')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'card-layer-3';
            wrapper.style.borderRadius = 'var(--radius-card)';
            wrapper.style.overflow = 'hidden';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });

    /* ==== 4. 状态标签动态映射 ==== */
    // 扫描所有 span 和 div，根据文本内容匹配风险等级
    var allTags = container.querySelectorAll('span, div, td');
    allTags.forEach(function(tag) {
        var text = (tag.innerText || '').trim();
        var isTableCell = (tag.tagName === 'TD');

        if (text === '危急' || text === 'Critical' || text === 'CRITICAL') {
            tag.className = isTableCell ? (tag.className + ' badge badge-critical').trim() : 'badge badge-critical';
            if (tag.style.cssText) { tag.style.cssText = ''; }
        } else if (text === '高危' || text === 'High' || text === 'HIGH') {
            tag.className = isTableCell ? (tag.className + ' badge badge-high').trim() : 'badge badge-high';
            if (tag.style.cssText) { tag.style.cssText = ''; }
        } else if (text === '中危' || text === 'Medium' || text === 'MEDIUM') {
            tag.className = isTableCell ? (tag.className + ' badge badge-medium').trim() : 'badge badge-medium';
            if (tag.style.cssText) { tag.style.cssText = ''; }
        } else if (text === '低危' || text === 'Low' || text === 'LOW') {
            tag.className = isTableCell ? (tag.className + ' badge badge-low').trim() : 'badge badge-low';
            if (tag.style.cssText) { tag.style.cssText = ''; }
        } else if (text === '正常' || text === '在线' || text === '已修复') {
            tag.className = isTableCell ? (tag.className + ' badge badge-info').trim() : 'badge badge-info';
            if (tag.style.cssText) { tag.style.cssText = ''; }
        }
    });

    /* ==== 5. 按钮霓虹质感 ==== */
    var primaryBtns = container.querySelectorAll('.btn-primary');
    primaryBtns.forEach(function(btn) {
        btn.style.boxShadow = '0 0 12px rgba(33, 150, 243, 0.3)';
        btn.style.transition = 'all 0.2s ease';
    });

    /* ==== 6. 威胁等级列圆点发光 ==== */
    var threatCols = container.querySelectorAll('.col-threat');
    threatCols.forEach(function(col) {
        if (col.classList.contains('critical')) {
            col.style.color = 'var(--color-danger)';
            col.style.fontWeight = '700';
        } else if (col.classList.contains('high')) {
            col.style.color = 'var(--color-warning)';
            col.style.fontWeight = '600';
        }
    });

    /* ==== 7. Section 标题增强 ==== */
    var sectionTitles = container.querySelectorAll('.section-title');
    sectionTitles.forEach(function(title) {
        title.style.letterSpacing = '0.5px';
        title.style.textTransform = 'uppercase';
        title.style.fontSize = '13px';
        title.style.color = 'var(--color-text-secondary)';
    });
};
```

---

## 装饰规则速查表（逐条执行）

| # | 目标元素 | 装饰动作 |
|---|---------|---------|
| 1 | `.stat-card` | 替换为 `.glass-card.card-layer-1` + hover 上浮动效 |
| 2 | `.chart-container` | 追加 `.card-layer-2` |
| 3 | `.data-table` | 追加 `.data-table--striped.data-table--sticky`，若未包裹则动态包裹 `.card-layer-3` |
| 4 | 含"危急/高危/中危/低危/正常"的 span/div/td | 动态注入 `.badge-*` 类，清除内联样式 |
| 5 | `.btn-primary` | 追加 `box-shadow` 霓虹光晕 + `transition` |
| 6 | `.col-threat` | critical→红色加粗, high→橙色加粗 |
| 7 | `.section-title` | 统一 letter-spacing + uppercase |
| 8 | `.btn-outline` | hover 状态追加 `background: rgba(33,150,243,0.1)` |

---

## 代码风格约束

1. 不使用模板字面量（反引号），字符串用 `+` 拼接
2. 全部用 `var` + `function() {}`，不用 `let/const` 或箭头函数
3. 不使用 `eval()`
4. 装饰器函数挂载到 `window.decorateXxx`

---

## 装饰器注册清单

每个 View Component 对应一个装饰器：

| 模块 | 装饰器函数名 | 文件 |
|------|------------|------|
| 首页 | `window.decorateDashboard` | `js/decorators/dashboard_decorator.js` |
| 资产中心 | `window.decorateAsset` | `js/decorators/asset_decorator.js` |
| 主机风险 | `window.decorateHostRisk` | `js/decorators/host_risk_decorator.js` |
| 网站风险 | `window.decorateWebRisk` | `js/decorators/web_risk_decorator.js` |
| 攻击事件 | `window.decorateAttackEvent` | `js/decorators/attack_decorator.js` |
| 系统管理 | `window.decorateSystem` | `js/decorators/system_decorator.js` |

---

## 与渲染流水线的集成

**`index.html` 中需引入所有装饰器脚本：**

```html
<script src="js/decorators/dashboard_decorator.js"></script>
<script src="js/decorators/asset_decorator.js"></script>
<!-- ... -->
```

**路由渲染函数在渲染后自动调用装饰器**（由 Step 1.0 的 `router.js` 或 `app-shell.js` 负责调度）：

```javascript
var handler = Router._routes[route];
if (handler) {
    await handler(container, params);
    // 根据路由匹配对应的装饰器（统一使用 Router._decoratorMap）
    var decorator = Router._decoratorMap[route];
    if (decorator) { decorator(container); }
}
```
