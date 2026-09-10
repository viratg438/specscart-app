// File: TryOnStage.web.tsx
// Web try-on: mirrored camera canvas + GLB locked to the eye line.

import { createElement, useEffect, useRef } from "react";
import * as THREE from "three";

import { DEFAULT_FIT, createFaceTracker } from "./face-fit";
import { FaceMeshHandle, createFaceMesh } from "./load-face-mesh";
import { loadGlb } from "./load-glb";
import { peekFrontCamera } from "./prime-camera";
import { stripTempleArms } from "./strip-temples";

type Props = {
  glbUri: string;
  active: boolean;
  refitToken?: number;
  startToken?: number;
  onReady?: () => void;
  onError?: () => void;
};

function visitFrontVertices(
  root: THREE.Object3D,
  visit: (vertex: THREE.Vector3) => void,
) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const zCut = box.max.z - Math.max(size.z * 0.22, 0.0001);
  const vertex = new THREE.Vector3();

  root.traverse((child: any) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) {
      return;
    }
    const position = mesh.geometry.attributes.position;
    if (!position) {
      return;
    }
    const step = Math.max(1, Math.floor(position.count / 4000));
    for (let i = 0; i < position.count; i += step) {
      vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      if (vertex.z >= zCut) {
        visit(vertex);
      }
    }
  });
}

function frontLensOrigin(root: THREE.Object3D) {
  const acc = new THREE.Vector3();
  let count = 0;
  visitFrontVertices(root, (vertex) => {
    acc.add(vertex);
    count += 1;
  });
  if (count < 8) {
    return new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  }
  return acc.multiplyScalar(1 / count);
}

function frontLensWidth(root: THREE.Object3D) {
  let minX = Infinity;
  let maxX = -Infinity;
  visitFrontVertices(root, (vertex) => {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
  });
  const width = maxX - minX;
  if (!Number.isFinite(width) || width < 0.0001) {
    return new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).x;
  }
  return width;
}

function drawCoverMirrored(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) {
    return;
  }
  const videoAspect = sourceWidth / sourceHeight;
  const viewAspect = width / height;
  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;
  if (videoAspect > viewAspect) {
    drawHeight = height;
    drawWidth = height * videoAspect;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  } else {
    drawWidth = width;
    drawHeight = width / videoAspect;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  }
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

// Glasses pivot on the nose, not on the front of the rim. Sitting the anchor a
// little behind the lens plane (in frame-width units) keeps the temples swinging
// around the head instead of sliding across the face as it turns.
const PIVOT_BEHIND_FRONT = 0.12;

function prepareFrame(model: THREE.Object3D) {
  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.updateMatrixWorld(true);

  // Normalise the size first: a group's position is applied after its scale, so
  // offsets measured at scale 1 would be off by `unit` once the frame is scaled.
  const unit = 1 / Math.max(frontLensWidth(wrapper), 0.0001);
  wrapper.scale.set(unit, unit, unit);
  wrapper.updateMatrixWorld(true);

  const origin = frontLensOrigin(wrapper);
  const box = new THREE.Box3().setFromObject(wrapper);
  wrapper.position.set(
    wrapper.position.x - origin.x,
    wrapper.position.y - origin.y,
    wrapper.position.z - box.max.z + PIVOT_BEHIND_FRONT,
  );
  wrapper.updateMatrixWorld(true);

  stripTempleArms(wrapper);
  wrapper.traverse((child) => {
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
      material.needsUpdate = true;
    }
  });
  return wrapper;
}

type Engine = {
  boot: (stream?: MediaStream) => Promise<void>;
  setGlb: (uri: string) => Promise<void>;
  refit: () => void;
  destroy: () => void;
};

