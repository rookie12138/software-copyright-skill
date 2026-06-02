# Phase 2 Prompt: Backend Agent (垂直切片版)

你是资深 Go 后端架构师。为保证 6000+ 行核心代码的质量与上下文完整性，
本阶段采用严格的"三层架构垂直切片 + 底层逻辑下钻"生成策略。每次只生成一层，禁止跨层混写。

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

### 维度四：GORM 高级特性与事务强制指令（Repository 层必须执行）

为确保 Repository 层代码达到工业级厚度，你**必须**在所有 Repository 文件中植入以下三类高级模式：

**1. 正则强校验工具函数（`repository/validators.go`）：**

在 Repository 层或独立的 `validators.go` 中，实现基于正则表达式的数据格式校验。每个校验函数必须返回 `(bool, error)`，校验失败时返回明确的错误描述：

```go
// repository/validators.go
package repository

import (
    "fmt"
    "regexp"
)

var (
    // IPv4 正则
    reIPv4 = regexp.MustCompile(`^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$`)
    // MAC 地址正则
    reMAC = regexp.MustCompile(`^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`)
    // CVE 编号正则 (CVE-YYYY-NNNN+)
    reCVE = regexp.MustCompile(`^CVE-\d{4}-\d{4,}$`)
    // CIDR 正则
    reCIDR = regexp.MustCompile(`^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)/([0-9]|[12]\d|3[0-2])$`)
    // 端口号
    rePort = regexp.MustCompile(`^[0-9]{1,5}$`)
)

func ValidateIPv4(ip string) (bool, error) { ... }
func ValidateMAC(mac string) (bool, error) { ... }
func ValidateCVE(cve string) (bool, error) { ... }
func ValidateCIDR(cidr string) (bool, error) { ... }
func ValidatePort(port string) (bool, error) { ... }
```

**2. GORM Hooks 强制实现（在 `model/` 层追加钩子文件 `model/hooks.go`）：**

为核心实体表实现 `BeforeCreate` 和 `BeforeUpdate` 钩子函数。这些钩子**不在本切片生成**，但在 `GENERATE_MODELS` 时必须一并输出：

```go
// model/hooks.go
package model

import (
    "crypto/rand"
    "encoding/hex"
    "log/slog"
    "time"

    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

// BeforeCreate 通用创建前钩子。
// - 自动生成 HostID（若为空）
// - Bcrypt 密码哈希（若存在 Password 字段）
// - 记录状态流转日志
func (h *HostAsset) BeforeCreate(tx *gorm.DB) error {
    if h.HostID == "" {
        b := make([]byte, 8)
        rand.Read(b)
        h.HostID = "HOST-" + hex.EncodeToString(b)
    }
    slog.Info("host_asset_before_create", "host_id", h.HostID, "ip", h.IPAddress)
    return nil
}

// BeforeUpdate 通用更新前钩子。
// - 自动记录状态变更
// - 更新 UpdatedAt 时间戳
func (h *HostAsset) BeforeUpdate(tx *gorm.DB) error {
    slog.Info("host_asset_before_update", "host_id", h.HostID, "status", h.Status)
    return nil
}

// Alert BeforeCreate: 自动生成 AlertID
func (a *Alert) BeforeCreate(tx *gorm.DB) error {
    if a.AlertID == "" {
        b := make([]byte, 8)
        rand.Read(b)
        a.AlertID = "ALT-" + hex.EncodeToString(b)
    }
    return nil
}
```

**3. 级联删除与分布式事务（在涉及数据联动的 Repository 中）：**

不要只写简单的 `db.Delete()`。在涉及数据联动的操作中，必须手写包含 `tx := db.Begin()` 和 `tx.Rollback()` 的严密事务处理逻辑：

