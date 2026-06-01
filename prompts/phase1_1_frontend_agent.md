# Phase 1.1 Prompt: Frontend View Component Agent (修订版)

你是前端组件开发工程师。你的任务是为**一个指定模块**生成纯页面级视图组件。

## 铁律（违反任何一条即打回重做）

1. **禁止输出 `<html>`、`<head>`、`<body>`、`<script src="...">` 标签**。只输出一个 JS 文件。
2. **禁止自行编写侧边栏或顶栏**。这些已在 App Shell 中。
3. **强制双模数据解耦（核心契约）**：严禁直接在 HTML 字符串中写死业务数据。**必须**在文件顶部定义 `async function apiFetch(url, options)`（双模：USE_MOCK=true 时返回本地 Mock 数据，false 时发起真实 HTTP 请求），所有渲染函数通过它获取数据。
4. **禁止写解释性注释**。如 `// 定义变量`、`// 渲染表格`、`// 绑定事件`。
5. **只暴露一个异步函数签名**：`window.renderXxx = async function(container, params)`。

## 输入

- `spec.json` → 了解本模块的 `id`、`name`、`route`、`sub_modules`
- `css/variables.css` → 已有的 CSS 变量名（引用时使用 `var(--xxx)`）
- `css/layout.css` → 已有的全局类名（`.glass-card`、`.data-table`、`.chart-container`、`.sub-tabs`、`.btn` 等）
- `js/router.js` → `window.router` API（`navigate()`, `getCurrentParams()`）

---

## 数据获取契约规范 (Dual-Mode API Adapter)

**这是本阶段最重要的部分。你必须实现"双模驱动"的数据获取适配器。代码必须同时包含真实的 `fetch()` 调用和 MOCK 模式的静态数据。**

### 为什么需要双模架构

1. **软著审查**：审查员看到的是标准的 `fetch(url, options)` + `async/await` 动态调用逻辑，证明系统具备真实后端交互能力
2. **截图产出**：`USE_MOCK=true` 时无需启动后端，秒级渲染带 CVE 编号和 ECharts 图表的丰富页面
3. **契约提取**：Phase 1.2 从 Mock JSON 结构提取 `openapi.yaml`，供 Phase 2 生成真实后端
4. **交付即部署**：设置 `USE_MOCK=false` 即可对接 Phase 2 的 Gin 后端

```javascript
/**
 * 双模 API 适配器 (Dual-Mode API Adapter)
 * USE_MOCK = true  : 返回本地高保真演示数据（用于开发截图与软著样本）
 * USE_MOCK = false : 发起真实 HTTP 请求（对接 Phase 2 生成的后端服务）
 */
window.APP_CONFIG = window.APP_CONFIG || { USE_MOCK: true };

async function apiFetch(url, options) {
    options = options || {};

    /* ==== 真实动态调用模式 ==== */
    if (!window.APP_CONFIG.USE_MOCK) {
        try {
            var response = await fetch(url, {
                method: options.method || 'GET',
                headers: options.headers || { 'Content-Type': 'application/json' },
                body: options.body || null
            });
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + url);
            }
            return await response.json();
        } catch (error) {
            console.error('apiFetch error:', error.message);
            throw error;
        }
    }

    /* ==== 静态演示数据模式 (Mock) ==== */
    await new Promise(function(resolve) { setTimeout(resolve, 150); });

    // 示例：首页态势总览聚合接口
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

    // 示例：高危主机列表（带分页参数）
    if (url.includes('/api/v1/assets/hosts/high-risk')) {
        return {
            code: 0,
            data: {
                total: 24,
                page: 1,
                page_size: 10,
                items: [
                    {
                        host_id: 'H-9921',
                        host_name: 'DMZ-VM-Prod-17',
                        ip_address: '172.20.18.175',
                        os_name: 'VMware ESXi',
                        os_version: '7.0 Update 3',
                        cve_id: 'CVE-2024-37085',
                        cvss_score: 9.8,
                        vuln_name: 'ESXi Authentication Bypass',
                        discovered_at: '2026-05-28T14:22:00Z',
                        status: 'open'
                    }
                    // ... 每个接口至少提供 10 条真实感数据
                ]
            }
        };
    }

    throw new Error('未注册的 Mock API 路由: ' + url);
}
```

**双模适配器设计原则：**

