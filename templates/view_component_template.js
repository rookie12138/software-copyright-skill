/**
 * {模块名称} View Component Template
 *
 * 本文件是 Phase 1.1 前端 Agent 生成 View Component 时的**代码结构**规范参考。
 * 所有 View Component 必须严格遵循此模板的**骨架结构**。
 *
 * ====== 铁律 ======
 * 1. 整个文件用 IIFE 包裹，只暴露 window.render{ModuleName}
 * 2. apiFetch 定义在 IIFE 内部（模块私有），禁止暴露为全局函数
 * 3. 禁止输出 <html>、<head>、<body> 标签
 * 4. 禁止编写侧边栏或顶栏
 * 5. 强制双模 apiFetch：USE_MOCK=true 时算法化生成海量数据，false 时真实 fetch
 * 6. 严禁手写 JSON 数组、严禁 // ... 省略 注释
 * 7. 必须使用种子数组 + for 循环 + Math.sin()/random() 生成数据
 * 8. ⚠ 反模板劫持：本模板中出现的 <th>列名、items.push({})中的字段名、
 *    stat-card__label中的指标名均为**结构占位符**，不具业务权威性。
 *    一切业务字段以 references/page_*.md 和"模块专属apiFetch接口清单"为唯一权威。
 *    当本模板与参考文档冲突时，参考文档胜出。
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

        // ═══════════════════════════════════════════════════════
        // 种子字典 — 池内容从 page_*.md 业务术语提取
        // ═══════════════════════════════════════════════════════
        var POOL_A = ['item_a_1', 'item_a_2', 'item_a_3', 'item_a_4', 'item_a_5', 'item_a_6', 'item_a_7'];
        var POOL_B = ['item_b_1', 'item_b_2', 'item_b_3', 'item_b_4', 'item_b_5', 'item_b_6', 'item_b_7', 'item_b_8'];

        // ═══════════════════════════════════════════════════════
        // 接口占位 — 字段列表必须从 Schema Extraction 输出复制
        // 以下 _id / _label 仅为结构演示，不代表实际业务字段
        // ═══════════════════════════════════════════════════════
        if (url.includes('{接口路径}')) {
            var items = [];
            for (var i = 1; i <= 45; i++) {
                items.push({
                    _id: 'PREFIX-' + (1000 + i),
                    _label: POOL_A[i % POOL_A.length] + '-' + (i < 10 ? '0' + i : i),
                    _value: parseFloat((9.9 - (i % 5) * 1.4 + (i % 3) * 0.3).toFixed(1))
                    // 按 Schema 输出补全所有字段（严禁遗漏"必须包含"字段）
                });
            }
            var page = parseInt((options.params || {}).page || 1);
            var pageSize = parseInt((options.params || {}).page_size || 10);
            var start = (page - 1) * pageSize;
            return {
                code: 0,
                data: { total: items.length, page: page, page_size: pageSize, items: items.slice(start, start + pageSize) }
            };
        }

        // 时序数据生成模板（适用于趋势图/面积图）
        if (url.includes('{时序接口路径}')) {
            var points = [];
            var baseVal = 1000;
            for (var day = 1; day <= 30; day++) {
                var wave = Math.sin(day / 3.5) * 300;
                var noise = Math.floor(Math.random() * 200);
                points.push({
                    date: '05-' + (day < 10 ? '0' + day : day),
                    value_a: Math.floor(baseVal + wave + noise),
                    value_b: Math.floor(baseVal * 0.4 + wave * 0.5 + noise / 2)
                });
            }
            return { code: 0, data: { points: points } };
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
            // 并发获取页面所需数据（接口路径从 Schema Extraction 输出复制）
            var resA = await apiFetch('{接口路径A}?page=1&page_size=10');
            var itemsA = resA.data.items;

            var html = '';
            html += '<div class="page-header">';
            html += '<h2 class="section-title">{模块名称 — 从page_xx.md提取}</h2>';
            html += '</div>';

            // 子Tab名称必须与 page_xx.md 章节标题一致
            html += '<div class="sub-tabs">';
            html += '  <div class="sub-tab active" data-tab="tab1">{子Tab1名 — 从page_xx.md提取}</div>';
            html += '  <div class="sub-tab" data-tab="tab2">{子Tab2名 — 从page_xx.md提取}</div>';
            html += '</div>';

            // KPI 卡片 — 指标名称必须与 page_xx.md "核心业务指标"一致
            html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">';
            html += '  <div class="stat-card">';
            html += '    <div class="stat-card__value">' + resA.data.total.toLocaleString() + '</div>';
            html += '    <div class="stat-card__label">{KPI指标名1 — 从page_xx.md提取}</div>';
            html += '  </div>';
            html += '</div>';

            // 数据表格 — 列头必须从 Schema Extraction 输出的"表格列头"行复制
            html += '<div class="card-layer-3" style="border-radius:var(--radius-card);overflow:hidden;">';
            html += '<div class="section-title" style="padding:16px;">{列表标题}</div>';
            html += '<table class="data-table data-table--striped data-table--sticky"><thead><tr>';
            html += '<th>{列1}</th><th>{列2}</th><th>{列3}</th><th>{列4}</th><th>操作</th>';
            html += '</tr></thead><tbody>';
            for (var i = 0; i < itemsA.length; i++) {
                var row = itemsA[i];
                html += '<tr>';
                html += '<td>' + row._label + '</td>';
                html += '<td>' + row._value + '</td>';
                html += '<td>' + row._id + '</td>';
                html += '<td><span class="badge badge-' + (i % 2 === 0 ? 'critical' : 'high') + '">' + (i % 2 === 0 ? '高危' : '中危') + '</span></td>';
                html += '<td><button class="btn btn-outline btn-detail" data-id="' + row._id + '">详情</button></td>';
                html += '</tr>';
            }
            html += '</tbody></table></div>';

            container.innerHTML = html;

            // 路由联动绑定
            var detailBtns = container.querySelectorAll('.btn-detail');
            detailBtns.forEach(function(btn) {
                btn.onclick = function() {
                    var itemId = btn.getAttribute('data-id');
                    router.navigate('/target-route', { id: itemId });
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
// [ ] Schema Extraction 是否已执行（必须先输出 Schema 再写代码）
// [ ] 表格列头是否与 Schema 输出的"表格列头"完全一致
// [ ] items.push({}) 字段是否覆盖了接口清单中的所有"必须包含"字段
// [ ] KPI 卡片指标名是否与 page_xx.md 完全一致
// [ ] 表格是否有至少 10 行数据（分页展示，total >= 30）
// [ ] 跨页面跳转是否使用 router.navigate()
// [ ] 是否有解释性注释（必须没有）
// [ ] 变量名是否使用了具体业务术语
