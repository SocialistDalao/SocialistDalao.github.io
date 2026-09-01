/* ============================================================
   LOANCOLD — home.js
   主页装配（双模式）：
     pro 模式  → 零 3D 加载，仅静态编辑式内容
     art 模式  → 懒加载 3D 人像 + 打字机对话面板
   切换到 art 时按需初始化（仅一次）；切回 pro 由 CSS 隐藏，
   渲染循环因 IntersectionObserver 失焦自动暂停。

   降级链：
     WebGL 不可用 / three 失败 / 纹理失败
       → Canvas2D 静态双色点阵（dither2d.js，零依赖）
       → 图片失败 → placehold.co 占位
   ============================================================ */

import { t, getLang } from './i18n.js';
import { autoDitherImages } from './dither2d.js';

/* ---------- 3D 人像视口（懒加载，仅初始化一次） ---------- */
let heroStarted = false;
let heroMount = null; // 挂载实例，供模式切换时刷新尺寸

function startHeroOnce() {
  if (heroStarted) return;
  const mount = document.getElementById('hero-dither');
  if (!mount) return;
  heroStarted = true;
  /* 重建时：清除残留 canvas，补上 loading 提示（dither.js 在 sceneReady 时会自动移除） */
  mount.querySelectorAll('canvas').forEach(c => c.remove());
  if (!mount.querySelector('.dither-loading')) {
    const ld = document.createElement('div');
    ld.className = 'dither-loading mono';
    ld.textContent = 'LOADING_1BIT';
    mount.appendChild(ld);
  }

  (async () => {
    try {
      const [{ mountDitheredScene, DitherUnsupportedError }, { createPortraitScene }] = await Promise.all([
        import('./dither.js'),
        import('./figure.js'),
      ]);

      try {
        heroMount = mountDitheredScene(mount, {
          pixelScale: 3,
          ditherScale: 0.9, // 略低的抖动强度：暗背景更纯净，文字更突出
          sceneFactory: (viewport) => createPortraitScene({
            textureUrl: 'images/me_portrait.jpg',
            ...viewport,
          }),
          onSceneError: () => fallbackStaticPortrait(mount),
        });
      } catch (err) {
        if (err instanceof DitherUnsupportedError) fallbackStaticPortrait(mount);
        else console.error(err);
      }
    } catch (err) {
      console.warn('[home] 3D pipeline unavailable, falling back:', err && err.message);
      fallbackStaticPortrait(mount);
    }
  })();
}

/* 切回艺术模式时刷新画布尺寸（避免 display:none 期间尺寸归零） */
function refreshHero() {
  if (heroMount && heroMount.refresh) heroMount.refresh();
}

/* 降级：静态双色点阵照片（含蓝底抠像） */
function fallbackStaticPortrait(mount) {
  mount.querySelector('.dither-loading')?.remove();
  mount.querySelectorAll('canvas').forEach(c => c.remove());
  const cv = document.createElement('canvas');
  cv.setAttribute('data-dither-img', 'images/me_portrait.jpg');
  cv.setAttribute('data-dither-pixelscale', '3');
  cv.setAttribute('data-dither-keyblue', '1');
  cv.setAttribute('data-alt', '李程浩的 1bit 点阵肖像');
  cv.style.width = '100%';
  cv.style.height = '100%';
  cv.style.objectFit = 'cover';
  mount.appendChild(cv);
  autoDitherImages(mount);
}

/* ---------- 打字机对话面板（双语，可重启） ---------- */
const TYPE_SPEED = 65, ERASE_SPEED = 24, HOLD_MS = 2400;

function makeTyper(lineEl) {
  let timer = 0;
  function stop() { clearTimeout(timer); }
  function start() {
    stop();
    const LINES = [1, 2, 3, 4].map(i => t(`art.dialogue.${i}`));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { lineEl.textContent = LINES[0]; return; }
    let li = 0, ci = 0, deleting = false;
    (function step() {
      const line = LINES[li];
      if (!deleting) {
        ci++;
        lineEl.textContent = line.slice(0, ci);
        if (ci >= line.length) { deleting = true; timer = setTimeout(step, HOLD_MS); return; }
        timer = setTimeout(step, TYPE_SPEED + Math.random() * 60);
      } else {
        ci--;
        lineEl.textContent = line.slice(0, ci);
        if (ci <= 0) { deleting = false; li = (li + 1) % LINES.length; timer = setTimeout(step, 500); return; }
        timer = setTimeout(step, ERASE_SPEED);
      }
    })();
  }
  return { start, stop };
}

let typer = null;
function startDialogueOnce() {
  const lineEl = document.getElementById('dialogue-line');
  if (!lineEl || typer) return;
  typer = makeTyper(lineEl);
  typer.start();
  /* 语言切换时用新语言重启打字机 */
  window.addEventListener('lang:change', () => typer && typer.start());
}

/* ---------- 启动（按当前模式门控） ---------- */
function boot() {
  if (document.documentElement.getAttribute('data-mode') === 'art') {
    startHeroOnce();
    startDialogueOnce();
  }
  /* MagicButton 点击 → layout.js 已绑定 setMode('art')；
     这里监听模式切换：pro→art 时彻底 dispose 旧 mount 并重建 3D 视口，
     彻底规避长时间 pro 后 WebGL 状态异常导致人像消失的 bug。
     重建发生在 transitionToArt 的 veil 遮罩下（~620ms），用户无感知闪烁。 */
  window.addEventListener('mode:change', (e) => {
    if (e.detail === 'art') {
      if (heroMount) {
        try { heroMount.dispose(); } catch (_) { /* ignore */ }
        heroMount = null;
        heroStarted = false;
      }
      startHeroOnce();
      startDialogueOnce();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
