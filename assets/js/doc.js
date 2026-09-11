/* ============================================================
   LOANCOLD — doc.js
   通用文档渲染器：读取 URL 参数 ?c=<markdown 路径>，
   用 marked 渲染为 HTML，套用站点文档排版。

   用法：
     doc.html?c=content/posts/lieblian.md      → 博客文章
     doc.html?c=content/projects/ultraos.md    → 项目详情

   特性：
     - 返回链接按内容类型自动切换（作品 / 博客 / 主页）
     - 双语标题：英文下用索引 JSON 的 titleEn，切回中文用 MD 原文
     - 加载中 / 加载失败状态
     - 图片路径基于站点根（doc.html 位于根目录）
   ============================================================ */

import { marked } from '../vendor/marked.esm.js';
import { getLang, applyI18n } from './i18n.js';

const contentEl = document.getElementById('doc-content');
const backEl = document.getElementById('doc-back');
const mdPath = new URLSearchParams(location.search).get('c');

let ctx = null;            // { back, i18n, index }
let originalTitle = '';    // MD 里的原始标题（中文）

/* ---------- 返回链接与索引类型 ---------- */
function resolveContext() {
  if (!mdPath) return { back: 'index.html', i18n: 'common.back.home', index: null };
  if (mdPath.includes('content/posts/')) {
    return { back: 'blog.html', i18n: 'common.back.blog', index: 'data/posts.json' };
  }
  if (mdPath.includes('content/projects/')) {
    return { back: 'works.html', i18n: 'common.back.works', index: 'data/projects.json' };
  }
  return { back: 'index.html', i18n: 'common.back.home', index: null };
}

function showError(msg) {
  contentEl.innerHTML = `<p class="dim mono">${msg}</p>`;
}

function updateDocTitle() {
  const h1 = contentEl.querySelector('h1');
  if (h1) document.title = `${h1.textContent.trim()} — 李程浩 LoanCold`;
}

/* ---------- 双语标题：en 用索引 titleEn，zh 用 MD 原文 ---------- */
async function applyTitle() {
  const h1 = contentEl.querySelector('h1');
  if (!h1 || !originalTitle) return;

  if (getLang() !== 'en') {
    h1.textContent = originalTitle;
    updateDocTitle();
    return;
  }
  if (!ctx.index) return;

  try {
    const res = await fetch(ctx.index);
    if (!res.ok) return;
    const list = await res.json();
    const item = list.find(p => p.url === mdPath);
    if (item && item.titleEn) {
      h1.textContent = item.titleEn;
      updateDocTitle();
    }
  } catch (_) { /* 保留原文标题 */ }
}

/* ---------- 主流程 ---------- */
async function boot() {
  ctx = resolveContext();

  backEl.href = ctx.back;
  backEl.dataset.i18n = ctx.i18n;
  applyI18n();

  if (!mdPath) {
    showError('缺少参数：请使用 doc.html?c=<markdown 路径>');
    return;
  }

  try {
    const res = await fetch(mdPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const md = await res.text();

    contentEl.innerHTML = marked.parse(md);

    const h1 = contentEl.querySelector('h1');
    originalTitle = h1 ? h1.textContent.trim() : '';

    await applyTitle();
    updateDocTitle();

    /* 语言切换时刷新标题 */
    window.addEventListener('lang:change', applyTitle);
  } catch (err) {
    console.warn('[doc]', err);
    showError(`文档加载失败：${mdPath}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
