import * as THREE from "three";

// How much of each temple arm to keep, measured from the hinge back towards the
// tip. Half an arm reads as "heading for the ear" without a full arm's clutter.
const DEFAULT_TEMPLE_KEEP = 0.5;

// Only the lenses and bridge sit near the frame's horizontal centre; the arms
// live out at the edges. So the furthest-back slice that still holds central
// geometry marks where the front ends and the temples begin.
const CENTRE_BAND = 0.25;
const DEPTH_BINS = 64;
// A stray vertex or a decorative rivet should not extend the "front", so a
// slice only counts once it holds this share of the busiest central slice.
const CENTRE_THRESHOLD = 0.01;
// Take the tip from a percentile, so one stray vertex behind the arms cannot
// stretch the measured temple length.
const TIP_PERCENTILE = 0.01;

/**
 * Finds the clip plane that keeps `keep` of each temple arm.
 *
 * Measuring against the bounding depth would be wrong: the front is a small and
 * very model-dependent share of it (10% on one of our frames, far more on a
 * wrap style), so the same fraction cuts a different amount of arm on every
 * model. Locating the hinge first makes `keep` mean what it says.
 *
 * Exported for testing against real frame geometry.
 */
export function templeCutPlane(
  xs: ArrayLike<number>,
  zs: ArrayLike<number>,
  keep: number,
): number | null {
  const count = zs.length;
  if (count < 12) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < count; i += 1) {
    if (xs[i] < minX) minX = xs[i];
    if (xs[i] > maxX) maxX = xs[i];
    if (zs[i] < minZ) minZ = zs[i];
    if (zs[i] > maxZ) maxZ = zs[i];
  }

  const depth = maxZ - minZ;
  const halfWidth = (maxX - minX) / 2;
  if (!(depth > 1e-9) || !(halfWidth > 1e-9)) {
    return null;
  }
  const centreX = (minX + maxX) / 2;

  const central = new Int32Array(DEPTH_BINS);
  for (let i = 0; i < count; i += 1) {
    if (Math.abs(xs[i] - centreX) < CENTRE_BAND * halfWidth) {
      const bin = Math.min(
        DEPTH_BINS - 1,
        Math.floor(((zs[i] - minZ) / depth) * DEPTH_BINS),
      );
      central[bin] += 1;
    }
  }

  let peak = 0;
  for (let b = 0; b < DEPTH_BINS; b += 1) {
    peak = Math.max(peak, central[b]);
  }
  if (peak === 0) {
    return null;
  }
  const threshold = Math.max(3, peak * CENTRE_THRESHOLD);

  // The furthest-back slice still carrying central geometry. Scanning the whole
  // range rather than stopping at the first gap keeps a frame whose bridge and
  // rims do not overlap in depth from reporting a hinge that is far too far
  // forward; the arms sit well outside the centre band, so they cannot extend it.
  let hingeBin = DEPTH_BINS - 1;
  for (let b = 0; b < DEPTH_BINS; b += 1) {
    if (central[b] >= threshold) {
      hingeBin = b;
      break;
    }
  }
  const hingeZ = minZ + (depth * hingeBin) / DEPTH_BINS;

  const behind: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (zs[i] < hingeZ) {
      behind.push(zs[i]);
    }
  }
  if (behind.length < 8) {
    return null;
  }
  behind.sort((a, b) => a - b);
  const tipZ = behind[Math.floor(behind.length * TIP_PERCENTILE)];

  const templeLength = hingeZ - tipZ;
  if (!(templeLength > depth * 0.05)) {
    return null;
  }
  return hingeZ - templeLength * Math.min(Math.max(keep, 0), 1);
}

export function stripTempleArms(
  root: THREE.Object3D,
  templeKeep: number = DEFAULT_TEMPLE_KEEP,
) {
  root.updateMatrixWorld(true);
  const scan = scanLocal(root);
  if (!scan) {
    return;
  }
  const depth = scan.maxZ - scan.minZ;
  if (!Number.isFinite(depth) || depth < 0.000001) {
    return;
  }
  // If the hinge cannot be located, fall back to halving the bounding depth.
  const plane =
    templeCutPlane(scan.xs, scan.zs, templeKeep) ?? scan.minZ + depth * 0.5;
  clipBehind(root, plane);
}

// Every vertex in the root's own space. Box3.setFromObject would report world
// space, which stops matching the vertices we test below as soon as the root is
// scaled — and we need the raw x/z spread anyway to find the hinge.
function scanLocal(root: THREE.Object3D) {
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const toLocal = new THREE.Matrix4();
  const vertex = new THREE.Vector3();
  const xs: number[] = [];
  const zs: number[] = [];
  let minZ = Infinity;
  let maxZ = -Infinity;

  root.traverse((child: any) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible) {
      return;
    }
    const position = mesh.geometry.attributes.position;
    if (!position) {
      return;
    }
    toLocal.multiplyMatrices(inverse, mesh.matrixWorld);
    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i).applyMatrix4(toLocal);
      xs.push(vertex.x);
      zs.push(vertex.z);
      if (vertex.z < minZ) minZ = vertex.z;
      if (vertex.z > maxZ) maxZ = vertex.z;
    }
  });

  return xs.length ? { xs, zs, minZ, maxZ } : null;
}

