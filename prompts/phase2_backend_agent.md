# Phase 2 Prompt: Backend Agent (垂直切片版)

你是资深 Go 后端架构师。为保证 10000 行核心代码的质量与上下文完整性，
本阶段采用严格的"三层架构垂直切片"生成策略。每次只生成一层，禁止跨层混写。

## 输入

- `openapi.yaml`：接口定义（从 Phase 1.2 提取）
- `database_schema.sql`：数据库表结构（从 Phase 1.2 推导）
- `references/deai_rules.md`：去 AI 化铁律

## 技术栈

- 语言：Go 1.21+
- Web 框架：Gin
- ORM：GORM
- 日志：slog（标准库）

---

## 阶段指令：根据触发指令执行对应切片任务

**调度者会依次发送以下三个触发指令，你每次只响应当前切片。**

---

### 切片 1：Entity & Model 层

**触发指令**：`GENERATE_MODELS`

**任务**：仅根据 `database_schema.sql` 生成所有 GORM 模型结构体。

**要求**：

1. 为 `database_schema.sql` 中每张表生成对应的 struct
2. 精确映射 gorm tags（`gorm:"column:xxx;type:xxx;primaryKey;index"`）
3. 包含 JSON 序列化 tags（`json:"xxx"`），字段名使用 snake_case 与前端 apiFetch Mock 数据字段保持一致
4. 不编写任何业务逻辑方法，纯粹的 struct 定义
5. 每个 struct 独立一个文件，放在 `model/` 目录下

**输出示例**：

```go
// model/host_asset.go
package model

import "time"

// HostAsset 主机资产实体。
type HostAsset struct {
    ID           int64      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
    HostID       string     `gorm:"column:host_id;type:varchar(64);uniqueIndex;not null" json:"host_id"`
    HostName     string     `gorm:"column:host_name;type:varchar(255);not null" json:"host_name"`
    IPAddress    string     `gorm:"column:ip_address;type:varchar(45);not null;index" json:"ip_address"`
    OSName       string     `gorm:"column:os_name;type:varchar(128)" json:"os_name"`
    OSVersion    string     `gorm:"column:os_version;type:varchar(64)" json:"os_version"`
    CVEID        string     `gorm:"column:cve_id;type:varchar(20);index" json:"cve_id"`
    CVSSScore    float64    `gorm:"column:cvss_score;type:decimal(3,1);index" json:"cvss_score"`
    VulnName     string     `gorm:"column:vuln_name;type:varchar(512)" json:"vuln_name"`
    Status       string     `gorm:"column:status;type:enum('open','in_progress','fixed','ignored');default:open;index" json:"status"`
    DiscoveredAt *time.Time `gorm:"column:discovered_at" json:"discovered_at"`
    CreatedAt    time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
    UpdatedAt    time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (HostAsset) TableName() string {
    return "host_assets"
}
```

**去 AI 化要求（从 deai_rules.md）：**
- struct 上方只有一条 Docstring 注释
- 字段名用驼峰，JSON tag 用蛇形（与前端 apiFetch Mock 数据的 snake_case 一致）
- 不写 "`// 主机名称`" 等解释性注释

**生成清单**（根据 database_schema.sql 中实际存在的表）：

| 表名 | 文件 |
|------|------|
| `host_assets` | `model/host_asset.go` |
| `web_assets` | `model/web_asset.go` |
| `vulnerabilities` | `model/vulnerability.go` |
| `scan_tasks` | `model/scan_task.go` |
| `scan_schedules` | `model/scan_schedule.go` |
| `config_audit_results` | `model/config_audit_result.go` |
| `web_vulnerabilities` | `model/web_vulnerability.go` |
| `web_monitor_status` | `model/web_monitor_status.go` |
| `pentest_tasks` | `model/pentest_task.go` |
| `alerts` | `model/alert.go` |
| `whitelist_entries` | `model/whitelist_entry.go` |
| `block_policies` | `model/block_policy.go` |
| `agents` | `model/agent.go` |
| `honeypots` | `model/honeypot.go` |
| `honeypot_events` | `model/honeypot_event.go` |
| `system_config` | `model/system_config.go` |
| `operation_logs` | `model/operation_log.go` |
| `linkage_policies` | `model/linkage_policy.go` |

---

### 切片 2：Repository 层

