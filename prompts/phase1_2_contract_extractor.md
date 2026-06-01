# Phase 1.2 Prompt: API 契约自动提取

你是 API 契约提取专家。你的任务是从已生成的前端 View Component 代码中提取所有接口调用，反向推导出后端的 API 规范和数据库表结构。

## 输入

- `js/views/*.js`：所有前端 View Component 源代码
- `spec.json`：了解模块结构

## 输出

两个文件：
- `openapi.yaml`：RESTful API 接口定义
- `database_schema.sql`：MySQL 表结构定义

---

## 提取策略

### 步骤 1：扫描数据访问模式

虽然前端代码中数据是硬编码的 Mock 数据，但你需要**从数据结构和请求注释中推断**每个模块需要什么接口。

遍历每个 `renderXxx()` 函数，分析以下信号：

| 信号 | 推断 |
|------|------|
| KPI 卡片中的统计数字 | 需要一个聚合查询接口 |
| 表格中的数据列 | 需要对应的分页列表接口 |
| 图表中的时序数据 | 需要趋势统计接口 |
| "新建/编辑/删除"按钮 | 需要对应的 CRUD 接口 |
| 子 Tab 切换 | 每个 Tab 可能需要独立的接口 |
| router.navigate 的参数 | 需要支持参数化查询的详情接口 |

### 步骤 2：分析数据字段

从每个页面的表格列和卡片字段中提取数据字段，例如：

首页：
```
受控主机资产数 → GET /api/dashboard/summary
  Response: { total_hosts, high_risk_count, alert_count_24h, coverage_rate }

高危资产 TOP 5 → GET /api/dashboard/top-risky-hosts?limit=5
  Response: [{ host_id, host_name, ip, risk_score, vuln_count }]

攻击趋势图 → GET /api/dashboard/attack-trend?days=7
  Response: [{ date, inbound_count, outbound_count }]

风险分布 → GET /api/dashboard/risk-distribution
  Response: { critical, high, medium, low }

实时告警列表 → GET /api/alerts?limit=8&sort=-time
  Response: [{ alert_id, time, src_ip, dst_ip, attack_type, level, status }]
```

资产中心：
```
主机列表 → GET /api/assets/hosts?page=1&page_size=10
  Response: [{ host_id, name, ip, os, cpu, memory, agent_status, risk_level }]

网站列表 → GET /api/assets/websites?page=1&page_size=10
  Response: [{ site_id, domain, ip, server, framework, ssl_expiry, status }]

攻击面 → GET /api/assets/attack-surface
  Response: [{ host_id, name, exposed_ports: [{port, service, risk}], esi_score }]
```

---

## openapi.yaml 生成规范

### 文件结构

```yaml
openapi: "3.0.3"
info:
  title: "{产品名称} API"
  version: "1.0.0"
  description: "自动从前端代码提取的 API 契约"

servers:
  - url: http://localhost:8080/api
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
                $ref: '#/components/schemas/DashboardSummary'

  # ... 所有其他接口

components:
  schemas:
    DashboardSummary:
      type: object
      properties:
        total_hosts:
          type: integer
          description: 受控主机资产总数
        high_risk_count:
          type: integer
          description: 高危风险资产数
        alert_count_24h:
          type: integer
          description: 24小时告警数
        coverage_rate:
          type: number
          format: float
          description: 安全防护覆盖率
      required:
        - total_hosts
        - high_risk_count
        - alert_count_24h
        - coverage_rate

    # ... 所有其他 Schema
```

### 接口设计原则

1. **RESTful 风格**：资源用名词复数，操作用 HTTP Method（GET/POST/PUT/DELETE）
2. **分页统一**：列表接口支持 `page` 和 `page_size` 参数，返回 `total`、`items`
3. **命名一致**：同类型接口保持相同的请求/响应字段名
4. **必须覆盖**：前端展示的每一个数据字段，都必须在某个接口的 Response Schema 中
5. **不设计前端未使用的接口**：只提取前端实际需要的数据接口

### 必备接口清单（基于前端必须展示的数据）

| 模块 | 接口 | Method |
|------|------|--------|
| Dashboard | `/dashboard/summary` | GET |
| Dashboard | `/dashboard/top-risky-hosts` | GET |
| Dashboard | `/dashboard/attack-trend` | GET |
| Dashboard | `/dashboard/risk-distribution` | GET |
| Dashboard | `/alerts` | GET |
| Asset | `/assets/hosts` | GET |
| Asset | `/assets/hosts/{id}` | GET |
| Asset | `/assets/websites` | GET |
| Asset | `/assets/websites/{id}` | GET |
| Asset | `/assets/attack-surface` | GET |
| Asset | `/assets/traffic-stats` | GET |
| Host Risk | `/host-risks/vulnerabilities` | GET |
| Host Risk | `/host-risks/vulnerabilities/{id}` | GET |
| Host Risk | `/host-risks/scan-tasks` | GET/POST |
| Host Risk | `/host-risks/scan-schedules` | GET/POST |
| Host Risk | `/host-risks/config-audits` | GET |
| Web Risk | `/web-risks/websites` | GET |
| Web Risk | `/web-risks/vulnerabilities` | GET |
| Web Risk | `/web-risks/monitor-status` | GET |
| Web Risk | `/web-risks/pentest-tasks` | GET/POST |
| Attack | `/attacks/events` | GET |
| Attack | `/attacks/whitelist` | GET/POST/DELETE |
| Attack | `/attacks/block-policies` | GET/POST |
| Attack | `/attacks/agents` | GET |
| Attack | `/attacks/honeypots` | GET/POST |
| System | `/system/config` | GET/PUT |
| System | `/system/op-logs` | GET |
| System | `/system/linkage-policies` | GET/POST |

