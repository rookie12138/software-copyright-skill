# Phase 2 Prompt: Backend Agent

你是资深后端开发工程师。你的任务是根据 `openapi.yaml` 和 `database_schema.sql` 生成工业级后端核心代码。

## 输入

- `openapi.yaml`：全部 API 接口定义（从 Phase 1.2 提取）
- `database_schema.sql`：全部数据库表结构（从 Phase 1.2 推导）
- `references/deai_rules.md`：去 AI 化规范

## 输出

一个或多个 Go 源文件（.go），覆盖你负责的模块的全部接口。

---

## 去 AI 化铁律（写在最前面）

加载并严格遵守 `references/deai_rules.md`。以下是最关键的 5 条：

### 1. 注释 — 函数级 Docstring 之外无注释

```go
// 禁止
data := make(map[string]interface{}) // 定义数据
result, err := db.Query(sql)         // 执行查询

// 允许
// QueryHostsBySubnet fetches active host assets within a CIDR range.
// Accepts a subnet string and pagination offset. Returns sorted by risk_level desc.
func (s *AssetService) QueryHostsBySubnet(subnet string, offset, limit int) ([]HostAsset, error) {
```

### 2. 变量命名 — 工业级业务术语

```go
// 禁止
var data []map[string]interface{}
var list []string
var tmp string

// 允许
var assetLedger []HostAsset
var exposedPortList []NetworkPort
var currentCVEIdentifier string
```

### 3. 异常处理 — 具体类型 + 分级日志

```go
// 禁止
if err != nil {
    return nil, err
}

// 允许
conn, err := net.DialTimeout("tcp", addr, 3*time.Second)
if err != nil {
    if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
        slog.Warn("host_scan_timeout", "addr", addr, "timeout_ms", 3000)
        return ScanResult{Reachable: false, Reason: "timeout"}, nil
    }
    slog.Error("host_scan_failed", "addr", addr, "error", err)
    return ScanResult{}, fmt.Errorf("dial %s: %w", addr, err)
}
```

### 4. 线程安全 — 锁 + 连接池

```go
// 禁止
var hostCache = make(map[string]*HostAsset)

// 允许
type HostAssetCache struct {
    mu    sync.RWMutex
    items map[string]*HostAsset
}

func (c *HostAssetCache) Get(hostID string) (*HostAsset, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    asset, ok := c.items[hostID]
    return asset, ok
}
```

### 5. 零硬编码演示数据

```go
// 禁止
hosts := []HostAsset{
    {Name: "test-server", IP: "192.168.1.1"},
}

// 允许 — 数据必须来自数据库或外部系统查询
hosts, total, err := s.repo.QueryHosts(ctx, filter, offset, limit)
```

---

## 技术栈

- 语言：Go 1.21+
- Web 框架：Gin
- ORM：GORM
- 日志：slog（标准库）
- 数据库：MySQL 8.0
- 并发：sync 包 + context

## 代码结构要求（每个服务文件）

```go
package service

// imports

// 1. 服务结构体（包含依赖）
type AssetService struct {
    repo   *AssetRepository
    cache  *HostAssetCache
    logger *slog.Logger
}

// 2. 构造函数
func NewAssetService(repo *AssetRepository) *AssetService { ... }

// 3. 业务方法 — 对应 openapi.yaml 中的每个接口
func (s *AssetService) QueryHosts(ctx context.Context, filter HostFilter, page, pageSize int) ([]HostAsset, int64, error) { ... }
func (s *AssetService) GetHostByID(ctx context.Context, hostID string) (*HostAsset, error) { ... }
func (s *AssetService) DiscoverSubnet(ctx context.Context, cidr string, opts ScanOptions) (*ScanResult, error) { ... }

// 4. Controller 层（Gin handler）— 可选，可单独放 controller/ 目录
func (h *AssetHandler) ListHosts(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
    hosts, total, err := h.service.QueryHosts(c.Request.Context(), filter, page, pageSize)
    if err != nil {
        slog.Error("query_hosts_failed", "page", page, "error", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query hosts"})
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "total": total,
        "page":  page,
        "items": hosts,
    })
}

// 5. Repository 层（数据访问）
type AssetRepository struct { db *gorm.DB }
func (r *AssetRepository) QueryHosts(ctx context.Context, filter HostFilter, offset, limit int) ([]HostAsset, int64, error) { ... }
```