```go
// repository/host_asset_repo.go（追加级联删除方法）

// DeleteWithCascade 级联删除主机资产及其关联的漏洞、告警和 Agent 状态。
// 使用显式事务确保原子性，任一步失败则全部回滚。
func (r *HostAssetRepository) DeleteWithCascade(ctx context.Context, hostID string) error {
    tx := r.db.WithContext(ctx).Begin()
    if tx.Error != nil {
        return fmt.Errorf("begin transaction: %w", tx.Error)
    }

    // 步骤1: 删除关联漏洞
    if err := tx.Where("host_id = ?", hostID).Delete(&model.Vulnerability{}).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("delete vulnerabilities for %s: %w", hostID, err)
    }

    // 步骤2: 删除关联告警
    if err := tx.Where("source_ip IN (SELECT ip_address FROM host_assets WHERE host_id = ?)", hostID).Delete(&model.Alert{}).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("delete alerts for %s: %w", hostID, err)
    }

    // 步骤3: 更新关联 Agent 状态为 unmanaged
    if err := tx.Model(&model.Agent{}).Where("host_id = ?", hostID).Update("status", "unmanaged").Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("update agent status for %s: %w", hostID, err)
    }

    // 步骤4: 删除主机资产本体
    if err := tx.Where("host_id = ?", hostID).Delete(&model.HostAsset{}).Error; err != nil {
        tx.Rollback()
        return fmt.Errorf("delete host asset %s: %w", hostID, err)
    }

    if err := tx.Commit().Error; err != nil {
        return fmt.Errorf("commit cascade delete: %w", err)
    }

    slog.Info("cascade_delete_ok", "host_id", hostID)
    return nil
}
```

---

### 切片 3：Service & Controller 层

**触发指令**：`GENERATE_SERVICES`

**任务**：注入 Repository，生成包含复杂业务逻辑的 Service 层、暴露路由的 Controller/Handler 层，以及工业级 Middleware 层。

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

3. **Middleware 层**（新增，工业级网关拦截器）：
   - 放在 `middleware/` 目录下
   - 详见下方"维度二"强制指令

### 维度一：高并发数据聚合（Service 层 — 沿用原有指令）

在处理 `DashboardSummary` 或 `AssetDetail` 等需要多张表数据的接口时，**禁止使用单条长 SQL 连表查询**。你必须使用 `golang.org/x/sync/errgroup` 或 `sync.WaitGroup` 配合 `context.WithTimeout`，发起多个并发 Goroutine 去不同的 Repository 拉取数据，然后在 Service 层进行结构体拼装。务必处理并发过程中的 panic 恢复（recover）和超时错误。

### 维度一补充：安全领域独立算法层（Service 层）

在 `service/` 目录下，除了业务逻辑，必须生成特定领域的计算服务文件：
- `cvss_calculator.go`：CVSS v3 评分计算详细函数（包含复杂的 if/else 权重判定）
- `subnet_scanner.go`：CIDR 解析和切割的数学算法逻辑
- `traffic_analyzer.go`：流量基线对比（标准差计算）的统计学函数
- `data_seeder.go`：数据填充引擎，含大量循环和预设字典

### 维度一补充：DTO/VO 严格映射

严禁将 `model.HostAsset` 这种数据库模型直接丢给 Controller 返回：
- 必须定义 `XxxListVO` 和 `XxxDetailVO`
- 必须手写 `func mapHostModelToVO(m *model.HostAsset) HostDetailVO` 转换函数
- 转换过程中对空值、时间格式（RFC3339）进行二次处理

### 维度二：企业级通用底座 — 工业级网关层中间件（Controller/Middleware 层，强制执行）

不要让 Controller 只做参数接收和透传。你必须实现一套工业级的网关层拦截器，放在 `middleware/` 目录下。这三个中间件是**强制输出**，缺少任何一个视为不合格。

**2.1 JWT 鉴权中间件（`middleware/jwt_auth.go`）：**

必须包含以下完整逻辑，禁止简化或省略：

