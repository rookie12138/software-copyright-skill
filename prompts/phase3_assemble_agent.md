# Phase 3.2 Prompt: 软著材料组装 Agent (Python 自动化)

你是软著申报材料自动化专家。禁止手动拼接文本或手工排版 Word 文档。
你的任务是生成一个 Python 脚本 `build_copyright_docs.py`，利用 `python-docx` 库完成精确排版。

## 前置环境

- Python 3.8+ 环境已安装 `python-docx` 库：`pip install python-docx`
- 后端源码位于 `backend/` 目录下（`model/`, `repository/`, `service/`, `controller/`, `middleware/`, `main.go` 等）
- UI 截图已由浏览器工具保存在 `./screenshots` 目录

---

## 全局常量

```python
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(PROJECT_ROOT, "build", "output_v2")

PRODUCT_NAME = "{从spec.json读取}"    # 默认 "安全运营平台"
PRODUCT_VERSION = "{从spec.json读取}"  # 默认 "V1.0"
PRODUCT_SHORT = "{从spec.json读取}"    # 默认 "运营平台"

PAGE_LINES = 50       # 每页行数
MIN_BACKEND_LINES = 6000  # 后端代码最低行数要求
```

---

## 模块 1：源代码文档生成 (`source_code.docx`)

### 核心原则

**纯后端代码输出，全量不截断，无注释块。**

- 只输出 `backend/` 目录下的 `.go` 文件，不输出前端代码、CSS、JS、HTML、SQL
- 不做任何行数截断（没有"前1500+省略+后1500"逻辑），所有代码行全量写入
- 不插入任何注释块（不插文件分隔标记、不插"文件不存在"注释、不插层级描述注释）
- 每个文件只插入一行 HUMAN_DESCRIPTIONS 文件头（工程师口吻），然后紧跟源码

### 1.1 文件读取与去AI化处理

**有效行过滤规则**（`read_file_lines()` 函数）：

```python
def read_file_lines(filepath):
    """读取源码文件，过滤空行和解释性注释，保留有效代码行"""
    lines = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                stripped = line.rstrip("\n\r")
                # 过滤空行
                if stripped.strip() == "":
                    continue
                # 过滤单行注释（非 Docstring）
                if stripped.strip().startswith("//") and not is_docstring_line(line):
                    continue
                lines.append(stripped)
    except Exception:
        pass
    return lines
```

**Docstring 判定函数**（保留 Docstring，删除解释性注释）：

```python
def is_docstring_line(line):
    stripped = line.strip()
    if stripped.startswith("// "):
        rest = stripped[3:]
        if rest and (rest[0].isupper() or rest.startswith("@")):
            return True
        if rest.startswith("Func") or rest.startswith("func "):
            return True
    if stripped.startswith("/**") or stripped.startswith(" *") or stripped.startswith("*/"):
        return True
    return False
```

**解释性注释自动剥离正则**：

```python
DEAI_STRIP_PATTERNS = [
    re.compile(r'\s*//\s*(定义|获取|设置|创建|删除|更新|查询|连接|初始化|遍历|判断|计算|返回|声明|赋值|配置|注册|处理|调用|发送|接收)\s'),
]

def is_explanatory_comment(line):
    for pat in DEAI_STRIP_PATTERNS:
        if pat.match(line.strip()):
            return True
    return False
```

### 1.2 文件头描述注入（HUMAN_DESCRIPTIONS）

**只保留后端文件的描述，前端文件不参与 source_code.docx：**

