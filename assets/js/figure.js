/* ============================================================
   LOANCOLD — figure.js
   主页 3D 视觉主体：以人像照片为纹理的 2.5D 展板。

   - 蓝底证件照色度抠像（chroma key），人物融入暗色背景
   - 顶点弧形弯曲形成轻微柱面，转动时产生真实视差
   - 受限交互：yaw / pitch 被严格夹紧（约 ±9° / ±6°），
     禁用缩放；空闲时呼吸微摆 —— "3D 可变化，但角度有限"
   - 过大角度会导致看到展板侧面/背面穿帮，故不使用自由轨道
   ============================================================ */

import * as THREE from 'three';

const PORTRAIT_VERT = /* glsl */`
uniform float uCurve;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z += uCurve * p.x * p.x;   // 轻微柱面弯曲，产生 3D 视差
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const PORTRAIT_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uMap;
varying vec2 vUv;
void main() {
  vec4 t = texture2D(uMap, vUv);
  // 蓝底抠像：蓝色超出红绿通道的部分判定为背景
  float blueExcess = t.b - max(t.r, t.g);
  float a = 1.0 - smoothstep(0.06, 0.28, blueExcess);
  // 径向羽化，边缘融入背景点阵
  float vig = smoothstep(0.62, 0.28, distance(vUv * vec2(1.0, 0.82), vec2(0.5, 0.40)));
  float alpha = a * vig;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(t.rgb, alpha);
}`;

/**
 * 创建主页人像场景（供 mountDitheredScene 的 sceneFactory 使用）
 * @param {object} o { textureUrl, yawLimit, pitchLimit, scale }
 */
export async function createPortraitScene(o = {}) {
  const yawLimit   = o.yawLimit   ?? 0.30;  // ≈ ±17°，保证转动可感知
  const pitchLimit = o.pitchLimit ?? 0.16;  // ≈ ±9°
  const scale      = o.scale      ?? 1.0;

  /* --- 纹理 --- */
  const texture = await new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      o.textureUrl,
      (t) => resolve(t), // 保持原始 sRGB 值（ColorManagement 已关闭）
      undefined,
      () => reject(new Error(`portrait texture failed: ${o.textureUrl}`))
    );
  });
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  /* --- 场景骨架 --- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.02, 5.6);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.PlaneGeometry(1.8, 2.4, 48, 64);
  const mat = new THREE.ShaderMaterial({
    vertexShader: PORTRAIT_VERT,
    fragmentShader: PORTRAIT_FRAG,
    uniforms: {
      uMap:   { value: texture },
      uCurve: { value: 0.24 },
    },
    transparent: true,
    side: THREE.FrontSide,
  });
  const portrait = new THREE.Mesh(geo, mat);
  portrait.position.y = 0.22;
  group.add(portrait);
  group.scale.setScalar(scale);

  /* --- 滤镜同步（背景随双色主题变化） --- */
  function setFilter(shadowColor) {
    scene.background = scene.background || new THREE.Color();
    scene.background.copy(shadowColor);
  }
  setFilter(new THREE.Color('#1A0F0A'));

  /* --- 帧更新：受限角度 + 阻尼 + 呼吸 --- */
  function update(_dt, t, pointer, reduceMotion) {
    const idleYaw   = reduceMotion ? 0 : Math.sin(t * 0.35) * 0.022;
    const idlePitch = reduceMotion ? 0 : Math.sin(t * 0.9)  * 0.012;
    const tYaw   = THREE.MathUtils.clamp(pointer.x * yawLimit + idleYaw,   -yawLimit,   yawLimit);
    const tPitch = THREE.MathUtils.clamp(-pointer.y * pitchLimit + idlePitch, -pitchLimit, pitchLimit);
    // 阻尼插值，避免突兀跳变
    group.rotation.y += (tYaw - group.rotation.y) * 0.08;
    group.rotation.x += (tPitch - group.rotation.x) * 0.08;
    if (!reduceMotion) {
      group.position.y = Math.sin(t * 1.05) * 0.03; // 呼吸浮动
    }
  }

  return { scene, camera, update, setFilter };
}