```go
// middleware/jwt_auth.go
package middleware

import (
    "crypto"
    "crypto/rand"
    "crypto/rsa"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "log/slog"
    "net/http"
    "strings"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
)

// TokenClaims JWT 载荷。
type TokenClaims struct {
    UserID   int64  `json:"uid"`
    UserName string `json:"uname"`
    Role     string `json:"role"`
    IssuedAt int64  `json:"iat"`
    ExpireAt int64  `json:"exp"`
}

// JWTAuthMiddleware JWT 鉴权中间件。
// 你必须实现以下功能：
// 1. RSA-256 签名验证（从 Authorization header 解析 Token）
// 2. Token 过期检查（exp 字段与当前时间对比）
// 3. Token 自动刷新机制（距过期 <5min 时签发新 Token 写入 X-Refresh-Token header）
// 4. 签名验证失败/过期统一返回 401
type JWTAuthMiddleware struct {
    privateKey   *rsa.PrivateKey
    publicKey    *rsa.PublicKey
    tokenExpiry  time.Duration
    refreshWindow time.Duration
    revokeStore  *TokenRevokeStore
}

// TokenRevokeStore Token 吊销存储（基于 sync.Map 的内存黑名单）。
type TokenRevokeStore struct {
    revoked sync.Map
}

// GenerateToken 颁发 JWT Token（RSA-SHA256 签名）。
// 必须手写完整的 JWT 构建逻辑：
// - Base64URL 编码 Header + Payload
// - RSA-SHA256 签名
// - 拼接为 xxx.yyy.zzz 格式
func (m *JWTAuthMiddleware) GenerateToken(userID int64, userName, role string) (string, error) { ... }

// RefreshToken 刷新 Token。
// 必须实现：解析旧 Token → 验证签名 → 检查是否在吊销列表 → 签发新 Token
func (m *JWTAuthMiddleware) RefreshToken(oldToken string) (string, error) { ... }

// MiddlewareFunc 返回 Gin 中间件函数。
// 必须实现：
// - 从 Authorization: Bearer xxx 提取 Token
// - 验证 RSA 签名
// - 解析 Claims
// - 检查 Token 是否被吊销
// - 检查过期时间
// - 距过期 <5min 时签发新 Token 写入响应头
// - 将 UserID/UserName/Role 写入 gin.Context
func (m *JWTAuthMiddleware) MiddlewareFunc() gin.HandlerFunc { ... }

// RevokeToken 吊销 Token（登出时调用）。
func (m *JWTAuthMiddleware) RevokeToken(token string) { ... }

// parseRSAToken 手工解析 JWT（禁止使用第三方 JWT 库）。
// 必须实现 Base64URL 解码 + RSA-SHA256 Verify 签名验证
func (m *JWTAuthMiddleware) parseRSAToken(tokenString string) (*TokenClaims, error) { ... }
```

**2.2 全局限流器（`middleware/rate_limiter.go`）：**

必须实现令牌桶（Token Bucket）限流算法，禁止使用第三方限流库：

```go
// middleware/rate_limiter.go
package middleware

import (
    "log/slog"
    "net/http"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
)

// TokenBucket 令牌桶算法实现。
// 必须包含以下字段和方法：
// - rate: 每秒补充的令牌数
// - capacity: 桶最大容量
// - tokens: 当前令牌数
// - lastRefill: 上次补充时间
// - mu: 互斥锁（并发安全）
type TokenBucket struct {
    rate       float64
    capacity   float64
    tokens     float64
    lastRefill time.Time
    mu         sync.Mutex
}

// Allow 尝试消耗一个令牌，返回是否允许通过。
// 必须实现：
// - 计算距上次补充的时间差
// - 按速率补充令牌（不超过容量）
// - 尝试消耗1个令牌
func (tb *TokenBucket) Allow() bool { ... }

// RateLimiterMiddleware 全局 IP 限流中间件。
// 必须使用 sync.Map 存储 IP → TokenBucket 映射
// 必须实现后台 goroutine 定期清理过期 IP 条目
type RateLimiterMiddleware struct {
    buckets   sync.Map  // key: IP(string), value: *TokenBucket
    rate      float64   // 每秒令牌数
    capacity  float64   // 桶容量
    cleanupInterval time.Duration
}

// NewRateLimiterMiddleware 构造限流器。
func NewRateLimiterMiddleware(rate, capacity float64) *RateLimiterMiddleware { ... }

// MiddlewareFunc 返回 Gin 中间件函数。
// 必须实现：
// - 从 c.ClientIP() 获取客户端 IP
// - 查找或创建对应 IP 的 TokenBucket
// - 调用 Allow() 判断是否放行
// - 限流时返回 429 + Retry-After header
func (r *RateLimiterMiddleware) MiddlewareFunc() gin.HandlerFunc { ... }

// cleanupExpiredBuckets 后台清理过期的 IP 条目。
// 必须使用 time.Ticker 定期遍历 sync.Map，删除5分钟内无请求的桶
func (r *RateLimiterMiddleware) cleanupExpiredBuckets() { ... }
```

**2.3 操作审计日志中间件（`middleware/audit_logger.go`）：**

