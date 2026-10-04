"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Moon, Sun } from "lucide-react";

/* Diorama 3D hero. Dimuat via next/dynamic ssr:false di Hero.tsx.
   Cleanup lengkap → aman untuk StrictMode (mount 2× di dev). */

const GREEN = 0x0b5c43, GREEN2 = 0x116a4e, AMBER = 0xf59e0b, TERRA = 0xc96f4a;
const CREAM = 0xf6f3ec, WHITE = 0xfdfcf9, ROAD = 0xe6e2d8;
const TRUNK = 0x8a6f55, LEAF = 0x5d8a6d, LEAF2 = 0x6f9b7f, GLASS = 0x2a3530;

const mat = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, ...o });

const box = (w: number, h: number, d: number, color: number) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = m.receiveShadow = true;
  return m;
};

const easeOutBack = (x: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

function house(w: number, h: number, d: number, wall: number, roof: number, roofH = 1) {
  const g = new THREE.Group();
  const b = box(w, h, d, wall);
  b.position.y = h / 2;
  g.add(b);
  const r = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.78, roofH, 4),
    mat(roof, { flatShading: true })
  );
  r.rotation.y = Math.PI / 4;
  r.position.y = h + roofH / 2;
  r.castShadow = true;
  g.add(r);
  return g;
}

function shop() {
  const g = new THREE.Group();
  const b = box(1.25, 1.1, 1, 0xe9efe9); b.position.y = 0.55; g.add(b);
  const band = box(1.31, 0.16, 1.06, GREEN); band.position.y = 1.0; g.add(band);
  const door = box(0.34, 0.5, 0.05, GLASS); door.position.set(0, 0.25, 0.51); g.add(door);
  return g;
}

function mosque() {
  const g = new THREE.Group();
  const base = box(1.7, 0.95, 1.3, WHITE); base.position.y = 0.475; g.add(base);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(GREEN2)
  );
  dome.position.y = 0.95; dome.castShadow = true; g.add(dome);
  const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 6), mat(AMBER));
  fin.position.y = 1.52; g.add(fin);
  const min = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.7, 8), mat(WHITE));
  min.position.set(1.05, 0.85, 0.75); min.castShadow = true; g.add(min);
  const minTop = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 8), mat(GREEN2));
  minTop.position.set(1.05, 1.85, 0.75); minTop.castShadow = true; g.add(minTop);
  return g;
}

function tree(s = 1, leaf = LEAF, foliage: THREE.Mesh[]) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.5 * s, 6), mat(TRUNK));
  t.position.y = 0.25 * s; t.castShadow = true; g.add(t);
  const f = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34 * s, 0), mat(leaf, { flatShading: true })
  );
  f.position.y = 0.72 * s; f.castShadow = true; g.add(f);
  foliage.push(f);
  return g;
}

function car() {
  const g = new THREE.Group();
  const body = box(1.15, 0.32, 0.55, AMBER); body.position.y = 0.3; g.add(body);
  const cab = box(0.6, 0.28, 0.5, GLASS); cab.position.set(-0.08, 0.58, 0); g.add(cab);
  const wg = new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10);
  wg.rotateX(Math.PI / 2);
  const wm = mat(0x2a2a28);
  ([[0.36, 0.31], [0.36, -0.31], [-0.36, 0.31], [-0.36, -0.31]] as const).forEach(([x, z]) => {
    const w = new THREE.Mesh(wg, wm);
    w.position.set(x, 0.13, z);
    w.castShadow = true;
    g.add(w);
  });
  return g;
}

function pin(color: number, s = 1) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 20), mat(color));
  cone.rotation.x = Math.PI; cone.position.y = 0.375; cone.castShadow = true; g.add(cone);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16), mat(color));
  ball.position.y = 0.86; ball.castShadow = true; g.add(ball);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat(WHITE));
  hole.position.set(0, 0.9, 0.26); g.add(hole);
  g.scale.setScalar(s);
  return g;
}

