/**
 * {模块名称} View Component Template
 *
 * 本文件是 Phase 1.1 前端 Agent 生成 View Component 时的代码规范参考。
 * 所有 View Component 必须严格遵循此模板结构。
 *
 * ====== 铁律 ======
 * 1. 只暴露一个全局函数：window.render{ModuleName} = function(container, params)
 * 2. 禁止输出 <html>、<head>、<body> 标签
 * 3. 禁止编写侧边栏或顶栏
 * 4. 所有数据硬编码在函数内（Mock 数据）
 * 5. 涉及跨模块跳转时调用 router.navigate(route, params)
 */

/**
 * 渲染 {模块名称} 页面。
 * @param {HTMLElement} container - 页面挂载容器（即 <main id="app-content">）
 * @param {Object} params - 路由参数对象，读取方式：params.hostId, params.alertId
 */
window.render{ModuleName} = function(container, params) {
    // ── Step 1: 读取路由参数（如果有跨页面跳转参数传入） ──
    var focusHostId = params.hostId || null;   // 示例：从资产中心跳转过来的主机ID
    var focusAlertId = params.alertId || null; // 示例：从首页跳转过来的告警ID

    // ── Step 2: 构建页面 HTML ──
    var html = '';

    // 2a. 页面标题
    html += '<div class="page-header">';
    html += '<h2 class="section-title">{模块名称}</h2>';
    html += '</div>';

    // 2b. 子 Tab 导航（如果该模块有 sub_modules）
    html += '<div class="sub-tabs">';
    html += '  <div class="sub-tab active" data-tab="tab1">子模块1</div>';
    html += '  <div class="sub-tab" data-tab="tab2">子模块2</div>';
    html += '</div>';

    // 2c. 统计卡片区（4张卡片）
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">';
    html += '  <div class="stat-card">';
    html += '    <div class="stat-card__value">12,847</div>';
    html += '    <div class="stat-card__label">指标名称1</div>';
    html += '    <div class="stat-card__trend up">↑ 12%</div>';
    html += '  </div>';
    html += '  <!-- ... 更多 stat-card ... -->';
    html += '</div>';

    // 2d. 图表容器
    html += '<div class="section-title">图表标题</div>';
    html += '<div class="chart-container" id="chart-{module}-trend"></div>';

    // 2e. 数据表格
    html += '<div class="section-title">表格标题</div>';
    html += '<table class="data-table">';
    html += '  <thead><tr>';
    html += '    <th>列1</th><th>列2</th><th>列3</th><th>列4</th><th>操作</th>';
    html += '  </tr></thead>';
    html += '  <tbody>';
    // 循环渲染至少 10 行工业级 Mock 数据
    html += '    <tr>';
    html += '      <td>主机SRV-BJ-001</td>';
    html += '      <td>192.168.1.128</td>';
    html += '      <td>Ubuntu 22.04 LTS</td>';
    html += '      <td><span class="risk-tag risk-high">高危</span></td>';
    html += '      <td>';
    // 跨页面跳转按钮
    html += '        <button class="btn btn-outline" onclick="router.navigate(\'/target-route\', {param: \'value\'})">查看详情</button>';
    html += '      </td>';
    html += '    </tr>';
    // ... 共 10+ 行
    html += '  </tbody>';
    html += '</table>';

    // ── Step 3: 将 HTML 写入容器 ──
    container.innerHTML = html;

    // ── Step 4: 绑定 Tab 切换事件 ──
    var tabs = container.querySelectorAll('.sub-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            // 切换 Tab 内容区域
            // ...
        });
    });

    // ── Step 5: 初始化 ECharts 图表（在 innerHTML 写入后） ──
    var chartDom = container.querySelector('#chart-{module}-trend');
    if (chartDom) {
        var chart = echarts.init(chartDom);
        chart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['入站攻击', '出站流量'], textStyle: { color: 'var(--color-text-secondary)' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['05-01','05-02','05-03','05-04','05-05','05-06','05-07',
                       '05-08','05-09','05-10','05-11','05-12','05-13','05-14',
                       '05-15','05-16','05-17','05-18','05-19','05-20','05-21',
                       '05-22','05-23','05-24','05-25','05-26','05-27','05-28',
                       '05-29','05-30'],
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
                    data: [245, 278, 312, 289, 356, 401, 388, 423, 467, 389,
                           512, 478, 534, 498, 567, 601, 546, 623, 589, 672,
                           645, 701, 667, 734, 698, 756, 712, 789, 745, 823],
                    smooth: true,
                    lineStyle: { color: 'var(--color-danger)' },
                    itemStyle: { color: 'var(--color-danger)' }
                },
                {
                    name: '出站流量',
                    type: 'line',
                    data: [128, 145, 167, 134, 189, 201, 178, 212, 234, 198,
                           256, 223, 278, 245, 301, 267, 334, 289, 356, 312,
                           389, 345, 401, 367, 423, 389, 445, 412, 467, 434],
                    smooth: true,
                    lineStyle: { color: 'var(--color-accent)' },
                    itemStyle: { color: 'var(--color-accent)' }
                }
            ]
        });
    }

    // ── Step 6: 如果有路由参数，定位到对应项 ──
    if (focusHostId) {
        // 高亮对应主机行，或滚动到对应位置
        // ...
    }
};

// ====== 代码生成检查清单（Agent 生成后自检） ======
//
// [ ] 函数签名是否正确（container, params）
// [ ] 是否有 <html>/<head>/<body> 标签（必须没有）
// [ ] 是否自己写了 sidebar/header（必须没有）
// [ ] 统计卡片值是否全非零
// [ ] 表格是否有至少 10 行工业级 Mock 数据
// [ ] 图表是否有至少 30 个时序数据点
// [ ] 跨页面跳转是否使用 router.navigate()
// [ ] 是否读取了路由参数 params（如适用）
// [ ] 是否有解释性注释（必须没有）
// [ ] 变量名是否使用了具体业务术语（而非 data/list/tmp）