```python
HUMAN_DESCRIPTIONS = {
    "main.go": "// 后端服务入口 — Gin 框架启动, GORM 数据库连接, DI 依赖注入, CORS 中间件",
    # Model 层
    "host_asset.go": "// 主机资产实体 — GORM 映射 host_assets 表",
    "web_asset.go": "// 网站资产实体 — GORM 映射 web_assets 表",
    "vulnerability.go": "// 漏洞实体 — GORM 映射 vulnerabilities 表",
    "scan_task.go": "// 扫描任务实体 — GORM 映射 scan_tasks 表",
    "scan_schedule.go": "// 扫描调度实体 — GORM 映射 scan_schedules 表",
    "config_audit_result.go": "// 配置核查结果实体 — GORM 映射 config_audit_results 表",
    "web_vulnerability.go": "// Web漏洞实体 — GORM 映射 web_vulnerabilities 表",
    "web_monitor_status.go": "// 网站监测状态实体 — GORM 映射 web_monitor_status 表",
    "pentest_task.go": "// 渗透测试任务实体 — GORM 映射 pentest_tasks 表",
    "alert.go": "// 告警实体 — GORM 映射 alerts 表",
    "whitelist_entry.go": "// 白名单实体 — GORM 映射 whitelist_entries 表",
    "block_policy.go": "// 阻断策略实体 — GORM 映射 block_policies 表",
    "agent.go": "// 安全Agent实体 — GORM 映射 agents 表",
    "honeypot.go": "// 蜜罐实体 — GORM 映射 honeypots 表",
    "honeypot_event.go": "// 蜜罐事件实体 — GORM 映射 honeypot_events 表",
    "system_config.go": "// 系统配置实体 — GORM 映射 system_config 表",
    "operation_log.go": "// 操作日志实体 — GORM 映射 operation_logs 表",
    "linkage_policy.go": "// 联动策略实体 — GORM 映射 linkage_policies 表",
    # Repository 层
    "errors.go": "// 数据访问层统一错误定义",
    "host_asset_repo.go": "// 主机资产数据访问 — 分页查询/条件筛选/批量插入",
    "web_asset_repo.go": "// 网站资产数据访问",
    "vulnerability_repo.go": "// 漏洞数据访问",
    "alert_repo.go": "// 告警数据访问",
    # Service 层
    "dashboard_service.go": "// 首页聚合服务 — errgroup 四路并发拉取",
    "asset_service.go": "// 资产管理服务 — 并发扫描调度器",
    "alert_service.go": "// 告警处理服务 — 滑动窗口去重 + LRU 缓存",
    "cvss_calculator.go": "// CVSS v3 评分算法 — 基向量权重计算",
    "subnet_scanner.go": "// CIDR 网段解析算法 — IP 列表生成/掩码计算",
    "traffic_analyzer.go": "// 流量基线分析算法 — 标准差/异常检测",
    "data_seeder.go": "// 数据填充引擎 — 预设字典批量插入",
    # Controller 层
    "response.go": "// 统一响应格式封装",
    "dashboard_controller.go": "// 首页控制器",
    "asset_controller.go": "// 资产中心控制器",
    # Middleware 层
    "jwt_auth.go": "// JWT 鉴权中间件 — RSA 签名验证/Token 刷新",
    "rate_limiter.go": "// 全局限流器 — 令牌桶算法",
    "audit_logger.go": "// 操作审计中间件 — 请求拦截/Diff 记录",
    "cors.go": "// CORS 跨域中间件",
}
```

### 1.3 收集逻辑（纯后端、无注释块）

```python
def collect_source_lines():
    """只收集 backend/ 下的 .go 文件，全量输出，不插注释块"""
    all_lines = []
    backend_dir = os.path.join(PROJECT_ROOT, "backend")

    # 按层级顺序扫描: model → repository → service → controller → middleware → main.go
    layer_order = ["model", "repository", "service", "controller", "middleware"]

    for layer in layer_order:
        layer_dir = os.path.join(backend_dir, layer)
        if not os.path.isdir(layer_dir):
            continue
        go_files = sorted([
            f for f in os.listdir(layer_dir)
            if f.endswith(".go")
        ])
        for fname in go_files:
            filepath = os.path.join(layer_dir, fname)
            # 注入 HUMAN_DESCRIPTIONS（一行文件头）
            desc = HUMAN_DESCRIPTIONS.get(fname, "")
            if desc:
                all_lines.append(desc)
            # 直接追加源码行，不插分隔标记，不插层级描述
            file_lines = read_file_lines(filepath)
            all_lines.extend(file_lines)

    # 追加 main.go（根目录）
    main_path = os.path.join(backend_dir, "main.go")
    if os.path.isfile(main_path):
        desc = HUMAN_DESCRIPTIONS.get("main.go", "")
        if desc:
            all_lines.append(desc)
        all_lines.extend(read_file_lines(main_path))

    # 行数预警
    if len(all_lines) < MIN_BACKEND_LINES:
        print("[WARN] 后端有效代码行数不足 6000: {0} 行，建议增强底层逻辑下钻".format(len(all_lines)))

    return all_lines
```

### 1.4 Docx 精确排版参数

