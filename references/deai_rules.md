# 去 AI 化代码规范 (De-AI Rules)

本规范适用于软著申请的全部后端代码（Go）和前端代码（JavaScript）。目标：让生成的代码读起来像一个有 5 年以上经验的工程师写的，消除 AI 生成痕迹。

---

## 规则 1：注释规范

### 禁止的解释性注释模式

以下注释类型一律禁用，代码审查时直接删除：

| 类别 | 示例（禁止） | 理由 |
|------|-------------|------|
| 变量定义解释 | `// 定义主机列表变量` | 变量名本身应自解释 |
| 控制流解释 | `// 如果错误不为空则返回` | 这是废话 |
| 函数调用解释 | `// 调用数据库查询` | 函数名应自解释 |
| 连接操作解释 | `// 连接数据库` | 同上 |
| 赋值解释 | `// 设置默认值` | 同上 |
| 循环解释 | `// 遍历所有主机` | 同上 |
| 初始值解释 | `// 初始化计数器` | 同上 |
| 待办标记 | `// TODO: ...` `// FIXME: ...` `// HACK: ...` | 生产代码不应有这些 |
| 分隔线注释 | `// ====== 分割线 ======` | 用空行分隔即可 |
| 序号注释 | `// 1. 第一步` `// 2. 第二步` | 代码结构应自说明 |

### 自动化去AI化正则清单

在 `build_copyright_docs.py` 中使用以下正则自动识别并剥离解释性注释：

```python
DEAI_STRIP_PATTERNS = [
    re.compile(r'\s*//\s*(定义|获取|设置|创建|删除|更新|查询|连接|初始化|遍历|判断|计算|返回|声明|赋值|配置|注册|处理|调用|发送|接收)\s'),
]
```

在 `audit_tool.py` 中使用扩展版本（含块注释检测）：

```python
EXPLANATORY_PATTERNS = [
    r'^\s*//\s*(定义|获取|设置|创建|删除|更新|查询|连接|初始化|遍历|判断|计算|返回|声明|赋值|配置|注册|处理|调用|发送|接收|解析|格式化|实例化|打开|关闭)',
    r'^\s*/\*\s*(定义|获取|设置|创建|删除|更新|查询|连接|初始化|遍历|判断|计算|返回|声明|赋值|配置|注册)',
]
```

### Docstring 与解释性注释的区分规则

在统计有效代码行时，必须区分 Docstring（保留）和解释性注释（删除）：

```python
def is_docstring_line(line):
    stripped = line.strip()
    if stripped.startswith("// "):
        rest = stripped[3:]
        # 大写字母开头或 @ 标签 → Docstring
        if rest and (rest[0].isupper() or rest.startswith("@")):
            return True
        # Func/func 开头 → Go 风格 Docstring
        if rest.startswith("Func") or rest.startswith("func "):
            return True
    # JSDoc / Go 块注释风格
    if stripped.startswith("/**") or stripped.startswith(" *") or stripped.startswith("*/"):
        return True
    return False
```

### 文件头描述表（HUMAN_DESCRIPTIONS）

在生成源代码文档时，为每个文件插入工程师口吻的模块说明，替换掉 AI 风格注释。以下为安全运营平台 6 大模块的标准描述：

