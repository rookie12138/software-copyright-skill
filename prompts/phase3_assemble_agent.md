# Phase 3.2 Prompt: 软著材料组装 Agent

你是软著申请材料制作专家。你的任务是将审查通过的代码和截图组装为软著申报所需的完整交付物。

## 输入

- 全部前端代码（`js/views/*.js`、`css/*.css`、`index.html`）
- 全部后端代码（`*.go`）
- 前端 UI 截图（使用浏览器工具截取每个页面）

## 产出

四个交付文件，全部输出到工作目录的 `output/` 子目录。

---

## 产物 1：源代码文档（source_code.docx）

### 处理流程

1. 将所有 JS 和 Go 文件的内容拼接为一个文本流
2. 剔除所有空行
3. 按每页 50 行进行分页
4. 取前 30 页（1500 行）和后 30 页（1500 行）
5. 格式化为 `.docx` 文档

### docx 格式要求

- 页眉：产品名称 + 版本号（居中、小号字体）
- 页码：右下角
- 代码字体：Courier New, 9pt
- 行号：左侧显示行号（灰色、8pt）
- 每页 50 行
- 页面设置：A4、纵向

### 文件排列顺序

```
# 前 30 页（第 1-1500 行）
1. index.html（前若干行）
2. js/router.js
3. js/app-shell.js
4. js/views/dashboard.js
5. js/views/asset.js
6. js/views/host-risk.js
7. js/views/web-risk.js
8. js/views/attack.js
9. js/views/system.js
10. 后端核心代码（asset_service.go）- 截至 1500 行

# 后 30 页（倒数 1500 行）
最后 N 个文件的后 1500 行
```

---

## 产物 2：系统截图集（screenshots.docx）

### 截图要求

1. 使用 `agent-browser` 或 `playwright-cli` 技能启动浏览器
2. 访问本地 8080 端口（需先启动 HTTP 服务）
3. 截取每个页面

### 截图清单

| 页面 | 截图内容 | 最少张数 |
|------|---------|---------|
| 首页 | 完整页面（含 KPI 卡片 + 图表 + 告警列表） | 2 |
| 资产中心 | 4 个 Tab 各一张 | 4 |
| 主机风险 | 4 个 Tab 各一张 | 4 |
| 网站风险 | 4 个 Tab 各一张 | 4 |
| 攻击事件 | 6 个子模块各一张（重点：监测中心、威胁告警、蜜罐配置） | 6 |
| 系统管理 | 3 个核心 Tab（系统配置、操作日志、联动策略） | 3 |

**总计至少 23 张截图。**

### docx 格式要求

- 每页一张截图
- 截图下方标注：模块名称 + 子页面名称
- 图片宽度适配页面（留 2cm 边距）

---

## 产物 3：操作手册（user_manual.docx）

### 结构

```
第1章 系统概述
  1.1 产品简介
  1.2 运行环境
  1.3 登录与主界面

第2章 首页 — 态势感知中心
  2.1 关键指标总览
  2.2 威胁趋势分析
  2.3 实时告警监控

第3章 资产中心 — 全维度资产管理
  3.1 主机资产管理
  3.2 网站资产管理
  3.3 流量风险分析
  3.4 攻击面测绘

第4章 主机风险 — 脆弱性评估与合规
  4.1 风险台账管理
  4.2 漏洞扫描任务
  4.3 周期扫描配置
  4.4 基线配置核查

第5章 网站风险 — Web应用安全防护
  5.1 网站台账管理
  5.2 漏洞扫描
  5.3 安全监测
  5.4 渗透测试

第6章 攻击事件 — 威胁监测与主动防御
  6.1 实时监测中心
  6.2 白名单管理
  6.3 阻断策略配置
  6.4 Agent节点管理
  6.5 威胁告警处理
  6.6 蜜罐诱捕防御

第7章 系统管理 — 平台运维
  7.1 系统配置
  7.2 在线升级
  7.3 诊断工具
  7.4 探针部署
  7.5 参数管理
  7.6 操作日志审计
  7.7 联动策略

附录：快捷键与术语表
```

### 内容要求

- 每个功能点配 1-2 张截图
- 操作步骤编号清楚（第1步 → 第2步 → ...）
- 关键技术术语首次出现时加解释
- 语言客观、准确，不出现"点击这里"等口语化表达（用"选择"、"单击"）

---

## 产物 4：完整源码包（source_code.zip）

### 打包内容

```
{产品名称}_V1.0_源码/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── variables.css
│   │   └── layout.css
│   └── js/
│       ├── router.js
│       ├── app-shell.js
│       └── views/
│           ├── dashboard.js
│           ├── asset.js
│           ├── host-risk.js
│           ├── web-risk.js
│           ├── attack.js
│           └── system.js
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   ├── controller/
│   │   ├── dashboard_controller.go
│   │   ├── asset_controller.go
│   │   ├── host_risk_controller.go
│   │   ├── web_risk_controller.go
│   │   ├── attack_controller.go
│   │   └── system_controller.go
│   ├── service/
│   │   ├── dashboard_service.go
│   │   ├── asset_service.go
│   │   ├── vuln_service.go
│   │   ├── web_monitor_service.go
│   │   ├── alert_service.go
│   │   └── system_service.go
│   ├── repository/
│   │   └── ... (各 repository 文件)
│   └── model/
│       └── ... (各 model 文件)
├── database/
│   └── schema.sql
├── api/
│   └── openapi.yaml
└── README.md
```

### README.md 内容

```markdown
# {产品名称} V{版本号}

## 技术栈
- 前端：原生 JavaScript SPA + ECharts 5.4.3
- 后端：Go 1.21 + Gin + GORM + MySQL 8.0

## 快速启动

### 前端
cd frontend && python -m http.server 8080
浏览器访问 http://localhost:8080

### 后端
cd backend && go run main.go

## 模块说明
{列出启用的模块}
```

---

## 注意事项

1. 生成 docx 文件使用 `docx` 技能
2. 截图使用 `agent-browser` 或 `playwright-cli` 技能
3. 打包使用系统 zip 命令
4. 所有产物输出到工作目录的 `output/` 子目录
5. 生成完毕后，汇报各文件大小和存放路径