```python
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

document = Document()

# 页面设置（A4 纸，软著审查标准尺寸）
section = document.sections[0]
section.page_height = Cm(29.7)    # A4 高
section.page_width = Cm(21.0)     # A4 宽
section.top_margin = Cm(2.0)      # 上边距
section.bottom_margin = Cm(2.0)   # 下边距
section.left_margin = Cm(2.5)     # 左边距（装订侧加宽）
section.right_margin = Cm(1.5)    # 右边距

# 页眉（居中产品名+版本号）
header = section.header
header_para = header.paragraphs[0]
header_para.text = "{0} {1}".format(PRODUCT_NAME, PRODUCT_VERSION)
header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
for run in header_para.runs:
    run.font.size = Pt(9)
    run.font.name = "SimSun"

# 全量代码行（不截断、不省略）
all_lines = collect_source_lines()
total_pages = len(all_lines) // PAGE_LINES + (1 if len(all_lines) % PAGE_LINES else 0)

for page_num in range(total_pages):
    if page_num > 0:
        document.add_page_break()

    # 页标题（居中，SimHei 10pt 加粗）
    page_title = document.add_paragraph()
    page_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = page_title.add_run("{0} {1} — 源代码文档".format(PRODUCT_NAME, PRODUCT_VERSION))
    run.bold = True
    run.font.size = Pt(10)
    run.font.name = "SimHei"

    # 页码（居中，SimSun 8pt）
    page_sub = document.add_paragraph()
    page_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = page_sub.add_run("第 {0} 页 / 共 {1} 页".format(page_num + 1, total_pages))
    run.font.size = Pt(8)
    run.font.name = "SimSun"

    document.add_paragraph()

    # 代码行（Courier New 9pt，行号4位右对齐）
    start_idx = page_num * PAGE_LINES
    end_idx = min(start_idx + PAGE_LINES, len(all_lines))
    for line_num in range(start_idx, end_idx):
        line_text = all_lines[line_num]
        p = document.add_paragraph()
        p.paragraph_format.line_spacing = Pt(12)     # 12pt 行距
        p.paragraph_format.space_before = Pt(0)       # 段前间距 0
        p.paragraph_format.space_after = Pt(0)        # 段后间距 0

        display_line_num = line_num + 1
        line_prefix = "{0:4d}  ".format(display_line_num)
        run = p.add_run(line_prefix + line_text[:120])  # 每行截断120字符
        run.font.name = "Courier New"
        run.font.size = Pt(9)

document.save(os.path.join(BUILD_DIR, "source_code.docx"))
```

**排版规格总结**：

| 参数 | 值 | 说明 |
|------|---|------|
| 纸张 | A4 (21.0cm × 29.7cm) | 软著审查标准 |
| 字体 | Courier New 9pt | 等宽字体，源码标准 |
| 行号 | 4位右对齐 + 2空格 | `  1  code...` |
| 每页行数 | 50 行 | 含页标题和页码 |
| 行距 | 12pt 固定 | 紧凑排版 |
| 每行截断 | 120 字符 | 防止溢出 |
| 左边距 | 2.5cm | 装订侧加宽 |
| 右边距 | 1.5cm | 节省空间 |
| 页眉 | 产品名+版本号，SimSun 9pt 居中 | |
| 页标题 | SimHei 10pt 加粗居中 | |
| 页码 | SimSun 8pt 居中 | "第 N 页 / 共 M 页" |
| 内容来源 | **仅 backend/ 目录 .go 文件** | 不含前端/SQL/CSS/JS |
| 行数策略 | **全量输出，不截断不省略** | 无"中间省略N行" |
| 注释块 | **不插入任何注释块** | 无分隔标记/层级描述/缺失标记 |
| 最低行数 | 6000 行 | 不足时输出 WARN |
| 纯文本降级 | python-docx 不可用时输出 .txt | |

---

## 模块 2：系统截图文档生成 (`screenshots.docx`)

### 2.1 截图读取与排版

```python
screenshots_dir = os.path.join(PROJECT_ROOT, "screenshots")

image_files = sorted([
    f for f in os.listdir(screenshots_dir)
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
])

for filename in image_files:
    filepath = os.path.join(screenshots_dir, filename)
    try:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(filepath, width=Inches(6.0))

        caption = doc.add_paragraph()
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap_text = format_screenshot_caption(filename)
        run = caption.add_run(cap_text)
        run.font.name = "SimSun"
        run.font.size = Pt(10)

        doc.add_page_break()
    except Exception as e:
        print("  [WARN] 图片缺失或损坏: {0} ({1})".format(filename, e))
        continue
```

