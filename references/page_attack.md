# 第X章 核心功能实现：战时指挥与主动防御反制中心

## 5.1 模块概述
本模块构成了系统的“实战化作战中心”，负责全网攻击事件的识别、AI 智能研判、自动化响应与黑客反制。系统彻底抛弃了传统的“海量告警堆叠”模式，通过引入本地/云端 DeepSeek AI 大模型、无侵入式微隔离以及高交互诱捕防御网络，建立了一套具备“秒级阻断、深度溯源、智能定性”的纵深战时防御闭环。

**[前端架构约束]**：本模块的实战监测大屏必须采用极具压迫感的 **Bento Grid（便当盒）暗黑风格布局**。告警数据的展示绝对禁止依赖单一的 `<table>`，必须深度结合 **Timeline（时间线）** 与 **Terminal（终端代码窗）** 视图，还原黑客攻击的真实质感。

---

## 5.2 核心子模块功能详述 (需实现为 4 个 Sub-Tab 切换)

### 5.2.1 AI 智能体研判与态势监测 (AI Triage & Monitoring)
联动 DeepSeek 大模型，对流量、蜜罐、主机告警进行三维一体融合分析，实现告警的自动降噪与精准定性。
* **DeepSeek 深度思考研判**：云端联网 AI 智能体自动分析攻击 Payload，判断响应报文是否攻击成功。输出详细的“AI 思考过程与研判结论”，并给攻击源自动打上标签（如：利用成功、内网恶意攻击、漏洞扫描）。数据传输前自动过滤“身份证/手机号”防泄露。
* **攻击数据包无损还原**：支持还原攻击者的底层网络数据包（TCP/UDP/ICMP），深度展示 SQL 注入或 XSS 攻击的完整 HTTP 请求头部与原始 Payload。
* **[UI 呈现要求]**：
  - “攻击数据包还原”与“AI 分析 Payload”区域，**严禁使用表格**！必须使用带有红黄绿 Mac 控制点的 **Terminal（深色黑客终端代码窗）视图**，并以等宽字体高亮攻击特征代码。
  - AI 研判结论需使用带有呼吸灯动效的卡片展示。

### 5.2.2 诱捕防御与全景溯源 (Deception & Traceback)
构建虚实结合的欺骗防御网络，捕获高级威胁并对攻击者进行精准物理身份溯源。
* **Trunk 级高交互蜜罐矩阵**：无需安装 Agent，通过 Trunk 方式将诱捕能力无侵入式发布到全网 VLAN。支持 Weblogic、Redis、Hadoop 等真实协议交互，以及泛微OA、深信服VPN等 10+ 种完全仿真蜜罐。
* **攻击者社交与指纹溯源**：精准提取攻击者的“黑客社交画像”（如百度/微博社交账号、昵称、头像），以及设备指纹（操作系统、浏览器类型、真实经纬度与物理位置）。
* **硬核威慑与反制**：支持一键下发页面威慑、拒绝服务反制、木马替换诱骗下载，以及针对攻击源 IP 的反向漏洞扫描。
* **[UI 呈现要求]**：溯源结果页面必须包含极具视觉冲击力的“黑客画像档案卡（Hacker Profile Card）”，展示头像、社交账号与指纹标签，打破死板的列表呈现。

### 5.2.3 自动化阻断与微隔离响应 (Automated Response)
将防御动作下沉至网络底层，实现毫秒级的威胁掐断。
* **失陷主机无Agent微隔离**：无需联动第三方防火墙，无需在主机安装 Agent，直接在交换机层面实现失陷主机的网络微隔离（断网），并支持 Web 界面一键取消隔离恢复业务。
* **智能旁路阻断**：基于 AI 研判标签（如：暴力破解高危、非法外联），自动触发 TCP RST 旁路阻断，灵活封禁国内外 IP 及其时间间隔。
* **入侵攻击链 (Kill Chain) 追踪**：参考 MITRE ATT&CK 模型，将零散告警串联为完整的攻击链（探测扫描 -> 渗透攻击 -> 攻陷蜜罐 -> 后门远控 -> 跳板横向）。
* **[UI 呈现要求]**：攻击链追踪展示**严禁使用表格**！必须采用左侧带发光时间轴线圈的 **Timeline（剧本式时间线）视图**，按时间顺序列出攻击者的每一步渗透动作。

### 5.2.4 高级威胁与违规外联监测 (Advanced Threats)
专注于内部人员违规行为与社会工程学攻击的监控。
* **实时翻墙上网监测**：无需加载证书，通过流量加密特征识别内网主流翻墙工具（V2Ray、Clash Verge、Surfshark），关联威胁情报，精准定位命中非法代理节点的违规外联行为。
* **钓鱼邮件实战演练**：统计并追踪打开钓鱼邮件的账号、点击非法链接的 IP、以及提交敏感数据的具体内容与时间。
* **[UI 呈现要求]**：在翻墙行为看板中，必须通过专属的 Badge（如醒目的红色或橙色标签）高亮显示命中规则的"翻墙工具名称（如 V2Ray）"和"非法代理节点 IP"。

---

## API Schema（前端组件唯一数据权威）

