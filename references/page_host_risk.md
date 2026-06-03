# 第X章 核心功能实现：主机风险与合规核查中心

## 3.1 模块概述
主机风险中心是本系统执行脆弱性评估和合规性审查的核心组件。该模块突破了传统漏扫工具“只扫不验、误报率高”的局限，提供覆盖“精准扫描-POC实战验证-全生命周期跟踪-全栈基线核查”的纵深风险闭环管理。

**[前端架构约束]**：本模块的整体概览区必须采用 **Bento Grid（便当盒布局）**，打破均分网格。在展示漏洞验证与合规数据时，严禁全部使用基础 `<table>` 兜底，必须根据上下文深度融合 Terminal（终端视图）与 ECharts 雷达图。

---

## 3.2 核心子模块功能详述 (需实现为 4 个 Sub-Tab 切换)

### 3.2.1 漏洞全生命周期风险台账 (Vulnerability Ledger)
构建以底层资产为核心的动态风险账本，解决跨网段扫描与 IP 漂移带来的工单错乱问题。
* **多维资产对齐追踪**：风险记录强制锚定底层物理 MAC 地址（UUID）与网络设备接口，确保在 DHCP 环境下漏洞依旧能准确追踪到具体设备。
* **漏洞生命周期智能管理**：系统自动跟踪漏洞状态，智能识别并流转“新增、已修复、未修复”状态。支持安全运营人员人工介入进行状态处置（如标记为“接受风险”或“忽略”）及编写审计备注。
* **[UI 呈现要求]**：表格 `<th>` 必须包含“MAC地址锚点”、“生命周期状态”。状态流转历史严禁用表格平铺，必须使用带有节点微光的 **Timeline（时间线）视图** 展示（例如：发现漏洞 -> 派发工单 -> 验证修复）。

### 3.2.2 实战化漏洞扫描与 POC 验证引擎 (Scanner & POC Engine)
以实战攻防视角，对内网资产进行无损自动化渗透与漏洞真实性校验。
* **海量漏洞库与异构支持**：内置 340,000+ 漏洞信息库，扫描策略深度兼容 Linux/Windows 物理机、VMware ESXi 虚拟化及容器节点。
* **POC 实战验证与利用证明**：集成 4500+ POC（概念验证），对漏洞进行自动化验证。扫描结果不仅提供漏洞描述，**必须包含详细的漏洞利用证明（Proof of Concept）**，包括但不限于：攻击 Payload、目标响应结果、漏洞利用点及关键参数。
* **[UI 呈现要求]**：针对“漏洞利用证明（Payload 与响应结果）”的展示，**绝对禁止使用普通表格或纯文本框**！必须包裹在带有 Mac 风格红黄绿控制点的 **Terminal（黑客终端代码窗）视图** 中，并使用极客字体（如 JetBrains Mono）高亮 HTTP 请求头与关键参数。

### 3.2.3 弱口令研判与差异分析工具 (Triage & Diff Analysis)
提供针对特定目标的精细化复测与趋势分析能力。
* **弱口令实战研判工具**：内置专项研判界面。支持用户针对指定的目标 IP 与应用协议，在 Web 界面上手工输入“用户名、密码”字典，系统在后台进行实时协议交互并返回登录校验结果，确认弱口令是否真实存在。
* **周期漏扫与增量差异分析**：支持精细化 Cron 调度（如指定凌晨业务低峰期），自动对比历史扫描任务，输出增量差异分析（“新增”标红高亮，“已修复”标绿高亮）。
* **[UI 呈现要求]**：弱口令研判工具应设计为极具科技感的“交互式控制台”——左侧为参数配置表单（暗黑风格 Input），右侧实时滚动显示类似控制台输出的探测日志（Terminal 视图）。

### 3.2.4 全栈基线配置核查 (Full-Stack Config Audit)
提供对企业级 IT 基础设施的深度合规性体检。
* **操作系统与应用服务核查**：支持 Windows 2003~2019 / Win 11 及各类 Linux 发行版。深度支持 Apache、Weblogic、Tomcat、Nginx 及 IIS 等中间件的安全配置提取。
* **数据库与大数据组件核查**：不仅支持常规的 Oracle、MySQL，更全面覆盖大数据基建体系，包括 Flume、HBase、Hadoop、Spark、Storm、ZooKeeper 的配置核查。
* **[UI 呈现要求]**：在展示某个业务系统（包含 OS、DB、大数据）的综合合规结果时，**禁止使用柱状图**。必须使用 **ECharts 雷达图 (Radar Chart)** 结合半透明警示色（color-mix），从"操作系统、中间件、数据库、大数据引擎"四个维度直观呈现合规覆盖率与短板。

