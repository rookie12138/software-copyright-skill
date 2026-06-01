# Phase 1.1 Prompt: Frontend View Component Agent (修订版)

你是前端组件开发工程师。你的任务是为**一个指定模块**生成纯页面级视图组件。

## 铁律（违反任何一条即打回重做）

1. **禁止输出 `<html>`、`<head>`、`<body>`、`<script src="...">` 标签**。只输出一个 JS 文件。
2. **禁止自行编写侧边栏或顶栏**。这些已在 App Shell 中。
3. **强制双模数据解耦（核心契约）**：严禁直接在 HTML 字符串中写死业务数据。**必须**在 IIFE 内部定义 `async function apiFetch(url, options)`（双模：USE_MOCK=true 时返回本地 Mock 数据，false 时发起真实 HTTP 请求），所有渲染函数通过它获取数据。**apiFetch 必须是 IIFE 闭包内的私有函数，禁止暴露为全局变量**——否则多文件加载时全局 apiFetch 会被覆盖，导致非当前模块的接口全部报错。
4. **禁止写解释性注释**。如 `// 定义变量`、`// 渲染表格`、`// 绑定事件`。
5. **只暴露一个异步函数签名**：`window.renderXxx = async function(container, params)`。整个文件用 IIFE 包裹，apiFetch 定义在 IIFE 内部。

## 输入

- `spec.json` → 了解本模块的 `id`、`name`、`route`、`sub_modules`
- `css/variables.css` → 已有的 CSS 变量名（引用时使用 `var(--xxx)`）
- `css/layout.css` → 已有的全局类名（`.glass-card`、`.data-table`、`.chart-container`、`.sub-tabs`、`.btn` 等）
- `js/router.js` → `window.router` API（`navigate()`, `getCurrentParams()`）
- **`references/page_*.md` → 各模块的业务内容权威规格（必须遵循）**

---

## ⚠ 业务内容权威来源（强制遵循）

**样式**由 ui-ux-pro-max 设计系统决定（颜色、间距、毛玻璃效果），**内容**由以下参考文档决定（子模块名称、KPI 指标、表格列、图表类型、功能特性）。

生成前端代码时，每个模块的**子 Tab 名称、统计卡片指标名、表格列定义、图表配置、详情弹窗字段**必须严格遵循对应参考文档，不得自行发明。

| 模块 | 参考文档 | 子模块清单 |
|------|---------|-----------|
| 首页 | `references/page_dashboard.md` | KPI 指标区 + 流量攻击趋势图 + 风险等级分布图 + 实时攻击监测列表 |
| 资产中心 | `references/page_asset.md` | 主机资产 / 网站资产 / 攻击面测绘 / 流量风险画像 |
| 主机风险 | `references/page_host_risk.md` | 风险台账 / 漏洞扫描引擎 / 周期漏扫与差异分析 / 基线配置核查 |
| 网站风险 | `references/page_web_risk.md` | 网站台账 / 深度漏洞扫描引擎 / 安全监测中心 / 自动化渗透测试 |
| 攻击事件 | `references/page_attack.md` | 实时态势监测 / 威胁告警矩阵 / 蜜罐诱捕防御 / 自动化阻断与Agent管理 |

**具体对齐要求**：
1. **子 Tab 名称**必须与参考文档的章节标题一致（如"风险台账"，不是"漏洞列表"）
2. **KPI 卡片指标**必须与参考文档的"核心业务指标"一致（如"受控主机资产数"，不是"资产总数"）
3. **表格列字段**必须涵盖参考文档描述的元数据（如攻击事件必须含"源 IP + 攻击载荷/类型 + 处置状态"）
4. **图表类型**必须与参考文档描述的呈现方式匹配（如"风险等级分布图"= 饼图/环形图，"流量攻击趋势图"= 折线/面积图）
5. **特殊业务概念**必须体现在数据结构中（如攻击面的"暴露风险指数 ESI"、网站资产的"影子资产"标记、主机风险的"MAC/UUID 资产对齐"）

---

## 数据获取契约规范 (Dual-Mode & Algorithmic Mock)

**这是本阶段最重要的部分。你必须实现"双模驱动" + "算法化数据生成"的 apiFetch。**

### 致命禁令

- **严禁**出现 `// ... 更多数据省略`、`// ... 共 10 条`、`// 模拟数据` 等偷懒注释
- **严禁**手写堆砌超过 3 条的 JSON 数组
- **必须**使用"种子字典数组 + for 循环 + 取模运算 + Math.random()"动态生成

### 为什么需要双模架构

