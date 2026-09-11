/* ============================================================
   LOANCOLD — layout.js
   共享外壳与全局状态：导航 / 模式切换 / 语言切换 / 滤镜切换器 / 页脚。

   全局状态（html 属性 + localStorage + CustomEvent）：
     data-mode  pro|art   loancold.mode  mode:change
     lang       zh|en     loancold.lang  lang:change
     data-filter 四色主题  loancold.filter dither:filter

   模式判定优先级：URL ?mode= / #mode > localStorage > pro（默认）
   ============================================================ */

import { getLang, setLang, t, applyI18n } from './i18n.js';

const NAV_ITEMS = [
  { href: 'index.html', key: 'index.html', i18n: 'nav.home' },
  { href: 'about.html', key: 'about.html', i18n: 'nav.about' },
  { href: 'works.html', key: 'works.html', i18n: 'nav.works' },
  { href: 'blog.html',  key: 'blog.html',  i18n: 'nav.blog' },
];

const FILTERS = [
  { id: 'amber',   color: '#C9A227', title: '琥珀' },
  { id: 'ink',     color: '#D9D6C3', title: '墨蓝纸白' },
  { id: 'citron',  color: '#B5C437', title: '黄绿' },
  { id: 'crimson', color: '#C96A5A', title: '暗红' },
];

const MODE_KEY  = 'loancold.mode';
const FILTER_KEY = 'loancold.filter';

/* ---------- 当前页面识别 ---------- */
function currentPageKey() {
  const p = location.pathname.split('/').pop();
  return (p === '' || p === '/') ? 'index.html' : p;
}

/* 子目录基准路径（当前所有页面均位于根目录；保留以兼容未来子目录页面） */
function basePath() {
  const seg = location.pathname.split('/').filter(Boolean);
  return seg.length > 1 ? '../' : '';
}

function store(key, val) { try { localStorage.setItem(key, val); } catch (_) { /* ignore */ } }
function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }

/* ============================================================
   模式管理
   ============================================================ */
export function getMode() {
  return document.documentElement.getAttribute('data-mode') === 'art' ? 'art' : 'pro';
}

export function setMode(mode, { persist = true } = {}) {
  const m = mode === 'art' ? 'art' : 'pro';
  document.documentElement.setAttribute('data-mode', m);
  if (persist) store(MODE_KEY, m);
  document.querySelectorAll('.mode-btn').forEach(b => {
    const target = b.dataset.modeTarget;
    b.dataset.current = m;
    b.textContent = m === 'art' ? t('mode.toPro') : t('mode.toArt');
    void target;
  });
  window.dispatchEvent(new CustomEvent('mode:change', { detail: m }));
}

function resolveInitialMode() {
  /* URL 参数 / hash 优先（便于分享艺术模式直达链接） */
  const q = new URLSearchParams(location.search).get('mode');
  const h = location.hash.replace('#', '');
  if (q === 'art' || h === 'art' || q === 'pro' || h === 'pro') {
    return q === 'art' || h === 'art' ? 'art' : 'pro';
  }
  const saved = read(MODE_KEY);
  return saved === 'pro' ? 'pro' : 'art';   /* 首次访问默认艺术模式 */
}

function initMode() {
  const initial = resolveInitialMode();
  setMode(initial, { persist: false }); /* URL 参数不落盘，尊重用户手动选择 */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(getMode() === 'art' ? 'pro' : 'art'));
  });
  /* MagicButton（简洁模式徽章）→ 艺术模式（扩散动画切换） */
  document.querySelectorAll('.magic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (getMode() === 'art') return;
      transitionToArt(btn);
    });
  });
  /* 艺术模式内的返回入口 */
  document.querySelectorAll('[data-mode-back]').forEach(el => {
    el.addEventListener('click', () => setMode('pro'));
  });
}

/* ============================================================
   滤镜（仅艺术模式有意义；pro 下由 CSS 隐藏）
   ============================================================ */
function applyFilter(id) {
  if (!FILTERS.some(f => f.id === id)) return;
  document.documentElement.setAttribute('data-filter', id);
  store(FILTER_KEY, id);
  document.querySelectorAll('.filter-dot').forEach(d => {
    d.classList.toggle('is-active', d.dataset.filter === id);
  });
  window.dispatchEvent(new CustomEvent('dither:filter', { detail: id }));
}

function initFilter() {
  applyFilter(read(FILTER_KEY) || 'amber');
}

/* ============================================================
   语言
   ============================================================ */