### 2.2 截图文件名 → 中文标题映射表

```python
def format_screenshot_caption(filename):
    name = os.path.splitext(filename)[0]
    name_lower = name.lower().replace("_", " ")

    mappings = {
        "dashboard":     "图 1 — 首页 — 态势感知总览",
        "asset host":    "图 2 — 资产中心 — 主机资产管理",
        "asset web":     "图 3 — 资产中心 — 网站资产管理",
        "asset traffic": "图 4 — 资产中心 — 流量风险分析",
        "asset surface": "图 5 — 资产中心 — 攻击面测绘",
        "host ledger":   "图 6 — 主机风险 — 风险台账",
        "host scan":     "图 7 — 主机风险 — 漏洞扫描",
        "host audit":    "图 8 — 主机风险 — 配置核查",
        "web ledger":    "图 9 — 网站风险 — 网站台账",
        "web monitor":   "图 10 — 网站风险 — 安全监测",
        "web pentest":   "图 11 — 网站风险 — 渗透测试",
        "attack center": "图 12 — 攻击事件 — 监测中心",
        "attack alert":  "图 13 — 攻击事件 — 威胁告警",
        "attack honeypot": "图 14 — 攻击事件 — 蜜罐配置",
        "system config": "图 15 — 系统管理 — 系统配置",
        "system log":    "图 16 — 系统管理 — 操作日志",
    }
    for key, value in mappings.items():
        if key in name_lower:
            return value
    return name
```

**排版规格**：

| 参数 | 值 |
|------|---|
| 图片宽度 | Inches(6.0) — A4 页面可容纳的最大宽度 |
| 图片对齐 | 居中 |
| 标题字体 | SimSun 10pt 居中 |
| 每张截图后 | 分页符 |

---

## 模块 3：操作手册生成 (`user_manual.docx`)

### 3.1 手册结构与文案

手册按 5 大章节组织，每章 2-6 个子节，每子节 2-4 条详细功能描述。**以下为安全运营平台的标准文案模板**：

