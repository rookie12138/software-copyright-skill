/**
 * {模块名称} View Component Template
 *
 * 本文件是 Phase 1.1 前端 Agent 生成 View Component 时的代码规范参考。
 * 所有 View Component 必须严格遵循此模板结构。
 *
 * ====== 铁律 ======
 * 1. 整个文件用 IIFE 包裹，只暴露 window.render{ModuleName}
 * 2. apiFetch 定义在 IIFE 内部（模块私有），禁止暴露为全局函数
 * 3. 禁止输出 <html>、<head>、<body> 标签
 * 4. 禁止编写侧边栏或顶栏
 * 5. 强制双模 apiFetch：USE_MOCK=true 时算法化生成海量数据，false 时真实 fetch
 * 6. 严禁手写 JSON 数组、严禁 // ... 省略 注释
 * 7. 必须使用种子数组 + for 循环 + Math.sin()/random() 生成数据
 *
 * ====== 为什么必须 IIFE ======
 * 多个 View Component 依次加载为 <script> 标签，如果每个文件都在全局定义
 * async function apiFetch()，后加载的会覆盖先加载的——导致非当前模块的接口
 * 全部抛 "未注册的 Mock API 路由"。IIFE 让 apiFetch 成为闭包私有变量，
 * 各模块互不干扰。
 */

(function() {
    'use strict';

    /* ==== 双模 API 适配器（模块私有） ==== */
    var APP_CONFIG = window.APP_CONFIG || { USE_MOCK: true };

    async function apiFetch(url, options) {
        options = options || {};

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

        await new Promise(function(resolve) { setTimeout(resolve, 100); });

        // 种子字典 — 所有算法化生成器共用
        var OS_POOL       = ['VMware ESXi 7.0', 'CentOS 7.9', 'Ubuntu 22.04 LTS', 'Windows Server 2019', 'RedHat 8.2', 'Debian 11', 'OpenSUSE Leap 15.4'];
        var ROLE_POOL     = ['DB-Master', 'K8s-Node', 'Web-Gateway', 'Redis-Cache', 'Auth-Server', 'Log-Collector', 'Nginx-Proxy'];
        var CVE_POOL      = ['CVE-2024-37085', 'CVE-2024-6387', 'CVE-2023-46805', 'CVE-2024-21413', 'CVE-2021-44228', 'CVE-2024-3094', 'CVE-2023-44487'];
        var ATK_TYPE_POOL = ['SQL Injection', 'SSH Brute Force', 'Log4j RCE', 'Path Traversal', 'DNS Tunneling', 'Stored XSS', 'CSRF Token Bypass', 'Cobalt Strike C2'];
        var SRC_IP_POOL   = ['104.18.2.145', '45.122.1.22', '185.199.110.153', '103.235.46.39', '114.114.114.114', '202.112.23.161', '91.121.87.10', '218.92.0.212'];

        // ═══════════════════════════════════════════════════════
        // 接口 1：示例 — 动态生成 45 条主机资产
        // ═══════════════════════════════════════════════════════
        if (url.includes('/api/v1/assets/hosts')) {
            var hostsItems = [];
            for (var i = 1; i <= 45; i++) {
                var role = ROLE_POOL[i % ROLE_POOL.length];
                var os = OS_POOL[i % OS_POOL.length];
                var cve = CVE_POOL[i % CVE_POOL.length];
                var cvss = (9.9 - (i % 5) * 1.4 + (i % 3) * 0.3).toFixed(1);
                if (parseFloat(cvss) > 10) { cvss = '9.8'; }
                hostsItems.push({
                    host_id: 'HST-2026-' + (1000 + i),
                    host_name: 'PROD-' + role + '-' + (i < 10 ? '0' + i : i),
                    ip_address: '172.20.18.' + (100 + i),
                    os_name: os,
                    cve_id: cve,
                    cvss_score: parseFloat(cvss),
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

        throw new Error('未注册的 Mock API 路由: ' + url);
    }

    /**
     * 渲染 {模块名称} 页面。
     * @param {HTMLElement} container - 页面挂载容器
     * @param {Object} params - 路由参数对象
     */
    window.render{ModuleName} = async function(container, params) {
        try {
            var hostsRes = await apiFetch('/api/v1/assets/hosts?page=1&page_size=10');
            var hosts = hostsRes.data.items;

            var html = '';
            html += '<div class="page-header">';
            html += '<h2 class="section-title">{模块名称}</h2>';
            html += '</div>';

            html += '<div class="sub-tabs">';
            html += '  <div class="sub-tab active" data-tab="tab1">子模块1</div>';
            html += '  <div class="sub-tab" data-tab="tab2">子模块2</div>';
            html += '</div>';

            html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">';
            html += '  <div class="stat-card">';
            html += '    <div class="stat-card__value">12,847</div>';
            html += '    <div class="stat-card__label">指标名称1</div>';
            html += '  </div>';
            html += '</div>';

            html += '<div class="card-layer-3" style="border-radius:var(--radius-card);overflow:hidden;">';
            html += '<div class="section-title" style="padding:16px;">数据列表</div>';
            html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>';
            html += '<th>主机名称</th><th>IP 地址</th><th>操作系统</th><th>CVE 编号</th><th>操作</th>';
            html += '</tr></thead><tbody>';
            for (var i = 0; i < hosts.length; i++) {
                var h = hosts[i];
                html += '<tr>';
                html += '<td>' + h.host_name + '</td>';
                html += '<td>' + h.ip_address + '</td>';
                html += '<td>' + h.os_name + '</td>';
                html += '<td>' + h.cve_id + '</td>';
                html += '<td><button class="btn btn-outline btn-detail" data-host-id="' + h.host_id + '">详情</button></td>';
                html += '</tr>';
            }
            html += '</tbody></table></div>';

            container.innerHTML = html;

            var detailBtns = container.querySelectorAll('.btn-detail');
            detailBtns.forEach(function(btn) {
                btn.onclick = function() {
                    var hostId = btn.getAttribute('data-host-id');
                    router.navigate('/target-route', { hostId: hostId });
                };
            });

        } catch (error) {
            container.innerHTML = '<div class="glass-card" style="text-align:center;padding:48px;"><span class="badge badge-critical">数据加载失败: ' + error.message + '</span></div>';
        }
    };

})();

// ====== 代码生成检查清单 ======
// [ ] 是否用 IIFE 包裹（必须 — 防止 apiFetch 全局覆盖）
// [ ] 函数签名是否正确（async container, params）
// [ ] 是否有 <html>/<head>/<body> 标签（必须没有）
// [ ] 是否自己写了 sidebar/header（必须没有）
// [ ] apiFetch 是否在 IIFE 内部、使用种子数组 + for 循环（必须）
// [ ] 表格是否有至少 10 行数据（分页展示，total >= 30）
// [ ] 跨页面跳转是否使用 router.navigate()
// [ ] 是否有解释性注释（必须没有）
// [ ] 变量名是否使用了具体业务术语
