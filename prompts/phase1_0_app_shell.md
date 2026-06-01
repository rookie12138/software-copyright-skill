# Phase 1.0 Prompt: App Shell 基座生成

你是前端架构师。你的任务是搭建整个应用的外壳，为后续 View Components 提供舞台。

## 输入

- `spec.json`：包含模块清单、UI 风格关键词（`ui_keywords`）、设计系统目录路径（`design_system_dir`）
- `design-system/` 全套文件（Phase 0 产出）：
  - `colors.css` — 色彩矩阵
  - `effects.css` — 毛玻璃特效
  - `badges.css` — 状态标签
  - `layers.css` — 卡片层级
  - `table-advanced.css` — 高级表格
  - `echarts-dark-theme.json` — ECharts 暗黑主题

## 核心约束

你必须产出的是**全局基座**，不是任何具体业务页面。

- Sidebar 菜单根据 `spec.json` 动态生成
- 每个路由对应 `<main id="app-content">` 内的挂载区域
- 后续 View Components 只需要实现 `async function renderXxx(container, params)` 即可接入
- **路由器必须集成装饰器调度**：渲染完成后自动调用对应的 `window.decorateXxx(container)`

## 必须产出的文件

| 文件 | 说明 |
|------|------|
| `index.html` | 唯一入口文件，引入所有 View Component JS + Decorator JS |
| `css/variables.css` | CSS 自定义属性 |
| `css/layout.css` | 全局布局 |
| `js/router.js` | SPA 路由器（含装饰器调度映射表） |
| `js/app-shell.js` | 应用初始化入口 |

---

## 各文件详细要求

### 1. index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{产品名称} — {版本号}</title>
    <!-- Phase 0 设计系统 -->
    <link rel="stylesheet" href="design-system/colors.css">
    <link rel="stylesheet" href="design-system/effects.css">
    <link rel="stylesheet" href="design-system/badges.css">
    <link rel="stylesheet" href="design-system/layers.css">
    <link rel="stylesheet" href="design-system/table-advanced.css">
    <!-- App Shell 自有 CSS -->
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/layout.css">
    <!-- ECharts CDN -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</head>
<body>
    <!-- Sidebar -->
    <aside id="sidebar">...</aside>
    <!-- Header + Content -->
    <div id="main-area">
        <header id="header">...</header>
        <main id="app-content"></main>
    </div>
    <!-- Scripts -->
    <!-- 0. 全局配置（双模 API 适配器开关，必须在所有 View Component 之前加载） -->
    <script>window.APP_CONFIG = { USE_MOCK: true };</script>

    <!-- 1. 路由引擎 -->
    <script src="js/router.js"></script>

    <!-- 2. View Components（每个模块一个文件） -->
    <script src="js/views/dashboard.js"></script>
    <script src="js/views/asset.js"></script>
    <script src="js/views/host-risk.js"></script>
    <script src="js/views/web-risk.js"></script>
    <script src="js/views/attack.js"></script>
    <script src="js/views/system.js"></script>

    <!-- 3. Visual Decorators（Phase 1.1b 产出，无侵入 DOM 装饰） -->
    <script src="js/decorators/dashboard_decorator.js"></script>
    <script src="js/decorators/asset_decorator.js"></script>
    <script src="js/decorators/host_risk_decorator.js"></script>
    <script src="js/decorators/web_risk_decorator.js"></script>
    <script src="js/decorators/attack_decorator.js"></script>
    <script src="js/decorators/system_decorator.js"></script>

    <!-- 4. App Shell 初始化 -->
    <script src="js/app-shell.js"></script>