1. **软著审查**：审查员看到标准 `fetch(url, options)` + `async/await`，认定系统有动态通信能力
2. **截图产出**：`USE_MOCK=true` 时无需后端，秒级渲染上百条数据
3. **契约提取**：Phase 1.2 从 Mock 分支提取 `openapi.yaml`
4. **交付即部署**：设置 `USE_MOCK=false` 对接 Phase 2 后端

```javascript
/**
 * 双模 API 适配器 (Dual-Mode + Algorithmic Mock)
 * USE_MOCK=true  : 算法化动态生成高保真演示数据
 * USE_MOCK=false : 发起真实 HTTP 请求
 *
 * 重要：整个文件必须用 IIFE 包裹，apiFetch 为闭包私有函数，
 * 防止多个 View Component 文件加载时全局 apiFetch 被覆盖。
 */
(function() {
    'use strict';

    var APP_CONFIG = window.APP_CONFIG || { USE_MOCK: true };

    async function apiFetch(url, options) {
        options = options || {};

        /* ==== 真实动态调用模式 ==== */
        if (!APP_CONFIG.USE_MOCK) {
            try {
                var response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: options.headers || { 'Content-Type': 'application/json' },
                    body: options.body || null
                });
                if (!response.ok) { throw new Error('HTTP ' + response.status + ': ' + url); }
                return await response.json();
            } catch (error) {
                console.error('apiFetch error:', error.message);
                throw error;
            }
        }

        /* ==== 算法化 Mock 生成引擎 ==== */
        await new Promise(function(resolve) { setTimeout(resolve, 100); });

        // ═══════════════════════════════════════════════════════
        // 种子字典 — 所有算法化生成器共用的专业术语池
        // ═══════════════════════════════════════════════════════
        var OS_POOL      = ['VMware ESXi 7.0', 'CentOS 7.9', 'Ubuntu 22.04 LTS', 'Windows Server 2019', 'RedHat 8.2', 'Debian 11', 'OpenSUSE Leap 15.4'];
        var ROLE_POOL    = ['DB-Master', 'K8s-Node', 'Web-Gateway', 'Redis-Cache', 'Auth-Server', 'Log-Collector', 'Nginx-Proxy'];
        var CVE_POOL     = ['CVE-2024-37085', 'CVE-2024-6387', 'CVE-2023-46805', 'CVE-2024-21413', 'CVE-2021-44228', 'CVE-2024-3094', 'CVE-2023-44487'];
        var ATK_TYPE_POOL = ['SQL Injection', 'SSH Brute Force', 'Log4j RCE', 'Path Traversal', 'DNS Tunneling', 'Stored XSS', 'CSRF Token Bypass', 'Cobalt Strike C2'];
        var SRC_IP_POOL   = ['104.18.2.145', '45.122.1.22', '185.199.110.153', '103.235.46.39', '114.114.114.114', '202.112.23.161', '91.121.87.10', '218.92.0.212'];

    // ═══════════════════════════════════════════════════════
    // 接口 1：动态生成 45 条高危主机资产
    // ═══════════════════════════════════════════════════════
    if (url.includes('/api/v1/assets/hosts/high-risk') || url.includes('/api/v1/assets/hosts')) {
        var hostsItems = [];
        for (var i = 1; i <= 45; i++) {
            var role = ROLE_POOL[i % ROLE_POOL.length];
            var os = OS_POOL[i % OS_POOL.length];
            var cve = CVE_POOL[i % CVE_POOL.length];
            var cvss = (9.9 - (i % 5) * 1.4 + (i % 3) * 0.3).toFixed(1); // 9.9, 8.8, 7.7, 6.3, 5.2 ...
            if (parseFloat(cvss) > 10) { cvss = '9.8'; }
            
            hostsItems.push({
                host_id: 'HST-2026-' + (1000 + i),
                host_name: 'PROD-' + role + '-' + (i < 10 ? '0' + i : i),
                ip_address: '172.20.18.' + (100 + i),
                os_name: os,
                os_version: '',
                cve_id: cve,
                cvss_score: parseFloat(cvss),
                vuln_name: cve.replace('CVE-', 'Vuln-'),
                discovered_at: '2026-05-' + (10 + (i % 21)) + 'T' + (8 + (i % 12)) + ':' + (i % 60) + ':00Z',
                status: i % 5 === 0 ? 'in_progress' : (i % 9 === 0 ? 'fixed' : 'open')
            });
        }

        var page = parseInt((options.params || {}).page || 1);
        var pageSize = parseInt((options.params || {}).page_size || 10);
        var start = (page - 1) * pageSize;
        return {
            code: 0,
            data: { total: hostsItems.length, page: page, page_size: pageSize, items: hostsItems.slice(start, start + pageSize) }
        };
    }

    // ═══════════════════════════════════════════════════════
    // 接口 2：动态生成 30 天攻击趋势时序（正弦波 + 随机噪点）
    // ═══════════════════════════════════════════════════════
    if (url.includes('/api/v1/dashboard/attack-trend')) {
        var points = [];
        var baseInbound = 1200, baseOutbound = 400;
        for (var day = 1; day <= 30; day++) {
            var wave1 = Math.sin(day / 3.5) * 350;
            var wave2 = Math.cos(day / 4.2) * 180;
            var noise = Math.floor(Math.random() * 250);
            points.push({
                date: '05-' + (day < 10 ? '0' + day : day),
                inbound: Math.floor(baseInbound + wave1 + noise),
                outbound: Math.floor(baseOutbound + wave2 + noise / 2)
            });
        }
        return { code: 0, data: { points: points } };
    }

    // ═══════════════════════════════════════════════════════
    // 接口 3：动态生成 60 条实时告警
    // ═══════════════════════════════════════════════════════
    if (url.includes('/api/v1/alerts')) {
        var alerts = [];
        for (var k = 1; k <= 60; k++) {
            var atkType = ATK_TYPE_POOL[k % ATK_TYPE_POOL.length];
            var srcIp = SRC_IP_POOL[k % SRC_IP_POOL.length];
            alerts.push({
                alert_id: 'ALT-' + (80000 + k),
                timestamp: '2026-06-01 ' + (8 + (k % 14)) + ':' + ((k * 7) % 60 < 10 ? '0' : '') + ((k * 7) % 60) + ':' + (k % 60 < 10 ? '0' : '') + (k % 60),
                src_ip: srcIp,
                dst_ip: '172.20.19.' + (10 + (k % 45)),
                attack_type: atkType,
                level: k % 7 === 0 ? 'critical' : (k % 3 === 0 ? 'high' : (k % 4 === 0 ? 'low' : 'medium')),
                status: k % 4 === 0 ? 'blocked' : (k % 4 === 1 ? 'isolated' : (k % 4 === 2 ? 'intercepting' : 'passed'))
                // 处置状态必须包含4种: intercepted(拦截中) / blocked(已阻断) / passed(已放行) / isolated(已隔离)
                // 参考 page_dashboard.md §1.2.3
            });
        }
        return { code: 0, data: { total: alerts.length, items: alerts } };
    }

    // ═══════════════════════════════════════════════════════
    // 接口 4：首页态势汇总（聚合计算，非写死）
    // ═══════════════════════════════════════════════════════
    if (url.includes('/api/v1/dashboard/summary')) {
        return {
            code: 0,
            data: {
                total_assets: 12847,
                critical_risks: 326,
                alerts_24h: 1892,
                protection_coverage: 94.7
            }
        };
    }

    // ═══════════════════════════════════════════════════════
    // 接口 5：风险等级分布
    // ═══════════════════════════════════════════════════════
    if (url.includes('/api/v1/dashboard/risk-distribution')) {
        return {
            code: 0,
            data: { critical: 256, high: 842, medium: 3145, low: 8604 }
        };
    }

    throw new Error('未注册的 Mock API 路由: ' + url);
    }

    // ═══════════════════════════════════════════════════════
    // 以下为 renderDashboard 及其他渲染函数（均在 IIFE 内部）
    // ═══════════════════════════════════════════════════════
```

