// File: load-glb.ts
// Try-on currently uses the Warby Parker Hilson GLB URL.

import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const WARBY_FRAME =
  "https://www-next-vto.warbyparker.com/hilson-opt-sbf-hunter-green_medium.glb";

// const specscartFrame = require("../../../assets/try-on/specscart-001.glb");
// const khronosFrame = require("../../../assets/try-on/khronos-sunglasses.glb");
// const REAL_ONLINE_FRAME =
//   "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb";

function parseGlb(buffer: ArrayBuffer): Promise<GLTF> {
  const magic = String.fromCharCode(
    ...Array.from(new Uint8Array(buffer, 0, 4)),
  );
  if (magic !== "glTF") {
    return Promise.reject(new Error("Not a GLB file"));
  }

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(buffer, "", resolve, reject);
  });
}

async function loadFromUri(uri: string): Promise<GLTF> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`GLB request failed (${response.status})`);
  }
  return parseGlb(await response.arrayBuffer());
}

export async function loadGlb(_uri: string): Promise<GLTF> {
  return loadFromUri(WARBY_FRAME);
}