```python
HUMAN_DESCRIPTIONS = {
    "index.html": (
        "// ============================================================\n"
        "// 安全运营平台 主入口页面\n"
        "// 加载顺序: 设计系统 CSS → 公共 JS 库 → 视图组件 → 装饰器 → 应用外壳\n"
        "// ============================================================"
    ),
    "router.js": (
        "// ============================================================\n"
        "// 前端路由模块 — 基于 URL Hash 的 SPA 单页路由分发器\n"
        "// 负责解析 hash 并调度到对应视图组件与装饰器\n"
        "// ============================================================"
    ),
    "app-shell.js": (
        "// ============================================================\n"
        "// 应用外壳模块 — 注册业务路由与装饰器映射\n"
        "// 生成侧边菜单、面包屑、路由导航与设计系统加载\n"
        "// ============================================================"
    ),
    "dashboard.js": (
        "// ============================================================\n"
        "// 首页态势大屏 — 四项核心 KPI 指标 + 攻击趋势图 + 风险分布图 + 实时告警表\n"
        "// 使用 ECharts 渲染折线图和饼图，支持跨路由导航到资产中心和攻击事件页面\n"
        "// ============================================================"
    ),
    "asset.js": (
        "// ============================================================\n"
        "// 资产中心 — 四个子 Tab: 主机资产 / 网站资产 / 攻击面测绘 / 流量统计\n"
        "// ============================================================"
    ),
    "host-risk.js": (
        "// ============================================================\n"
        "// 主机风险管理 — 四个子 Tab: 漏洞台账 / 扫描任务 / 扫描调度 / 配置核查\n"
        "// ============================================================"
    ),
    "web-risk.js": (
        "// ============================================================\n"
        "// Web 风险管理 — 四个子 Tab: 网站台账 / 网站漏洞 / 安全监测 / 渗透测试\n"
        "// ============================================================"
    ),
    "attack.js": (
        "// ============================================================\n"
        "// 攻击事件中心 — 六个子 Tab: 事件清单 / 攻击统计 / 阻断策略 / 白名单 / 安全 Agent / 蜜罐\n"
        "// ============================================================"
    ),
    "system.js": (
        "// ============================================================\n"
        "// 系统管理 — 七个子 Tab: 系统配置 / 在线升级 / 诊断工具 / 探针部署 / 参数管理 / 操作日志 / 联动策略\n"
        "// ============================================================"
    ),
    "main.go": (
        "// ============================================================\n"
        "// 后端服务入口 — Gin 框架启动, GORM 数据库连接, DI 依赖注入, CORS 中间件\n"
        "// ============================================================"
    ),
    "database_schema.sql": (
        "-- ============================================================\n"
        "-- 数据库建表脚本 — MySQL 8.0, InnoDB 引擎, utf8mb4 字符集\n"
        "-- 含外键约束与索引\n"
        "-- ============================================================"
    ),
}

def get_module_description(filepath):
    """根据文件路径返回层级描述（自动插入到源码文档中）"""
    if filepath.startswith("backend/model/"):
        return "数据模型层 — GORM 实体映射, 对应 MySQL 表结构"
    if filepath.startswith("backend/repository/"):
        return "数据访问层 — 封装 GORM 查询, 事务批处理, 动态过滤"
    if filepath.startswith("backend/service/"):
        return "业务逻辑层 — 并发查询, 数据聚合, 统计计算"
    if filepath.startswith("backend/controller/"):
        return "控制器层 — Gin 路由注册, 请求参数解析, 统一响应封装"
    if filepath.startswith("js/decorators/"):
        return "DOM 装饰器 — 非侵入式视觉增强, 表格斑马纹, 状态徽章"
    if filepath.startswith("css/"):
        return "样式系统 — CSS 自定义属性, 布局变量, 响应式栅格"
    if filepath.startswith("design-system/"):
        return "设计系统 — 色彩矩阵, 玻璃拟态效果, 图表暗黑主题"
    return None
```

### 允许的注释

**仅允许函数级 Docstring**，格式：

**Go：**
```go
// DiscoverSubnet performs ICMP-based host discovery within a CIDR range.
// It spawns up to maxConcurrency goroutines and respects the context deadline.
// Returns alive hosts sorted by response time.
func (e *ScanEngine) DiscoverSubnet(ctx context.Context, cidr string, maxConcurrency int) ([]HostProbe, error) {
```

**JavaScript：**
```javascript
/**
 * 渲染资产中心页面。包含四个子Tab：主机资产、网站资产、流量风险、攻击面。
 * @param {HTMLElement} container - 页面挂载容器
 * @param {Object} params - 路由参数（如 { hostId: 'SRV-BJ-001' }）
 */
window.renderAssetCenter = function(container, params) {
```

---

## 规则 2：变量命名规范

### 禁止的通用命名

