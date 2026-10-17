/** Read-only coach-house exhibit (`?mounts`). Uses the game's materials and post pass; never opens a save. */
import * as THREE from 'three';
import { startLoop } from '../core/loop';
import { PAD_BUTTON } from '../core/padMap';
import { activePad } from '../core/pads';
import { MOUNTS, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import { RENDER, SIM } from '../data/tuning';
import { allEffectsOn, computeFx } from '../render/fx';
import { tint } from '../render/meshKit';
import { createMount } from '../render/mounts';
import { createPipeline } from '../render/pipeline';
import { updatePostUniforms } from '../render/postPass';
import { createWorldMaterial, updateWorldUniforms, worldUniforms } from '../render/worldMaterial';

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const STYLE = `
 .mount-exhibit{position:fixed;inset:0;z-index:30;color:#e4ddd1;font:13px/1.5 Georgia,serif;pointer-events:none;background:linear-gradient(180deg,#07080ca8,transparent 20%,transparent 60%,#07080cdd)}
 .mount-exhibit *{box-sizing:border-box}.mount-exhibit header{position:absolute;top:28px;left:36px;right:36px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
 .mount-exhibit .eyebrow{font:10px/1.5 monospace;letter-spacing:.22em;text-transform:uppercase;color:#b3a590}.mount-exhibit .brand{margin:3px 0 0;font-size:21px;letter-spacing:.12em;font-weight:normal}
 .mount-exhibit a{color:#bbb4a9;pointer-events:auto;text-decoration:none;border-bottom:1px solid #777064;padding:3px 0;font:11px/1.5 monospace}
 .mount-exhibit .plate{position:absolute;left:36px;right:36px;bottom:26px;max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(250px,1fr) auto;gap:28px;align-items:end}
 .mount-exhibit h1{margin:6px 0 8px;font-size:clamp(23px,3.1vw,39px);font-weight:normal;line-height:1.1;letter-spacing:-.02em}.mount-exhibit p{margin:0;color:#aca69e;max-width:400px;font-size:13px}
 .mount-exhibit .spec{margin-top:14px;font:10px/1.6 monospace;letter-spacing:.06em;color:#8e8794}.mount-exhibit .controls{max-width:460px;pointer-events:auto;padding:15px 17px;background:#0c0d12d9;border:1px solid #39323e;box-shadow:0 8px 40px #0007}
 .mount-exhibit .row{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.mount-exhibit .row:first-child{margin-top:0}.mount-exhibit button{font:11px/1.4 monospace;color:#b8b0b4;cursor:pointer;border:1px solid #413a43;background:#141319;padding:8px 10px;min-height:33px}
 .mount-exhibit button:hover{border-color:#b49cc3;color:#fff}.mount-exhibit button:focus-visible,.mount-exhibit a:focus-visible{outline:2px solid #d5b5ec;outline-offset:3px}.mount-exhibit button[aria-pressed=true]{border-color:#a48cbb;background:#31243b;color:#f2e5fa}
 .mount-exhibit .hint{margin-top:12px;color:#817986;font:9px/1.6 monospace}.mount-exhibit .status{position:absolute;top:103px;right:36px;color:#9c8ca5;font:10px/1.5 monospace;letter-spacing:.08em}
 .mount-exhibit.is-hidden{background:none}.mount-exhibit.is-hidden>*{display:none}
 @media(max-width:720px){.mount-exhibit header{top:18px;left:20px;right:20px}.mount-exhibit .brand{font-size:16px}.mount-exhibit .plate{left:20px;right:20px;bottom:14px;gap:12px;grid-template-columns:1fr}.mount-exhibit .controls{max-width:none;padding:9px 10px}.mount-exhibit h1{font-size:25px;margin:4px 0}.mount-exhibit p,.mount-exhibit .spec{display:none}.mount-exhibit .row{margin-top:5px}.mount-exhibit button{padding:5px 8px;min-height:28px}.mount-exhibit .hint{margin-top:7px}.mount-exhibit .status{top:80px;right:20px;font-size:9px}}
`;

export async function startMountGallery(): Promise<void> {
  const pipeline = createPipeline(document.body);
  const canvas = pipeline.renderer.domElement;
  canvas.setAttribute('aria-label', 'Rotatable animated mount exhibit. Drag to orbit, scroll to zoom.');
  canvas.style.touchAction = 'none';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.013, 0.014, 0.022);
  const camera = new THREE.PerspectiveCamera(42, RENDER.width / RENDER.height, 0.1, 90);
  const mounts = { chariot: createMount('chariot'), automobile: createMount('automobile') };
  for (const m of Object.values(mounts)) scene.add(m.root);
  mounts.automobile.root.visible = false;
  const stage = makeStage(scene);
  const enabled = allEffectsOn();
  enabled.warp = enabled.displace = enabled.lens = enabled.dread = false;
  const fx = computeFx({ sanity: 100, cap: 0, anomalyProximity: 0.5, enabled });
  fx.fogNear = 17; fx.fogFar = 40;
  const u = worldUniforms;
  u.uLightDir.value.set(-0.55, 0.85, 0.4).normalize();
  u.uLightColor.value.set(1.12, 1.06, 0.98);
  u.uAmbient.value.set(0.56, 0.52, 0.65);
  u.uFogColor.value.set(0.013, 0.014, 0.022);
  u.uGlowPos.value.set(3, 1.6, 2); u.uGlowColor.value.set(0.24, 0.03, 0.42); u.uGlowRange.value = 11;
  u.uLamps.value[0].set(-4, 3, 2, 15); u.uLampColors.value[0].set(4, 2.7, 1.6);
  u.uLamps.value[1].set(4, 3, -3, 13); u.uLampColors.value[1].set(2.5, 0.3, 4);

  const overlay = document.createElement('section');
  overlay.className = 'mount-exhibit'; overlay.setAttribute('aria-label', 'Mount exhibit controls');
  const style = document.createElement('style'); style.textContent = STYLE; overlay.append(style);
  overlay.insertAdjacentHTML('beforeend', `<header><div><div class="eyebrow">Seventy Steps · The coach house</div><h2 class="brand">A SWIFTER PASSAGE</h2></div><a href="${location.pathname}">Return to title ↗</a></header>
    <div class="status" aria-live="polite"></div><div class="plate"><div><div class="eyebrow">I · The spectral procession</div><h1></h1><p></p><div class="spec">ONE TRAVERSAL MODEL · TWO APPEARANCES</div></div><div class="controls"><div class="row" data-row="mount"></div><div class="row" data-row="gait"></div><div class="row" data-row="view"></div><div class="hint">Drag / right stick: orbit · Wheel / left stick: zoom<br>1 / 2: mount · Space: pause · O: orbit · H: hide labels</div></div></div>`);
  document.body.append(overlay);
  const heading = overlay.querySelector('h1')!;
  const description = overlay.querySelector('p')!;
  const chapter = overlay.querySelector('.plate .eyebrow')!;
  const status = overlay.querySelector('.status')!;
  const buttons: HTMLButtonElement[] = [];
  let id: MountId = 'chariot', gait = 2, paused = false, auto = true, detailed = false;
  let yaw = -0.92, pitch = 0.22, radius = 11, distance = 11, time = 0, speed = 0;
  let dragging = false, lastX = 0, lastY = 0, hidden = false;
  const target = new THREE.Vector3(0, 1.2, 1.3), aim = target.clone();
  const rates = [0, MOUNT_TRAVERSAL.cruise, MOUNT_TRAVERSAL.gallop];
  const refresh = (): void => {
    const data = MOUNTS[id]; heading.textContent = data.name; description.textContent = data.description;
    chapter.textContent = id === 'chariot' ? 'I · The spectral procession' : 'II · A machine out of time';
    status.textContent = `${['AT REST', 'TRAVELLING', 'GALLOPING'][gait]}${paused ? ' · PAUSED' : ''} · VISUAL EXHIBIT`;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.mount ? b.dataset.mount === id : b.dataset.gait ? Number(b.dataset.gait) === gait : b.dataset.action === 'pause' ? paused : b.dataset.action === 'orbit' ? auto : b.dataset.action === 'resolution' ? detailed : false));
  };
  const button = (row: string, text: string, action: () => void, data: Record<string, string> = {}): HTMLButtonElement => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = text;
    Object.assign(b.dataset, data); b.addEventListener('click', () => { action(); refresh(); });
    overlay.querySelector(`[data-row="${row}"]`)!.append(b); buttons.push(b); return b;
  };
  const frame = (): void => {
    const bounds = new THREE.Box3().setFromObject(mounts[id].root), size = bounds.getSize(new THREE.Vector3());
    bounds.getCenter(target); target.y = Math.max(1, size.y * 0.48); aim.copy(target);
    distance = Math.max(size.z, size.x * 1.1, size.y * 1.5) * 1.65; radius = distance;
  };
  const choose = (next: MountId): void => {
    mounts[id].root.visible = false; id = next; mounts[id].root.visible = true; frame(); refresh();
  };
  for (const mount of ['chariot', 'automobile'] as const) button('mount', mount === 'chariot' ? '1 · Spectral chariot' : '2 · Brassbound motor car', () => choose(mount), { mount });
  ['Rest', 'Walk', 'Gallop'].forEach((label, i) => button('gait', label, () => { gait = i; }, { gait: String(i) }));
  const pauseButton = button('gait', 'Pause', () => { paused = !paused; }, { action: 'pause' });
  button('view', 'Orbit', () => { auto = !auto; }, { action: 'orbit' });
  button('view', 'Profile', () => { yaw = -Math.PI / 2; pitch = 0.12; auto = false; radius = distance; });
  button('view', 'Three-quarter', () => { yaw = -0.92; pitch = 0.22; auto = false; radius = distance; });
  const resolutionButton = button('view', 'Inspect at 800px', () => { detailed = !detailed; resize(); }, { action: 'resolution' });
  const resize = (): void => { pipeline.resize(true, detailed ? 2 : 1.5); resolutionButton.textContent = detailed ? 'Game resolution' : 'Inspect at 800px'; };
  const listeners = new AbortController(), signal = listeners.signal;
  addEventListener('resize', resize, { signal });
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; auto = false; canvas.setPointerCapture(e.pointerId); refresh(); }, { signal });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    yaw -= (e.clientX - lastX) * 0.007; pitch = clamp(pitch + (e.clientY - lastY) * 0.005, 0.04, 0.85);
    lastX = e.clientX; lastY = e.clientY;
  }, { signal });
  canvas.addEventListener('pointerup', () => { dragging = false; }, { signal });
  canvas.addEventListener('lostpointercapture', () => { dragging = false; }, { signal });
  canvas.addEventListener('wheel', e => { e.preventDefault(); radius = clamp(radius * Math.exp(e.deltaY * 0.001), distance * 0.4, distance * 2); }, { passive: false, signal });
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === ' ' && e.target instanceof HTMLElement && ['BUTTON', 'A'].includes(e.target.tagName)) return;
    if (key === '1' || key === '2') choose(key === '1' ? 'chariot' : 'automobile');
    if (key === ' ') { e.preventDefault(); paused = !paused; }
    if (key === 'o') auto = !auto;
    if (key === 'h') { hidden = !hidden; overlay.classList.toggle('is-hidden', hidden); }
    refresh();
  }, { signal });
  choose(id); resize(); refresh();
  camera.position.set(target.x - radius * 0.72, target.y + radius * 0.22, target.z + radius * 0.6); camera.lookAt(target);
  await pipeline.compile(scene, camera);
  let padHeld = new Set<number>();
  const stop = startLoop({
    step(dt) {
      const pad = activePad();
      const down = new Set(pad?.buttons.flatMap((b, i) => b.pressed ? [i] : []) ?? []);
      const hit = (n: number): boolean => down.has(n) && !padHeld.has(n);
      if (hit(PAD_BUTTON.lb) || hit(PAD_BUTTON.rb)) choose(id === 'chariot' ? 'automobile' : 'chariot');
      if (hit(PAD_BUTTON.a)) { paused = !paused; refresh(); }
      if (hit(PAD_BUTTON.up)) { gait = (gait + 1) % 3; refresh(); }
      padHeld = down;
      const stick = (i: number): number => Math.abs(pad?.axes[i] ?? 0) > 0.15 ? pad!.axes[i] : 0;
      if (stick(2) || stick(3)) { if (auto) { auto = false; refresh(); } yaw -= stick(2) * dt * 1.9; pitch = clamp(pitch + stick(3) * dt, 0.04, 0.85); }
      radius = clamp(radius * Math.exp(stick(1) * dt), distance * 0.4, distance * 2);
      if (auto && !dragging) yaw += dt * 0.12;
      if (!paused) {
        time += dt; speed += (rates[gait] - speed) * Math.min(1, dt * 4);
        mounts[id].update({ time, dt, speed, turn: 0 });
      }
      aim.lerp(target, Math.min(1, dt * 5));
    },
    render() {
      camera.position.set(aim.x + Math.sin(yaw) * Math.cos(pitch) * radius, aim.y + Math.sin(pitch) * radius, aim.z + Math.cos(yaw) * Math.cos(pitch) * radius);
      camera.lookAt(aim); updateWorldUniforms(fx, time, camera.position, target, pipeline.size);
      updatePostUniforms(pipeline.post, fx, time, pipeline.size); pipeline.render(scene, camera, target);
      pauseButton.textContent = paused ? 'Resume' : 'Pause';
    },
  }, SIM.hz, SIM.maxFrameSeconds);
  addEventListener('pagehide', () => { stop(); listeners.abort(); for (const m of Object.values(mounts)) m.dispose(); stage(); pipeline.renderer.dispose(); overlay.remove(); }, { once: true });
}

