/* ============================================================
   LOANCOLD — dither2d.js
   零依赖 Canvas2D 静态双色抖动。
   与 dither.js（WebGL 管线）共享同一套调色板与抖动语义，
   但不依赖 three —— 供 about / works 及降级路径使用，
   保证 three CDN 失败时降级逻辑仍然可用。
   ============================================================ */

export const FILTER_COLORS = {
  amber:   { shadow: '#1A0F0A', light: '#C9A227' },
  ink:     { shadow: '#2E3550', light: '#D9D6C3' },
  citron:  { shadow: '#16160F', light: '#B5C437' },
  crimson: { shadow: '#230B0B', light: '#C96A5A' },
};

export function currentFilterId() {
  return document.documentElement.getAttribute('data-filter') || 'amber';
}

/* ---------- 8x8 Bayer 矩阵（递归生成，值域 [0,64)） ---------- */
const BAYER8 = (() => {
  /* M_{2n}(x,y) = 4·M_n(x mod n, y mod n) + M_2(⌊x/n⌋, ⌊y/n⌋)
     粗层（块偏移）用 M_2，细层用 4·M_n —— 保证值不重复、均匀分布 */
  const M2 = [[0, 2], [3, 1]];
  let m = M2;
  let n = 2;
  while (n < 8) {
    const nm = Array.from({ length: n * 2 }, () => new Array(n * 2));
    for (let y = 0; y < n * 2; y++) {
      for (let x = 0; x < n * 2; x++) {
        nm[y][x] = 4 * m[y % n][x % n] + M2[Math.floor(y / n)][Math.floor(x / n)];
      }
    }
    m = nm;
    n *= 2;
  }
  return m;
})();

function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function themeColors() {
  const f = FILTER_COLORS[currentFilterId()];
  return { shadow: f.shadow, light: f.light };
}

/* ---------- 把图片处理成双色点阵 ----------
   opts.keyBlue: 蓝底证件照色度抠像 + 径向羽化（与 WebGL 路径语义一致） */
export function ditherImageToCanvas(src, canvas, opts = {}) {
  const { shadow, light } = { ...themeColors(), ...opts };
  const pixelScale  = Math.max(1, opts.pixelScale || 4);
  const levels      = opts.levels || 2;
  const ditherScale = opts.ditherScale ?? 1.1;
  const keyBlue     = !!opts.keyBlue;
  const sh = parseHex(shadow), lt = parseHex(light);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const w = Math.max(2, Math.round(img.naturalWidth / pixelScale));
        const h = Math.max(2, Math.round(img.naturalHeight / pixelScale));
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const d = data.data;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = d[i], g = d[i + 1], b = d[i + 2];

            /* 抠像与羽化系数（keyBlue 时把人物从蓝底/边缘中提取） */
            let alpha = 1;
            if (keyBlue) {
              const blueExcess = (b - Math.max(r, g)) / 255;
              const key = 1 - smoothstep(0.06, 0.28, blueExcess);
              const nx = x / w, ny = y / h;
              const dist = Math.hypot((nx - 0.5), (ny * 0.82 - 0.40));
              const vig = smoothstep(0.62, 0.28, dist); // 径向羽化
              alpha = key * vig;
              if (alpha < 0.02) {
                d[i] = sh[0]; d[i + 1] = sh[1]; d[i + 2] = sh[2]; d[i + 3] = 255;
                continue;
              }
            }

            let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            lum += (BAYER8[y & 7][x & 7] / 64 - 0.5) * ditherScale;
            lum = Math.floor(Math.min(Math.max(lum, 0), 1) * levels) / (levels - 1);
            const t = Math.min(Math.max(lum, 0), 1);
            /* 双色映射后按 alpha 融回背景暗色 */
            d[i]     = Math.round(sh[0] + ((lt[0] - sh[0]) * t) * alpha);
            d[i + 1] = Math.round(sh[1] + ((lt[1] - sh[1]) * t) * alpha);
            d[i + 2] = Math.round(sh[2] + ((lt[2] - sh[2]) * t) * alpha);
            d[i + 3] = 255;
          }
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas);
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/* 扫描 canvas[data-dither-img] 并静态抖动；失败则降级为 <img>（最终兜底 placehold.co） */
export async function autoDitherImages(root = document) {
  const canvases = root.querySelectorAll('canvas[data-dither-img]');
  const jobs = Array.from(canvases).map(async (cv) => {
    try {
      await ditherImageToCanvas(cv.dataset.ditherImg, cv, {
        pixelScale: parseFloat(cv.dataset.ditherPixelscale || '4'),
        levels: parseInt(cv.dataset.ditherLevels || '2', 10),
        keyBlue: cv.dataset.ditherKeyblue === '1',
      });
      cv.classList.add('is-ready');
    } catch (err) {
      console.warn('[dither] image fallback:', err.message);
      const img = document.createElement('img');
      img.alt = cv.dataset.alt || '';
      img.onerror = () => {
        const c = themeColors();
        img.src = `https://placehold.co/640x360/${c.shadow.slice(1)}/${c.light.slice(1)}?text=IMAGE`;
      };
      img.src = cv.dataset.ditherImg;
      cv.replaceWith(img);
    }
  });
  await Promise.all(jobs);
}
