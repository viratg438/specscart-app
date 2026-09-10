// File: load-face-mesh.ts
// Loads classic MediaPipe Face Mesh via a normal script tag (Metro-safe).

export type MeshLandmark = { x: number; y: number; z?: number };

export type FaceMeshHandle = {
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  close: () => void;
};

type FaceMeshInstance = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (
    cb: (results: { multiFaceLandmarks?: MeshLandmark[][] }) => void,
  ) => void;
  send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
  initialize?: () => Promise<void>;
  close: () => void;
};

type FaceMeshCtor = new (config: {
  locateFile: (file: string) => string;
}) => FaceMeshInstance;

const FACE_MESH_JS =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
const FACE_MESH_DIR =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      if ((window as unknown as { FaceMesh?: FaceMeshCtor }).FaceMesh) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function createFaceMesh(
  onLandmarks: (points: MeshLandmark[]) => void,
): Promise<FaceMeshHandle> {
  await loadScript(FACE_MESH_JS);
  const FaceMesh = (window as unknown as { FaceMesh?: FaceMeshCtor }).FaceMesh;
  if (!FaceMesh) {
    throw new Error("FaceMesh is not available");
  }

  const mesh = new FaceMesh({
    locateFile: (file) => `${FACE_MESH_DIR}${file}`,
  });
  mesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false,
    selfieMode: false,
    minDetectionConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });
  mesh.onResults((results) => {
    const face = results.multiFaceLandmarks?.[0];
    if (face && face.length > 263) {
      onLandmarks(face);
    }
  });
  if (typeof mesh.initialize === "function") {
    await mesh.initialize();
  }

  return {
    send: (input) => mesh.send(input),
    close: () => mesh.close(),
  };
}