### 算法化设计原则（铁律）

| 规则 | 禁止 | 必须 |
|------|------|------|
| 数据来源 | 手写 JSON 数组 `[{...}, {...}, ...]` | `for` 循环 + 种子数组 + 取模运算 |
| 列表数量 | 写死 2-3 条 | 循环生成 30-60+ 条 |
| 时间序列 | 写死几个日期 | `Math.sin()` + `Math.random()` 生成波峰波谷 |
| IP/端口 | 写死几个固定值 | 种子数组索引 + 动态偏移量 |
| 风险评分 | 全写死同一个值 | `(9.9 - (i%5)*1.4 + (i%3)*0.3)` 动态生成梯度 |
| 数据省略 | `// ... 共 N 条` | 不存在这种注释 |

### 种子数组硬性要求

**每个 `apiFetch` 必须包含以下种子数组（至少 5-8 个元素）：**

- `OS_POOL` — 7 种真实操作系统
- `ROLE_POOL` — 7 种数据中心角色
- `CVE_POOL` — 7 个真实 CVE 编号
- `ATK_TYPE_POOL` — 8 种真实攻击向量
- `SRC_IP_POOL` — 8 个真实外部 IP 段

**根据模块需要，额外包含以下专业术语池（来源：参考文档 page_*.md）：**

