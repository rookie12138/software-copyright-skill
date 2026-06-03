# 第X章 核心功能实现：网站风险与全生命周期监测模块

## 4.1 模块概述
网站风险模块专注应用层面的脆弱性挖掘、内容合规审查与实时状态防护。相较于底层系统的封闭性，Web 应用是暴露面最大、被攻击最频繁的突破口。本模块集成了“主动漏洞扫描、被动 Web 日志分析、8 维度高频监测、敏感内容审查及渗透测试台账”，为网站提供全方位保护闭环。

**[前端架构约束]**：本模块的整体展示严禁使用等宽死板网格，必须采用 **Bento Grid（便当盒错落布局）**。涉及 Web 日志分析、渗透测试跟踪等场景，绝对禁止使用纯表格兜底，必须深度融合 Terminal（终端代码窗）与 Timeline（时间线）高阶视图。

---

## 4.2 核心子模块详述 (需实现为 4 个 Sub-Tab 切换)

### 4.2.1 网站台账与内容合规审查 (Web Ledger & Content Audit)
解决网站资产底数不清及敏感信息违规发布的问题。
* **应用指纹与跨层级映射**：自动探测 Web Server、后端框架及 SSL 证书有效状态。破除“只看域名”局限，跨层级映射 Web 服务与底层承载服务器 IP 的关联拓扑。
* **敏感文件事件泄露监测**：自动扫描发布到外网的 PDF、Word、Excel 文件，精准定位是否包含“身份证号、邮箱、手机号码、用户名/密码”等敏感信息泄露。
* **敏感内容审查工具**：内置 10万+ 敏感词库，支持人工上传文件或粘贴文本进行审查，并支持二次人工复核。
* **[UI 呈现要求]**：敏感文件泄露的证据展示列表中，必须使用特殊颜色的 Badge（如高亮红/黄）来标记泄露类型（如 `[身份证泄露]`, `[密码泄露]`），严禁视觉平庸。

### 4.2.2 Web 日志分析与深度扫描 (Log Analysis & Scanner)
结合主动扫描与被动流量日志，精准捕获应用层的高级威胁。
* **现代 SPA 架构扫描**：内置无头浏览器（Headless Browser），完美支持 Vue/React 等单页动态应用的深度路由抓取，覆盖 OWASP Top 10（含反序列化、XXE 等）。
* **Web 日志智能分析**：输入 Web 日志文件及端口号，系统自动跟踪并发现各类 Web 入侵攻击（如：目录穿越、SQL 注入、XSS 跨站脚本、Web 路径遍历漏洞），并高亮显示攻击特征。
* **[UI 呈现要求]**：对于“Web 日志分析”中捕获的攻击请求报文与特征，**绝对禁止使用普通表格展示**！必须将其包裹在带有 Mac 红黄绿控制点的 **Terminal（黑客终端代码窗）视图** 中，并使用极客字体（如 Fira Code）高亮显示 SQL 注入或 XSS 的具体 Payload 代码。

### 4.2.3 8维度安全监测中心 (8-Dim Security Monitor)
提供低至 5 分钟/次的极高频网站健康度实时监测。
* **Web 8 维度实时监测**：本地化提供对网站的“漏洞、篡改、黑链、敏感文件、敏感词、网马监测、可用性、域名劫持”等 8 个维度的分钟级监测。
* **文件深度篡改检测**：精准检测 Web 目录下的文件篡改行为，记录“创建、写入、修改权限、重命名、删除”等极度敏感的操作轨迹。
* **[UI 呈现要求]**：在展示某个网站的“8 维度监测健康度”时，**禁止使用柱状图或饼图**！必须使用 **ECharts 雷达图 (Radar Chart)** 结合半透明警示色，将 8 个维度直观地绘制在雷达网格上，体现专业的安全态势感知能力。

### 4.2.4 自动化渗透测试台账 (Penetration Test Ledger)
将线下安全服务成果转化为线上可度量、可追踪的数据资产。
* **渗透报告可视化导入**：支持以 Excel 报表格式直接导入外部或内部的渗透测试报告，形成标准化台账。
* **渗透测试风险大屏**：以可视化图表展现漏洞风险级别比例、风险应用分布比例。
* **漏洞状态跟踪闭环**：对渗透报告中的漏洞进行全生命周期跟踪确认，记录处置状态流转（未整改 -> 已整改 -> 忽略）。
* **[UI 呈现要求]**：渗透测试漏洞的"处置状态流转记录"，**严禁使用表格平铺**！必须使用左侧带有发光圆点的 **Timeline（时间线）视图** 呈现（如：报告导入 -> 确认漏洞 -> 研发修复 -> 复测通过），提供剧本式的审计体验。

