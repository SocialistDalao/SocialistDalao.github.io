/* ============================================================
   LOANCOLD — dither.js
   1bit 双色有序抖动 WebGL 渲染管线。

   场景 → 低分辨率 RenderTarget → 全屏后处理（8x8 Bayer 抖动
   + 亮度量化 + 双色映射）→ 低分辨率画布 → nearest 放大（CSS
   image-rendering: pixelated），得到粗颗粒规则点阵。

   Canvas2D 静态抖动在 ./dither2d.js（零依赖），
   此处 re-export 以保持单一入口兼容。

   通用挂载协议：
     mountDitheredScene(el, opts) 可在任意内页元素上嵌入
     dithering 视口（data-dither-mount 的运行时实现）。
   ============================================================ */

import * as THREE from 'three';
import {
  FILTER_COLORS,
  currentFilterId,
} from './dither2d.js';

export { FILTER_COLORS, currentFilterId, ditherImageToCanvas, autoDitherImages } from './dither2d.js';

/* 关闭色彩管理：全链路保持原始 sRGB 分量值，
   保证 dithering 的亮度语义与 CSS 调色板完全一致（否则输出整体偏亮） */
THREE.ColorManagement.enabled = false;

export class DitherUnsupportedError extends Error {
  constructor(reason) {
    super(`Dithering pipeline unsupported: ${reason}`);
    this.name = 'DitherUnsupportedError';
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/* ---------- 后处理着色器 ---------- */
const POST_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const POST_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec3  uShadow;
uniform vec3  uLight;
uniform float uLevels;      // 2.0 = 1bit 双色（默认）
uniform float uDitherScale; // 抖动强度

// Bayer 2x2 递归基（fract 紧凑式，8x8 展开）
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }

void main() {
  vec3  c   = texture2D(tDiffuse, vUv).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));      // 亮度域
  vec2  p   = gl_FragCoord.xy;                         // RT 分辨率即点阵分辨率
  float b   = bayer2(0.25 * p) * 0.0625
            + bayer2(0.5  * p) * 0.25
            + bayer2(p);                               // 8x8 Bayer，[0,1)
  lum += (b - 0.5) * uDitherScale;                     // 有序抖动
  lum  = floor(clamp(lum, 0.0, 1.0) * uLevels) / max(uLevels - 1.0, 1.0); // 量化
  gl_FragColor = vec4(mix(uShadow, uLight, clamp(lum, 0.0, 1.0)), 1.0);   // 双色映射
}`;

/* ============================================================
   mountDitheredScene(el, opts)
   在任意元素上挂载一个 1bit dithering 渲染视口。
   opts:
     sceneFactory: async ({ width, height }) => {
        scene, camera,
        update?(dt, t, pointer, reduceMotion),
        setFilter?(shadowColor, lightColor)   // 滤镜切换回调
     }
     pixelScale: 3        // 显示分辨率 / 渲染分辨率（粗颗粒度）
     levels: 2            // 亮度量化级数（2=1bit）
     ditherScale: 1.15    // 抖动强度
     interactive: true    // 是否响应指针（用于受限角度交互）
     onSceneError(err)    // 场景装配失败回调（降级入口）
   returns { dispose(), setFilter(id) }
   throws DitherUnsupportedError（调用方可据此降级）
   ============================================================ */
export function mountDitheredScene(el, opts = {}) {
  const pixelScale  = Math.max(1, opts.pixelScale || 3);
  const levels      = opts.levels || 2;
  const ditherScale = opts.ditherScale ?? 1.15;

  /* --- WebGL 可用性 --- */
  try {
    const test = document.createElement('canvas').getContext('webgl2')
              || document.createElement('canvas').getContext('webgl');
    if (!test) throw new Error('no webgl');
  } catch (err) {
    throw new DitherUnsupportedError(err && err.message);
  }

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(1); // 分辨率由 pixelScale 控制，避免高 DPI 开销翻倍
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // 输出不做额外转换

  const canvas = renderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  el.classList.add('dither-viewport');
  el.appendChild(canvas);

  /* --- 后处理场景 --- */
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const shadowCur = hexToRgb(FILTER_COLORS[currentFilterId()].shadow);
  const lightCur  = hexToRgb(FILTER_COLORS[currentFilterId()].light);
  const shadowTgt = shadowCur.clone();
  const lightTgt  = lightCur.clone();

  const postMat = new THREE.ShaderMaterial({
    vertexShader: POST_VERT,
    fragmentShader: POST_FRAG,
    uniforms: {
      tDiffuse:    { value: null },
      uShadow:     { value: shadowCur },
      uLight:      { value: lightCur },
      uLevels:     { value: levels },
      uDitherScale:{ value: ditherScale },
    },
    depthTest: false,
    depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  /* --- 业务场景 --- */
  let userScene = null;
  let renderTarget = null;
  let sceneReady = false;

  const pointer = { x: 0, y: 0 };
  const pointerTgt = { x: 0, y: 0 };

  function onPointerMove(e) {
    const r = el.getBoundingClientRect();
    pointerTgt.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointerTgt.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  if (opts.interactive !== false) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  /* --- 尺寸 --- */
  let rtW = 2, rtH = 2;
  function resize() {
    const w = Math.max(2, Math.floor(el.clientWidth / pixelScale));
    const h = Math.max(2, Math.floor(el.clientHeight / pixelScale));
    if (w === rtW && h === rtH) return;
    rtW = w; rtH = h;
    renderer.setSize(rtW, rtH, false);
    if (renderTarget) renderTarget.dispose();
    renderTarget = new THREE.WebGLRenderTarget(rtW, rtH, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });
    postMat.uniforms.tDiffuse.value = renderTarget.texture;
    if (userScene && userScene.camera) {
      userScene.camera.aspect = rtW / rtH;
      userScene.camera.updateProjectionMatrix();
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  /* --- 滤镜切换（双色渐变过渡） --- */
  function setFilter(id) {
    const f = FILTER_COLORS[id] || FILTER_COLORS.amber;
    shadowTgt.copy(hexToRgb(f.shadow));
    lightTgt.copy(hexToRgb(f.light));
    if (userScene && userScene.setFilter) userScene.setFilter(shadowTgt, lightTgt);
  }
  const onFilter = (e) => setFilter(e.detail);
  window.addEventListener('dither:filter', onFilter);

  /* --- 渲染循环（后台暂停） --- */
  let running = !document.hidden;
  let inView = true;
  let rafId = 0;
  let last = performance.now();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (!running || !sceneReady) return;
    /* 元素隐藏（display:none → clientWidth/Height = 0）时暂停渲染；
       恢复可见时自动重算尺寸并继续 —— 不依赖 IntersectionObserver 时序，
       彻底规避模式来回切换后人像消失的问题 */
    const hidden = el.clientWidth < 2 || el.clientHeight < 2;
    if (hidden) { inView = false; return; }
    if (!inView) { inView = true; resize(); }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // 指针阻尼
    pointer.x += (pointerTgt.x - pointer.x) * 0.08;
    pointer.y += (pointerTgt.y - pointer.y) * 0.08;
    if (userScene.update) userScene.update(dt, now / 1000, pointer, reduceMotion);

    // 双色过渡
    shadowCur.lerp(shadowTgt, 0.12);
    lightCur.lerp(lightTgt, 0.12);

    renderer.setRenderTarget(renderTarget);
    renderer.render(userScene.scene, userScene.camera);
    renderer.setRenderTarget(null);
    postMat.uniforms.tDiffuse.value = renderTarget.texture;
    renderer.render(postScene, postCamera);
  }

  function onVisibility() {
    running = !document.hidden;
    last = performance.now();
  }
  document.addEventListener('visibilitychange', onVisibility);

  /* --- 装配业务场景 --- */
  (async () => {
    try {
      userScene = await opts.sceneFactory({ width: rtW, height: rtH });
      if (!userScene || !userScene.scene || !userScene.camera) {
        throw new Error('sceneFactory returned invalid scene');
      }
      /* 场景就绪后立即同步相机纵横比（首次 resize 发生在场景加载前，
         否则 aspect 停留在 1，画面会被画布比例拉伸变形） */
      userScene.camera.aspect = rtW / rtH;
      userScene.camera.updateProjectionMatrix();
      sceneReady = true;
      const f = FILTER_COLORS[currentFilterId()];
      if (userScene.setFilter) userScene.setFilter(hexToRgb(f.shadow), hexToRgb(f.light));
      el.querySelector('.dither-loading')?.remove();
    } catch (err) {
      console.error('[dither] scene failed:', err);
      dispose();
      if (opts.onSceneError) opts.onSceneError(err);
    }
  })();

  rafId = requestAnimationFrame(tick);

  /* --- 清理 --- */
  function dispose() {
    cancelAnimationFrame(rafId);
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('dither:filter', onFilter);
    if (opts.interactive !== false) window.removeEventListener('pointermove', onPointerMove);
    renderTarget?.dispose();
    postMat.dispose();
    renderer.dispose();
    canvas.remove();
  }

  /* refresh：供外部（模式切换）强制重算尺寸。
     双 rAF 确保 display 已从 none 恢复、clientWidth 返回真实值 */
  function refresh() {
    requestAnimationFrame(() => requestAnimationFrame(resize));
  }

  return { dispose, setFilter, refresh };
}