- `FRAMEWORK_POOL` — Web 应用框架: `['Spring Boot', 'Django', 'Express', 'Laravel', 'ThinkPHP', 'Flask', 'Gin']`
- `WEB_SERVER_POOL` — Web 服务器: `['Nginx', 'Apache', 'IIS', 'Tomcat', 'OpenResty', 'Caddy']`
- `ATK_CATEGORY_POOL` — 8类威胁告警: `['应用漏洞类', '暴力破解类', '异常通信类', '横向移动类', '数据外泄类', '恶意代码类', '中间件安全类', '诱捕告警类']`
- `OWASP_POOL` — OWASP Top 10: `['A01-权限控制失效', 'A02-加密失败', 'A03-注入', 'A04-不安全设计', 'A05-安全配置错误', 'A06-过时组件', 'A07-身份认证失败', 'A08-软件完整性失败', 'A09-日志监控不足', 'A10-SSRF']`
- `HONEYPOT_TYPE_POOL` — 蜜罐类型: `['SSH服务', 'MySQL服务', 'Redis服务', 'Web后台', 'Git仓库', 'OA办公系统']`
- `COLLECT_PROTOCOL_POOL` — 配置核查采集协议: `['SNMPv3', 'SSH', 'WMI', 'Agent']`
- `COMPLIANCE_POOL` — 合规标准: `['等保2.0', 'CIS Benchmark', 'ISO 27001', '自定义基线']`
- `VULN_STATUS_POOL` — 漏洞修复流转: `['open', 'in_progress', 'fixed', 'accepted_risk']`

种子数组中每一项必须是工业级专业术语，不能用 `os1`, `os2` 等通用命名。

---

## 组件渲染规范

**在你的主函数中，必须先获取数据，再构建 DOM：**