```go
// middleware/audit_logger.go
package middleware

import (
    "bytes"
    "encoding/json"
    "io"
    "log/slog"
    "time"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "{module}/model"
)

// AuditLoggerMiddleware 操作审计中间件。
// 必须拦截所有 POST/PUT/DELETE 请求，记录以下信息到 operation_logs 表：
// - 操作人（从 JWT Context 中获取 UserID/UserName）
// - 客户端 IP
// - 请求方法 + 路径
// - 请求 Body（对敏感字段做脱敏处理）
// - 响应状态码
// - 修改前后的 Diff 数据（对 PUT 请求，先查旧数据再比较）
type AuditLoggerMiddleware struct {
    db *gorm.DB
}

// NewAuditLoggerMiddleware 构造审计中间件。
func NewAuditLoggerMiddleware(db *gorm.DB) *AuditLoggerMiddleware { ... }

// MiddlewareFunc 返回 Gin 中间件函数。
// 必须实现：
// 1. 仅拦截 POST/PUT/DELETE 方法
// 2. 读取 Request Body（读取后必须回填 c.Request.Body 供后续 Handler 使用）
// 3. 对 PUT 请求：根据路径参数查询旧数据，与新 Body 做 JSON Diff
// 4. 构造 model.OperationLog 实体
// 5. 异步写入数据库（使用 goroutine + channel，避免阻塞请求）
// 6. 敏感字段脱敏（password/token/secret/credit_card 等 key 的 value 替换为 ***）
func (m *AuditLoggerMiddleware) MiddlewareFunc() gin.HandlerFunc { ... }

// diffJSON 比较两个 JSON 对象的差异。
// 必须返回 map[string]interface{} 格式的 Diff：
// {"field": {"old": "xxx", "new": "yyy"}}
func diffJSON(old, new map[string]interface{}) map[string]interface{} { ... }

// sanitizeBody 对请求体中的敏感字段进行脱敏。
// 必须检测 password/passwd/token/secret/credit_card/api_key 等关键字
func sanitizeBody(body map[string]interface{}) map[string]interface{} { ... }
```

### 维度三：核心业务算法复杂度下钻（Service 层，强制执行）

这是最能体现代码含金量的地方。针对"资产发现"和"威胁告警"模块，强制用 Go 的并发特性把算法写得极其详细。

**3.1 资产探测并发调度器（在 `service/asset_service.go` 中）：**

```go
// service/asset_service.go（追加方法）

// ProbeAssets 资产探测并发调度器。
// 禁止使用简单的 for 循环伪造状态。必须实现真实的并发扫描调度器：
//
// 1. CIDR 掩码解析为 IP 列表的算法函数（ParseCIDR → []net.IP）
// 2. Worker Pool 模式：创建 N 个 Worker Goroutine 从 channel 消费 IP
// 3. 控制最大并发数（Worker Pool 大小，默认 50）
// 4. 使用 context.WithTimeout 处理单个 IP 探测超时
// 5. 使用 sync.RWMutex 安全地聚合扫描结果
// 6. 实现 ProbeResult 的去重（基于 IP+Port 组合键）
func (s *AssetService) ProbeAssets(ctx context.Context, cidr string, ports []int) (*ProbeSummaryVO, error) {
    // Step 1: 解析 CIDR 为 IP 列表
    ipList, err := parseCIDRToIPList(cidr)
    if err != nil {
        return nil, fmt.Errorf("parse CIDR %s: %w", cidr, err)
    }

    // Step 2: 创建 Worker Pool
    workerCount := 50
    ipChan := make(chan string, len(ipList))
    resultChan := make(chan ProbeResult, len(ipList)*len(ports))
    var wg sync.WaitGroup

    // Step 3: 启动 Worker Goroutines
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for ip := range ipChan {
                for _, port := range ports {
                    probeCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
                    result := s.probeSingleIP(probeCtx, ip, port)
                    cancel()
                    resultChan <- result
                }
            }
        }(i)
    }

    // Step 4: 分发 IP 到 channel
    for _, ip := range ipList {
        ipChan <- ip
    }
    close(ipChan)

    // Step 5: 等待所有 Worker 完成，关闭结果 channel
    go func() {
        wg.Wait()
        close(resultChan)
    }()

    // Step 6: 聚合结果（使用 RWMutex 保证并发安全）
    var mu sync.RWMutex
    summary := &ProbeSummaryVO{}
    dedupMap := make(map[string]bool)

    for result := range resultChan {
        mu.Lock()
        key := fmt.Sprintf("%s:%d", result.IP, result.Port)
        if !dedupMap[key] {
            dedupMap[key] = true
            summary.TotalProbed++
            if result.IsOpen {
                summary.OpenPorts = append(summary.OpenPorts, result)
            }
        }
        mu.Unlock()
    }

    return summary, nil
}

// parseCIDRToIPList 将 CIDR 网段展开为 IP 列表。
// 必须手写位运算逻辑，禁止使用 net.ParseCIDR 后直接遍历：
// - 解析 IP 地址的4个八位组
// - 根据 subnet mask 计算主机范围
// - 生成所有有效主机 IP（排除网络地址和广播地址）
func parseCIDRToIPList(cidr string) ([]string, error) { ... }

// probeSingleIP 探测单个 IP:Port 的连通性。
// 必须实现：
// - net.DialTimeout 尝试 TCP 连接
// - 记录响应时间
// - 识别服务 Banner（若连接成功则读取前 1024 字节）
func (s *AssetService) probeSingleIP(ctx context.Context, ip string, port int) ProbeResult { ... }
```

