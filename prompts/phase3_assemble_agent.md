# Phase 3.2 Prompt: 软著材料组装 Agent (Python 自动化)

你是软著申报材料自动化专家。禁止手动拼接文本或手工排版 Word 文档。
你的任务是生成一个 Python 脚本 `build_copyright_docs.py`，利用 `python-docx` 库完成精确排版。

## 前置环境

- Python 3.8+ 环境已安装 `python-docx` 库：`pip install python-docx`
- 前后端源码位于 `./frontend` 和 `./backend` 目录
- UI 截图已由浏览器工具保存在 `./screenshots` 目录

---

## 脚本必须实现的核心逻辑

### 模块 1：源代码文档生成 (`source_code.docx`)

**逻辑铁律**：

1. 读取所有源码文件（`frontend/` 下的 `.html`, `.css`, `.js`，`backend/` 下的 `.go`，`database/` 下的 `.sql`）
2. 剔除所有空白行（`line.strip() == ''`）
3. 将代码保存到列表中（每项为一行）
4. **软著 60 页强规则**：只取前 1500 行（前 30 页）和后 1500 行（后 30 页）
   - 如果总行数不足 3000 行 → 全部写入
   - `first30 = code_lines[:1500]`
   - `last30 = code_lines[-1500:]` 或 `code_lines[1500:]`（不足时取其余）
5. 使用 `python-docx` 创建文档：

```python
from docx import Document
from docx.shared import Pt, Inches, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

document = Document()

# 页面设置
section = document.sections[0]
section.page_height = Cm(29.7)   # A4
section.page_width = Cm(21.0)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.left_margin = Cm(2.5)
section.right_margin = Cm(1.5)

# 页眉
header = section.header
header_para = header.paragraphs[0]
header_para.text = '{产品名称} {版本号}'
header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = header_para.runs[0]
run.font.size = Pt(9)
run.font.name = '宋体'

# 代码段落格式
for i, line in enumerate(lines_60):
    # 行号
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.line_spacing = Pt(12)
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)

    # 行号 + 代码
    run = paragraph.add_run(f'{i+1:4d}  {line}')
    run.font.name = 'Courier New'
    run.font.size = Pt(9)
    run.font.color.rgb = None  # 黑色

# 保存
document.save('output/source_code.docx')
```

**行号格式**：`  1  package main`（右对齐 4 位 + 2 个空格 + 代码）

**文件排序**：
1. `frontend/index.html`
2. `frontend/js/router.js`
3. `frontend/js/app-shell.js`
4. `frontend/js/views/dashboard.js`
5. `frontend/js/views/asset.js`
6. `frontend/js/views/host-risk.js`
7. `frontend/js/views/web-risk.js`
8. `frontend/js/views/attack.js`
9. `frontend/js/views/system.js`
10. `frontend/js/decorators/*.js`
11. `backend/model/*.go`
12. `backend/repository/*.go`
13. `backend/service/*.go`
14. `backend/controller/*.go`
15. `backend/main.go`
16. `database_schema.sql`

---

### 模块 2：系统截图文档生成 (`screenshots.docx`)

**逻辑**：

1. 遍历 `./screenshots` 目录下的所有 `.png` / `.jpg` 文件
2. 按文件名排序（如 `01_dashboard.png`, `02_asset_host.png`）

```python
import os
from docx.shared import Inches

screen_doc = Document()
# 同样的页面设置

screenshots_dir = './screenshots'
files = sorted([f for f in os.listdir(screenshots_dir) if f.endswith(('.png', '.jpg', '.jpeg'))])

for filename in files:
    filepath = os.path.join(screenshots_dir, filename)

    # 插入图片
    paragraph = screen_doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    run.add_picture(filepath, width=Inches(6.0))

    # 图片描述文字（从文件名推断）
    caption_para = screen_doc.add_paragraph()
    caption_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption_run = caption_para.add_run(format_caption(filename))
    caption_run.font.name = '宋体'
    caption_run.font.size = Pt(10)

    # 每张截图后分页
    screen_doc.add_page_break()

screen_doc.save('output/screenshots.docx')
```

**文件名到描述文字的映射函数**：

