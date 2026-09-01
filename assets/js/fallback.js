/* ============================================================
   LOANCOLD — fallback.js（普通脚本，零依赖，非 ES Module）
   专为 file:// 直接打开设计：浏览器会拦截 ES Module（CORS），
   本脚本不受限制，提供降级但完整的浏览体验。

   http/https 下此脚本不做任何事（module 版本全功能运行）。

   file:// 下的能力边界：
     - DOM 注入（导航/页脚/提示条）    ✔ 可用
     - 打字机动画                      ✔ 可用
     - <img> 显示原图                  ✔ 可用
     - ES Module / fetch JSON          ✘ 被浏览器拦截
     - Canvas 读本地图片（抖动处理）    ✘ canvas 被污染
     - WebGL three.js                  ✘ module 不可用
   ============================================================ */
(function () {
  'use strict';
  if (location.protocol !== 'file:') return;

  /* ---------- 提示条 ---------- */
  function banner() {
    var bar = document.createElement('div');
    bar.className = 'file-banner';
    bar.innerHTML =
      '⚠ 本地文件模式 — 3D 与抖动效果不可用。' +
      '运行 <code>python3 -m http.server</code> 或部署到线上以获得完整体验。' +
      ' / <span class="en">Local file mode — full experience needs a local server.</span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ---------- 简化导航 / 页脚 ---------- */
  var NAV = [
    { href: 'index.html', label: '主页' },
    { href: 'about.html', label: '关于' },
    { href: 'works.html', label: '作品' },
    { href: 'blog.html',  label: '博客' },
  ];
  function currentPage() {
    var p = location.pathname.split('/').pop();
    return (p === '' || p === '/') ? 'index.html' : p;
  }
  function basePath() {
    var seg = location.pathname.split('/').filter(Boolean);
    return seg.length > 1 ? '../' : '';
  }
  function header() {
    var cur = currentPage();
    var base = basePath();
    var h = document.createElement('header');
    h.className = 'site-header';
    h.innerHTML =
      '<a class="logo" href="' + base + 'index.html">LOANCOLD<em>_</em></a>' +
      '<nav>' + NAV.map(function (n) {
        return '<a href="' + base + n.href + '" class="' + (n.key === cur ? 'is-active' : '') + '">' + n.label + '</a>';
      }).join('') + '</nav>';
    document.body.insertBefore(h, document.body.firstChild.nextSibling);
  }
  function footer() {
    var f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = '© 2021–2026 李程浩 · LoanCold — ' +
      '<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">湘ICP备2021002933号-1</a>';
    document.body.appendChild(f);
  }

  /* ---------- 主页：人像原图 + 打字机 ---------- */
  function fixHero() {
    var mount = document.getElementById('hero-dither');
    if (mount) {
      mount.innerHTML = '';
      var img = document.createElement('img');
      img.src = 'images/me_portrait.jpg';
      img.alt = '李程浩';
      img.onerror = function () { img.style.display = 'none'; };
      img.style.cssText = 'height:100%;width:auto;max-width:100%;object-fit:contain;margin:0 auto;display:block;';
      mount.appendChild(img);
    }
    /* 打字机（简化版） */
    var lineEl = document.getElementById('dialogue-line');
    if (!lineEl) return;
    var LINES = [
      '我是李程浩，也可以叫我 LoanCold。',
      '写操作系统，也写诗。',
      '体系结构 · 操作系统 · 分布式系统 · 数据库。',
    ];
    var li = 0, ci = 0, del = false;
    (function step() {
      var line = LINES[li];
      if (!del) {
        lineEl.textContent = line.slice(0, ++ci);
        if (ci >= line.length) { del = true; return setTimeout(step, 2400); }
        return setTimeout(step, 70);
      }
      lineEl.textContent = line.slice(0, --ci);
      if (ci <= 0) { del = false; li = (li + 1) % LINES.length; return setTimeout(step, 500); }
      setTimeout(step, 24);
    })();
  }

  /* ---------- about/works：抖动画布退回原图 ---------- */
  function fixCanvases() {
    var list = document.querySelectorAll('canvas[data-dither-img]');
    for (var i = 0; i < list.length; i++) {
      var cv = list[i];
      var img = document.createElement('img');
      img.alt = cv.getAttribute('data-alt') || '';
      img.src = cv.getAttribute('data-dither-img');
      img.onerror = function () { this.style.visibility = 'hidden'; };
      if (cv.parentNode) cv.parentNode.replaceChild(img, cv);
    }
  }

  /* ---------- blog：fetch 不可用，指向静态列表 ---------- */
  function fixBlog() {
    var list = document.getElementById('post-list');
    if (list && !list.children.length) {
      list.innerHTML =
        '<p class="dim mono">本地文件模式下数据加载不可用 — 请使用 <a href="life.html">旧版文章列表</a>，' +
        '或通过本地服务器 / 线上地址访问完整博客。</p>';
    }
    var mount = document.getElementById('blog-dither');
    if (mount) mount.style.display = 'none';
  }

  function boot() {
    banner();
    header();
    footer();
    fixHero();
    fixCanvases();
    fixBlog();
    document.querySelectorAll('.dither-loading').forEach(function (el) { el.remove(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