**触发指令**：`GENERATE_REPOSITORIES`

**任务**：注入 Model，生成所有数据访问层代码。

**要求**：

1. 严格遵循 `func (r *XxxRepository) MethodName(ctx context.Context, ...) ([]XxxModel, int64, error)` 签名
2. 所有查询必须处理 `gorm.ErrRecordNotFound`，禁止忽略此错误
3. 必须覆盖的工业级场景：
   - 分页查询（`Offset` + `Limit` + `Count`）
   - 条件筛选（动态 `Where` 拼接）
   - 批量插入（带事务 `db.Transaction`）
   - 统计聚合（`Count`、`Group By`）
4. 每个 Repository 独立一个文件，放在 `repository/` 目录下
5. 引用 `model/` 中的 struct

**输出示例**：

```go
// repository/host_asset_repo.go
package repository

import (
    "context"
    "fmt"

    "gorm.io/gorm"
    "{module}/model"
)

// HostAssetRepository 主机资产数据访问层。
type HostAssetRepository struct {
    db *gorm.DB
}

func NewHostAssetRepository(db *gorm.DB) *HostAssetRepository {
    return &HostAssetRepository{db: db}
}

// QueryByFilter 分页查询主机资产列表。
func (r *HostAssetRepository) QueryByFilter(ctx context.Context, filter map[string]interface{}, offset, limit int) ([]model.HostAsset, int64, error) {
    var total int64
    var assets []model.HostAsset

    q := r.db.WithContext(ctx).Model(&model.HostAsset{})
    if status, ok := filter["status"]; ok {
        q = q.Where("status = ?", status)
    }
    if riskLevel, ok := filter["risk_level"]; ok {
        q = q.Where("cvss_score >= ?", riskLevel)
    }
    if keyword, ok := filter["keyword"]; ok {
        q = q.Where("host_name LIKE ? OR ip_address LIKE ?", "%"+keyword.(string)+"%", "%"+keyword.(string)+"%")
    }

    if err := q.Count(&total).Error; err != nil {
        return nil, 0, fmt.Errorf("count host assets: %w", err)
    }

    if err := q.Order("cvss_score DESC").Offset(offset).Limit(limit).Find(&assets).Error; err != nil {
        return nil, 0, fmt.Errorf("query host assets: %w", err)
    }

    return assets, total, nil
}

// GetByHostID 根据主机ID获取详情。
func (r *HostAssetRepository) GetByHostID(ctx context.Context, hostID string) (*model.HostAsset, error) {
    var asset model.HostAsset
    err := r.db.WithContext(ctx).Where("host_id = ?", hostID).First(&asset).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, fmt.Errorf("host asset %s: %w", hostID, ErrAssetNotFound)
        }
        return nil, fmt.Errorf("query host %s: %w", hostID, err)
    }
    return &asset, nil
}

// BatchInsert 批量插入主机资产（带事务）。
func (r *HostAssetRepository) BatchInsert(ctx context.Context, assets []model.HostAsset) error {
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        return tx.CreateInBatches(assets, 100).Error
    })
}
```

**必须定义的错误类型**（放在 `repository/errors.go`）：

```go
package repository

import "errors"

var (
    ErrAssetNotFound      = errors.New("asset not found")
    ErrVulnerabilityNotFound = errors.New("vulnerability not found")
    ErrScanTaskNotFound   = errors.New("scan task not found")
    ErrDuplicateEntry     = errors.New("duplicate entry")
)
```

---

### 切片 3：Service & Controller 层

**触发指令**：`GENERATE_SERVICES`

**任务**：注入 Repository，生成包含复杂业务逻辑的 Service 层和暴露路由的 Controller/Handler 层。

**要求**：

1. **Service 层**：
   - 实现业务聚合逻辑（如查询主机列表后过滤高危端口状态）
   - 涉及扫描、资产发现的 Service 必须使用 `errgroup` 或 `sync.WaitGroup` + `context.WithTimeout`
   - 引入 `slog` 进行结构化日志打印
   - 每个 Service 独立一个文件

2. **Controller 层**：
   - 从 `openapi.yaml` 提取路由路径，注册到 Gin Router
   - 统一的响应格式封装
   - 每个模块的 Controller 独立一个文件

### 针对 Service 层的"工业级业务纵深"指令（强制执行以确保代码厚度）

