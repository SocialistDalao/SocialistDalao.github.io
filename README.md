# loancold.com — 李程浩的个人主页

个人主页源码，部署于 GitHub Pages（[www.loancold.com](https://www.loancold.com)）。

## 特性

- **双模式**
  - **艺术模式**（默认）：1bit 有序抖动（Obra Dinn 风格）3D 人像，四组双色滤镜主题
  - **简洁模式**：文艺复兴画册式简历排版（米纸白 / 衬线刊头 / 金色油画框）
  - 右下角金色徽章一键切换，带黑金扩散过渡动画；URL `?mode=art|pro` 可直达
- **中英双语**：全站 UI 可切换（`localStorage` 持久化），博客标题附英文译名
- **零构建**：原生 HTML / CSS / ES Module，无打包步骤，`git push` 即部署
- **离线可用**：Three.js 本地化（`assets/vendor/`），不依赖外部 CDN

## 目录结构

```
├── index.html              # 主页（双 hero：艺术模式 3D + 简洁模式刊头）
├── about.html              # 个人介绍与简历
├── works.html              # 个人作品（12 个项目卡片）
├── blog.html               # 博客集合（Notion 入口 + 历史存档）
├── award.html / life.html  # 历史页面（荣誉 / 文章列表，保留旧链接）
├── <project>.html          # 项目详情页（cscc / nscscc / ruf / AiC / xv62019 …）
├── html/                   # 博客文章（含川西自驾路书等）
├── data/posts.json         # 博客文章清单（可替换为 Notion 数据源）
├── assets/
│   ├── css/main.css        # 设计系统（双模式变量、组件、响应式）
│   ├── js/
│   │   ├── layout.js       # 共享外壳：导航 / 模式 / 语言 / 滤镜 / 页脚
│   │   ├── i18n.js         # 内联双语字典
│   │   ├── dither.js       # WebGL 1bit 抖动管线（低分辨率 RT + Bayer 8×8）
│   │   ├── dither2d.js     # 零依赖 Canvas2D 抖动（降级用）
│   │   ├── figure.js       # 主页 2.5D 人像场景（蓝底抠像 + 受限角度）
│   │   ├── home.js         # 主页装配（按模式懒加载 3D）
│   │   ├── blog.js         # 博客数据层（可替换数据源）
│   │   └── fallback.js     # file:// 直开降级（普通脚本）
│   └── vendor/             # 本地化依赖（three.js / leaflet）
├── images/                 # 项目截图与人像
└── file/                   # 论文 / PPT / 简历等附件
```

## 本地开发

```bash
python3 -m http.server 8642
# 打开 http://localhost:8642
```

> ⚠️ 不要直接双击 `index.html` 用 `file://` 打开——浏览器会拦截 ES Module。
> `fallback.js` 提供了降级体验（简化导航 + 原图），但完整功能需经 HTTP 服务。

## 内容维护

**新增作品**：在 `works.html` 加卡片 → `assets/js/i18n.js` 加 `works.wN.*` 键 → 新建详情页（复制现有页面的 head + `doc-body` 结构）

**新增博客**：在 `html/` 下新建文章（参考现有文章的 head 模板）→ `data/posts.json` 加条目（`titleEn` 为英文标题）

**切换默认模式**：改 `layout.js` 的 `resolveInitialMode()` 返回值 + 各页面 head 防闪脚本的默认值

**接入 Notion**：在 `assets/js/blog.js` 实现 `NotionSource`（同 `PostsSource` 接口），替换 `LocalJsonSource` 即可，页面渲染逻辑无需改动

## 技术说明

- **抖动管线**：场景 → 低分辨率 RenderTarget（约 1/3 分辨率）→ 全屏后处理（8×8 Bayer 有序抖动 + 亮度量化 + 双色映射）→ nearest 放大
- **性能**：简洁模式零 three.js 加载；后台标签页暂停渲染；`prefers-reduced-motion` 降级
- **降级链**：WebGL 不可用 → Canvas2D 静态抖动 → 原图 → placehold.co 占位
