# 第X章 核心功能实现：全维度资产管理中心

## 2.1 模块概述
资产管理中心是本网络安全运营平台（SOC）的底层核心模块，负责全网资产的自动发现、属性识别与风险画像。系统打破了传统的静态资产记录模式，通过探针感知、无代理探测与互联网开放数据收集，实现了对“主机-网站-流量-攻击面”的四位一体化动态管理。

**[前端架构约束]**：本模块的主览区域必须打破传统等宽网格，采用 **Bento Grid（便当盒）非对称错落布局**。数据呈现严禁全部依赖普通表格，必须根据业务场景深度融合 ECharts 力导向图（资产拓扑）与雷达图（风险画像）。

---

## 2.2 核心子模块功能详解 (需实现为 4 个 Sub-Tab 切换)

### 2.2.1 主机资产精细化管理 (Host Assets)
突破传统漏扫限制，通过无侵入式探测技术实现内网哑资产与主机资产的全面映射。
* **跨网段 MAC 自动识别**：无需联动第三方设备、无需安装 Agent、无需拥有主机凭证，系统即可对跨网段的 IP 进行深度探测，提取底层物理 MAC 地址（UUID唯一标识），解决 IP 漂移带来的资产对齐难题。
* **多网卡与精细化设备探测**：对历史资产进行二次扫描，精准识别主机是否存在多网卡（内网穿透风险），并在台账中高亮多网卡 IP。
* **全量设备指纹画像**：内置 4W+ 弱点与设备指纹库，不仅识别 Windows/Linux/国产操作系统，更能精准识别“网络摄像头、打印机、核心交换机、路由器”等 IoT 与网络设备。
* **[UI 呈现要求]**：表格 `<th>` 必须包含“设备类型”、“MAC/UUID标识”、“多网卡状态(Badge)”。

### 2.2.2 网站资产自动化台账 (Web Assets)
专注应用层资产的自动化收敛与合规性梳理，解决“说不清、找不到”的影子资产难题。
* **资产相关度与影子资产发现**：通过主动爬虫技术，爬取企业已知网站页面，基于“网段、域名”命中规则进行相关度分析，自动挖掘并高亮标记企业内部未备案的 **“影子资产 (Shadow Asset)”** 与测试 API 接口。
* **应用指纹与跨层级链路**：自动识别中间件信息（如 Nginx, Tomcat）、Web 框架（如 Spring Boot, Django）及 SSL 证书有效期。
* **[UI 呈现要求]**：严禁用纯表格展示跨层链路！必须使用 **ECharts 力导向关系图 (Force-Directed Graph)**，以带有微小弧线的流光连线（curveness: 0.2），直观展示 Web 资产与其底层承载服务器 IP 之间的物理拓扑映射关系。

### 2.2.3 互联网暴露面与攻击面监测 (Attack Surface)
模拟黑客视角的外部侦查，全面收敛企业在互联网上的数字资产暴露面。
* **二级域名与 IP 反查探测**：输入一级域名即可一键扫描互联网数据，自动获取二级域名、解析 IP、网站标题与返回状态码。支持 IP 段反查关联域名。
* **全景数字资产暴露**：不仅收集 Web 信息，更深度收集企业相关的暴露邮箱、敏感文档、App 程序、微信小程序及微信公众号等外部攻击面信息。
* **敏感代码与文件泄露追踪**：监测发布到公网的 PDF、Excel 或 Github 代码库中是否包含“密码、身份证号、内部邮箱”等敏感信息。
* **[UI 呈现要求]**：针对“敏感代码/文件泄露”的证据展示，绝对禁止使用普通表格！必须使用深色背景、带有 Mac 控制点的 **Terminal（黑客终端代码窗）视图**，并用荧光色高亮泄漏的敏感词。

### 2.2.4 流量风险画像分析 (Traffic Profiling)
通过旁路流量镜像技术对海量流量进行采集，提供全网视角的流量健康度体检。
* **多维协议与资产定性**：基于 80000+ 威胁特征库，实时解构全网流量，区分 HTTP、DNS、SSH 等标准业务流量与潜在的非标端口数据传输。
* **异常基线对比**：通过机器学习建立流量正常基线。结合攻击源、风险等级、命中规则数，自动识别流量激增或异常会话。
* **[UI 呈现要求]**：针对流量画像评估，**禁止使用柱状图**。必须使用 **ECharts 雷达图 (Radar Chart)**，配合当前主题的半透明告警色（color-mix），从"协议合规性、基线偏离度、异常会话率、暴露风险指数 (ESI)"等多个维度展现动态风险面貌。