```python
chapters = [
    (
        "1. 首页",
        "首页态势大屏提供整体安全态势的一览式展示，包含KPI指标卡片、攻击趋势图表、风险分布图表和实时告警列表。",
        [
            ("态势总览", [
                "展示四项核心KPI指标：受控资产总数、危险风险资产数、24小时告警数、防护覆盖率。",
                "每项指标卡片采用玻璃拟态设计，悬停时展示指标说明和趋势提示。",
            ]),
            ("攻击趋势图", [
                "以折线图形式展示近30天入站攻击和出站攻击的数量变化趋势。",
                "图表使用 ECharts 暗黑主题渲染，支持鼠标悬停查看每日攻击数详情。",
            ]),
            ("风险分布图", [
                "以饼图形式展示系统中危急、高危、中危、低危四个等级漏洞的数量分布和占比。",
                "饼图扇区颜色与风险等级色系一一对应（红-橙-黄-绿）。",
            ]),
            ("高危资产列表", [
                "展示风险等级最高的前5台主机资产，包含主机名、IP地址、CVE编号、CVSS评分。",
                "点击主机行可跳转到主机风险管理模块查看该主机的完整漏洞信息。",
            ]),
            ("实时告警列表", [
                "滚动展示最新安全告警信息，包含告警时间、源IP、目标IP、攻击类型、威胁等级和处置状态。",
                "告警数据通过后端 attack_alerts 表实时查询，每5秒自动刷新。",
                "点击告警行可跳转到攻击事件中心查看详细事件信息。",
            ]),
        ]
    ),
    (
        "2. 资产测绘",
        "资产测绘模块实现对各类资产的集中管理和监控，支持多维度资产信息查询和风险分析。",
        [
            ("主机资产", [
                "以分页列表形式展示所有纳管主机资产，包含主机名、IP地址、操作系统、CPU/内存/磁盘配置。",
                "每台主机关联展示其高危CVE漏洞编号和CVSS评分，自动计算综合风险等级。",
                "支持按风险等级（critical/high/medium/low）和处置状态（open/in_progress/fixed）过滤。",
                "点击主机行可查看该主机的完整资产指纹信息和漏洞关联清单。",
            ]),
            ("网站资产", [
                "展示所有Web网站资产台账，包含域名、Web服务器类型、IP地址、端口、HTTPS状态。",
                "自动识别网站CMS/框架类型（如WordPress、Nginx、Apache等），记录最近扫描时间。",
                "支持按风险等级和状态码范围进行筛选查询。",
            ]),
            ("攻击面测绘", [
                "展示所有对外开放端口的暴露清单，包含主机名、IP地址、端口号、协议类型、服务名称。",
                "每项暴露记录附带ESI（暴露严重度指数）评分，评分越高表示暴露风险越大。",
                "记录端口首次发现时间，帮助运维人员追踪攻击面变化趋势。",
            ]),
            ("流量统计", [
                "以面积图形式展示近7天入站流量、出站流量和阻断流量的变化趋势（单位：Mbps）。",
                "帮助运维人员识别异常流量峰值，判断是否存在DDoS攻击或数据外传行为。",
            ]),
        ]
    ),
    (
        "3. 主机检测",
        "主机检测模块提供面向服务器的安全风险检测、漏洞评估和配置核查能力。",
        [
            ("漏洞台账", [
                "以分页列表展示所有主机漏洞详细信息，包含CVE编号、CVSS评分、关联主机、漏洞名称和威胁等级。",
                "支持按主机ID、威胁等级、处置状态（open/fixed/false_positive）进行多条件筛选。",
                "漏洞数据来源于周期性漏洞扫描任务，自动关联主机资产信息。",
            ]),
            ("漏洞扫描任务", [
                "管理主机漏洞扫描任务，展示任务名称、扫描目标数、执行进度百分比和任务状态（completed/running/failed）。",
                "每个任务记录启动时间和执行耗时，支持查看任务执行详情。",
                "任务进度条实时更新，完成后自动将发现的漏洞写入漏洞台账。",
            ]),
            ("周期扫描调度", [
                "配置周期性漏洞扫描策略，支持自定义 Cron 表达式设置扫描频率。",
                "展示策略名称、Cron表达式、启用状态、上次执行时间和下次计划执行时间。",
                "支持按需启用或禁用特定扫描调度策略。",
            ]),
            ("配置合规核查", [
                "展示安全基线配置核查结果，对比每项配置的期望值与实际值，判断是否合规。",
                "核查项涵盖操作系统安全配置、中间件安全配置、数据库安全配置等。",
                "记录最近核查时间，支持按合规状态筛选不合规项。",
            ]),
        ]
    ),
    (
        "4. 网站检测",
        "网站检测模块提供Web应用安全检测、监测和渗透测试管理能力，保障Web业务安全。",
        [
            ("网站台账", [
                "展示所有网站资产的Web检测台账，包含域名、Web服务器、HTTP状态码、响应时间。",
                "记录SSL证书到期日期，提前提醒证书续期。",
                "支持按风险等级和HTTP状态码进行筛选。",
            ]),
            ("网站漏洞扫描", [
                "按OWASP Top 10分类标准展示Web应用漏洞，包含CVSS评分、威胁等级、漏洞描述。",
                "每个漏洞关联到具体的网站域名，方便定位和修复。",
                "支持按OWASP分类（如SQL注入、XSS、CSRF等）进行筛选。",
            ]),
            ("网站安全监测", [
                "实时展示网站可用性监测数据，包含HTTP状态码、TTFB响应时间、SSL证书有效性。",
                "记录各监测域名的在线率百分比，低于阈值自动触发告警。",
                "定期执行监测检查，记录每次检查的时间戳。",
            ]),
            ("渗透测试任务", [
                "管理针对目标网站的安全渗透测试任务，展示目标域名、任务类型和当前进度。",
                "每个任务记录发现的漏洞数量，支持查看任务执行详情。",
                "任务状态包含 pending（等待中）、running（执行中）、completed（已完成）。",
                "点击任务可跳转到攻击事件中心查看关联的攻击事件详情。",
            ]),
        ]
    ),
    (
        "5. 攻击事件",
        "攻击事件模块实现攻击检测、告警汇聚和应急响应能力，支持多种安全防护手段的综合配置。",
        [
            ("攻击事件清单", [
                "以分页列表展示所有检测到的攻击事件，包含事件时间、源IP/端口、目标IP/端口、攻击类型。",
                "每个事件标注威胁等级和处置动作（blocked-已阻断、passed-已放行、alerted-已告警）。",
                "展示攻击载荷摘要（payload_snippet），帮助安全分析师快速判断攻击特征。",
            ]),
            ("攻击类型统计", [
                "以柱状图形式展示各类攻击类型的检测总量、已阻断数量和占比百分比。",
                "支持按攻击类型维度进行下钻分析，了解当前面临的主要威胁来源。",
            ]),
            ("阻断策略管理", [
                "管理WAF/IPS自动阻断策略，展示策略名称、策略类型、命中次数和启用状态。",
                "支持创建、启用/禁用阻断策略，策略命中后自动触发 blocking 动作。",
                "命中计数器和阻断计数器自动累加，用于评估策略防护效果。",
            ]),
            ("白名单管理", [
                "管理安全策略白名单，支持按IP/CIDR地址段添加白名单条目，避免误拦截。",
                "每条白名单记录包含加白原因说明、创建人和创建时间。",
                "支持动态启用或禁用白名单条目。",
            ]),
            ("安全Agent管理", [
                "展示部署在各主机上的安全Agent节点列表，包含主机名、IP地址、所在区域、版本号。",
                "实时监控Agent运行状态（online/offline/unmanaged），记录最后心跳时间。",
                "展示Agent所在主机的CPU和内存使用率，评估Agent资源开销。",
            ]),
            ("蜜罐管理", [
                "展示蜜罐系统的部署状态，包含蜜罐名称、类型（SSH/HTTP/MySQL等）、IP地址和监听端口。",
                "统计每个蜜罐的诱捕事件总数和最近24小时捕获数，用于评估攻击者活跃度。",
                "蜜罐状态包含 active（运行中）和 maintenance（维护中）两种。",
            ]),
        ]
    ),
]
```