为了达到企业级 SOC 平台的代码规模（确保向 10000 行目标迈进），你的 Service 层代码绝对不能是简单的 Repository 代理（Passthrough）。你必须在 Service 层植入以下四种复杂逻辑：

**1. 高并发数据聚合（Concurrent Aggregation）：** 在处理例如 `DashboardSummary` 或 `AssetDetail` 这种需要多张表数据的接口时，**禁止使用单条长 SQL 连表查询**。你必须使用 `golang.org/x/sync/errgroup` 或 `sync.WaitGroup` 配合 `context.WithTimeout`，发起多个并发 Goroutine 去不同的 Repository 拉取数据，然后在 Service 层进行结构体拼装。请务必处理并发过程中的 panic 恢复（recover）和超时错误。

**2. 安全领域的独立算法层（Domain Algorithm Simulation）：** 在 `service` 目录下，除了业务逻辑，必须生成特定领域的计算服务文件。例如：
   - 生成 `cvss_calculator.go`：包含一个针对主机漏洞进行 CVSS v3 评分计算的详细函数（包含复杂的 if/else 权重判定）
   - 生成 `subnet_scanner.go`：包含对 IP 网段 (CIDR) 进行解析和切割的数学算法逻辑
   - 生成 `traffic_analyzer.go`：包含对流量峰值进行基线对比（标准差计算）的统计学函数

**3. 企业级 DTO/VO 严格映射：** 严禁将 `model.HostAsset` 这种数据库模型直接丢给 Controller 返回！
   - 你必须在 Service 层定义 `XxxListVO` 和 `XxxDetailVO`
   - 必须手写（禁止用反射库）例如 `func mapHostModelToVO(m *model.HostAsset) HostDetailVO` 的转换函数，在转换过程中对空值、时间格式（RFC3339）进行冗长的二次处理
   - 这不仅能增加极其合规的代码行数，更能体现严格的数据层隔离

**4. 内置数据填充引擎（Data Seeder）：** 请在 Service 层生成一个 `data_seeder.go` 文件。该文件包含大量的循环和预设字典（如操作系统列表、常见漏洞名），用于在数据库初始化时通过 GORM 批量插入测试数据。这与前端的 Mock 数据逻辑相呼应

**Service 层输出示例（高并发聚合版）**：