```python
def format_caption(filename):
    name = os.path.splitext(filename)[0]
    name = name.replace('_', ' ')
    # 常见模式替换
    mappings = {
        'dashboard': '首页 — 态势感知总览',
        'asset host': '资产中心 — 主机资产管理',
        'asset web': '资产中心 — 网站资产管理',
        'asset traffic': '资产中心 — 流量风险分析',
        'asset surface': '资产中心 — 攻击面测绘',
        'host ledger': '主机风险 — 风险台账',
        'host scan': '主机风险 — 漏洞扫描',
        'host audit': '主机风险 — 配置核查',
        'web ledger': '网站风险 — 网站台账',
        'web monitor': '网站风险 — 安全监测',
        'web pentest': '网站风险 — 渗透测试',
        'attack center': '攻击事件 — 监测中心',
        'attack alert': '攻击事件 — 威胁告警',
        'attack honeypot': '攻击事件 — 蜜罐配置',
        'system config': '系统管理 — 系统配置',
        'system log': '系统管理 — 操作日志',
    }
    for key, value in mappings.items():
        if key in name.lower():
            return value
    return name.title()
```

---

### 模块 3：操作手册生成 (`user_manual.docx`)

**逻辑**：
- 读取 `screenshots/` 的截图列表
- 按模块分组
- 生成包含以下结构的操作手册：

```python
manual_doc = Document()

# 目录
manual_doc.add_heading('目录', level=1)

chapters = [
    ('第1章 系统概述', '系统用途、运行环境、登录方式'),
    ('第2章 首页 — 态势感知中心', '关键指标查看、趋势图表分析、告警处理流程'),
    ('第3章 资产中心', '主机资产管理、网站资产管理、流量分析、攻击面查看'),
    ('第4章 主机风险', '风险台账、漏洞扫描任务创建、周期漏扫配置、配置核查查看'),
    ('第5章 网站风险', '网站台账、网站漏洞扫描、安全监测、渗透测试任务'),
    ('第6章 攻击事件', '监测中心、白名单管理、阻断策略配置、Agent管理、威胁告警处置、蜜罐配置'),
    ('第7章 系统管理', '系统配置、操作日志查询、联动策略管理'),
]

for title, desc in chapters:
    manual_doc.add_heading(title, level=1)
    manual_doc.add_paragraph(desc)
    # 插入对应截图
    matching_screenshots = find_matching_screenshots(title, screenshots_files)
    for shot in matching_screenshots:
        manual_doc.add_picture(shot, width=Inches(5.5))
        last_paragraph = manual_doc.paragraphs[-1]
        last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    manual_doc.add_page_break()

manual_doc.save('output/user_manual.docx')
```

---

### 模块 4：完整源码包 (`source_code.zip`)

使用 Python `zipfile` 标准库打包：

```python
import zipfile

with zipfile.ZipFile('output/source_code.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    # frontend
    for root, dirs, files in os.walk('./frontend'):
        for file in files:
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, '.')
            zf.write(filepath, arcname)

    # backend
    for root, dirs, files in os.walk('./backend'):
        for file in files:
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, '.')
            zf.write(filepath, arcname)

    # database schema（Phase 1.2 产出在根目录）
    if os.path.exists('database_schema.sql'):
        zf.write('database_schema.sql')
    if os.path.exists('openapi.yaml'):
        zf.write('openapi.yaml')

    # database directory（如有额外 SQL 文件）
    if os.path.exists('./database'):
        for root, dirs, files in os.walk('./database'):
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, '.')
                zf.write(filepath, arcname)

    # README
    if os.path.exists('README.md'):
        zf.write('README.md')
```

---

## 异常处理要求

脚本必须妥善处理以下场景，不能崩溃：

| 场景 | 处理方式 |
|------|---------|
| 源码目录不存在 | `print('[WARN] 目录不存在: {}'.format(path))`，跳过 |
| 截图目录为空 | `print('[WARN] 截图目录为空，跳过 screenshots.docx 生成')` |
| 图片文件缺失 | `print('[WARN] 图片缺失: {}'.format(filename))`，跳过该图片 |
| 非文本文件混入源码目录 | 只读取 `.go`, `.js`, `.html`, `.css`, `.sql` 文件 |
| 编码错误 | 打开文件时指定 `encoding='utf-8', errors='replace'` |
| 总代码行数不足 3000 | 全部写入，不报错 |

---

## 输出要求

仅输出完整的 `build_copyright_docs.py` Python 代码。

- 脚本开头用 `"""..."""` 三引号注释说明用途、使用方式和依赖
- 包含 `if __name__ == '__main__':` 入口
- 执行完毕后打印所有产出文件路径和大小
- 所有路径使用 `os.path.join()` 确保跨平台兼容