```javascript
    window.renderDashboard = async function(container, params) {
    try {
        // 1. 并发获取页面所需数据
        var summaryRes = await apiFetch('/api/v1/dashboard/summary');
        var hostsRes = await apiFetch('/api/v1/assets/hosts/high-risk?limit=5');
        var trendRes = await apiFetch('/api/v1/dashboard/attack-trend?days=7');
        var distRes = await apiFetch('/api/v1/dashboard/risk-distribution');
        var alertsRes = await apiFetch('/api/v1/alerts?limit=8');
        
        var summary = summaryRes.data;
        var hosts = hostsRes.data.items;
        var trendData = trendRes.data.points;
        var distribution = distRes.data;
        var alerts = alertsRes.data.items;
        
        // 2. 构建 HTML 字符串（使用提取到的数据，不在字符串中写死）
        var html = '';
        html += '<div class="dashboard-container">';
        
        // KPI 卡片区（指标名称必须与 page_dashboard.md §1.2.1 一致）
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:24px;">';
        html += '  <div class="glass-card card-layer-1">';
        html += '    <div class="stat-card__value">' + summary.total_assets.toLocaleString() + '</div>';
        html += '    <div class="stat-card__label">受控主机资产数</div>';
        html += '  </div>';
        html += '  <div class="glass-card card-layer-1">';
        html += '    <div class="stat-card__value">' + summary.critical_risks.toLocaleString() + '</div>';
        html += '    <div class="stat-card__label">高危风险资产数</div>';
        html += '  </div>';
        html += '  <div class="glass-card card-layer-1">';
        html += '    <div class="stat-card__value">' + summary.alerts_24h.toLocaleString() + '</div>';
        html += '    <div class="stat-card__label">实时威胁告警数</div>';
        html += '  </div>';
        html += '</div>';
        
        // 图表区（图表类型必须与 page_dashboard.md §1.2.2 一致）
        html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:24px;">';
        html += '  <div class="chart-container card-layer-2" id="chart-attack-trend"><div class="section-title" style="padding:12px;">流量攻击趋势</div></div>';
        html += '  <div class="chart-container card-layer-2" id="chart-risk-dist"><div class="section-title" style="padding:12px;">风险等级分布</div></div>';
        html += '</div>';
        
        // 高危主机表格
        html += '<div class="card-layer-3" style="border-radius:var(--radius-card);overflow:hidden;">';
        html += '<div class="section-title" style="padding:16px;">高危风险资产 TOP 5</div>';
        html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>';
        html += '<th>主机名称</th><th>IP 地址</th><th>操作系统</th><th>CVE 编号</th><th>CVSS 评分</th><th>操作</th>';
        html += '</tr></thead><tbody>';
        for (var i = 0; i < hosts.length; i++) {
            var h = hosts[i];
            html += '<tr>';
            html += '<td>' + h.host_name + '</td>';
            html += '<td>' + h.ip_address + '</td>';
            html += '<td>' + h.os_name + ' ' + h.os_version + '</td>';
            html += '<td>' + h.cve_id + '</td>';
            html += '<td class="col-threat ' + (h.cvss_score >= 9 ? 'critical' : 'high') + '">' + h.cvss_score + '</td>';
            html += '<td><button class="btn btn-outline btn-detail" data-host-id="' + h.host_id + '">风险详情</button></td>';
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        
        // 实时攻击监测列表（字段必须与 page_dashboard.md §1.2.3 一致：源IP + 攻击载荷/类型 + 处置状态）
        html += '<div class="card-layer-3" style="margin-top:20px;border-radius:var(--radius-card);overflow:hidden;">';
        html += '<div class="section-title" style="padding:16px;">实时攻击监测</div>';
        html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>';
        html += '<th>时间</th><th>源 IP</th><th>目标 IP</th><th>攻击载荷/类型</th><th>威胁等级</th><th>处置状态</th><th>操作</th>';
        html += '</tr></thead><tbody>';
        for (var j = 0; j < alerts.length; j++) {
            var a = alerts[j];
            html += '<tr>';
            html += '<td>' + a.timestamp + '</td>';
            html += '<td>' + a.src_ip + '</td>';
            html += '<td>' + a.dst_ip + '</td>';
            html += '<td>' + a.attack_type + '</td>';
            html += '<td><span class="badge badge-' + a.level + '">' + a.level + '</span></td>';
            html += '<td>' + a.status + '</td>';
            html += '<td><button class="btn btn-outline btn-dispose" data-alert-id="' + a.alert_id + '">处置</button></td>';
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        
        html += '</div>'; // end dashboard-container
        
        container.innerHTML = html;
        
        // 3. 路由联动绑定（使用原生 DOM API 绑定事件）
        var detailBtns = container.querySelectorAll('.btn-detail');
        detailBtns.forEach(function(btn, index) {
            btn.onclick = function() {
                var hostId = btn.getAttribute('data-host-id');
                router.navigate('/host-risk', { hostId: hostId });
            };
        });
        
        var disposeBtns = container.querySelectorAll('.btn-dispose');
        disposeBtns.forEach(function(btn, index) {
            btn.onclick = function() {
                var alertId = btn.getAttribute('data-alert-id');
                router.navigate('/attack', { alertId: alertId });
            };
        });
        
        // 4. 初始化 ECharts（在 innerHTML 写入后）
        var trendDom = container.querySelector('#chart-attack-trend');
        if (trendDom) {
            var trendChart = echarts.init(trendDom, 'dark-cyber');
            trendChart.setOption({
                // 使用 trendData 构建图表配置
                tooltip: { trigger: 'axis' },
                legend: { data: ['入站攻击', '出站流量'], textStyle: { color: 'var(--color-text-secondary)' } },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: {
                    type: 'category',
                    data: trendData.map(function(p) { return p.date; }),
                    axisLabel: { color: 'var(--color-text-secondary)' }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: 'var(--color-text-secondary)' }
                },
                series: [
                    {
                        name: '入站攻击',
                        type: 'line',
                        data: trendData.map(function(p) { return p.inbound; }),
                        smooth: true,
                        lineStyle: { color: 'var(--color-danger)' },
                        itemStyle: { color: 'var(--color-danger)' }
                    },
                    {
                        name: '出站流量',
                        type: 'line',
                        data: trendData.map(function(p) { return p.outbound; }),
                        smooth: true,
                        lineStyle: { color: 'var(--color-accent)' },
                        itemStyle: { color: 'var(--color-accent)' }
                    }
                ]
            });
        }
        
    } catch (error) {
        container.innerHTML = '<div class="glass-card" style="text-align:center;padding:48px;"><span class="badge badge-critical">数据加载失败: ' + error.message + '</span></div>';
    }
};

})(); // end IIFE
```

---

## 路由跳转联动规则

（保留原有规则，改为从 apiFetch 数据中提取 ID 参数传递）