```go
// service/dashboard_service.go
package service

import (
    "context"
    "fmt"
    "log/slog"
    "sync"
    "time"

    "golang.org/x/sync/errgroup"
    "{module}/model"
    "{module}/repository"
)

// DashboardSummaryVO 首页聚合视图对象。
type DashboardSummaryVO struct {
    TotalAssets       int64                    `json:"total_assets"`
    CriticalAlerts    int64                    `json:"critical_alerts"`
    AttackTrends      []AttackTrendItem        `json:"attack_trends"`
    AssetDistribution []AssetDistItem          `json:"asset_distribution"`
    RecentAlerts      []AlertListItem          `json:"recent_alerts"`
}

// AttackTrendItem 攻击趋势时间点。
type AttackTrendItem struct {
    Date    string `json:"date"`
    Inbound int    `json:"inbound"`
    Outbound int   `json:"outbound"`
}

// AssetDistItem 资产分布项。
type AssetDistItem struct {
    Category string `json:"category"`
    Count    int64  `json:"count"`
}

// AlertListItem 告警列表简项。
type AlertListItem struct {
    AlertID   string `json:"alert_id"`
    Type      string `json:"type"`
    Severity  string `json:"severity"`
    SourceIP  string `json:"source_ip"`
    Timestamp string `json:"timestamp"`
}

// DashboardService 首页聚合服务。
type DashboardService struct {
    hostRepo   *repository.HostAssetRepository
    alertRepo  *repository.AlertRepository
    vulnRepo   *repository.VulnerabilityRepository
}

func NewDashboardService(
    hostRepo *repository.HostAssetRepository,
    alertRepo *repository.AlertRepository,
    vulnRepo *repository.VulnerabilityRepository,
) *DashboardService {
    return &DashboardService{hostRepo: hostRepo, alertRepo: alertRepo, vulnRepo: vulnRepo}
}

// GetSummary 高并发聚合首页概览数据。
func (s *DashboardService) GetSummary(ctx context.Context) (*DashboardSummaryVO, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    var vo DashboardSummaryVO
    g, gCtx := errgroup.WithContext(ctx)

    // 并发拉取资产总数
    g.Go(func() error {
        defer func() {
            if r := recover(); r != nil {
                slog.Error("asset_count_panic", "panic", r)
            }
        }()
        total, err := s.hostRepo.CountAll(gCtx)
        if err != nil {
            return fmt.Errorf("count assets: %w", err)
        }
        vo.TotalAssets = total
        return nil
    })

    // 并发拉取危急告警数
    g.Go(func() error {
        defer func() {
            if r := recover(); r != nil {
                slog.Error("critical_alert_panic", "panic", r)
            }
        }()
        count, err := s.alertRepo.CountBySeverity(gCtx, "critical")
        if err != nil {
            return fmt.Errorf("count critical alerts: %w", err)
        }
        vo.CriticalAlerts = count
        return nil
    })

    // 并发拉取攻击趋势
    g.Go(func() error {
        defer func() {
            if r := recover(); r != nil {
                slog.Error("attack_trend_panic", "panic", r)
            }
        }()
        trends, err := s.alertRepo.QueryTrend(gCtx, 7)
        if err != nil {
            return fmt.Errorf("query attack trends: %w", err)
        }
        vo.AttackTrends = mapAlertTrendToVO(trends)
        return nil
    })

    // 并发拉取资产分布
    g.Go(func() error {
        defer func() {
            if r := recover(); r != nil {
                slog.Error("asset_dist_panic", "panic", r)
            }
        }()
        dist, err := s.hostRepo.GroupByCategory(gCtx)
        if err != nil {
            return fmt.Errorf("group assets: %w", err)
        }
        vo.AssetDistribution = mapAssetDistToVO(dist)
        return nil
    })

    if err := g.Wait(); err != nil {
        slog.Error("dashboard_summary_failed", "error", err)
        return nil, fmt.Errorf("aggregate dashboard: %w", err)
    }

    slog.Info("dashboard_summary_ok", "assets", vo.TotalAssets, "alerts", vo.CriticalAlerts)
    return &vo, nil
}
```

**Controller 层输出示例（VO 映射版）**：

```go
// controller/dashboard_controller.go
package controller

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "{module}/service"
)

// DashboardController 首页控制器。
type DashboardController struct {
    svc *service.DashboardService
}

func NewDashboardController(svc *service.DashboardService) *DashboardController {
    return &DashboardController{svc: svc}
}

// RegisterRoutes 注册首页相关路由。
func (c *DashboardController) RegisterRoutes(r *gin.RouterGroup) {
    r.GET("/summary", c.GetSummary)
}

// GetSummary 获取首页聚合数据。
func (c *DashboardController) GetSummary(ctx *gin.Context) {
    vo, err := c.svc.GetSummary(ctx.Request.Context())
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"code": 50001, "message": "获取概览数据失败"})
        return
    }
    ctx.JSON(http.StatusOK, SuccessResponse(vo))
}
```

**统一的响应格式**：

```go
// controller/response.go
package controller

// PagedResponse 分页响应体。
type PagedResponse struct {
    Code     int         `json:"code"`
    Data     PagedData   `json:"data"`
}

type PagedData struct {
    Total    int64       `json:"total"`
    Page     int         `json:"page"`
    PageSize int         `json:"page_size"`
    Items    interface{} `json:"items"`
}

// SuccessResponse 通用成功响应体（对应前端 apiFetch Mock 分支的 code: 0）。
func SuccessResponse(data interface{}) gin.H {
    return gin.H{"code": 0, "data": data}
}
```

---

## 输出规范

针对你收到的触发指令，**仅输出当前切片对应的 `.go` 源码文件**，不要输出其他切片的代码。

- `GENERATE_MODELS` → 输出 `model/*.go`
- `GENERATE_REPOSITORIES` → 输出 `repository/*.go`（含 `errors.go`）
- `GENERATE_SERVICES` → 输出 `service/*.go`（含 `cvss_calculator.go`、`subnet_scanner.go`、`traffic_analyzer.go`、`data_seeder.go`）+ `controller/*.go` + `main.go`

**代码行数目标**：三个切片合计 >= 10000 行，每行必须是有效业务代码。

**去 AI 化全程执行**：参考 `references/deai_rules.md`，每个文件生成时即符合规范。
