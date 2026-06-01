# Phase 1.2 Prompt: API 契约自动提取 (双模适配版)

你是 API 契约提取专家。前端团队已通过**双模 API 适配器 (Dual-Mode API Adapter)** 模式实现数据绑定。你的任务是从中提取真实的后端契约。

## 输入

- `js/views/*.js`：所有前端 View Component 源代码（含 `apiFetch` 双模适配器）

## 关键认知

`apiFetch` 函数包含两个分支：
- `if (!window.APP_CONFIG.USE_MOCK)` → 真实 `fetch()` 调用（软著审查员看到这个就认定系统有动态通信能力）
- Mock 数据分支 → **你从这里提取 API 端点路径和响应 Schema**

**为什么从 Mock 分支提取**：Mock 分支的 JSON 结构最完整、字段名与后端 DB 列名严格一致、无需猜测字段类型。

## 提取策略（严格基于 apiFetch Mock 分支静态分析）

### 步骤 1：提取端点 (Endpoints)

逐个扫描 `js/views/*.js` 文件中 `apiFetch` 函数体。

**扫描目标**：所有 `url.includes('...')` 中的路径字符串。

```
输入示例：
if (url.includes('/api/v1/dashboard/summary')) { ... }
if (url.includes('/api/v1/assets/hosts/high-risk')) { ... }

提取结果 → 端点清单：
GET /api/v1/dashboard/summary
GET /api/v1/assets/hosts/high-risk
```

**HTTP Method 推断规则**：
- 带 `?limit=` / `?page=` 参数的 → `GET`
- `options.body` 存在的 → `POST` / `PUT`
- `remove` / `delete` 关键词在 URL 中 → `DELETE`

### 步骤 2：提取响应 Schema

逐个分析每个 `url.includes()` 分支中 `return { ... }` 的 JSON 对象结构。

**分析规则**：
- 顶层 `code` 字段 → 忽略（通用字段）
- 顶层 `data` 字段 → 响应体主体
- `data` 如果是对象 → 直接映射为 Schema properties
- `data.items` 是数组 → 提取数组元素的所有字段作为 Schema
- `data.total` 存在 → 说明是分页接口

**示例**：

```javascript
// 前端 apiFetch Mock 分支代码：
if (url.includes('/api/v1/dashboard/summary')) {
    return {
        code: 200,
        data: {
            total_assets: 12847,
            critical_risks: 326,
            alerts_24h: 1892,
            protection_coverage: 94.7
        }
    };
}

// 提取结果 → OpenAPI Schema：
DashboardSummaryResponse:
  type: object
  properties:
    total_assets:
      type: integer
    critical_risks:
      type: integer
    alerts_24h:
      type: integer
    protection_coverage:
      type: number
```

### 步骤 3：类型推断

从 Mock 数据的具体值反向推断字段类型：

| Mock 值 | 推断类型 |
|---------|---------|
| `12847`, `24`（纯整数） | `integer` |
| `94.7`（浮点数） | `number` / `format: float` |
| `"SRV-BJ-001"`（字符串） | `string` |
| `"2026-05-28T14:22:00Z"`（ISO 时间） | `string` / `format: date-time` |
| `true` / `false` | `boolean` |
| `[{...}]`（数组） | `array`，items 提取子 Schema |

### 步骤 4：去重合并

多个页面可能引用相同接口路径，合并为一个 Schema 定义。

---

## 数据库推导策略 (database_schema.sql)

严格根据提取出的 OpenAPI Schema 实体进行数据库建模。

**推导规则**：

1. **实体识别**：每个带 `items` 数组的响应 Schema 对应一张数据库表
2. **逐字段映射**：Schema 中每个 property 对应表的一个列
3. **类型映射**：

| OpenAPI 类型 | MySQL 类型 |
|-------------|-----------|
| `integer` | `INT` 或 `BIGINT` |
| `number` | `DECIMAL(10,2)` |
| `string`（短文本） | `VARCHAR(n)` |
| `string`（长文本/JSON） | `TEXT` / `JSON` |
| `string` / `format: date-time` | `DATETIME` |
| `boolean` | `TINYINT(1)` |

4. **推断主键**：包含 `_id` 后缀的字段优先作为主键候选；若 `id` 字段唯一性，设为 `PRIMARY KEY AUTO_INCREMENT`
5. **推断外键**：字段名含另一个实体名 + `_id` 的 → `FOREIGN KEY REFERENCES`
6. **强制审计字段**：每张表添加 `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` 和 `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
7. **强制索引**：为 `ip_address`、`cve_id`、`status`、`risk_level` 等高频筛选字段添加 `INDEX`

**示例**：

```sql
-- 从前端 apiFetch Mock 分支自动推导
-- 源: /api/v1/assets/hosts/high-risk → items[0]
CREATE TABLE host_assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    host_id VARCHAR(64) NOT NULL UNIQUE COMMENT '主机唯一标识',
    host_name VARCHAR(255) NOT NULL COMMENT '主机名称',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP地址',
    os_name VARCHAR(128) COMMENT '操作系统名称',
    os_version VARCHAR(64) COMMENT '操作系统版本',
    cve_id VARCHAR(20) COMMENT '关联CVE编号',
    cvss_score DECIMAL(3,1) COMMENT 'CVSS评分',
    vuln_name VARCHAR(512) COMMENT '漏洞名称',
    status ENUM('open','in_progress','fixed','ignored') DEFAULT 'open',
    discovered_at DATETIME COMMENT '发现时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ip (ip_address),
    INDEX idx_cve (cve_id),
    INDEX idx_status (status),
    INDEX idx_risk (cvss_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机资产表';
```

---

## openapi.yaml 生成规范

```yaml
openapi: "3.0.3"
info:
  title: "{产品名称} API"
  version: "1.0.0"
  description: "自动从 apiFetch Mock 分支静态分析提取"

servers:
  - url: http://localhost:8080/api/v1
    description: 本地开发服务器

paths:
  /dashboard/summary:
    get:
      summary: 获取首页态势汇总
      tags: [Dashboard]
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  data:
                    $ref: '#/components/schemas/DashboardSummary'

components:
  schemas:
    DashboardSummary:
      type: object
      properties:
        total_assets:
          type: integer
        critical_risks:
          type: integer
        alerts_24h:
          type: integer
        protection_coverage:
          type: number
```

---

## 交付规范

1. **接口对应 100%**：`openapi.yaml` 中的每个 path 必须能在前端 `apiFetch` Mock 分支中找到对应的 `url.includes()` 分支
2. **字段对应 100%**：Schema 中的每个 property 必须在前端取值代码中有对应引用（如 `summary.total_assets`）
3. **不凭空创造**：禁止添加前端 `apiFetch` Mock 分支中不存在的接口或字段
4. **表结构自洽**：`database_schema.sql` 中的每张表必须对应至少一个 API Schema
5. **文件保存位置**：工作目录根目录下的 `openapi.yaml` 和 `database_schema.sql`
