# Phase 3.1 Prompt: 代码审查与质检 (Python 自动化)

你是高级发布工程师。为避免大模型数错行数或漏审代码，你的任务是编写一个 Python 3 静态分析脚本 `audit_tool.py`。

## 任务目标

生成一个完整的、可直接在项目根目录运行的 Python 脚本。该脚本执行以下自动化检查，并在控制台输出结构化报告。

---

## 检查项 1：精确行数统计

**逻辑**：
- 遍历 `backend/` 下所有 `.go` 文件
- 遍历 `frontend/js/views/` 下所有 `.js` 文件
- 遍历 `frontend/js/decorators/` 下所有 `.js` 文件（如有）
- 排除空白行（`line.strip() == ''`）
- 排除整行注释行（以 `//` 开头的行，且不是 `// FuncName` 格式的 Docstring 判断：如果 `//` 后紧跟大写字母或 `@`，视为 Docstring，保留计入）

**判定标准**：
- 有效行数 >= 10000：`[PASS] 代码行数达标: NNNN 行`
- 有效行数 < 10000：`[FAIL] 代码行数不达标: NNNN 行（差 NNNN 行）`

---

## 检查项 2：坏味道正则扫描

### 2a. Go 代码 — 通用异常捕获

**正则扫描模式**：
```
if err != nil \{\s*\\n\s*return
```
匹配 `if err != nil {` 后紧接着 `return err`（无日志版本）。

判定：每个匹配项输出 `[WARN] 文件:行号 — 裸返回错误（缺少 slog 日志）`

### 2b. Go 代码 — 解释性注释

**正则扫描模式**（匹配以下中文注释模式）：
```
^\\s*//\\s*(定义|获取|设置|创建|删除|更新|查询|连接|初始化|遍历|判断|计算|返回|声明|赋值|配置|注册)
```

判定：每个匹配项输出 `[WARN] 文件:行号 — 解释性注释: "注释内容"`

### 2c. JS 前端代码 — 空表格/空图表检查

**逻辑**：扫描 `frontend/js/views/` 下的文件，检查：
- `mockFetch` 中每个 `url.includes()` 分支的 `items` 数组长度是否 >= 5
- 如果没有 `items` 数组，检查 `data` 中是否有全为零的统计字段

### 2d. 前端路由单向绑定检查

**逻辑**：
- 扫描所有 `router.navigate('/xxx'` 调用
- 检查目标路由 `/xxx` 是否在 `js/views/` 中存在对应的 `window.renderXxx` 函数
- 模拟首页 → 资产中心 → 主机风险 → 系统管理共 6 条关键路径

---

## 输出格式

脚本运行后在控制台输出以下结构化报告：

```
============================================
  软著代码质量审查报告
  产品: {产品名称}
  审查时间: {自动生成}
============================================

[检查 1] 有效代码行数统计
  backend/    : XXXX 行
  frontend/   : XXXX 行
  总计        : XXXX 行
  [PASS] 代码行数达标 / [FAIL] 缺少 XXX 行

[检查 2] Go 错误处理审计
  [WARN] backend/service/asset_service.go:45 — 裸返回错误
  ...

[检查 3] 解释性注释扫描
  [WARN] backend/repository/host_asset_repo.go:23 — "// 获取主机列表"
  ...

[检查 4] 前端数据充分性
  [PASS] 全部 mockFetch items >= 5
  / [WARN] frontend/js/views/dashboard.js: alertsRes 仅 3 条 items

[检查 5] 路由联动检查
  [PASS] 全部路由存在对应组件
  / [WARN] router.navigate('/system',...) → window.renderSystem 未定义

============================================
  最终结论: [PASS] / [FAIL]
============================================
```

**退出码规范**：
- 所有检查项全部 PASS → `sys.exit(0)`
- 任一检查项 FAIL（行数不达标 / 路由缺口） → `sys.exit(1)`
- 仅有 WARN（无 FAIL） → `sys.exit(0)` 但输出声明存在 WARN

---

## 输出要求

仅输出完整的、可直接执行的 `audit_tool.py` Python 代码。

- 使用标准库（`os`, `re`, `sys`, `pathlib`, `json`, `datetime`）
- 无需第三方依赖
- 脚本开头用三引号 `"""..."""` 注释说明用途和使用方式
- 所有路径使用 `os.path.join()` 确保跨平台兼容