/** A plain stone turntable and worn brass rings keep the coachwork's silhouette readable. */
function makeStage(scene: THREE.Scene): () => void {
  const material = createWorldMaterial({ texture: 'stone', vertexColors: true, uvScale: [6, 6], vary: 0.18 });
  const trim = createWorldMaterial({ texture: 'cloth', vertexColors: true, emissive: 0.2 });
  const geometries: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, m = material): void => { geometries.push(g); scene.add(new THREE.Mesh(g, m)); };
  add(tint(new THREE.PlaneGeometry(100, 100, 10, 10).rotateX(-Math.PI / 2).translate(0, -0.13, 0), [0.19, 0.2, 0.23]));
  add(tint(new THREE.CylinderGeometry(7.2, 7.4, 0.12, 80).translate(0, -0.075, 1), [0.31, 0.31, 0.34]));
  for (const r of [6.8, 7.05]) add(tint(new THREE.TorusGeometry(r, 0.013, 3, 96).rotateX(Math.PI / 2).translate(0, -0.006, 1), [0.5, 0.4, 0.29]), trim);
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12;
    add(tint(new THREE.BoxGeometry(0.025, 0.008, i % 3 ? 0.12 : 0.25).translate(0, 0, 6.63).rotateY(a).translate(0, -0.002, 1), [0.36, 0.3, 0.26]), trim);
  }
  return () => { for (const g of geometries) g.dispose(); material.dispose(); trim.dispose(); };
}
