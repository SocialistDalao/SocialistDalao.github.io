# CODEBUDDY.md
This file provides guidance to CodeBuddy when working with code in this repository.

个人主页源码（李程浩 / LoanCold），部署于 GitHub Pages → [www.loancold.com](https://www.loancold.com)（`CNAME`）。
**零构建**：原生 HTML / CSS / ES Module，无打包步骤，`git push` 即发布。

## 常用命令

```bash
# 本地预览（必需）—— file:// 会拦截 ES Module 与 fetch，必须经 HTTP
python3 -m http.server 8642        # 打开 http://localhost:8642

# 无头浏览器验证（playwright-cli 需先装：npm i -g @playwright/cli，浏览器用 chromium）
playwright-cli open "http://localhost:8642/index.html?mode=art" --browser=chromium
playwright-cli console error       # 检查控制台报错
playwright-cli eval "<js>"         # 页面内求值（调试状态/尺寸）
playwright-cli screenshot          # 截图，输出到 .playwright-cli/
playwright-cli close

# 部署
git push                           # GitHub Pages 自动发布
```

本项目**没有** package.json / 构建脚本 / 测试框架 / lint 配置。验证靠「HTTP 服务 + 无头浏览器截图与控制台检查」。

## 架构总览

### 1. 全局状态层 —— `assets/js/layout.js` 是唯一入口

三个全局状态，统一遵循 **`html` 属性 + `localStorage` + `CustomEvent`** 三件套：

| 状态 | html 属性 | localStorage 键 | 事件 | 取值 |
|---|---|---|---|---|
| 模式 | `data-mode` | `loancold.mode` | `mode:change` | `pro` / `art` |
| 语言 | `lang` | `loancold.lang` | `lang:change` | `zh-CN` / `en` |
| 滤镜 | `data-filter` | `loancold.filter` | `dither:filter` | `amber`/`ink`/`citron`/`crimson` |

页面只需引入 `layout.js`（+ `fallback.js`），即自动获得导航、页脚（含备案号）、MagicButton、模式/语言/滤镜切换。

**模式判定优先级**：URL `?mode=` / `#mode` > `sessionStorage`（会话内）> `localStorage`（长期）> 默认 `art`。

- **防闪脚本**：每个页面 `<head>` 内有一段同步内联脚本，在首次渲染前按上述优先级决定 `data-mode`，避免主题闪烁
- **会话内保持**：URL 参数进入与主动切换都会写 `sessionStorage`，保证外部分享链接（如 `?mode=pro`）进入后**跨页面不丢失**；只有主动切换才写 `localStorage`，避免 URL 参数覆盖访客的长期偏好
- ⚠️ **改默认模式或优先级要同步 7 处**：`layout.js` 的 `resolveInitialMode()` + `index` / `about` / `works` / `blog` / `doc` / `roadbook` 六个页面的内联脚本

### 2. 双模式（CSS 门控 + 懒加载）

- `main.css` 用 `[data-mode="pro"]` 做**变量重映射**（`--bg/--light/--shadow` 翻转为米纸白/墨黑/暗金），全站组件自动适配，无需逐组件写两套
- `[data-mode="art"]` 保留 1bit 点阵主题；滤镜切换器仅 art 可见
- **pro 模式零 three.js 加载**：`home.js` 仅在 `data-mode === 'art'` 时才 `await import('./dither.js')`。这是性能红线，勿在 pro 路径上静态 import three
- 模式切换过渡：`transitionToArt()` 用 `.mode-veil` 从按钮位置扩散覆盖全屏 → 遮罩下切换 → 淡出

### 3. 内容流水线（Markdown → 页面，客户端渲染）

`doc.html?c=<md 路径>` + `assets/js/doc.js`：`fetch(md)` → `marked.parse()` → 注入 `#doc-content`。

- **无构建**，改 MD 后 push 即生效
- 返回链接与索引类型按 MD 路径自动判定：`content/posts/` → 回 `blog.html`；`content/projects/` → 回 `works.html`
- 英文标题取自索引 JSON 的 `titleEn`（MD 正文保持中文原文，文学内容不机翻）；切语言时重新应用标题
- 新增文章/项目**不需要改 HTML**：写 MD + 在 `data/posts.json` / `data/projects.json` 加一条记录

### 4. 数据驱动列表（可替换数据源）

- `works.js` / `blog.js` 读 JSON 渲染卡片，监听 `lang:change` 重渲染双语字段
- `blog.js` 显式定义了数据源契约 `class PostsSource { fetch() -> Promise<Post[]> }`；接 Notion 时新增同接口的 `NotionSource` 替换 `LocalJsonSource` 即可，**不要**在渲染层塞数据获取逻辑

### 5. 1bit 抖动管线（两套实现，共享调色板）

- `dither.js`（WebGL，依赖 three）：业务场景 → 低分辨率 `RenderTarget`（`1/pixelScale`）→ 全屏后处理（8×8 Bayer 有序抖动 + 亮度量化 + 双色映射）→ `NearestFilter` 放大 + CSS `image-rendering: pixelated`
- `dither2d.js`（Canvas2D，**零依赖**）：静态图片抖动，并定义 `FILTER_COLORS` 调色板（单一事实来源）
- `dither.js` re-export `dither2d.js` 的接口以保持单一入口
- **为何拆两个文件**：内页与降级路径不能依赖 three；`dither2d.js` 必须保持零依赖
- 通用挂载协议：`mountDitheredScene(el, opts)`，`opts.sceneFactory({width,height})` 返回 `{scene, camera, update?, setFilter?}`，可在任意内页嵌入 3D 视口

### 6. 降级链（多级，务必保持可用）

```
WebGL 不可用 / three 加载失败 / 纹理失败 → dither2d.js 静态点阵 → 图片 404 → placehold.co 占位
file:// 直开（ES Module 与 fetch 被拦截） → fallback.js（普通脚本）注入简化导航 + 原图 + 提示条
```

`fallback.js` 是**非 module 的普通脚本**，仅当 `location.protocol === 'file:'` 时激活，HTTP 下完全休眠。

## 设计规范

### 设计 Token（事实来源：`assets/css/main.css`）

**艺术模式（1bit 双色）**——由 `html[data-filter]` 驱动；`dither2d.js` 的 `FILTER_COLORS` 是 JS 侧同源副本，**改色需两处同步**：

| 滤镜 | shadow（暗） | light（亮） | bg |
|---|---|---|---|
| `amber`（默认） | `#1A0F0A` | `#C9A227` | `#0E0805` |
| `ink` | `#2E3550` | `#D9D6C3` | `#181C29` |
| `citron` | `#16160F` | `#B5C437` | `#0B0B07` |
| `crimson` | `#230B0B` | `#C96A5A` | `#130505` |

**简洁模式（文艺复兴画册）**——`[data-mode="pro"]` 对上述变量做**重映射**：

| token | 值 | 用途 |
|---|---|---|
| `--bg` | `#F4EFE6` | 米纸白底 |
| `--light` | `#1C1A17` | 墨黑（文字 / 边框） |
| `--gold` | `#9A7B2D` | 唯一强调色（分隔线 / 链接 / 油画框） |
| `--paper-deep` | `#EAE3D4` | 次级底色 |
| `--ink-soft` | `#6E675C` | 弱化文字 |

⚠️ pro 是**重映射 art 变量**而非另立一套，因此组件只需写一次即可两模式通吃。新增组件请复用 `--bg/--light/--shadow/--gold`，不要硬编码颜色。

### 字体

`--font-sans`（Noto Sans SC）正文 · `--font-mono`（JetBrains Mono）元信息与按钮 · pro 标题额外用 `--font-serif`（Noto Serif SC）。均经 Google Fonts `display=swap`。

### 组件命名约定

- 像素风（art 专用）：`px-*`（`px-frame` / `px-divider`）、`btn-px`；修饰符用 `--`（`px-frame--pad` / `px-frame--invert`）
- pro 专属组件统一 `pro-*` 前缀；简洁模式主页根为 `.hero-pro`
- 通用类：`.dim` / `.faint` / `.mono` / `.section-title` / `.reveal`（滚动淡入，由 `layout.js` 的 IntersectionObserver 驱动）
- 按页组件：主页 `hero`(art) · `hero-pro`(pro) · `magic-btn`；关于 `about-grid` / `timeline` / `honor-list` / `tag`；作品 `work-grid` / `work-card` / `work-shot`；博客 `notion-card` / `chip` / `post-row`；文档 `doc-body` / `doc-back`

### 常见修改入口

| 想改什么 | 改哪里 |
|---|---|
| 调色板 / 滤镜 | `main.css` 顶部 `[data-filter]` 变量 **+** `dither2d.js` 的 `FILTER_COLORS` |
| pro 主题配色 | `main.css` 的 `[data-mode="pro"]` 变量块 |
| 字体 | `main.css` 的 `--font-*` **+** 各页 `<link>` 的 Google Fonts 请求 |
| 点阵颗粒度 | `mountDitheredScene` 的 `pixelScale`（越大越粗）/ 静态图 `data-dither-pixelscale` |
| 抖动强度 / 量化级数 | `ditherScale`（0.9~1.2）/ `levels`（2 = 1bit） |
| 人像交互范围 | `figure.js` 的 `yawLimit` / `pitchLimit` |
| 导航项 / 滤镜按钮 | `layout.js` 的 `NAV_ITEMS` / `FILTERS` |
| 全站文案 | `i18n.js` 的 `DICT`（每个键含 `zh` / `en`） |

## 关键约定与已知陷阱

1. **色彩管理必须关闭**：`dither.js` 顶部 `THREE.ColorManagement.enabled = false` + `renderer.outputColorSpace = LinearSRGBColorSpace` + 纹理**不设** `colorSpace`。任一处开启都会让亮度整体漂移，破坏 dithering 与 CSS 调色板的一致性。
2. **Bayer 递归公式**：`M_{2n}(x,y) = 4·M_n(x%n, y%n) + M_2(⌊x/n⌋, ⌊y/n⌋)`——粗层块偏移用 `M2`、细层用 `4·M_n`。写反会产生重复值、点阵质量崩坏（GLSL 版用 `fract` 紧凑式，与 JS 版语义等价）。
3. **相机 aspect 时序**：`resize()` 在 `sceneFactory` 之前执行，场景就绪后**必须再同步一次** `camera.aspect` 并 `updateProjectionMatrix()`，否则画面被画布比例拉伸。
4. **`display:none` 会让 `clientWidth/Height` 归零**：模式切换时渲染目标会被压成 2×2 导致画面消失。`dither.js` 的 `tick()` 自检 `clientWidth < 2` 并自动 `resize()` 恢复；`home.js` 在 `mode:change` 时 dispose 并重建 mount。改动渲染循环时勿删这段。
5. **3D 视口用「重建」而非「复用」**：长时间处于 pro 后 WebGL 状态可能异常，故 pro→art 时彻底 `dispose()` 后重建（重建发生在遮罩动画下，用户无感知）。
6. **人像素材**：`images/me_portrait.jpg` 是**蓝底**证件照，抠像靠「蓝通道超出红绿的量」`blueExcess` 判定（`figure.js` / `dither2d.js` 语义一致）。换照片若底色不同需调阈值。
7. **受限交互**：`figure.js` 的 yaw/pitch 严格夹紧（默认 ≈±17°/±9°）且禁用缩放——角度过大看到展板侧面穿帮。这是产品约束，不要改成自由轨道。
8. **备案号**：`layout.js` 的 `buildFooter()` 含 `湘ICP备2021002933号-1`，所有页面底部必须保留。
9. **localStorage 键统一 `loancold.*` 前缀**（`mode` / `lang` / `filter`）。
10. **本地调试必须用 HTTP 服务**：`file://` 下 module 与 fetch 均被拦截，只会看到 `fallback.js` 的降级界面。
11. **依赖全部本地化**：`assets/vendor/`（three / marked / leaflet），不要引入外部 CDN —— 曾因 CDN 不可达导致降级路径暴露 bug。
12. **CSS 里 `@import` 了 Tailwind CDN**（`main.css` 首行）。若需完全离线，此项需一并本地化。

## 内容维护速查

- 新增作品：写 `content/projects/<id>.md` + 在 `data/projects.json` 加记录（字段见 README）
- 新增博客：写 `content/posts/<slug>.md` + 在 `data/posts.json` 加记录（含 `titleEn`）
- 访问文档页：`doc.html?c=content/posts/<slug>.md`
- 博客已迁移至 Notion，`blog.html` 顶部保留 Notion 入口卡片，`content/posts/` 为历史存档
- `roadbook.html` 是含 Leaflet 交互地图的**特殊页面**，不走 MD 流水线