// A packed vertex: every attribute laid out back to back, plus the root-space z
// the clip is measured against.
type ClipVertex = { z: number; data: Float32Array };

// Drops everything behind zMin, cutting triangles exactly on the plane rather
// than discarding whole ones — a coarse temple is often a handful of long
// triangles, and dropping by centroid would leave the arm at full length.
function clipBehind(root: THREE.Object3D, zMin: number) {
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const toLocal = new THREE.Matrix4();
  const point = new THREE.Vector3();

  root.traverse((child: any) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible) {
      return;
    }
    toLocal.multiplyMatrices(inverse, mesh.matrixWorld);

    const source = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry;
    const position = source.attributes.position;
    if (!position) {
      return;
    }

    // Carry every attribute the source has (uv2, color, tangent, ...) so the
    // clip never silently drops a material input.
    const names = Object.keys(source.attributes);
    const sizes = names.map((name) => source.attributes[name].itemSize);
    const stride = sizes.reduce((total, size) => total + size, 0);

    const make = (): ClipVertex => ({ z: 0, data: new Float32Array(stride) });
    const triangle = [make(), make(), make()];
    const crossings = [make(), make()];
    const polygon: ClipVertex[] = [];
    const flat: number[] = [];

    const read = (target: ClipVertex, index: number) => {
      let offset = 0;
      for (let n = 0; n < names.length; n += 1) {
        const attribute = source.attributes[names[n]];
        const size = sizes[n];
        target.data[offset] = attribute.getX(index);
        if (size > 1) target.data[offset + 1] = attribute.getY(index);
        if (size > 2) target.data[offset + 2] = attribute.getZ(index);
        if (size > 3) target.data[offset + 3] = attribute.getW(index);
        offset += size;
      }
      point.fromBufferAttribute(position, index).applyMatrix4(toLocal);
      target.z = point.z;
    };

    const mix = (
      target: ClipVertex,
      from: ClipVertex,
      to: ClipVertex,
      amount: number,
    ) => {
      for (let i = 0; i < stride; i += 1) {
        target.data[i] = from.data[i] + (to.data[i] - from.data[i]) * amount;
      }
      target.z = from.z + (to.z - from.z) * amount;
    };

    const emit = (vertex: ClipVertex) => {
      for (let i = 0; i < stride; i += 1) {
        flat.push(vertex.data[i]);
      }
    };

    const groups = source.groups.length
      ? source.groups
      : [{ start: 0, count: position.count, materialIndex: 0 }];
    const outGroups: {
      start: number;
      count: number;
      materialIndex: number;
    }[] = [];

    for (const group of groups) {
      const start = group.start;
      const end = Math.min(
        position.count,
        start + (group.count ?? position.count),
      );
      const groupStart = flat.length / stride;

      for (let i = start; i + 2 < end; i += 3) {
        read(triangle[0], i);
        read(triangle[1], i + 1);
        read(triangle[2], i + 2);

        // Sutherland-Hodgman against the single plane z = zMin. Walking the
        // edges in order keeps the original winding, so the fan below stays
        // front-facing.
        polygon.length = 0;
        let cut = 0;
        for (let edge = 0; edge < 3; edge += 1) {
          const current = triangle[edge];
          const next = triangle[(edge + 1) % 3];
          const currentIn = current.z >= zMin;
          const nextIn = next.z >= zMin;
          if (currentIn) {
            polygon.push(current);
          }
          if (currentIn !== nextIn) {
            const amount = (zMin - current.z) / (next.z - current.z);
            mix(crossings[cut], current, next, amount);
            polygon.push(crossings[cut]);
            cut += 1;
          }
        }

        for (let fan = 2; fan < polygon.length; fan += 1) {
          emit(polygon[0]);
          emit(polygon[fan - 1]);
          emit(polygon[fan]);
        }
      }

      const groupCount = flat.length / stride - groupStart;
      if (groupCount > 0) {
        outGroups.push({
          start: groupStart,
          count: groupCount,
          materialIndex: group.materialIndex ?? 0,
        });
      }
    }

    const vertexCount = flat.length / stride;
    if (vertexCount < 3) {
      mesh.visible = false;
      return;
    }

    const clipped = new THREE.BufferGeometry();
    let offset = 0;
    for (let n = 0; n < names.length; n += 1) {
      const size = sizes[n];
      const values = new Float32Array(vertexCount * size);
      for (let v = 0; v < vertexCount; v += 1) {
        for (let k = 0; k < size; k += 1) {
          values[v * size + k] = flat[v * stride + offset + k];
        }
      }
      clipped.setAttribute(names[n], new THREE.BufferAttribute(values, size));
      offset += size;
    }
    if (!clipped.attributes.normal) {
      clipped.computeVertexNormals();
    }
    if (outGroups.length > 1) {
      for (const group of outGroups) {
        clipped.addGroup(group.start, group.count, group.materialIndex);
      }
    }
    mesh.geometry = clipped;
  });
}
