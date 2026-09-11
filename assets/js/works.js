/* ============================================================
   LOANCOLD — works.js
   作品列表数据驱动渲染（data/projects.json → 卡片网格）

   新增作品只需：
     1. content/projects/<id>.md 写内容
     2. data/projects.json 加一条记录
   无需改 HTML。

   卡片支持：图片 / 文字占位、GitHub Star 徽章、外部链接
   ============================================================ */

import { t, getLang } from './i18n.js';

const SOURCE = 'data/projects.json';
const gridEl = document.getElementById('work-grid');

/* ---------- 卡片模板 ---------- */
function cardHtml(p, lang) {
  const isEn = lang === 'en';
  const title = (isEn && p.titleEn) ? p.titleEn : p.title;
  const meta  = (isEn && p.metaEn)  ? p.metaEn  : p.meta;
  const desc  = (isEn && p.descEn)  ? p.descEn  : p.desc;

  /* 主链接：MD 文档 或 外部链接 */
  const isExternal = !p.url;
  const href = p.url ? `doc.html?c=${encodeURI(p.url)}` : p.external;
  const linkAttrs = isExternal ? ' target="_blank" rel="noopener"' : '';

  /* 缩略图 or 文字占位 */
  const shot = p.image
    ? `<div class="work-shot"><img class="dither-plain" src="${p.image}" alt="${title}"
         onerror="this.onerror=null;this.src='https://placehold.co/640x360/F4EFE6/9A7B2D?text=${encodeURIComponent(p.id)}';"></div>`
    : `<div class="work-shot work-shot--text"><span class="work-shot-title">${p.placeholder || p.id.toUpperCase()}</span></div>`;

  /* 底部链接区 */
  const links = [];
  if (p.url) links.push(`<a href="${href}">${t('works.more')}</a>`);
  if (p.github) {
    links.push(`<a class="gh-badge" href="https://github.com/${p.github}" target="_blank" rel="noopener" aria-label="GitHub Stars">
      <img src="https://img.shields.io/github/stars/${p.github}?style=social" alt="GitHub stars" loading="lazy" onerror="this.style.display='none'"></a>`);
  }
  if (p.external) links.push(`<a href="${p.external}" target="_blank" rel="noopener">gitee ↗</a>`);

  return `
      <div class="work-card reveal is-visible">
        <a href="${href}"${linkAttrs}>
          ${shot}
        </a>
        <h3><a href="${href}"${linkAttrs}>${title}</a></h3>
        <div class="work-meta mono">${meta}</div>
        <p>${desc}</p>
        <div class="work-links">${links.join('')}</div>
      </div>`;
}

/* ---------- 渲染 ---------- */
async function render() {
  if (!gridEl) return;
  try {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const projects = await res.json();
    gridEl.innerHTML = projects.map(p => cardHtml(p, getLang())).join('');
  } catch (err) {
    console.warn('[works]', err);
    gridEl.innerHTML = '<p class="dim mono">作品列表加载失败，请稍后重试。</p>';
  }
}

function boot() {
  render();
  /* 语言切换时重渲染（双语字段） */
  window.addEventListener('lang:change', render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