---

## API Schema（前端组件唯一数据权威）

> 以下接口定义是本模块前端代码生成的**唯一权威来源**。`view_component_template.js` 和 `phase1_1_frontend_agent.md` 中的示例字段均不具权威性。当前后两者与本文档冲突时，以本文档为准。

### GET /api/v1/web-risks/websites?page=1&page_size=10
- **业务来源**: §4.2.1 网站台账与内容合规审查
- **必含字段**: site_id, domain, framework(应用框架自动识别: Spring Boot/Django/Express), web_server(Web服务器类型: Nginx/Apache/IIS/Tomcat), ssl_status(SSL证书有效状态), ssl_expiry_date(SSL证书有效期), is_shadow(影子资产标记: true/false), linked_server_ip(跨层级链路映射至底层服务器), sensitive_file_count, content_audit_status
- **表格列头**: 域名 | 框架 | Web服务器 | SSL状态 | SSL到期 | 影子资产 | 关联服务器 | 操作
- **KPI指标**: 网站总数 | 影子资产 | SSL告警 | 敏感文件
- **图表**: 跨层级链路力导向图(Force-Directed Graph)
- **Mock生成**: for i 1→30 + DOMAIN_POOL + WEB_SERVER_POOL
- **种子池**: DOMAIN_POOL, WEB_SERVER_POOL, FRAMEWORK_POOL

### GET /api/v1/web-risks/vulnerabilities?page=1&page_size=10
- **业务来源**: §4.2.2 Web日志分析与深度扫描
- **必含字段**: vuln_id, site_id, domain, vuln_type(SQLi/XSS/XXE/反序列化/SSRF/IDOR), owasp_category(OWASP Top 10分类: A01-A10), is_spa_detected(是否SPA架构: Vue/React/传统MPA), severity, poc_payload, request_raw, response_raw, status
- **表格列头**: 域名 | 漏洞类型 | OWASP分类 | SPA检测 | 严重等级 | 状态 | 操作
- **KPI指标**: 漏洞总数 | 高危漏洞 | SQLi | XSS
- **图表**: 无（POC Payload用Terminal视图展示）
- **Mock生成**: for i 1→40 + OWASP_CATEGORY_POOL
- **种子池**: OWASP_POOL

### GET /api/v1/web-risks/monitor-status?page=1&page_size=10
- **业务来源**: §4.2.3 8维度安全监测中心
- **必含字段**: site_id, domain, vuln_status, tamper_detected(篡改检测结果), darklink_found(暗链检测结果), sensitive_word_found, webshell_detected, availability_status, dns_hijack_status, is_heavy_guard(是否重保增强监测模式), ttfb_ms(首字节时间), status_code(HTTP状态码), uptime_pct(可用性SLA)
- **表格列头**: 域名 | 篡改检测 | 暗链检测 | 敏感词 | 网马 | 可用性 | TTFB | 重保模式 | 操作
- **KPI指标**: 监测网站数 | 篡改告警 | 暗链告警 | 可用率
- **图表**: 雷达图(Radar Chart) — 从"漏洞、篡改、黑链、敏感文件、敏感词、网马、可用性、域名劫持"8个维度展现
- **Mock生成**: for i 1→20 + HTTP状态码 + TTFB动态值

### GET /api/v1/web-risks/pentest-tasks?page=1&page_size=10
- **业务来源**: §4.2.4 自动化渗透测试台账
- **必含字段**: task_id, target_domain, attack_chain(攻击链路: 边界突破→提权→横向移动), oob_verified(带外验证状态: DNSLog/HTTPLog/未验证), vuln_chain_ids(串联的漏洞ID列表), severity, status, reporter, report_date
- **表格列头**: 目标域名 | 攻击链路 | OOB验证 | 严重等级 | 状态 | 报告日期 | 操作
- **KPI指标**: 渗透任务数 | 高危占比 | 已整改 | 未整改
- **图表**: 无（攻击链路用Timeline视图，处置状态流转用Timeline视图）
- **Mock生成**: for i 1→12 渗透测试任务