> 以下接口定义是本模块前端代码生成的**唯一权威来源**。`view_component_template.js` 和 `phase1_1_frontend_agent.md` 中的示例字段均不具权威性。当前后两者与本文档冲突时，以本文档为准。

### GET /api/v1/attacks/events?page=1&page_size=10
- **业务来源**: §5.2.1 AI智能体研判与态势监测
- **必含字段**: event_id, timestamp, src_ip, dst_ip, attack_type, attack_phase(攻击阶段: 资产发现→漏洞利用→权限维持), level, cluster_id(聚类事件ID, 多源数据聚类分析), payload_raw, ai_verdict, ai_tags, status
- **表格列头**: 时间 | 源IP | 目标IP | 攻击类型 | 攻击阶段 | 威胁等级 | AI研判 | 操作
- **KPI指标**: 攻击事件总数 | 高危事件 | AI研判率 | 自动阻断率
- **图表**: 力导向关系图(Force-Directed Graph) — 攻击源IP为中心节点，辐射蜜罐与被攻击主机
- **Mock生成**: for i 1→60 + ATK_TYPE_POOL + SRC_IP_POOL
- **种子池**: ATK_TYPE_POOL, SRC_IP_POOL

### GET /api/v1/attacks/alerts/stats
- **业务来源**: §5.2.1 AI智能体研判 — 8类威胁告警矩阵
- **必含字段**: alert_category(1-8分类), category_name(应用漏洞类/暴力破解类/异常通信类/横向移动类/数据外泄类/恶意代码类/中间件安全类/诱捕告警类), count, trend(up/down/stable)
- **表格列头**: 无（矩阵统计）
- **KPI指标**: 无
- **图表**: 矩阵热力图/柱状图
- **Mock生成**: for i 1→8 按 ATK_CATEGORY_POOL 分组统计 count
- **种子池**: ATK_CATEGORY_POOL

### GET /api/v1/attacks/honeypots
- **业务来源**: §5.2.2 诱捕防御与全景溯源
- **必含字段**: honeypot_id, honeypot_type(service: SSH/MySQL/Redis / application: Web/Git/OA / file: 文档诱饵), ip, port, lure_level(诱饵仿真等级), status, event_count
- **表格列头**: 蜜罐名称 | 类型 | IP | 端口 | 仿真等级 | 事件数 | 操作
- **KPI指标**: 蜜罐总数 | 在线蜜罐 | 触发事件 | 高仿真占比
- **图表**: 无
- **Mock生成**: for i 1→6 蜜罐
- **种子池**: HONEYPOT_TYPE_POOL

### GET /api/v1/attacks/honeypot-events?page=1&page_size=10
- **业务来源**: §5.2.2 诱捕防御与全景溯源 — 诱捕事件
- **必含字段**: event_id, honeypot_id, src_ip(攻击源IP), attack_payload(攻击载荷详情), capture_path(完整攻击路径复现), timestamp, level, social_profile(社交画像), device_fingerprint(设备指纹)
- **表格列头**: 时间 | 攻击源IP | 目标蜜罐 | 攻击载荷 | 威胁等级 | 社交画像 | 操作
- **KPI指标**: 无
- **图表**: 无（攻击路径用Timeline视图，Payload用Terminal视图）
- **Mock生成**: for i 1→30 诱捕事件

### GET /api/v1/attacks/block-policies?page=1&page_size=10
- **业务来源**: §5.2.3 自动化阻断与微隔离响应
- **必含字段**: policy_id, block_type(IP黑名单/区域封禁/协议过滤/TLS指纹拦截), target, confidence_score(攻击置信度阈值), is_auto_block(是否自动下发封禁), created_at, expire_at, status
- **表格列头**: 策略名称 | 阻断类型 | 目标 | 置信度 | 自动下发 | 状态 | 操作
- **KPI指标**: 阻断策略数 | 自动阻断 | 手动阻断 | 封禁IP数
- **图表**: 无
- **Mock生成**: for i 1→10 阻断策略

### GET /api/v1/attacks/agents?page=1&page_size=10
- **业务来源**: §5.2.3 自动化阻断 — 分布式Agent架构
- **必含字段**: agent_id, hostname, ip, agent_tech(eBPF内核/用户态), heartbeat_status(心跳状态), version(Agent版本, 用于静默升级管理), os, last_heartbeat, status
- **表格列头**: 主机名 | IP | 采集技术 | 心跳状态 | 版本 | 最后心跳 | 操作
- **KPI指标**: Agent总数 | 在线数 | 离线数 | eBPF占比
- **图表**: 无
- **Mock生成**: for i 1→25 Agent节点

### GET /api/v1/attacks/whitelist?page=1&page_size=10
- **业务来源**: §5.2.3 自动化阻断 — 白名单管理
- **必含字段**: entry_id, ip_or_cidr, reason, created_by, created_at, expire_at, status
- **表格列头**: IP/CIDR | 原因 | 创建人 | 创建时间 | 过期时间 | 操作
- **KPI指标**: 无
- **图表**: 无
- **Mock生成**: for i 1→15 白名单 IP/CIDR