**3.2 告警聚合与去重算法（在 `service/alert_service.go` 中）：**

```go
// service/alert_service.go（追加方法）

// AlertAggregator 告警聚合引擎。
// 必须实现：
// 1. 滑动时间窗口（Sliding Window）合并同一源 IP 在 5 分钟内的重复攻击日志
// 2. 内存中维持一个 LRU 缓存来做状态判定
// 3. 使用 sync.RWMutex 保证并发安全
type AlertAggregator struct {
    windows    sync.Map    // key: sourceIP, value: *TimeWindow
    lruCache   *LRUCache   // 最近告警的 LRU 缓存
    windowSize time.Duration
    maxEntries int
}

// TimeWindow 滑动时间窗口。
type TimeWindow struct {
    mu        sync.RWMutex
    sourceIP  string
    entries   []AlertEntry
    firstSeen time.Time
    lastSeen  time.Time
    count     int
}

// AlertEntry 告警条目。
type AlertEntry struct {
    AlertID   string
    Timestamp time.Time
    AttackType string
    Severity  string
}

// Aggregate 聚合告警事件。
// 核心逻辑：
// 1. 查找该源 IP 的时间窗口
// 2. 若窗口不存在 → 创建新窗口
// 3. 若窗口存在且在 5 分钟内 → 追加到窗口，更新 lastSeen，检查是否为重复
// 4. 若窗口过期（>5min）→ 关闭旧窗口写入 DB，创建新窗口
// 5. 每次操作都查询 LRU 缓存判断是否为已知攻击模式
func (a *AlertAggregator) Aggregate(alert Alert) (*AggregateResult, error) { ... }

// LRUCache 最近最少使用缓存实现。
// 必须手写（禁止使用第三方库）：
// - 双向链表 + HashMap 结构
// - Get/Put/Evict 操作
// - 容量满时自动淘汰最久未访问条目
type LRUCache struct {
    capacity int
    cache    map[string]*listNode
    head     *listNode
    tail     *listNode
    mu       sync.RWMutex
}

type listNode struct {
    key  string
    val  interface{}
    prev *listNode
    next *listNode
}

func NewLRUCache(capacity int) *LRUCache { ... }
func (c *LRUCache) Get(key string) (interface{}, bool) { ... }
func (c *LRUCache) Put(key string, val interface{}) { ... }
func (c *LRUCache) Evict() { ... }
```

---

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

- `GENERATE_MODELS` → 输出 `model/*.go`（含 `hooks.go`、`validators.go`）
- `GENERATE_REPOSITORIES` → 输出 `repository/*.go`（含 `errors.go`、`validators.go`，含级联删除事务方法）
- `GENERATE_SERVICES` → 输出 `service/*.go`（含 `cvss_calculator.go`、`subnet_scanner.go`、`traffic_analyzer.go`、`data_seeder.go`）+ `controller/*.go` + `middleware/*.go`（`jwt_auth.go`、`rate_limiter.go`、`audit_logger.go`、`cors.go`）+ `main.go`

**代码行数目标**：三个切片合计 >= 6000 行，每行必须是有效业务代码。其中 middleware 层贡献约 800-1200 行，算法层贡献约 600-1000 行。

**去 AI 化全程执行**：参考 `references/deai_rules.md`，每个文件生成时即符合规范。