---

## API Schema（前端组件唯一数据权威）

> 以下接口定义是本模块前端代码生成的**唯一权威来源**。`view_component_template.js` 和 `phase1_1_frontend_agent.md` 中的示例字段均不具权威性。当前后两者与本文档冲突时，以本文档为准。

### GET /api/v1/host-risks/vulnerabilities?page=1&page_size=10
- **业务来源**: §3.2.1 漏洞全生命周期风险台账
- **必含字段**: vuln_id, host_id, host_name, ip_address, mac_address(底层物理MAC, 用于资产对齐追踪), device_interface(网络设备接口), cve_id, cvss_score, vuln_name, fix_status(修复状态流转: open→in_progress→fixed→accepted_risk), vuln_trend(漏洞趋势: new/fixed/unchanged), discovered_at, status
- **表格列头**: 主机名称 | IP地址 | MAC地址锚点 | CVE编号 | CVSS评分 | 生命周期状态 | 漏洞趋势 | 操作
- **KPI指标**: 漏洞总数 | 高危漏洞数 | 待修复数 | 已修复率
- **图表**: 无（状态流转用Timeline视图）
- **Mock生成**: for i 1→50 + CVE_POOL + host_id动态关联 + cvss动态梯度
- **种子池**: CVE_POOL, VULN_STATUS_POOL

### GET /api/v1/host-risks/scan-tasks?page=1&page_size=10
- **业务来源**: §3.2.2 实战化漏洞扫描与POC验证引擎
- **必含字段**: task_id, task_name, target_type(异构环境: linux_vm/windows_physical/esxi/container), target_range, thread_pool_size(线程池配置), io_timeout_ms(I/O超时阈值, 防拥塞调度), progress, vuln_count, poc_verified_count, status, started_at
- **表格列头**: 任务名称 | 目标类型 | 扫描范围 | 线程池 | 超时阈值 | 进度 | POC验证 | 操作
- **KPI指标**: 扫描任务数 | 运行中 | POC验证率 | 漏洞检出数
- **图表**: 无
- **Mock生成**: for i 1→20 扫描任务
- **种子池**: TARGET_TYPE_POOL

### GET /api/v1/host-risks/scan-schedules
- **业务来源**: §3.2.3 弱口令研判与差异分析工具 — 周期漏扫
- **必含字段**: schedule_id, schedule_name, cron_expression(标准Cron表达式), target_range, last_run_at, next_run_at, new_vulns_count(新增漏洞), fixed_vulns_count(已修复漏洞), status
- **表格列头**: 调度名称 | Cron表达式 | 目标范围 | 上次执行 | 新增漏洞 | 已修复漏洞 | 操作
- **KPI指标**: 调度任务数 | 新增漏洞 | 已修复漏洞 | 差异率
- **图表**: 无（增量差异高亮: "新增"标红 + "已修复"标绿）
- **Mock生成**: for i 1→8 Cron调度

### GET /api/v1/host-risks/config-audits?page=1&page_size=10
- **业务来源**: §3.2.4 全栈基线配置核查
- **必含字段**: audit_id, target_host, target_type(OS/中间件/数据库/大数据), collect_protocol(采集协议: SNMPv3/SSH/WMI, 无Agent模式), compliance_standard(合规标准: 等保2.0/CIS Benchmark/自定义), check_result(pass/fail/warning), total_checks, pass_count, fail_count, warning_count
- **表格列头**: 目标主机 | 类型 | 采集协议 | 合规标准 | 通过/失败/警告 | 合规率 | 操作
- **KPI指标**: 核查主机数 | 合规率 | 不合规项 | 告警项
- **图表**: 雷达图(Radar Chart) — 从"操作系统、中间件、数据库、大数据引擎"四个维度呈现合规覆盖率
- **Mock生成**: for i 1→15 + CHECK_ITEM_POOL
- **种子池**: COLLECT_PROTOCOL_POOL, COMPLIANCE_POOL