| 禁止 | 应替换为 | 示例场景 |
|------|---------|---------|
| `data` | 具体业务名 | `hostEntries`, `alertRecords` |
| `result` | 具体业务名 | `scanReport`, `auditFindings` |
| `list` | 具体业务名 | `exposedPortList`, `vulnEntries` |
| `tmp` | 有意义的中间量 | `pendingHost`, `rawPayload` |
| `item` | 具体元素名 | `host`, `alert`, `task` |
| `value` | 具体值名 | `cvssScore`, `hostCount` |
| `info` | 模糊 | `hostInfo` → `hostFingerprint`, `userInfo` → `operatorProfile` |
| `obj` | 具体对象名 | `scanConfig`, `blockRule` |
| `num` | 具体计量名 | `alertCount`, `portCount` |
| `str` | 具体字符串名 | `hostname`, `cveIdentifier` |
| `arr` | 具体数组名 | `subnetList`, `cveCollection` |
| `resp` | 具体响应名 | `scanResponse`, `dashboardPayload` |
| `req` | 具体请求名 | `scanRequest`, `blockPolicyInput` |
| `i`, `j`, `k` | （循环内可接受） | 超过 3 层嵌套时用具体名 |
| `ctx` | （Go context 可接受） | 约定俗成 |
| `err` | （Go error 可接受） | 约定俗成 |

### 工业级命名前缀

建议使用以下业务术语构建变量名：

**资产类**：`asset`, `host`, `endpoint`, `node`, `instance`, `workload`, `container`
**漏洞类**：`vuln`, `exploit`, `weakness`, `exposure`, `cve`, `cvss`
**告警类**：`alert`, `incident`, `event`, `signal`, `trigger`, `detection`
**扫描类**：`scan`, `probe`, `discover`, `enumerate`, `fingerprint`, `inspect`
**网络类**：`subnet`, `cidr`, `port`, `protocol`, `traffic`, `packet`, `session`
**安全类**：`threat`, `attack`, `breach`, `compromise`, `defense`, `harden`
**任务类**：`task`, `job`, `schedule`, `cron`, `pipeline`, `workflow`

---

## 规则 3：异常处理规范

### Go 代码

**禁止：**
```go
if err != nil {
    return nil, err  // 裸返回
}
```

**必须：**
```go
if err != nil {
    // 1. 先判断具体异常类型
    if errors.Is(err, context.DeadlineExceeded) {
        slog.Warn("scan_timeout", "cidr", cidr, "elapsed", time.Since(start))
        return partialResult, ErrScanTimeout
    }
    if netErr, ok := err.(*net.OpError); ok {
        slog.Warn("network_unreachable", "addr", addr, "op", netErr.Op)
        return ScanResult{Reachable: false, Reason: "network unreachable"}, nil
    }
    // 2. 兜底记录完整错误信息
    slog.Error("scan_failed", "cidr", cidr, "error", err)
    return nil, fmt.Errorf("discover subnet %s: %w", cidr, err)
}
```

**必须使用的具体异常类型：**
- `net.Error` / `*net.OpError` — 网络操作失败
- `context.DeadlineExceeded` — 超时
- `context.Canceled` — 取消
- `sql.ErrNoRows` — 查询无结果
- `*os.PathError` — 文件操作失败
- `*json.SyntaxError` — JSON 解析错误
- `*strconv.NumError` — 数字解析错误
- 自定义业务错误（`ErrAssetNotFound`, `ErrScanTimeout` 等）

### JavaScript 代码（前端）

前端 View Component 中数据硬编码，通常不需要 try-catch。如需异常处理：

```javascript
// 禁止
try {
    var chart = echarts.init(dom);
} catch (e) {
    console.log(e);
}

// 允许
var chartDom = container.querySelector('#attack-trend-chart');
if (!chartDom) {
    console.warn('Chart container #attack-trend-chart not found');
    return;
}
var chart = echarts.init(chartDom);
```

---

## 规则 4：线程安全规范

### Go 并发安全

**共享数据结构必须加锁：**