function createEngine(
  host: HTMLDivElement,
  onReady: (() => void) | undefined,
  onError: (() => void) | undefined,
): Engine {
  let cancelled = false;
  let raf = 0;
  let stream: MediaStream | null = null;
  let ownsStream = false;
  let faceMesh: FaceMeshHandle | null = null;
  let sending = false;
  let tracker = createFaceTracker();
  let currentModel: THREE.Object3D | null = null;
  let readySent = false;

  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.style.cssText =
    "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";

  const camCanvas = document.createElement("canvas");
  camCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  const camCtx = camCanvas.getContext("2d", { alpha: false });

  // Face Mesh does not need the full-resolution preview, and feeding it one is
  // what makes the frame lag behind a quick head turn. Landmarks come back
  // normalised, so the smaller copy costs no accuracy in the fit.
  const detectCanvas = document.createElement("canvas");
  const detectCtx = detectCanvas.getContext("2d", { alpha: false });

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";

  host.appendChild(video);
  host.appendChild(camCanvas);
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const FOV = 32;
  const CAM_Z = 2.2;
  const DETECT_WIDTH = 320;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 30);
  camera.position.z = CAM_Z;
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 0.75);
  key.position.set(0.2, 0.5, 2);
  scene.add(key);

  const holder = new THREE.Group();
  holder.rotation.order = "YXZ";
  holder.position.set(DEFAULT_FIT.x, DEFAULT_FIT.y, 0);
  holder.scale.setScalar(DEFAULT_FIT.scale);
  holder.visible = true;
  scene.add(holder);

  const planeScale = () => Math.tan((FOV * Math.PI) / 360) * CAM_Z;

  const resize = () => {
    const width = Math.max(1, Math.round(host.clientWidth || 1));
    const height = Math.max(1, Math.round(host.clientHeight || 1));
    if (camCanvas.width !== width || camCanvas.height !== height) {
      camCanvas.width = width;
      camCanvas.height = height;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);
  const hostObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => resize())
      : null;
  hostObserver?.observe(host);

  const draw = () => {
    if (cancelled) {
      return;
    }

    if (camCtx && video.readyState >= 2 && video.videoWidth > 0) {
      drawCoverMirrored(camCtx, video, camCanvas.width, camCanvas.height);
    }

    if (faceMesh && detectCtx && camCanvas.width > 1 && !sending) {
      const ratio = Math.min(1, DETECT_WIDTH / camCanvas.width);
      const width = Math.max(1, Math.round(camCanvas.width * ratio));
      const height = Math.max(1, Math.round(camCanvas.height * ratio));
      if (detectCanvas.width !== width || detectCanvas.height !== height) {
        detectCanvas.width = width;
        detectCanvas.height = height;
      }
      detectCtx.drawImage(camCanvas, 0, 0, width, height);
      sending = true;
      faceMesh
        .send({ image: detectCanvas })
        .catch(() => undefined)
        .finally(() => {
          sending = false;
        });
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(draw);
  };

  const markReady = () => {
    if (!readySent) {
      readySent = true;
      onReady?.();
    }
  };

  const startCamera = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    ownsStream = true;
    video.srcObject = stream;
    await video.play();
  };

  const applyFace = (points: { x: number; y: number; z?: number }[]) => {
    const fit = tracker(points, camCanvas.width || 1, camCanvas.height || 1);
    const world = planeScale();
    holder.visible = true;
    holder.position.set(fit.x * world, fit.y * world, 0);
    holder.rotation.set(fit.pitch, fit.yaw, fit.roll);
    holder.scale.setScalar(fit.scale * world);
  };

  const startTracking = async () => {
    faceMesh = await createFaceMesh(applyFace);
  };

  const setGlb = async (uri: string) => {
    const gltf = await loadGlb(uri);
    if (cancelled) {
      return;
    }
    if (currentModel) {
      holder.remove(currentModel);
    }
    const model = prepareFrame(gltf.scene);
    currentModel = model;
    holder.add(model);
    holder.visible = true;
    markReady();
  };

  draw();

  const boot = async (existing?: MediaStream) => {
    if (existing) {
      stream = existing;
      ownsStream = false;
      video.srcObject = stream;
      await video.play();
    } else {
      await startCamera();
    }
    try {
      await startTracking();
    } catch {
      // Frame still shows at the default eye position if tracking fails.
    }
    markReady();
  };

  return {
    boot,
    setGlb,
    refit: () => {
      tracker = createFaceTracker();
    },
    destroy: () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      hostObserver?.disconnect();
      faceMesh?.close();
      if (ownsStream) {
        stream?.getTracks().forEach((track) => track.stop());
      }
      renderer.dispose();
      video.srcObject = null;
      video.remove();
      camCanvas.remove();
      detectCanvas.remove();
      canvas.remove();
    },
  };
}

export function TryOnStage({
  glbUri,
  active,
  refitToken = 0,
  startToken = 0,
  onReady,
  onError,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const readyRef = useRef(onReady);
  const errorRef = useRef(onError);
  const glbRef = useRef(glbUri);
  readyRef.current = onReady;
  errorRef.current = onError;
  glbRef.current = glbUri;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !active || typeof document === "undefined") {
      return;
    }

    const engine = createEngine(
      host,
      () => readyRef.current?.(),
      () => errorRef.current?.(),
    );
    engineRef.current = engine;

    const existing = peekFrontCamera();
    engine
      .boot(existing ?? undefined)
      .then(() => engine.setGlb(glbRef.current))
      .catch(() => errorRef.current?.());

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [active, startToken]);

  useEffect(() => {
    if (!active || !glbUri) {
      return;
    }
    engineRef.current?.setGlb(glbUri).catch(() => undefined);
  }, [active, glbUri]);

  useEffect(() => {
    if (refitToken > 0) {
      engineRef.current?.refit();
    }
  }, [refitToken]);

  return createElement("div", {
    ref: hostRef,
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      background: "#111",
    },
  });
}