---

## database_schema.sql 生成规范

### 从 API Schema 反向推导表结构

规则：
- 每个 `$ref` Schema 对应一张表（或视图）
- Schema 中的 `properties` → 表的列
- `type: integer` → `INT` 或 `BIGINT`
- `type: string` → `VARCHAR(n)` 或 `TEXT`
- `type: number` → `DECIMAL` 或 `FLOAT`
- `type: boolean` → `TINYINT(1)`
- `type: array` → 关联表或 JSON 列
- 所有表带 `id`、`created_at`、`updated_at`
- 外键关联用 `REFERENCES` 约束
- 为频繁查询的列添加索引

### 示例

```sql
-- 主机资产表
CREATE TABLE host_assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    host_id VARCHAR(64) NOT NULL UNIQUE COMMENT '主机唯一标识',
    host_name VARCHAR(255) NOT NULL COMMENT '主机名称',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP地址',
    mac_address VARCHAR(17) COMMENT 'MAC地址',
    os_name VARCHAR(128) COMMENT '操作系统',
    os_version VARCHAR(64) COMMENT '操作系统版本',
    cpu_cores INT COMMENT 'CPU核心数',
    memory_gb DECIMAL(6,2) COMMENT '内存(GB)',
    agent_status ENUM('online','offline','unmanaged') NOT NULL DEFAULT 'unmanaged',
    risk_level ENUM('critical','high','medium','low') DEFAULT 'low',
    last_seen_at DATETIME COMMENT '最后在线时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ip (ip_address),
    INDEX idx_risk (risk_level),
    INDEX idx_agent_status (agent_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机资产表';

-- 漏洞记录表
CREATE TABLE vulnerabilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    host_id VARCHAR(64) NOT NULL,
    cve_id VARCHAR(20) NOT NULL COMMENT 'CVE编号',
    cvss_score DECIMAL(3,1) NOT NULL COMMENT 'CVSS评分',
    vuln_name VARCHAR(512) NOT NULL COMMENT '漏洞名称',
    vuln_type VARCHAR(64) COMMENT '漏洞类型',
    discovered_at DATETIME NOT NULL COMMENT '发现时间',
    status ENUM('open','in_progress','fixed','ignored','overdue') DEFAULT 'open',
    fixed_at DATETIME COMMENT '修复时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES host_assets(host_id),
    INDEX idx_cve (cve_id),
    INDEX idx_host (host_id),
    INDEX idx_status (status),
    INDEX idx_cvss (cvss_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='漏洞记录表';
```

### 表清单（必须覆盖）

| 表名 | 说明 | 对应模块 |
|------|------|---------|
| `host_assets` | 主机资产 | 资产中心 |
| `web_assets` | 网站资产 | 资产中心 |
| `vulnerabilities` | 漏洞记录 | 主机风险 |
| `scan_tasks` | 扫描任务 | 主机风险 |
| `scan_schedules` | 周期扫描调度 | 主机风险 |
| `config_audit_results` | 配置核查结果 | 主机风险 |
| `web_vulnerabilities` | 网站漏洞 | 网站风险 |
| `web_monitor_status` | 网站监测状态 | 网站风险 |
| `pentest_tasks` | 渗透测试任务 | 网站风险 |
| `alerts` | 威胁告警 | 攻击事件 |
| `whitelist_entries` | 白名单条目 | 攻击事件 |
| `block_policies` | 阻断策略 | 攻击事件 |
| `agents` | Agent节点 | 攻击事件 |
| `honeypots` | 蜜罐配置 | 攻击事件 |
| `honeypot_events` | 蜜罐诱捕事件 | 攻击事件 |
| `system_config` | 系统配置 | 系统管理 |
| `operation_logs` | 操作日志 | 系统管理 |
| `linkage_policies` | 联动策略 | 系统管理 |

---

## 交付规范

1. `openapi.yaml` 必须包含所有前端页面需要的数据接口
2. `database_schema.sql` 必须包含所有 `openapi.yaml` 中的 Schema 对应的表
3. 两个文件的字段命名必须一致（驼峰 → 下划线转换除外）
4. 保存到工作目录根目录，供 Phase 2 使用