</body>
</html>
```

**Sidebar 要求**：
- 宽度：`var(--sidebar-width)`（默认 240px）
- 顶部：产品 Logo/名称
- 菜单项：遍历 `spec.json` 中 `enabled: true` 的模块
- 当前激活项高亮（根据 `router.getCurrentRoute()`）
- 每个菜单项点击触发 `router.navigate(route)`

**Header 要求**：
- 高度：`var(--header-height)`（默认 56px）
- 左侧：面包屑导航（当前页面名称）
- 右侧：登录用户名 + 全局告警铃铛 + 退出按钮

**app-content 要求**：
- 占据 sidebar 右侧的全部剩余空间
- 内边距 24px
- overflow-y: auto

### 2. css/variables.css

从 `spec.json.css_variables` 逐字复制所有 CSS 变量，追加以下布局相关变量：

```css
:root {
    /* === 从 spec.json 复制所有 UI 变量 === */
    --color-primary: ...;
    /* ... */

    /* === 补充布局变量 === */
    --sidebar-width: 240px;
    --header-height: 56px;
    --content-padding: 24px;
    --card-padding: 20px;
    --card-radius: 8px;

    /* === 图表配色（网络安全主题） === */
    --chart-critical: #f44336;
    --chart-high: #ff9800;
    --chart-medium: #ffeb3b;
    --chart-low: #4caf50;
    --chart-info: #2196f3;
}
```

### 3. css/layout.css

```css
/* 重置 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: var(--font-family);
    background: var(--color-bg-main);
    color: var(--color-text-primary);
    display: flex;
    min-height: 100vh;
}

/* Sidebar */
#sidebar {
    width: var(--sidebar-width);
    background: var(--color-bg-sidebar);
    /* ... 完整样式 */
}
#sidebar .nav-item { cursor: pointer; /* hover, active 态 */ }
#sidebar .nav-item.active { background: var(--color-primary); }

/* Main Area */
#main-area { flex: 1; display: flex; flex-direction: column; }
#header { height: var(--header-height); background: var(--color-bg-card); /* ... */ }
#app-content { flex: 1; padding: var(--content-padding); overflow-y: auto; }

/* 公共组件类名 */
.stat-card { background: var(--color-bg-card); border-radius: var(--card-radius); padding: var(--card-padding); }
.stat-card__value { font-size: 28px; font-weight: 700; color: var(--color-accent); }
.stat-card__label { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
.stat-card__trend { font-size: 12px; }
.stat-card__trend.up { color: var(--color-danger); }
.stat-card__trend.down { color: var(--color-success); }

.data-table { width: 100%; border-collapse: collapse; background: var(--color-bg-card); border-radius: var(--card-radius); overflow: hidden; }
.data-table th { text-align: left; padding: 12px 16px; font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
.data-table td { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.data-table tr:hover td { background: rgba(33,150,243,0.05); }

.chart-container { width: 100%; aspect-ratio: 16/9; background: var(--color-bg-card); border-radius: var(--card-radius); }

.btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-danger { background: var(--color-danger); color: #fff; }
.btn-outline { background: transparent; border: 1px solid var(--color-accent); color: var(--color-accent); }

.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--color-text-primary); }
.sub-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; }
.sub-tab { padding: 10px 20px; cursor: pointer; font-size: 13px; color: var(--color-text-secondary); border-bottom: 2px solid transparent; }
.sub-tab.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
```

### 4. js/router.js

```javascript
/**
 * Hash-based SPA Router.
 * Supports route registration, navigation, and parameter passing.
 */
const Router = {
    _routes: {},
    _currentRoute: null,
    _currentParams: null,
    /** 路由 → 视觉装饰器映射表（Phase 1.1b 产出） */
    _decoratorMap: {},

    on(route, handler) {
        this._routes[route] = handler;
    },

    navigate(route, params) {
        this._currentRoute = route;
        this._currentParams = params || {};
        window.location.hash = route;
        this._render();
    },

    getCurrentRoute() {
        return this._currentRoute;
    },

    getCurrentParams() {
        return this._currentParams || {};
    },

    _render: async function() {
        var container = document.getElementById('app-content');
        container.innerHTML = '';

        var handler = this._routes[this._currentRoute];
        if (handler) {
            await handler(container, this._currentParams);
        }

        /* ==== 视觉装饰器调度 ==== */
        var decorator = this._decoratorMap[this._currentRoute];
        if (decorator && typeof decorator === 'function') {
            decorator(container);
        }

        this._updateSidebar();
    },

    _updateSidebar() {
        document.querySelectorAll('#sidebar .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.route === this._currentRoute) {
                item.classList.add('active');
            }
        });
    },

    init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || '/dashboard';
            // 提取路径和查询参数
            const [path, queryString] = hash.split('?');
            const params = {};
            if (queryString) {
                queryString.split('&').forEach(pair => {
                    const [k, v] = pair.split('=');
                    params[decodeURIComponent(k)] = decodeURIComponent(v || '');
                });
            }
            this._currentRoute = path;
            this._currentParams = params;
            this._render();
        });

        // 初始路由
        if (!window.location.hash) {
            this.navigate('/dashboard');
        } else {
            window.dispatchEvent(new Event('hashchange'));
        }
    }
};