| 来源页面 | 触发点 | 目标路由 | 传递参数 |
|---------|--------|---------|---------|
| 首页 | "高危资产 TOP 5" 的"详情"按钮 | `/host-risk` | `{ hostId: host.host_id }` |
| 首页 | 实时告警列表的"处置"按钮 | `/attack` | `{ alertId: alert.alert_id }` |
| 首页 | KPI 卡片的"查看详情" | 对应模块路由 | 无参数 |
| 资产中心 | 主机列表的"风险详情" | `/host-risk` | `{ hostId: host.host_id }` |
| 资产中心 | 网站列表的"漏洞详情" | `/web-risk` | `{ siteId: site.site_id }` |
| 主机风险 | 漏洞列表的"关联资产" | `/asset` | `{ hostId: vuln.host_id }` |
| 网站风险 | 渗透测试的"攻击路径" | `/attack` | `{ pentestId: task.task_id }` |

---

## Mock 数据规范

### 必须使用真实数据格式

| 数据类型 | 要求 | 错误示例 | 正确示例 |
|---------|------|---------|---------|
| CVE 编号 | 真实 CVE 编号 + 年份 | CVE-0000-0000 | CVE-2024-6387 (RegreSSHion) |
| CVSS 评分 | 1.0-10.0 之间的合理值 | 0.0 或全部 10.0 | 9.8, 7.5, 5.3, 3.1 |
| IP 地址 | 真实内网 IP 段 | 1.1.1.1 | 192.168.1.128, 10.0.5.42, 172.20.18.175 |
| 端口 | 常见服务端口 | 99999 | 22, 3389, 445, 6379, 3306, 8080, 443 |
| 操作系统 | 真实 OS 版本 | OS V1.0 | Ubuntu 22.04 LTS, Windows Server 2019, VMware ESXi 7.0 |
| 攻击类型 | 真实攻击向量 | hack_attack | SQL Injection, Stored XSS, SSRF, RCE via Deserialization |
| 时间 | ISO 8601 格式 | 2020-01-01 | 2026-05-28T14:22:00Z |
| 威胁等级 | 固定枚举值 | danger | critical, high, medium, low |

### 数据量要求（算法化生成）

| 场景 | 最少条目 | 生成方式 |
|------|---------|---------|
| 每个列表接口 | 30-60 条 | `for` 循环 + 种子数组 + 取模 |
| ECharts 时序图 | 30 个点 | `for` 循环 + `Math.sin()` + `Math.random()` |
| ECharts 饼图/柱状图 | 4-7 个分类 | 种子数组长度切分 |
| 告警/事件列表 | 50-60 条 | `for` 循环 + 种子数组 |
| 表格行 | 通过分页展示 10/页，total 显示 45-60 | `items.slice(start, start+pageSize)` |

### 致命数据犯规

- 从 `for` 循环改成 `items: [{手动写2条}]` → **立即打回**
- 出现 `// ... 共 N 条` 或 `// 更多数据省略` 注释 → **立即打回**
- 手写超过 3 条的 JSON 数组 → **警告+要求改循环**

---

## 模块专属 apiFetch 接口清单

以下是各模块必须实现的接口 + 算法化生成指南：

### 首页 (dashboard) — 参考 `page_dashboard.md`

```
接口路径                                     生成方式 & 字段要求
/api/v1/dashboard/summary                   聚合值 — total_assets(受控主机资产数), critical_risks(高危风险资产数), alerts_24h(实时威胁告警数)
                                            三个指标名称必须与参考文档 §1.2.1 一致
/api/v1/dashboard/attack-trend?days=30       for day 1→30 + Math.sin(day/3.5)*350 + Math.random()*250
                                            流量攻击趋势图（5分钟粒度），字段: date, inbound, outbound
                                            图表类型: 折线/面积图（参考 §1.2.2）
/api/v1/dashboard/risk-distribution          分布值 — critical(危急), high(高危), medium(中危), low(低危)
                                            四维度名称必须与参考文档 §1.2.2 一致
                                            图表类型: 饼图/环形图
/api/v1/alerts?page=1&page_size=10           for k 1→60 + ATK_TYPE_POOL + SRC_IP_POOL
                                            实时攻击监测列表（参考 §1.2.3）
                                            字段必须包含: src_ip(源IP), attack_type(攻击载荷/类型), status(处置状态: 拦截中/已阻断/已放行/已隔离)
/api/v1/assets/hosts/high-risk?limit=5       从 hosts 总列表中取 cvss_score >= 7.0 的前 5 条
                                            高危风险资产 TOP 5 快速入口
```

### 资产中心 (asset) — 参考 `page_asset.md`