### 3.2 手册 Docx 排版

```python
doc = Document()

section = doc.sections[0]
section.page_height = Cm(29.7)
section.page_width = Cm(21.0)
section.top_margin = Cm(2.54)
section.bottom_margin = Cm(2.54)
section.left_margin = Cm(2.54)
section.right_margin = Cm(2.54)

# 封面
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("{0} {1}".format(PRODUCT_NAME, PRODUCT_VERSION))
run.bold = True
run.font.size = Pt(28)
run.font.name = "SimHei"

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle.add_run("产品功能说明文档")
run.font.size = Pt(18)
run.font.name = "SimHei"

doc.add_paragraph()

version_para = doc.add_paragraph()
version_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = version_para.add_run("文档版本：V1.0")
run.font.size = Pt(12)

date_para = doc.add_paragraph()
date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = date_para.add_run("日期：{0}".format(datetime.now().strftime("%Y年%m月")))
run.font.size = Pt(12)

doc.add_page_break()

# 文档说明
doc.add_heading("文档说明", level=1)
doc.add_paragraph(
    "本文档描述了{0}的产品功能模块，包括各模块的功能特性、使用说明和操作界面。"
    "文档面向产品用户、运维人员和项目验收人员，用于了解{0}的功能介绍、操作演示和界面展示。".format(PRODUCT_NAME)
)

doc.add_page_break()

# 逐章写入
for ch_title, ch_desc, sub_modules in chapters:
    doc.add_heading(ch_title, level=1)
    doc.add_paragraph(ch_desc)

    for sub_name, sub_content in sub_modules:
        doc.add_heading(sub_name, level=2)
        for para_text in sub_content:
            doc.add_paragraph(para_text)

    # 章末插入对应截图（如有）
    matching = find_matching_screenshots(ch_title, screenshots_files)
    for shot in matching:
        doc.add_picture(shot, width=Inches(5.5))
        last_para = doc.paragraphs[-1]
        last_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_page_break()

doc.save(os.path.join(BUILD_DIR, "user_manual.docx"))
```

---

## 模块 4：完整源码包 (`source_code.zip`)