// 导出全局引用，供 View Component 使用
window.router = Router;
```

### 5. js/app-shell.js

**这是最容易遗漏的一步。没有 `Router.on()` 注册，所有页面都是空白的！**

```javascript
/**
 * App Shell Initializer.
 * 注册路由映射、装饰器映射，启动路由器并渲染侧边栏。
 */
(function() {
    /* ==== 1. 注册核心业务路由（路由 → 渲染函数） ==== */
    /* 函数名必须与 Phase 1.1 中 View Component 暴露的全局函数名严格一致 */
    Router.on('/dashboard', window.renderDashboard);
    Router.on('/asset',     window.renderAssetCenter);
    Router.on('/host-risk', window.renderHostRisk);
    Router.on('/web-risk',  window.renderWebRisk);
    Router.on('/attack',    window.renderAttackEvent);
    Router.on('/system',    window.renderSystem);

    /* ==== 2. 注册 Phase 1.1b 视觉装饰器映射 ==== */
    Router._decoratorMap = {
        '/dashboard': window.decorateDashboard,
        '/asset':     window.decorateAsset,
        '/host-risk': window.decorateHostRisk,
        '/web-risk':  window.decorateWebRisk,
        '/attack':    window.decorateAttackEvent,
        '/system':    window.decorateSystem
    };

    /* ==== 3. 渲染侧边栏菜单 ==== */
    // 从 spec.json 中读取 enabled:true 的模块，动态生成 #sidebar-menu 的 HTML
    var sidebarMenu = document.getElementById('sidebar-menu');
    var enabledModules = [{id:'dashboard',name:'首页',route:'/dashboard',icon:'home'},
                          {id:'asset',name:'资产中心',route:'/asset',icon:'server'},
                          {id:'host-risk',name:'主机风险',route:'/host-risk',icon:'shield'},
                          {id:'web-risk',name:'网站风险',route:'/web-risk',icon:'globe'},
                          {id:'attack',name:'攻击事件',route:'/attack',icon:'crosshair'},
                          {id:'system',name:'系统管理',route:'/system',icon:'settings'}];

    var menuHtml = '';
    enabledModules.forEach(function(mod) {
        menuHtml += '<div class="nav-item" data-route="' + mod.route + '" data-icon="' + mod.icon + '">';
        menuHtml += '<span class="nav-item__icon">' + mod.icon + '</span>';
        menuHtml += '<span class="nav-item__label">' + mod.name + '</span>';
        menuHtml += '</div>';
    });
    sidebarMenu.innerHTML = menuHtml;

    // 侧边栏点击事件绑定
    var navItems = sidebarMenu.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var route = this.getAttribute('data-route');
            Router.navigate(route);
        });
    });

    /* ==== 4. 启动路由器 ==== */
    Router.init();
})();
```

### 补充排查：如果页面依然空白

加上了路由注册后仍空白，在浏览器按 `F12` 打开控制台，看报错：

**1. `Uncaught ReferenceError: renderDashboard is not defined`**
- 原因：`js/views/dashboard.js` 未生成，或 `index.html` 中 `<script src>` 路径写错
- 对策：检查 `frontend/js/views/` 目录下对应的 JS 文件是否存在

**2. `SyntaxError: Unexpected identifier` / `Unexpected string`**
- 原因：某个 `js/views/*.js` 字符串拼接漏了引号或分号，整个文件语法崩溃
- 对策：点击 Console 报错中的文件名和行号，手动补缺失的引号

---

## 生成后验证清单

在交付前，确认以下每一项：

- [ ] Sidebar 菜单项数量与 `spec.json` 中 `enabled: true` 的模块数一致
- [ ] 每个菜单项的 `data-route` 属性值正确
- [ ] Header 包含标题、用户名、告警铃铛
- [ ] `<main id="app-content">` 存在且为空白容器
- [ ] CSS 变量全部来自 `spec.json`，无自由发挥
- [ ] 公共类名 `.stat-card`、`.data-table`、`.chart-container`、`.sub-tabs` 已定义
- [ ] **`app-shell.js` 中 `Router.on()` 注册了全部 6 条路由**（缺一条 = 一个页面空白）
- [ ] **`Router._decoratorMap` 中注册了全部 6 个装饰器函数**（缺一条 = 一个页面无视觉装饰）
- [ ] `window.router` 全局可访问
- [ ] 浏览器 Console 无 `ReferenceError` 或 `SyntaxError` 报错
