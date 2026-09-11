/* ============================================================
   LOANCOLD — blog.js
   博客集合：可替换数据源 + 分类筛选 + 双语渲染 + 模式门控 3D。

   数据源契约（未来接入 Notion 只需新增同接口实现）：
     class PostsSource { fetch() -> Promise<Post[]> }
     Post: { id, title, titleEn?, date, category, excerpt, url }
     category: 'travel' | 'poem' | 'thought' | 'misc'
   当前实现：LocalJsonSource('data/posts.json')
   ============================================================ */

import { t, getLang } from './i18n.js';

/* ---------- 数据源 ---------- */
export class LocalJsonSource {
  constructor(url) { this.url = url; }
  async fetch() {
    const res = await fetch(this.url);
    if (!res.ok) throw new Error(`posts fetch failed: ${res.status}`);
    return res.json();
  }
}

/* 未来替换示例（保留在此作为接缝说明）：
   export class NotionSource {
     constructor(databaseId) { this.databaseId = databaseId; }
     async fetch() { ... 调 Notion API，映射为 Post[] ... }
   }
*/

/* ---------- 博客顶部 3D 挂载点：体素波浪（仅艺术模式） ---------- */

/* three / 渲染管线动态导入：失败时仅禁用 3D 挂载点，列表照常渲染 */
let THREE = null;
let mountDitheredScene = null;
let DitherUnsupportedError = null;
try {
  THREE = await import('three');
  ({ mountDitheredScene, DitherUnsupportedError } = await import('./dither.js'));
} catch (_) { /* 3D 不可用，降级为无挂载点 */ }

let waveMounted = false;

async function createWaveScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 2.6, 7.2);
  camera.lookAt(0, 0, 0);

  const COLS = 26, ROWS = 12, GAP = 0.42;
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const mat = new THREE.MeshBasicMaterial(); // 亮度即高度信息，交给 dithering
  const count = COLS * ROWS;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  scene.add(mesh);
  const dummy = new THREE.Object3D();

  function update(_dt, tt, _pointer, reduceMotion) {
    if (reduceMotion) return;
    let i = 0;
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        const wx = (x - COLS / 2) * GAP;
        const wz = (z - ROWS / 2) * GAP;
        const hgt = 0.5 + 0.5 * Math.sin(wx * 0.9 + tt * 1.4) * Math.cos(wz * 1.1 - tt * 0.9);
        dummy.position.set(wx, hgt * 1.6 - 0.8, wz);
        dummy.scale.y = 0.4 + hgt * 1.8;
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function setFilter(shadowColor) {
    scene.background = scene.background || new THREE.Color();
    scene.background.copy(shadowColor);
    mat.color.setRGB(0.5, 0.5, 0.5);
  }
  setFilter(new THREE.Color('#1A0F0A'));

  return { scene, camera, update, setFilter };
}

function mountWave() {
  if (waveMounted) return;
  const mount = document.getElementById('blog-dither');
  if (!mount) return;
  if (!mountDitheredScene) { mount.style.display = 'none'; return; }
  waveMounted = true;
  try {
    mountDitheredScene(mount, {
      pixelScale: 3,
      interactive: false,
      sceneFactory: () => createWaveScene(),
      onSceneError: () => { mount.style.display = 'none'; },
    });
  } catch (err) {
    if (err instanceof DitherUnsupportedError) mount.style.display = 'none';
  }
}

/* ---------- 列表渲染（双语） ---------- */
const CATEGORIES = ['all', 'travel', 'poem', 'thought', 'misc'];

class BlogApp {
  constructor(source) {
    this.source = source;
    this.posts = [];
    this.active = 'all';
    this.listEl = document.getElementById('post-list');
    this.chipRow = document.getElementById('chip-row');
  }

  async start() {
    try {
      this.posts = await this.source.fetch();
    } catch (err) {
      console.error('[blog]', err);
      this.listEl.innerHTML = `<p class="dim mono">${t('blog.loadfail')}</p>`;
      return;
    }
    /* 日期倒序，空日期沉底 */
    this.posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    this.renderChips();
    this.render();
  }

  title(p) {
    const lang = getLang();
    return (lang === 'en' && p.titleEn) ? p.titleEn : p.title;
  }

  renderChips() {
    const cats = CATEGORIES.filter(c => c === 'all' || this.posts.some(p => p.category === c));
    this.chipRow.innerHTML = cats.map(c =>
      `<button class="chip ${c === this.active ? 'is-active' : ''}" data-cat="${c}">${t('blog.cat.' + c)}</button>`
    ).join('');
    this.chipRow.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.active = btn.dataset.cat;
        this.chipRow.querySelectorAll('.chip').forEach(b =>
          b.classList.toggle('is-active', b.dataset.cat === this.active));
        this.render();
      });
    });
  }

  render() {
    const lang = getLang();
    const posts = this.active === 'all'
      ? this.posts
      : this.posts.filter(p => p.category === this.active);

    if (!posts.length) {
      this.listEl.innerHTML = `<p class="dim mono">${t('blog.empty')}</p>`;
      return;
    }
    this.listEl.innerHTML = posts.map(p => {
      /* .md 内容经通用渲染器 doc.html 打开；其他（如 roadbook.html）直链 */
      const href = p.url.endsWith('.md') ? `doc.html?c=${encodeURI(p.url)}` : encodeURI(p.url);
      return `
      <a class="post-row reveal is-visible" href="${href}">
        <span class="p-date mono">${p.date || t('blog.unknown.date')}</span><span class="p-cat">${t('blog.cat.' + p.category)}</span>
        <h3>${this.title(p)}</h3>
        <p class="p-excerpt">${p.excerpt || ''}</p>
      </a>`;
    }).join('');
  }
}

/* ---------- 启动 ---------- */
function boot() {
  /* 波浪 3D 仅艺术模式挂载；切到 art 时懒加载 */
  if (document.documentElement.getAttribute('data-mode') === 'art') mountWave();
  window.addEventListener('mode:change', (e) => {
    if (e.detail === 'art') mountWave();
  });

  const app = new BlogApp(new LocalJsonSource('data/posts.json'));
  app.start();
  /* 语言切换时重渲染标题与筛选文案 */
  window.addEventListener('lang:change', () => {
    if (app.posts.length) { app.renderChips(); app.render(); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