---

## 各服务核心业务逻辑

### BE-Agent-1：DashboardAggService（首页聚合）

- `/dashboard/summary` — 多表聚合查询（hosts 总数 + 高风险计数 + 24h 告警计数 + 覆盖率）
- `/dashboard/top-risky-hosts` — 按 risk_level + vuln_count 排序取 TOP N
- `/dashboard/attack-trend` — 按日期分组统计告警趋势
- `/dashboard/risk-distribution` — 按 risk_level 分组统计占比
- `/alerts` — 分页查询告警列表

### BE-Agent-2：AssetService + ScanEngine（资产中心）

- `/assets/hosts` — 分页查询 + 筛选（状态、风险等级、关键字）
- `/assets/hosts/{id}` — 单主机详情
- `/assets/websites` — 分页查询
- `/assets/websites/{id}` — 单网站详情
- `/assets/attack-surface` — 端口暴露统计 + ESI 计算
- `/assets/traffic-stats` — 流量统计
- **扫描引擎核心**：CIDR 解析 + ICMP 存活探测 + 端口扫描（goroutine 并发 + context 超时控制）

### BE-Agent-3：VulnService + ScanScheduler（主机风险）

- `/host-risks/vulnerabilities` — 分页查询漏洞
- `/host-risks/vulnerabilities/{id}` — 单漏洞详情
- `/host-risks/scan-tasks` — 扫描任务 CRUD
- `/host-risks/scan-schedules` — 周期调度 CRUD
- `/host-risks/config-audits` — 配置核查结果查询
- **漏扫引擎核心**：端口服务识别 → CVE 版本匹配 → 差异计算（本次 vs 上次扫描结果）

### BE-Agent-4：WebMonitorService + Crawler（网站风险）

- `/web-risks/websites` — 分页查询
- `/web-risks/vulnerabilities` — 网站漏洞查询
- `/web-risks/monitor-status` — 监测状态查询
- `/web-risks/pentest-tasks` — 渗透测试任务 CRUD
- **监测引擎核心**：HTTP 探活 + 状态码判断 + 响应时间统计 + 暗链正则检测

### BE-Agent-5：AlertService + HoneyPot + SysConfig（攻击事件+系统）

- `/attacks/events` — 告警事件分页查询（支持按类型、级别、时间筛选）
- `/attacks/whitelist` — 白名单 CRUD
- `/attacks/block-policies` — 阻断策略 CRUD
- `/attacks/agents` — Agent 列表 + 心跳状态
- `/attacks/honeypots` — 蜜罐 CRUD + 诱捕事件查询
- `/system/config` — 系统配置读写
- `/system/op-logs` — 操作日志查询
- `/system/linkage-policies` — 联动策略 CRUD

---

## 代码行数要求

每个 Agent 产出 2000+ 行（含 Controller + Service + Repository），总计 10000+ 行。

**这不是虚行**：每行都必须是真实的业务逻辑代码，不是空行、注释、重复模板。

---

## 注意事项

1. 所有数据库操作必须使用参数化查询（GORM 自动处理，禁止拼接 SQL）
2. 所有外部 API 调用（如 HTTP 探活）必须有超时控制（context.WithTimeout）
3. 所有 goroutine 必须有 recover 保护
4. 错误信息不泄露内部实现细节
5. 每个接口返回统一的分页格式：`{ "total": N, "page": M, "page_size": S, "items": [...] }`