```go
// 读写锁保护的热数据缓存
type AlertBuffer struct {
    mu      sync.RWMutex
    entries []AlertRecord
    maxSize int
}

func (b *AlertBuffer) Push(record AlertRecord) {
    b.mu.Lock()
    defer b.mu.Unlock()
    if len(b.entries) >= b.maxSize {
        b.entries = b.entries[1:]
    }
    b.entries = append(b.entries, record)
}

func (b *AlertBuffer) Snapshot() []AlertRecord {
    b.mu.RLock()
    defer b.mu.RUnlock()
    copied := make([]AlertRecord, len(b.entries))
    copy(copied, b.entries)
    return copied
}
```

**goroutine 必须有 recover 保护：**

```go
go func() {
    defer func() {
        if r := recover(); r != nil {
            slog.Error("goroutine_panic", "recover", r, "stack", debug.Stack())
        }
    }()
    // 实际逻辑
}()
```

**连接池管理：**
- 数据库连接：设置 `SetMaxOpenConns(25)` `SetMaxIdleConns(10)` `SetConnMaxLifetime(5 * time.Minute)`
- HTTP 客户端：复用 `http.Client` 实例，设置合理的 `Timeout`

---

## 规则 5：零演示数据

**禁止：**
```go
// 硬编码测试数据
hosts := []HostAsset{
    {Name: "test-server-01", IP: "192.168.1.1"},
    {Name: "demo-host", IP: "10.0.0.1"},
}
```

```go
// 返回假数据
func GetHosts() []HostAsset {
    return []HostAsset{
        {Name: "示例主机", IP: "192.168.1.100"},
    }
}
```

**必须：**
```go
// 数据来自数据库查询
func (s *AssetService) QueryHosts(ctx context.Context, filter HostFilter, offset, limit int) ([]HostAsset, int64, error) {
    hosts, total, err := s.repo.QueryHosts(ctx, filter, offset, limit)
    if err != nil {
        return nil, 0, fmt.Errorf("query hosts: %w", err)
    }
    return hosts, total, nil
}
```

---

## 规则 6：日志规范

```go
// 禁止
log.Println("error:", err)
fmt.Println("host found:", host.Name)

// 必须 — 使用 slog 结构化日志
slog.Info("host_discovered", "host_id", host.ID, "ip", host.IP, "os", host.OS)
slog.Warn("scan_partial_failure", "cidr", cidr, "scanned", scanned, "failed", failed)
slog.Error("db_query_failed", "table", "host_assets", "error", err, "query_time_ms", elapsed)
```

**日志级别使用规则：**
- `Debug`：详细的扫描进度、数据包内容
- `Info`：重要状态变化（任务开始/完成、新资产发现）
- `Warn`：可恢复的异常（超时重试、部分扫描失败）
- `Error`：不可恢复的错误（数据库连接丢失、配置解析失败）

---

## 规则 7：HTTP 接口规范

```go
// 统一的分页响应格式（与前端 apiFetch Mock 分支的 code+data 结构一致）
type PagedResponse struct {
    Code int       `json:"code"`
    Data PagedData `json:"data"`
}

type PagedData struct {
    Total    int64       `json:"total"`
    Page     int         `json:"page"`
    PageSize int         `json:"page_size"`
    Items    interface{} `json:"items"`
}

// 统一的错误响应格式
type ErrorResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Detail  string `json:"detail,omitempty"`
}

// 不暴露内部错误详情给客户端
c.JSON(http.StatusInternalServerError, ErrorResponse{
    Code:    50001,
    Message: "内部服务错误",
})
```

---

## 规则 8：不要过度设计

**不需要的：**
- 接口/抽象层：如果只有一个实现，不写 interface
- 设计模式：不滥用工厂模式、建造者模式
- 泛型：Go 1.21 泛型仅在明显减少重复代码时使用
- 中间件层：Gin 项目不需要自定义 HTTP 中间件层

**够用就好：**
- Controller → Service → Repository 三层，不需要更多
- 配置用环境变量，不需要配置中心
- 错误处理用标准 errors 包 + fmt.Errorf wrap