function initLang() {
  document.documentElement.setAttribute('lang', getLang() === 'en' ? 'en' : 'zh-CN');
  applyI18n();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(getLang() === 'zh' ? 'en' : 'zh');
      btn.textContent = t('lang.switch');
      /* 模式按钮文案随语言刷新 */
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.textContent = getMode() === 'art' ? t('mode.toPro') : t('mode.toArt');
      });
    });
  });
  window.addEventListener('lang:change', () => {
    document.querySelectorAll('.lang-btn').forEach(b => { b.textContent = t('lang.switch'); });
  });
}

/* ============================================================
   头部 / 页脚
   ============================================================ */
function buildHeader() {
  const cur = currentPageKey();
  const header = document.createElement('header');
  header.className = 'site-header';
  const base = basePath();
  header.innerHTML = `
    <a class="logo" href="${base}index.html">LOANCOLD<em>_</em></a>
    <nav aria-label="站点导航">
      ${NAV_ITEMS.map(n =>
        `<a href="${base}${n.href}" class="${n.key === cur ? 'is-active' : ''}" data-i18n="${n.i18n}">${t(n.i18n)}</a>`
      ).join('')}
      <button class="mode-btn" data-mode-target="1" title="切换模式"></button>
      <button class="lang-btn" title="Language">${t('lang.switch')}</button>
      <span class="filter-dots" role="group" aria-label="滤镜切换">
        ${FILTERS.map(f =>
          `<button class="filter-dot" data-filter="${f.id}" title="${f.title}" aria-label="滤镜：${f.title}" style="--dot:${f.color}"></button>`
        ).join('')}
      </span>
    </nav>`;
  header.querySelectorAll('.filter-dot').forEach(dot => {
    dot.addEventListener('click', () => applyFilter(dot.dataset.filter));
  });
  return header;
}

function buildFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span data-i18n="footer.copyright">${t('footer.copyright')}</span>
    <span class="mono">—</span>
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">湘ICP备2021002933号-1</a>`;
  return footer;
}

/* ---------- MagicButton 注入（全站，简洁模式右下角金色徽章） ---------- */
function injectMagicButton() {
  if (document.querySelector('.magic-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'magic-btn';
  btn.setAttribute('aria-label', '进入艺术模式');
  btn.textContent = '✦';
  document.body.appendChild(btn);
  btn.addEventListener('click', () => {
    if (getMode() === 'art') return;
    transitionToArt(btn);
  });
}

/* ---------- 模式切换扩散动画（1bit 黑金，从按钮铺满全屏） ----------
   三阶段无感渐变：
     1. 深色圆从按钮位置扩散覆盖全屏（0.6s）
     2. 完全覆盖后（此时页面被遮住）切换模式
     3. 遮罩淡出，露出已切换好的艺术模式（0.45s）
   ============================================================ */
function transitionToArt(btn) {
  const veil = document.createElement('div');
  veil.className = 'mode-veil';
  const r = btn.getBoundingClientRect();
  veil.style.setProperty('--vx', ((r.left + r.width / 2) / window.innerWidth * 100) + '%');
  veil.style.setProperty('--vy', ((r.top + r.height / 2) / window.innerHeight * 100) + '%');
  document.body.appendChild(veil);
  /* 双 rAF 确保初始 clip-path 已渲染，再触发过渡 */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    veil.classList.add('veil-go');          // 阶段1：扩散覆盖
    setTimeout(() => {
      setMode('art');                       // 阶段2：遮罩下切换（无感）
      veil.classList.add('veil-fade');      // 阶段3：淡出露出艺术模式
    }, 620);
  }));
  setTimeout(() => veil.remove(), 1250);
}

/* ---------- 滚动点阵淡入 ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
}

/* ---------- 1bit favicon（全站注入） ---------- */
const FAVICON_SVG = `data:image/svg+xml,` + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>` +
  `<rect width='16' height='16' fill='#1A0F0A'/>` +
  `<rect x='2' y='2' width='12' height='12' fill='#C9A227'/>` +
  `<rect x='5' y='5' width='6' height='6' fill='#1A0F0A'/>` +
  `<rect x='7' y='7' width='2' height='2' fill='#C9A227'/>` +
  `</svg>`
);

function injectFavicon() {
  if (document.querySelector('link[rel="icon"]')) return;
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = FAVICON_SVG;
  document.head.appendChild(link);
}

/* ---------- 装配 ---------- */
function boot() {
  injectFavicon();
  const body = document.body;
  body.prepend(buildHeader());
  body.append(buildFooter());
  injectMagicButton(); /* 全站注入右下角金色徽章（pro 模式可见） */
  initFilter();
  initLang();
  initMode();     /* mode 最后初始化：按钮文案依赖 i18n */
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
