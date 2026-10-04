"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ===== Pin data ===== */
const PINS = [
  { x: -1.8, z: -1.2, color: 0xfbbf24, label: "Kebumen" },
  { x: 0.6, z: -1.6, color: 0xfbbf24, label: "Gombong" },
  { x: 2.0, z: -0.2, color: 0xfbbf24, label: "Karanganyar" },
  { x: -0.4, z: 0.8, color: 0x34d399, label: "Prembun" },
  { x: 1.0, z: 0.0, color: 0xfbbf24, label: "Sruweng" },
  { x: 2.6, z: -1.0, color: 0x34d399, label: "Ayah" },
];

/* ===== Roads data ===== */
const ROADS_H = [
  { z: -1.0, width: 6, main: false },
  { z: 0.2, width: 6, main: true },
  { z: 1.4, width: 6, main: false },
];
const ROADS_V = [
  { x: -1.0, width: 5, main: false },
  { x: 0.8, width: 5, main: true },
  { x: 2.4, width: 5, main: false },
];

export default function HeroDiorama() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ----- Renderer ----- */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    /* ----- Scene & Camera ----- */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfaf9f6, 0.08);

    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
    camera.position.set(0, 5.5, 5);
    camera.lookAt(0, 0, 0);

    /* ----- Lights ----- */
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
    sun.position.set(4, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 20;
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.002;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xe0f0ff, 0.4);
    fill.position.set(-3, 4, -2);
    scene.add(fill);

    /* ----- Map surface (tilted plane) ----- */
    const mapGroup = new THREE.Group();
    mapGroup.rotation.x = -Math.PI * 0.32; // ~58° tilt
    mapGroup.rotation.z = Math.PI * 0.03; // slight twist
    scene.add(mapGroup);

    // Grid plane with custom shader for grid lines
    const planeGeo = new THREE.PlaneGeometry(7, 5, 1, 1);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xfaf9f6,
      roughness: 0.9,
      metalness: 0.0,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    mapGroup.add(plane);

    // Grid lines on surface
    const gridHelper = new THREE.GridHelper(7, 28, 0x064e3b, 0x064e3b);
    (gridHelper.material as THREE.Material).opacity = 0.06;
    (gridHelper.material as THREE.Material).transparent = true;
    gridHelper.position.y = 0.002;
    mapGroup.add(gridHelper);

    /* ----- Roads on surface ----- */
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, roughness: 0.7, metalness: 0.0,
    });
    const roadMatMain = new THREE.MeshStandardMaterial({
      color: 0x064e3b, roughness: 0.6, metalness: 0.0,
    });

    ROADS_H.forEach((r) => {
      const geo = new THREE.PlaneGeometry(r.width, r.main ? 0.06 : 0.04);
      const mesh = new THREE.Mesh(geo, r.main ? roadMatMain : roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.004, r.z);
      (mesh.material as THREE.MeshStandardMaterial).opacity = r.main ? 0.18 : 0.1;
      (mesh.material as THREE.MeshStandardMaterial).transparent = true;
      mapGroup.add(mesh);
    });

    ROADS_V.forEach((r) => {
      const geo = new THREE.PlaneGeometry(r.main ? 0.06 : 0.04, r.width);
      const mesh = new THREE.Mesh(geo, r.main ? roadMatMain : roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(r.x, 0.004, 0);
      (mesh.material as THREE.MeshStandardMaterial).opacity = r.main ? 0.18 : 0.1;
      (mesh.material as THREE.MeshStandardMaterial).transparent = true;
      mapGroup.add(mesh);
    });

    /* ----- Region areas (dashed circles) ----- */
    const regionGeo = new THREE.RingGeometry(0.5, 0.52, 32);
    const regionMat = new THREE.MeshBasicMaterial({
      color: 0x064e3b, side: THREE.DoubleSide, transparent: true, opacity: 0.12,
    });
    const regionPositions = [
      { x: -1.2, z: -0.8 }, { x: 1.0, z: 0.3 }, { x: 2.0, z: -0.8 },
    ];
    regionPositions.forEach((pos) => {
      const ring = new THREE.Mesh(regionGeo, regionMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.003, pos.z);
      ring.scale.set(1.4, 1.4, 1.4);
      mapGroup.add(ring);
    });

    /* ----- 3D Pins ----- */
    type PinObject = {
      group: THREE.Group;
      head: THREE.Mesh;
      yBase: number;
      delay: number;
    };

    const pins: PinObject[] = [];
    const stemMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.4 });

    PINS.forEach((p, i) => {
      const group = new THREE.Group();
      group.position.set(p.x, 0, p.z);

      // Stem (thin cylinder)
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.5, 8);
      const stem = new THREE.Mesh(stemGeo, stemMat.clone());
      (stem.material as THREE.MeshStandardMaterial).color.setHex(p.color);
      stem.position.y = 0.25;
      stem.castShadow = true;
      group.add(stem);

      // Head (sphere)
      const headGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: p.color, roughness: 0.2, metalness: 0.5,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.55;
      head.castShadow = true;
      group.add(head);

      // Shadow on surface (small dark circle)
      const shadowGeo = new THREE.CircleGeometry(0.08, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.003;
      group.add(shadow);

      // Ripple ring (torus)
      const rippleGeo = new THREE.TorusGeometry(0.15, 0.008, 8, 32);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: p.color, transparent: true, opacity: 0,
      });
      const ripple = new THREE.Mesh(rippleGeo, rippleMat);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.005;
      group.add(ripple);

      mapGroup.add(group);

      pins.push({
        group,
        head,
        yBase: 0.55,
        delay: i * 0.4,
      });

      // Store ripple ref on the pin for animation
      (group as Record<string, unknown>)._ripple = ripple;
      (group as Record<string, unknown>)._rippleMat = rippleMat;
    });

    /* ----- Floating card (thin box above surface) ----- */
    const cardGroup = new THREE.Group();
    cardGroup.position.set(-1.5, 1.0, -0.8);
    cardGroup.rotation.y = 0.15;

    // Card body
    const cardGeo = new THREE.BoxGeometry(1.0, 0.6, 0.02);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.4, metalness: 0.0,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.castShadow = true;
    cardGroup.add(card);

    // Green accent bar on card
    const accentGeo = new THREE.BoxGeometry(1.0, 0.06, 0.025);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, roughness: 0.3, metalness: 0.2,
    });
    const accent = new THREE.Mesh(accentGeo, accentMat);
    accent.position.y = 0.27;
    cardGroup.add(accent);

    // WA icon dot (green circle)
    const waDotGeo = new THREE.CircleGeometry(0.06, 16);
    const waDotMat = new THREE.MeshStandardMaterial({
      color: 0x25d366, side: THREE.DoubleSide,
    });
    const waDot = new THREE.Mesh(waDotGeo, waDotMat);
    waDot.position.set(0.4, -0.2, 0.012);
    cardGroup.add(waDot);

    mapGroup.add(cardGroup);

    /* ----- Ambient particles ----- */
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 1] = Math.random() * 3 + 0.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleSpeeds.push(0.2 + Math.random() * 0.5);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x064e3b, size: 0.03, transparent: true, opacity: 0.25,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ----- Resize handler ----- */
    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    onResize();
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(canvas);

    /* ----- Animation loop ----- */
    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      const elapsed = (now - t0) / 1000;

      // Pin head bobbing
      pins.forEach((pin) => {
        const t = elapsed - pin.delay;
        if (t > 0) {
          pin.head.position.y = pin.yBase + Math.sin(t * 1.8) * 0.04;
        }

        // Ripple pulse
        const ripple = (pin.group as Record<string, unknown>)._ripple as THREE.Mesh;
        const rippleMat = (pin.group as Record<string, unknown>)._rippleMat as THREE.MeshBasicMaterial;
        if (ripple && rippleMat) {
          const cycle = ((elapsed - pin.delay * 0.5) % 3) / 3; // 0..1 over 3s
          if (cycle > 0) {
            const s = 0.5 + cycle * 2.5;
            ripple.scale.set(s, s, 1);
            rippleMat.opacity = cycle < 0.5 ? cycle * 1.2 : Math.max(0, (1 - cycle) * 1.5);
          }
        }
      });

      // Floating card gentle bob
      cardGroup.position.y = 1.0 + Math.sin(elapsed * 0.8) * 0.06;
      cardGroup.rotation.y = 0.15 + Math.sin(elapsed * 0.5) * 0.03;

      // Ambient particles drift
      const posArr = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += particleSpeeds[i] * 0.003;
        if (posArr[i * 3 + 1] > 4) {
          posArr[i * 3 + 1] = 0.3;
          posArr[i * 3] = (Math.random() - 0.5) * 8;
          posArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Subtle camera sway
      camera.position.x = Math.sin(elapsed * 0.3) * 0.15;
      camera.position.z = 5 + Math.cos(elapsed * 0.25) * 0.1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* ----- Cleanup (CRITICAL for React StrictMode) ----- */
    return () => {
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      renderer.dispose();

      // Dispose all geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
