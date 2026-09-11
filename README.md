# loancold.com — 李程浩的个人主页

个人主页源码，部署于 GitHub Pages（[www.loancold.com](https://www.loancold.com)）。

## 特性

- **双模式**
  - **艺术模式**（默认）：1bit 有序抖动（Obra Dinn 风格）3D 人像，四组双色滤镜主题
  - **简洁模式**：文艺复兴画册式简历排版（米纸白 / 衬线刊头 / 金色油画框）
  - 右下角金色徽章一键切换，带黑金扩散过渡动画；URL `?mode=art|pro` 可直达
- **中英双语**：全站 UI 可切换（`localStorage` 持久化），内容标题附英文译名
- **内容与表现分离**：正文用 **Markdown** 编写，由通用渲染器 `doc.html` 统一呈现
- **数据驱动列表**：作品与博客列表由 JSON 渲染，新增内容无需改 HTML
- **零构建**：原生 HTML / CSS / ES Module，无打包步骤，`git push` 即部署
- **离线可用**：Three.js / marked / Leaflet 均已本地化（`assets/vendor/`），不依赖外部 CDN

## 目录结构

```
├── index.html          # 主页（艺术模式 3D 人像 + 简洁模式刊头，双 hero）
├── about.html          # 个人介绍与简历
├── works.html          # 作品列表（由 data/projects.json 驱动渲染）
├── blog.html           # 博客集合（Notion 入口 + 历史存档，由 data/posts.json 驱动）
├── doc.html            # ★ 通用文档渲染器（?c=<md路径>，Markdown → 页面）
├── roadbook.html       # 川西自驾路书（含 Leaflet 交互地图的特殊页面）
├── content/
│   ├── posts/          # 博客文章 Markdown（12 篇）
│   ├── projects/       # 项目详情 Markdown（11 个）
│   └── pages/          # 其他内容页 Markdown（award 等）
├── data/
│   ├── posts.json      # 博客索引（标题双语 / 日期 / 分类 / 摘要 / MD 路径）
│   └── projects.json   # 作品索引（标题双语 / 标签 / 描述 / 缩略图 / 仓库）
├── assets/
│   ├── css/main.css    # 设计系统（双模式变量、组件、Markdown 排版、响应式）
│   ├── js/
│   │   ├── layout.js   # 共享外壳：导航 / 模式 / 语言 / 滤镜 / 页脚
│   │   ├── i18n.js     # 内联双语字典
│   │   ├── doc.js      # ★ 文档渲染器（fetch MD + marked 渲染）
│   │   ├── works.js    # ★ 作品列表数据驱动渲染
│   │   ├── blog.js     # 博客列表数据驱动渲染
│   │   ├── dither.js   # WebGL 1bit 抖动管线（低分辨率 RT + Bayer 8×8）
│   │   ├── dither2d.js # 零依赖 Canvas2D 抖动（降级用）
│   │   ├── figure.js   # 主页 2.5D 人像场景（蓝底抠像 + 受限角度）
│   │   ├── home.js     # 主页装配（按模式懒加载 3D）
│   │   └── fallback.js # file:// 直开降级（普通脚本）
│   └── vendor/         # 本地化依赖（three.js / marked / leaflet）
├── images/ file/       # 图片与附件
└── favicon.svg
```

## 本地开发

```bash
python3 -m http.server 8642
# 打开 http://localhost:8642
```

> ⚠️ 不要直接双击 `index.html` 用 `file://` 打开——浏览器会拦截 ES Module 与 `fetch`。
> `fallback.js` 提供了降级体验，但完整功能需经 HTTP 服务。

## 内容维护

### 新增作品

1. 写 `content/projects/<id>.md`（Markdown，首行 `# 标题`）
2. 在 `data/projects.json` 加一条记录：

```json
{
  "id": "myproject",
  "title": "中文标题", "titleEn": "English Title",
  "meta": "标签 · 年份", "metaEn": "TAGS · YEAR",
  "desc": "一句话描述", "descEn": "One-line description",
  "url": "content/projects/myproject.md",
  "image": "images/myproject.png",     // 可选；无图则用 placeholder
  "placeholder": "MY PROJECT",          // 无图时的文字占位
  "github": "owner/repo",               // 可选，自动渲染 Star 徽章
  "external": "https://..."             // 可选，外部链接（无 MD 时）
}
```

### 新增博客

1. 写 `content/posts/<slug>.md`
2. 在 `data/posts.json` 加一条记录（`url` 填 MD 路径，`titleEn` 为英文标题）

### 访问文档页

```
doc.html?c=content/posts/<slug>.md
doc.html?c=content/projects/<id>.md
```

### 其他

- **切换默认模式**：改 `layout.js` 的 `resolveInitialMode()` + 各页面 head 防闪脚本的默认值
- **接入 Notion**：在 `assets/js/blog.js` 实现 `NotionSource`（同 `PostsSource` 接口），替换 `LocalJsonSource` 即可

## 技术说明

- **抖动管线**：场景 → 低分辨率 RenderTarget（约 1/3 分辨率）→ 全屏后处理（8×8 Bayer 有序抖动 + 亮度量化 + 双色映射）→ nearest 放大
- **Markdown**：`marked` 客户端渲染，无构建步骤；图片路径基于站点根
- **性能**：简洁模式零 three.js 加载；后台标签页暂停渲染；`prefers-reduced-motion` 降级
- **降级链**：WebGL 不可用 → Canvas2D 静态抖动 → 原图 → placehold.co 占位