```
接口路径                                     生成方式 & 字段要求
/api/v1/assets/hosts?page=1&page_size=10     for i 1→45 + ROLE_POOL + OS_POOL + CVE_POOL + IP动态偏移
                                            主机资产（参考 §2.2.1）
                                            必须包含: os_name+os_version(资产指纹识别), agent_status(存活监测: online/offline/offline_warning)
                                            必须包含: mac_address(UUID唯一标识, 用于跨网段资产对齐)
/api/v1/assets/hosts/{id}                    从 hosts 列表中按 host_id 查找单条（主机详情弹窗）
/api/v1/assets/websites?page=1&page_size=10   for i 1→35 + DOMAIN_POOL + SERVER_POOL
                                            网站资产（参考 §2.2.2）
                                            必须包含: framework(应用框架: Spring Boot/Django/Express), web_server(Nginx/IIS/Apache/Tomcat)
                                            必须包含: ssl_status(SSL证书有效状态), is_shadow(影子资产标记: true/false)
                                            必须包含: linked_server_ip(跨层级链路映射: 关联底层服务器IP)
/api/v1/assets/attack-surface                for i 1→30 端口暴露统计
                                            攻击面测绘（参考 §2.2.4）
                                            必须包含: open_ports(开放端口列表, 重点关注3389/445/6379/3306)
                                            必须包含: esi_score(暴露风险指数, 参考文档中的ESI概念)
/api/v1/assets/traffic-stats                 for day 1→7 + 面积图数据
                                            流量风险画像（参考 §2.2.3）
                                            必须包含: protocol_type(协议分类: HTTP/DNS/SSH/非标), is_anomaly(是否异常基线偏离)
```

### 主机风险 (host-risk) — 参考 `page_host_risk.md`

```
接口路径                                     生成方式 & 字段要求
/api/v1/host-risks/vulnerabilities            for i 1→50 + CVE_POOL + host_id动态关联 + cvss动态梯度
                                            风险台账（参考 §3.2.1）
                                            必须包含: mac_address(底层物理MAC, 用于资产对齐追踪), device_interface(网络设备接口)
                                            必须包含: fix_status(修复状态流转: open→in_progress→fixed), vuln_trend(漏洞趋势: new/fixed/unchanged)
/api/v1/host-risks/scan-tasks                 for i 1→20 扫描任务
                                            漏洞扫描引擎（参考 §3.2.2）
                                            必须包含: target_type(异构环境: linux_vm/windows_physical/esxi/container)
                                            必须包含: thread_pool_size(线程池配置), io_timeout_ms(I/O超时阈值, 防拥塞调度)
/api/v1/host-risks/scan-schedules             for i 1→8 Cron调度
                                            周期漏扫与差异分析（参考 §3.2.3）
                                            必须包含: cron_expression(标准Cron表达式), new_vulns_count(新增漏洞), fixed_vulns_count(已修复漏洞)
                                            增量差异高亮展示: "新增"标红 + "已修复"标绿
/api/v1/host-risks/config-audits              for i 1→15 + CHECK_ITEM_POOL
                                            基线配置核查（参考 §3.2.4）
                                            必须包含: collect_protocol(采集协议: SNMPv3/SSH/WMI, 无Agent模式)
                                            必须包含: compliance_standard(合规标准: 等保2.0/CIS Benchmark/自定义)
                                            必须包含: check_result(pass/fail/warning)
```

### 网站风险 (web-risk) — 参考 `page_web_risk.md`

```
接口路径                                     生成方式 & 字段要求
/api/v1/web-risks/websites                    for i 1→30 + DOMAIN_POOL + SERVER_POOL
                                            网站台账（参考 §4.2.1）
                                            必须包含: framework(应用框架自动识别), web_server(Web服务器类型)
                                            必须包含: ssl_expiry_date(SSL证书有效期), linked_server_ip(跨层级链路映射至底层服务器)
/api/v1/web-risks/vulnerabilities             for i 1→40 + OWASP_CATEGORY_POOL
                                            深度漏洞扫描引擎（参考 §4.2.2）
                                            必须包含: owasp_category(OWASP Top 10分类: A01-A10)
                                            必须包含: is_spa_detected(是否SPA架构: Vue/React/传统MPA)
                                            必须包含: vuln_type(SQLi/XSS/XXE/反序列化/SSRF/IDOR)
/api/v1/web-risks/monitor-status              for i 1→20 + HTTP状态码 + TTFB动态值
                                            安全监测中心（参考 §4.2.3）
                                            必须包含: is_heavy_guard(是否重保增强监测模式)
                                            必须包含: darklink_found(暗链检测结果), tamper_detected(篡改检测结果)
                                            必须包含: ttfb_ms(首字节时间), status_code(HTTP状态码), uptime_pct(可用性SLA)
/api/v1/web-risks/pentest-tasks               for i 1→12 渗透测试任务
                                            自动化渗透测试（参考 §4.2.4）
                                            必须包含: attack_chain(攻击链路: 边界突破→提权→横向移动)
                                            必须包含: oob_verified(带外验证状态: DNSLog/HTTPLog/未验证)
                                            必须包含: vuln_chain_ids(串联的漏洞ID列表)
```