export default function HeroDiorama() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nightRef = useRef(false);
  const [night, setNight] = useState(false);
  const [pinCount, setPinCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const camBase = new THREE.Vector3(0, 9.6, 13.4);
    camera.position.copy(camBase);

    const hemi = new THREE.HemisphereLight(0xfdfcf7, 0xcfc9ba, 1.05);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.35);
    sun.position.set(6, 11, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 2, far: 32 });
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    /* --- Pegunungan low-poly (latar statis) --- */
    const mountain = (x: number, z: number, r: number, h: number, color: number) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mat(color, { flatShading: true }));
      m.position.set(x, h / 2 - 0.25, z);
      m.rotation.y = (x * 13.7) % Math.PI;
      scene.add(m);
    };
    mountain(-7.2, -7.6, 2.8, 3.6, 0x9fbfaa);
    mountain(-3.4, -8.3, 3.2, 3.0, 0x93b49f);
    mountain(0.6, -8.7, 3.4, 3.5, 0x9fbfaa);
    mountain(4.6, -8.1, 2.9, 3.2, 0x8fb09c);
    mountain(7.7, -7.3, 2.4, 2.7, 0xa5c2af);
    mountain(-5.5, -6.3, 1.9, 1.7, 0x7fa491);
    mountain(3.4, -6.5, 2.1, 1.5, 0x7fa491);

    /* --- Awan melayang --- */
    const cloudMat = mat(0xffffff, { roughness: 1 });
    const cloud = (s: number) => {
      const g = new THREE.Group();
      ([[0, 0, 0, 0.5], [0.55, 0.12, 0.1, 0.36], [-0.55, 0.1, -0.05, 0.4], [0.15, 0.28, 0, 0.34]] as const).forEach(([x, y, z, r]) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cloudMat);
        b.position.set(x, y, z);
        b.scale.y = 0.7;
        g.add(b);
      });
      g.scale.setScalar(s);
      scene.add(g);
      return g;
    };
    const clouds = [
      { g: cloud(1.2), bx: -5.0, by: 5.4, bz: -3.0, spd: 0.22, ph: 0 },
      { g: cloud(0.9), bx: 4.6, by: 5.9, bz: -4.2, spd: 0.3, ph: 2 },
      { g: cloud(1.4), bx: 1.4, by: 6.3, bz: -5.6, spd: 0.18, ph: 4 },
      { g: cloud(0.75), bx: -2.2, by: 5.1, bz: 2.2, spd: 0.26, ph: 5.5 },
    ].map(c => (c.g.position.set(c.bx, c.by, c.bz), c));

    /* --- Matahari ↔ Bulan + bintang --- */
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xffc55c, emissive: 0xffae1a, emissiveIntensity: 0.95, roughness: 0.4 });
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), sunMat);
    sunBall.position.set(-4.6, 5.7, -6.5);
    scene.add(sunBall);

    const moonMat = new THREE.MeshStandardMaterial({ color: 0xe8eef2, emissive: 0xbfd3e6, emissiveIntensity: 0.06, roughness: 0.5 });
    const moonBall = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), moonMat);
    moonBall.position.set(4.8, 1.2, -6.5);
    scene.add(moonBall);

    const starGeoB = new THREE.BufferGeometry();
    const sp: number[] = [];
    for (let i = 0; i < 70; i++) sp.push((Math.random() - 0.5) * 18, 3.5 + Math.random() * 5.5, -9.5 + Math.random() * 3);
    starGeoB.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0, depthWrite: false });
    scene.add(new THREE.Points(starGeoB, starMat));

    /* --- Dunia kampung --- */
    const world = new THREE.Group();
    scene.add(world);

    const plat = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.9, 0.55, 64), mat(CREAM));
    plat.position.y = -0.28; plat.receiveShadow = true; world.add(plat);
    const platTop = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 0.03, 64), mat(0xefeadf));
    platTop.position.y = 0.015; platTop.receiveShadow = true; world.add(platTop);
    const road = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.9, 72), mat(ROAD));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.05; road.receiveShadow = true; world.add(road);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), mat(0xede8dc));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.06; plaza.receiveShadow = true; world.add(plaza);
    const path = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 1.9), mat(0xede8dc));
    path.position.set(0, 0.05, -2.05); path.receiveShadow = true; world.add(path);

    const foliage: THREE.Mesh[] = [];

    const mosqueG = mosque(); mosqueG.position.set(-1.7, 0, -1.1); mosqueG.rotation.y = 0.5; world.add(mosqueG);
    const h1 = house(1.15, 0.85, 1, WHITE, GREEN); h1.position.set(1.5, 0, -1.5); h1.rotation.y = -0.35; world.add(h1);
    const h2 = house(1, 0.75, 0.9, 0xf3efe6, TERRA); h2.position.set(1.75, 0, 1.15); h2.rotation.y = -1.1; world.add(h2);
    const sh1 = shop(); sh1.position.set(-0.7, 0, 1.8); sh1.rotation.y = 0.25; world.add(sh1);
    const h3 = house(1.2, 0.9, 1, WHITE, GREEN, 0.9); h3.position.set(4.9, 0, -0.6); h3.rotation.y = 1.3; world.add(h3);
    const sh2 = shop(); sh2.position.set(-4.6, 0, 1.6); sh2.rotation.y = -1.9; world.add(sh2);

    ([
      [0.3, -2.5, 1, LEAF], [-2.6, 0.6, 1.15, LEAF2], [2.2, 1.6, 0.9, LEAF2],
      [-3.3, -3.0, 1.2, LEAF], [4.2, 2.9, 0.9, LEAF2], [-4.9, -1.8, 1.05, LEAF],
      [5.2, 1.6, 0.85, LEAF2], [-1.8, 2.1, 0.9, LEAF],
    ] as const).forEach(([x, z, s, leaf]) => {
      const t = tree(s, leaf, foliage);
      t.position.set(x, 0, z);
      world.add(t);
    });

    const mainPin = pin(AMBER, 1.15); world.add(mainPin);
    const miniA = pin(GREEN, 0.55); miniA.position.set(-1.35, 0, 2.35); world.add(miniA);
    const miniB = pin(GREEN, 0.5); miniB.position.set(2.2, 0, -2.0); world.add(miniB);
    const carG = car(); world.add(carG);
    const ORBIT_R = 3.5;

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x3d3226, emissive: 0xffb454, emissiveIntensity: 0, roughness: 0.6,
    });
    const addWin = (g: THREE.Group, x: number, y: number, z: number, w = 0.16, h = 0.2) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowMat);
      m.position.set(x, y, z);
      g.add(m);
    };
    addWin(h1, -0.3, 0.5, 0.51); addWin(h1, 0.3, 0.5, 0.51);
    addWin(h2, 0, 0.42, 0.46);
    addWin(h3, -0.35, 0.55, 0.51); addWin(h3, 0.35, 0.55, 0.51);
    addWin(sh1, 0.4, 0.55, 0.51, 0.28, 0.24); addWin(sh2, 0.4, 0.55, 0.51, 0.28, 0.24);

    const poppers: { g: THREE.Group; delay: number; base: number; t: number }[] = [];
    const popIn = (g: THREE.Group, delay: number, base: number) => {
      if (reduced) { g.scale.setScalar(base); return; }
      g.scale.setScalar(0.0001);
      poppers.push({ g, delay, base, t: 0 });
    };
    popIn(mainPin, 0.4, 1.15);
    popIn(miniA, 1.1, 0.55);
    popIn(miniB, 1.45, 0.5);

    let rotY = -0.55, targetRotY = -0.55, vel = 0, dragging = false, lastX = 0, idle = 0;
    let sx = 0, sy = 0, movedFar = false;
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; sx = e.clientX; sy = e.clientY;
      movedFar = false; idle = 0; vel = 0;
      canvas.style.cursor = "grabbing";
    };
    const onMoveWin = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      parallax.tx = (e.clientX - r.left) / r.width - 0.5;
      parallax.ty = (e.clientY - r.top) / r.height - 0.5;
      if (dragging) {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) movedFar = true;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        vel = dx * 0.005;
        targetRotY += vel;
        idle = 0;
      }
    };
    const onUpWin = () => {
      dragging = false;
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMoveWin);
    window.addEventListener("pointerup", onUpWin);

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitPlane = new THREE.Mesh(
      new THREE.CircleGeometry(6.4, 48),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitPlane.rotation.x = -Math.PI / 2;
    hitPlane.position.y = 0.04;
    world.add(hitPlane);

    const dropped: THREE.Group[] = [];
    const dropPin = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(hitPlane)[0];
      if (!hit) return;
      const p = pin(GREEN, 0.5);
      p.position.copy(world.worldToLocal(hit.point.clone()));
      p.rotation.y = Math.random() * Math.PI * 2;
      world.add(p);
      popIn(p, 0, 0.5);
      dropped.push(p);
      if (dropped.length > 8) world.remove(dropped.shift()!);
      setPinCount((n) => n + 1);
    };
    const onUpCanvas = (e: PointerEvent) => {
      if (!movedFar) dropPin(e);
    };
    canvas.addEventListener("pointerup", onUpCanvas);

    const daySky = new THREE.Color(0xfdfcf7), nightSky = new THREE.Color(0x35544a);
    const dayGnd = new THREE.Color(0xcfc9ba), nightGnd = new THREE.Color(0x14231e);
    const daySun = new THREE.Color(0xffffff), nightSun = new THREE.Color(0xa9c7e8);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    let mix = 0;
    let camZ = 13.4;

    const size = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      camZ = aspect < 0.8 ? 17 : aspect < 1.3 ? 15 : 13.4;
    };
    const ro = new ResizeObserver(size);
    ro.observe(wrap);
    size();

    let t = 0, last = performance.now(), raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      if (!dragging) {
        targetRotY += vel;
        vel *= 0.93;
        idle += dt;
        if (!reduced && idle > 2.5) targetRotY += dt * 0.12;
      }
      rotY += (targetRotY - rotY) * 0.12;
      world.rotation.y = rotY;

      parallax.x += (parallax.tx - parallax.x) * 0.05;
      parallax.y += (parallax.ty - parallax.y) * 0.05;
      camera.position.set(camBase.x + parallax.x * 1.4, camBase.y - parallax.y * 0.8, camZ);
      camera.lookAt(0, 0.8, 0);

      const target = nightRef.current ? 1 : 0;
      mix += (target - mix) * 0.04;
      hemi.color.lerpColors(daySky, nightSky, mix);
      hemi.groundColor.lerpColors(dayGnd, nightGnd, mix);
      hemi.intensity = lerp(1.05, 0.5, mix);
      sun.color.lerpColors(daySun, nightSun, mix);
      sun.intensity = lerp(1.35, 0.55, mix);
      glowMat.emissiveIntensity = mix * 1.9;
      sunBall.position.y = lerp(5.7, 1.1, mix);
      sunMat.emissiveIntensity = lerp(0.95, 0.05, mix);
      moonBall.position.y = lerp(1.1, 5.5, mix);
      moonMat.emissiveIntensity = lerp(0.06, 0.85, mix);
      starMat.opacity = mix * 0.9;

      if (!reduced) {
        mainPin.position.y = 0.08 + Math.sin(t * 1.8) * 0.12;
        mainPin.rotation.y = t * 0.6;
        const a = t * 0.35;
        carG.position.set(Math.cos(a) * ORBIT_R, 0.05, Math.sin(a) * ORBIT_R);
        carG.rotation.y = -a - Math.PI / 2;
        clouds.forEach(c => {
          c.g.position.x = c.bx + Math.sin(t * c.spd + c.ph) * 0.8;
          c.g.position.y = c.by + Math.sin(t * 0.6 + c.ph) * 0.12;
        });
        foliage.forEach((f, i) => { f.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.06; });
        for (let i = poppers.length - 1; i >= 0; i--) {
          const p = poppers[i];
          p.t += dt;
          const k = p.t - p.delay;
          if (k <= 0) continue;
          const x = Math.min(k / 0.55, 1);
          p.g.scale.setScalar(p.base * easeOutBack(x));
          if (x >= 1) { p.g.scale.setScalar(p.base); poppers.splice(i, 1); }
        }
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUpCanvas);
      window.removeEventListener("pointermove", onMoveWin);
      window.removeEventListener("pointerup", onUpWin);
      renderer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m.dispose());
      });
    };
  }, []);

  const toggleNight = () =>
    setNight((v) => {
      const next = !v;
      nightRef.current = next;
      return next;
    });

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[0_24px_60px_-32px_rgba(6,78,59,.28)] transition-colors duration-500 ${
        night ? "border-green-dark bg-green-dark" : "border-line bg-white"
      }`}
    >
      <div ref={wrapRef} className="relative h-[320px] sm:h-[400px] lg:h-[440px]">
        <span
          className={`pointer-events-none absolute left-4 top-4 z-10 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-500 ${
            night ? "border-white/15 bg-green-dark/70 text-white/60" : "border-line bg-paper/90 text-mute"
          }`}
        >
          Diorama mitra · 3D
        </span>

        {failed ? (
          <div className="grid h-full place-items-center">
            <p className={`text-sm ${night ? "text-white/50" : "text-mute"}`}>
              Diorama tidak didukung perangkat ini.
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label="Diorama 3D kota Kebumen — seret untuk memutar, klik untuk memasang pin"
            className="block h-full w-full cursor-grab touch-pan-y"
          />
        )}
      </div>

      <div className={`flex items-center justify-between gap-3 border-t px-4 py-3 transition-colors duration-500 ${night ? "border-white/10" : "border-line"}`}>
        <div className="flex min-w-0 items-center gap-2">
          <p className={`truncate font-mono text-[11px] uppercase tracking-[0.12em] ${night ? "text-white/45" : "text-faint"}`}>
            Seret memutar · klik untuk pin
          </p>
          {pinCount > 0 && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${night ? "bg-white/10 text-amber-300" : "bg-green-tint text-green"}`}>
              {pinCount} pin
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={toggleNight}
          aria-pressed={night}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
            night
              ? "border-white/20 text-white/65 hover:border-white/40"
              : "border-line text-mute hover:border-green/40 hover:text-green"
          }`}
        >
          {night ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {night ? "Siang" : "Malam"}
        </button>
      </div>
    </div>
  );
}
