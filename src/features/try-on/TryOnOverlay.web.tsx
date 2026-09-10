// File: TryOnOverlay.web.tsx
// Web canvas overlay — avoids expo-gl so the GLB can render in the browser.

import { createElement, MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import { loadGlb } from "./load-glb";
import { TryOnPose } from "./pose";
import { stripTempleArms } from "./strip-temples";

type Props = {
  glbUri: string;
  poseRef: MutableRefObject<TryOnPose>;
  onReady?: () => void;
  onError?: () => void;
};

function prepareFrame(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.scale.setScalar(1.45 / Math.max(size.x, 0.0001));
  stripTempleArms(model);
}

export function TryOnOverlay({ glbUri, poseRef, onReady, onError }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof document === "undefined") {
      return;
    }

    let cancelled = false;
    let raf = 0;
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    camera.position.z = 1.85;
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(0.3, 0.7, 1.5);
    scene.add(key);

    const holder = new THREE.Group();
    scene.add(holder);

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const draw = () => {
      if (cancelled) {
        return;
      }
      const pose = poseRef.current;
      holder.position.set(pose.x, 0.16 + pose.y, 0);
      holder.scale.setScalar(pose.scale);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(draw);
    };

    loadGlb(glbUri)
      .then((gltf) => {
        if (cancelled) {
          return;
        }
        const model = gltf.scene;
        prepareFrame(model);
        holder.add(model);
        onReady?.();
        draw();
      })
      .catch(() => {
        if (!cancelled) {
          onError?.();
        }
      });

    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      canvas.remove();
    };
  }, [glbUri, onError, onReady, poseRef]);

  return createElement("div", {
    ref: hostRef,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 3,
    },
  });
}