- `if (!window.APP_CONFIG.USE_MOCK)` 分支 → 包含真实的 `fetch()` + `response.json()` + 错误处理 → **这是软著审查员看到的"动态通信能力"证明**
- Mock 数据放在 `if` 的隐式 `else` 分支中 → Phase 1.2 静态分析从这里提取 API 契约
- Mock 的 `code: 0` 与后端的统一响应格式一致
- 字段命名统一用 snake_case，时间用 ISO 8601

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
        
        // KPI 卡片区
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:24px;">';
        html += '  <div class="glass-card card-layer-1">';
        html += '    <div class="stat-card__value">' + summary.total_assets.toLocaleString() + '</div>';
        html += '    <div class="stat-card__label">受控主机资产数</div>';
        html += '  </div>';
        html += '  <div class="glass-card card-layer-1">';
        html += '    <div class="stat-card__value">' + summary.critical_risks.toLocaleString() + '</div>';
        html += '    <div class="stat-card__label">高危风险资产数</div>';
        html += '  </div>';
        // ... 更多卡片
        html += '</div>';
        
        // 图表区
        html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:24px;">';
        html += '  <div class="chart-container card-layer-2" id="chart-attack-trend"></div>';
        html += '  <div class="chart-container card-layer-2" id="chart-risk-dist"></div>';
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
        
        // 实时告警列表
        html += '<div class="card-layer-3" style="margin-top:20px;border-radius:var(--radius-card);overflow:hidden;">';
        html += '<div class="section-title" style="padding:16px;">实时威胁告警</div>';
        html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>';
        html += '<th>时间</th><th>源 IP</th><th>目标 IP</th><th>攻击类型</th><th>威胁等级</th><th>处置状态</th><th>操作</th>';
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

### 数据量要求

| 场景 | 最少条目 |
|------|---------|
| 每个 apiFetch 列表接口 | 10 条 items |
| ECharts 时序图 | 30 个 data points |
| ECharts 饼图/柱状图 | 4-6 个分类 |
| 告警列表 | 8 条 |

### 数据零值禁止

- 统计数字不能全为 0
- 图表不能全为空
- 每个 apiFetch 分支至少返回 1 条有意义数据
- CVSS 评分不能全为 0

---

## 模块专属 apiFetch 接口清单

以下是各模块必须实现的 apiFetch 接口参考：

### 首页 (dashboard)

```javascript
async function apiFetch(url, options) {
    // /api/v1/dashboard/summary — 态势总览
    // /api/v1/dashboard/attack-trend?days=7 — 攻击趋势时序数据
    // /api/v1/dashboard/risk-distribution — 风险等级分布
    // /api/v1/alerts?limit=8 — 实时告警列表
    // /api/v1/assets/hosts/high-risk?limit=5 — 高危资产 TOP 5
}
```

### 资产中心 (asset)

```javascript
async function apiFetch(url, options) {
    // /api/v1/assets/hosts?page=1&page_size=10 — 主机列表
    // /api/v1/assets/hosts/{id} — 主机详情
    // /api/v1/assets/websites?page=1&page_size=10 — 网站列表
    // /api/v1/assets/attack-surface — 攻击面数据
    // /api/v1/assets/traffic-stats — 流量统计
}
```

### 主机风险 (host-risk)

```javascript
async function apiFetch(url, options) {
    // /api/v1/host-risks/vulnerabilities?page=1&page_size=10 — 漏洞列表
    // /api/v1/host-risks/scan-tasks — 扫描任务
    // /api/v1/host-risks/scan-schedules — 周期调度
    // /api/v1/host-risks/config-audits — 配置核查
}
```

### 网站风险 (web-risk)

```javascript
async function apiFetch(url, options) {
    // /api/v1/web-risks/websites?page=1&page_size=10 — 网站列表
    // /api/v1/web-risks/vulnerabilities — 网站漏洞
    // /api/v1/web-risks/monitor-status — 监测状态
    // /api/v1/web-risks/pentest-tasks — 渗透测试任务
}
```

### 攻击事件 (attack)

```javascript
async function apiFetch(url, options) {
    // /api/v1/attacks/events?page=1&page_size=10 — 攻击事件列表
    // /api/v1/attacks/alerts/stats — 8类威胁统计
    // /api/v1/attacks/whitelist — 白名单
    // /api/v1/attacks/block-policies — 阻断策略
    // /api/v1/attacks/agents — Agent状态
    // /api/v1/attacks/honeypots — 蜜罐配置
}
```

### 系统管理 (system)

```javascript
async function apiFetch(url, options) {
    // /api/v1/system/config — 系统配置
    // /api/v1/system/op-logs?page=1&page_size=10 — 操作日志
    // /api/v1/system/linkage-policies — 联动策略
}
```

---

## 代码风格约束

1. 全部使用 `var` 声明变量，不使用 `let`/`const`
2. 不使用箭头函数，全部 `function() {}`
3. 不使用模板字面量（反引号），字符串拼接用 `+`
4. 每个 `renderXxx()` 为 `async function`，通过 `apiFetch()` 获取数据
5. 路由跳转使用 `router.navigate(route, params)`

---

## 重要提示

**你只负责业务逻辑和数据填充。视觉装饰在运行时由独立脚本完成。**

你的 `renderXxx()` 产出后，Step 1.1b 会生成一个独立的 `decorateXxx()` 装饰器脚本，通过 DOM API 动态注入毛玻璃、状态标签、斑马纹等高级 CSS 类名。你的代码不会被修改，只需确保：
- 在文件头部定义规范的 `async function apiFetch(url, options)` 及其所有接口分支
- 在 `renderXxx()` 中正确调用 `apiFetch` 并解构数据
- 正确的 DOM 结构（使用 `.stat-card`、`.data-table`、`.chart-container` 等基础类名）
- 正确的路由跳转逻辑
- 无解释性注释的代码

视觉层面的升级由 `window.decorateXxx(container)` 在渲染后全自动完成。