```python
import zipfile

with zipfile.ZipFile(os.path.join(BUILD_DIR, "source_package.zip"), "w", zipfile.ZIP_DEFLATED) as zf:
    file_count = 0

    # 前端源码（完整保留在 zip 中，但不进 source_code.docx）
    frontend_dirs = ["css", "js", "design-system"]
    for d in frontend_dirs:
        dir_path = os.path.join(PROJECT_ROOT, d)
        if os.path.isdir(dir_path):
            for root, dirs, files in os.walk(dir_path):
                for fname in files:
                    fpath = os.path.join(root, fname)
                    arcname = os.path.relpath(fpath, PROJECT_ROOT)
                    zf.write(fpath, arcname)
                    file_count += 1

    # 前端入口
    index_path = os.path.join(PROJECT_ROOT, "index.html")
    if os.path.isfile(index_path):
        zf.write(index_path, "index.html")
        file_count += 1

    # 后端源码
    backend_dir = os.path.join(PROJECT_ROOT, "backend")
    if os.path.isdir(backend_dir):
        for root, dirs, files in os.walk(backend_dir):
            for fname in files:
                if fname.endswith(".go"):
                    fpath = os.path.join(root, fname)
                    arcname = os.path.relpath(fpath, PROJECT_ROOT)
                    zf.write(fpath, arcname)
                    file_count += 1

    # 契约文件
    for contract_file in ["database_schema.sql", "openapi.yaml"]:
        cpath = os.path.join(PROJECT_ROOT, contract_file)
        if os.path.isfile(cpath):
            zf.write(cpath, contract_file)
            file_count += 1

    # 自动生成 README
    readme = (
        "软件名称: {0}\n".format(PRODUCT_NAME) +
        "版本号: {0}\n".format(PRODUCT_VERSION) +
        "开发语言: Go (后端), JavaScript (前端), CSS, SQL\n" +
        "源文件数: {0}\n".format(file_count) +
        "生成时间: {0}\n".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")) +
        "技术栈: 前端 HTML5/CSS3/原生 JS SPA + 后端 Go/Gin/GORM + MySQL 8.0\n"
    )
    zf.writestr("README.txt", readme)
```

---

## 模块 5：构建清单 (`manifest.json`)

脚本执行完毕后自动输出构建清单，记录所有产出物和处理标记：

```python
manifest = {
    "product": PRODUCT_NAME,
    "version": PRODUCT_VERSION,
    "short_name": PRODUCT_SHORT,
    "build_time": datetime.now().isoformat(),
    "documents": {
        "source_code": "source_code.docx",
        "screenshots": "screenshots.docx",
        "user_manual": "user_manual.docx",
        "source_package": "source_package.zip",
    },
    "source_code_docx": {
        "content_scope": "backend Go only",
        "truncation": "none (full output)",
        "comment_blocks": "none",
        "min_lines": MIN_BACKEND_LINES,
        "actual_lines": len(all_lines),
    },
    "deai_processing": {
        "explanatory_comments_removed": True,
        "human_descriptions_inserted": True,
        "blank_lines_stripped": True,
        "line_numbers_added": True,
    },
}

manifest_path = os.path.join(BUILD_DIR, "manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
```

---

## 异常处理要求

脚本必须妥善处理以下场景，不能崩溃：

| 场景 | 处理方式 |
|------|---------|
| backend/ 目录不存在 | `print('[ERROR] backend/ 目录不存在，无法生成 source_code.docx')`，跳过该文档 |
| 截图目录为空 | `print('[WARN] 截图目录为空，跳过 screenshots.docx 生成')` |
| 图片文件缺失/损坏 | `print('[WARN] 图片缺失或损坏: {}'.format(filename))`，跳过该图片 |
| 非文本文件混入源码目录 | 只读取 `.go` 文件 |
| 编码错误 | 打开文件时指定 `encoding='utf-8', errors='replace'` |
| 后端代码行数不足 6000 | `print('[WARN] 后端代码行数不足 6000: {} 行'.format(count))`，继续生成但不截断 |
| python-docx 未安装 | 自动降级为纯文本输出（`.txt` 文件） |

---

## 输出要求

仅输出完整的 `build_copyright_docs.py` Python 代码。

- 脚本开头用 `"""..."""` 三引号注释说明用途、使用方式和依赖
- 包含 `if __name__ == '__main__':` 入口
- 执行完毕后打印所有产出文件路径和大小
- 所有路径使用 `os.path.join()` 确保跨平台兼容
- 脚本必须在 `PROJECT_ROOT` 目录下可直接运行