---

## API Schema（前端组件唯一数据权威）

> 以下接口定义是本模块前端代码生成的**唯一权威来源**。`view_component_template.js` 和 `phase1_1_frontend_agent.md` 中的示例字段均不具权威性。当前后两者与本文档冲突时，以本文档为准。

### GET /api/v1/assets/hosts?page=1&page_size=10
- **业务来源**: §2.2.1 主机资产精细化管理
- **必含字段**: host_id, host_name, ip_address, mac_address(UUID唯一标识, 用于跨网段资产对齐), agent_status(存活监测: online/offline/offline_warning), os_name, os_version(资产指纹识别), device_type(设备类型: 服务器/网络设备/IoT/打印机/摄像头), multi_nic(多网卡状态: true/false), cve_id, cvss_score, status
- **表格列头**: 主机名称 | IP地址 | MAC/UUID标识 | Agent状态 | 设备类型 | 多网卡状态 | CVSS评分 | 操作
- **KPI指标**: 受控主机资产数 | 高危风险资产数 | 在线Agent数 | 离线预警数
- **图表**: 资产链路力导向图(Force-Directed Graph) — 以主机为中心节点
- **Mock生成**: for i 1→45 + ROLE_POOL + OS_POOL + CVE_POOL + IP动态偏移
- **种子池**: ROLE_POOL, OS_POOL, CVE_POOL

### GET /api/v1/assets/hosts/{id}
- **业务来源**: §2.2.1 主机资产精细化管理 — 详情弹窗
- **必含字段**: host_id, host_name, ip_address, mac_address, agent_status, os_name, os_version, device_type, multi_nic, cve_id, cvss_score, vuln_name, discovered_at, status
- **表格列头**: 无（详情弹窗）
- **KPI指标**: 无
- **图表**: 无
- **Mock生成**: 从 hosts 列表中按 host_id 查找单条

### GET /api/v1/assets/websites?page=1&page_size=10
- **业务来源**: §2.2.2 网站资产自动化台账
- **必含字段**: site_id, domain, framework(应用框架: Spring Boot/Django/Express), web_server(Nginx/IIS/Apache/Tomcat), ssl_status(SSL证书有效状态), ssl_expiry_date(SSL证书有效期), is_shadow(影子资产标记: true/false), linked_server_ip(跨层级链路映射: 关联底层服务器IP)
- **表格列头**: 域名 | 框架 | Web服务器 | SSL状态 | 影子资产 | 关联服务器 | 操作
- **KPI指标**: 网站资产总数 | 影子资产数 | SSL告警数 | 关联率
- **图表**: 跨层级链路力导向图(Force-Directed Graph) — curveness:0.2 微小弧线流光连线
- **Mock生成**: for i 1→35 + DOMAIN_POOL + WEB_SERVER_POOL
- **种子池**: DOMAIN_POOL, WEB_SERVER_POOL, FRAMEWORK_POOL

### GET /api/v1/assets/attack-surface
- **业务来源**: §2.2.3 互联网暴露面与攻击面监测
- **必含字段**: asset_id, domain, sub_domain, resolved_ip, site_title, status_code, open_ports(开放端口列表, 重点关注3389/445/6379/3306), esi_score(暴露风险指数), exposed_emails, sensitive_files
- **表格列头**: 域名 | 子域名 | 解析IP | 开放端口 | ESI指数 | 暴露文件 | 操作
- **KPI指标**: 暴露面资产数 | 高危暴露数 | 敏感文件数 | 泄露邮箱数
- **图表**: 无
- **Mock生成**: for i 1→30 + 端口暴露统计
- **种子池**: DOMAIN_POOL, PORT_POOL

### GET /api/v1/assets/traffic-stats
- **业务来源**: §2.2.4 流量风险画像分析
- **必含字段**: ip, protocol_type(协议分类: HTTP/DNS/SSH/非标), is_anomaly(是否异常基线偏离), risk_score, hit_rules, traffic_volume
- **表格列头**: IP地址 | 协议分类 | 异常标记 | 风险评分 | 命中规则数 | 流量大小 | 操作
- **KPI指标**: 监控流量源数 | 异常流量数 | 命中规则数 | 基线偏离率
- **图表**: 雷达图(Radar Chart) — 从"协议合规性、基线偏离度、异常会话率、暴露风险指数(ESI)"多维度展现
- **Mock生成**: for i 1→25 + 种子数据