### 攻击事件 (attack) — 参考 `page_attack.md`

```
接口路径                                     生成方式 & 字段要求
/api/v1/attacks/events                        for i 1→60 + ATK_TYPE_POOL + SRC_IP_POOL
                                            实时态势监测中心（参考 §5.2.1）
                                            必须包含: attack_phase(攻击阶段: 资产发现→漏洞利用→权限维持)
                                            必须包含: cluster_id(聚类事件ID, 多源数据聚类分析)
/api/v1/attacks/alerts/stats                  for i 1→8 按 ATK_TYPE_POOL 分组统计 count
                                            8类威胁告警矩阵（参考 §5.2.2）:
                                            1-应用漏洞类(SQLi/RCE) 2-暴力破解类(SSH/DB) 3-异常通信类(C2/DNS隧道)
                                            4-横向移动类(WMI/SMB) 5-数据外泄类(离群流量) 6-恶意代码类(WebShell)
                                            7-中间件安全类(Nginx/Redis未授权) 8-诱捕告警类(蜜罐触发)
                                            字段必须包含: alert_category(1-8分类), category_name, count, trend
/api/v1/attacks/whitelist                     for i 1→15 白名单 IP/CIDR
/api/v1/attacks/block-policies                for i 1→10 阻断策略
                                            自动化阻断（参考 §5.2.4）
                                            必须包含: block_type(IP黑名单/区域封禁/协议过滤/TLS指纹拦截)
                                            必须包含: confidence_score(攻击置信度阈值), is_auto_block(是否自动下发封禁)
/api/v1/attacks/agents                        for i 1→25 Agent节点
                                            分布式Agent架构（参考 §5.2.4）
                                            必须包含: agent_tech(eBPF内核/用户态), heartbeat_status(心跳状态)
                                            必须包含: version(Agent版本, 用于静默升级管理)
/api/v1/attacks/honeypots                     for i 1→6 蜜罐
                                            蜜罐诱捕防御体系（参考 §5.2.3）
                                            必须包含: honeypot_type(service: SSH/MySQL/Redis / application: Web/Git/OA / file: 文档诱饵)
                                            必须包含: lure_level(诱饵仿真等级)
/api/v1/attacks/honeypot-events               for i 1→30 诱捕事件
                                            必须包含: src_ip(攻击源IP), attack_payload(攻击载荷详情), capture_path(完整攻击路径复现)
```

### 系统管理 (system)

```
接口路径                                     生成方式
/api/v1/system/config                        静态配置对象（系统名称、日志保留天数、告警阈值...）
/api/v1/system/op-logs?page=1&page_size=10    for i 1→50 + ACTION_POOL（登录/查询/创建/删除/导出...）
/api/v1/system/linkage-policies               for i 1→8 联动策略（防火墙联动/EDR联动/邮件通知/SIEM转发）
```

---

## 代码风格约束

1. 全部使用 `var` 声明变量，不使用 `let`/`const`
2. 不使用箭头函数，全部 `function() {}`
3. 不使用模板字面量（反引号），字符串拼接用 `+`
4. 每个文件用 IIFE 包裹，`apiFetch` 为闭包内私有函数，只暴露 `window.renderXxx`
5. `window.renderXxx` 为 `async function`，通过闭包内的 `apiFetch()` 获取数据
6. 路由跳转使用 `router.navigate(route, params)`

---

## 重要提示

**你只负责业务逻辑和数据填充。视觉装饰在运行时由独立脚本完成。**

你的 `renderXxx()` 产出后，Step 1.1b 会生成一个独立的 `decorateXxx()` 装饰器脚本，通过 DOM API 动态注入毛玻璃、状态标签、斑马纹等高级 CSS 类名。你的代码不会被修改，只需确保：
- 在 IIFE 内部定义 `async function apiFetch(url, options)` 及其所有接口分支（闭包私有，不会与其他模块冲突）
- 在 `window.renderXxx()` 中正确调用闭包内的 `apiFetch` 并解构数据
- 正确的 DOM 结构（使用 `.stat-card`、`.data-table`、`.chart-container` 等基础类名）
- 正确的路由跳转逻辑
- 无解释性注释的代码

视觉层面的升级由 `window.decorateXxx(container)` 在渲染后全自动完成。
