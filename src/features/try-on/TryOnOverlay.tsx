// File: TryOnOverlay.tsx
// Transparent WebGL layer that places the selected frame GLB over the camera.

import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { MutableRefObject, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import * as THREE from "three";

import { loadGlb } from "./load-glb";
import { TryOnPose } from "./pose";
import { stripTempleArms } from "./strip-temples";

export type { TryOnPose };

type Props = {
  glbUri: string;
  poseRef: MutableRefObject<TryOnPose>;
  onReady?: () => void;
  onError?: () => void;
};

function createRenderer(gl: ExpoWebGLRenderingContext) {
  const canvas =
    "canvas" in gl && gl.canvas
      ? gl.canvas
      : {
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          style: {},
          addEventListener() {},
          removeEventListener() {},
          clientWidth: gl.drawingBufferWidth,
          clientHeight: gl.drawingBufferHeight,
        };

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    context: gl as unknown as WebGLRenderingContext,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function prepareFrame(model: THREE.Object3D) {
  model.updateMatrixWorld(true);
  // Scale before centring: position is applied after scale in the object's
  // matrix, so a centre measured at scale 1 leaves the frame off by `scale`.
  const size = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  model.scale.setScalar(0.42 / Math.max(size.x, 0.0001));
  model.updateMatrixWorld(true);
  const center = new THREE.Box3()
    .setFromObject(model)
    .getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);
  stripTempleArms(model);

  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    mesh.frustumCulled = false;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }
      material.side = THREE.DoubleSide;
      if ("transmission" in material) {
        material.transmission = 0;
      }
      if (material.opacity < 0.2) {
        material.opacity = 0.35;
      }
      material.needsUpdate = true;
    }
  });
}

export function TryOnOverlay({ glbUri, poseRef, onReady, onError }: Props) {
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [glbUri]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const renderer = createRenderer(gl);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      28,
      gl.drawingBufferWidth / Math.max(gl.drawingBufferHeight, 1),
      0.01,
      50,
    );
    camera.position.z = 1.85;

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(0.3, 0.7, 1.5);
    scene.add(key);

    const holder = new THREE.Group();
    scene.add(holder);

    try {
      const gltf = await loadGlb(glbUri);
      if (cancelledRef.current) {
        return;
      }
      const model = gltf.scene;
      prepareFrame(model);
      holder.add(model);
      onReady?.();
    } catch {
      if (!cancelledRef.current) {
        onError?.();
      }
    }

    const draw = () => {
      if (cancelledRef.current) {
        return;
      }
      const pose = poseRef.current;
      holder.position.set(pose.x, 0.04 + pose.y, 0);
      holder.scale.setScalar(pose.scale);
      renderer.render(scene, camera);
      gl.endFrameEXP();
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  return (
    <GLView
      key={glbUri}
      style={[styles.fill, { pointerEvents: "none" }]}
      onContextCreate={onContextCreate}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
