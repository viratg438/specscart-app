// File: head-pose.ts
// Rigid head pose from a Face Mesh landmark cloud.
//
// Fitting the live cloud back onto a reference captured while the user faced
// the camera yields rotation, scale and position from a single solve, so the
// three can never disagree with each other the way separate per-feature
// heuristics do. Scale in particular comes out yaw-invariant for free.

export type Vec3 = { x: number; y: number; z: number };

export type HeadPose = {
  // Row-major 3x3 taking reference-space directions into the current frame.
  rotation: Float64Array;
  scale: number;
  centroid: Vec3;
};

export function centroidOf(points: Vec3[]): Vec3 {
  const out = { x: 0, y: 0, z: 0 };
  for (const point of points) {
    out.x += point.x;
    out.y += point.y;
    out.z += point.z;
  }
  const count = Math.max(points.length, 1);
  out.x /= count;
  out.y /= count;
  out.z /= count;
  return out;
}

function det3(m: Float64Array) {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

function invert3(m: Float64Array): Float64Array | null {
  const det = det3(m);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  const inv = new Float64Array(9);
  inv[0] = (m[4] * m[8] - m[5] * m[7]) / det;
  inv[1] = (m[2] * m[7] - m[1] * m[8]) / det;
  inv[2] = (m[1] * m[5] - m[2] * m[4]) / det;
  inv[3] = (m[5] * m[6] - m[3] * m[8]) / det;
  inv[4] = (m[0] * m[8] - m[2] * m[6]) / det;
  inv[5] = (m[2] * m[3] - m[0] * m[5]) / det;
  inv[6] = (m[3] * m[7] - m[4] * m[6]) / det;
  inv[7] = (m[1] * m[6] - m[0] * m[7]) / det;
  inv[8] = (m[0] * m[4] - m[1] * m[3]) / det;
  return inv;
}

// Orthogonal polar factor of m, i.e. the nearest rotation. Iterating
// R <- (R + R^-T) / 2 converges quadratically and avoids pulling in an SVD.
function nearestRotation(m: Float64Array): Float64Array | null {
  let current = Float64Array.from(m);
  for (let step = 0; step < 32; step += 1) {
    const inverse = invert3(current);
    if (!inverse) {
      return null;
    }
    const next = new Float64Array(9);
    let delta = 0;
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const value = 0.5 * (current[row * 3 + col] + inverse[col * 3 + row]);
        next[row * 3 + col] = value;
        delta = Math.max(delta, Math.abs(value - current[row * 3 + col]));
      }
    }
    current = next;
    if (delta < 1e-10) {
      break;
    }
  }
  return current;
}

function rotate(m: Float64Array, x: number, y: number, z: number): Vec3 {
  return {
    x: m[0] * x + m[1] * y + m[2] * z,
    y: m[3] * x + m[4] * y + m[5] * z,
    z: m[6] * x + m[7] * y + m[8] * z,
  };
}

// Umeyama similarity fit: finds scale s, rotation R and the current centroid
// that best map reference points onto the current ones.
export function solvePose(
  reference: Vec3[],
  refCentroid: Vec3,
  current: Vec3[],
): HeadPose | null {
  if (reference.length !== current.length || reference.length < 6) {
    return null;
  }

  const centroid = centroidOf(current);
  const covariance = new Float64Array(9);
  let refSpread = 0;

  for (let i = 0; i < reference.length; i += 1) {
    const qx = reference[i].x - refCentroid.x;
    const qy = reference[i].y - refCentroid.y;
    const qz = reference[i].z - refCentroid.z;
    const px = current[i].x - centroid.x;
    const py = current[i].y - centroid.y;
    const pz = current[i].z - centroid.z;

    covariance[0] += px * qx;
    covariance[1] += px * qy;
    covariance[2] += px * qz;
    covariance[3] += py * qx;
    covariance[4] += py * qy;
    covariance[5] += py * qz;
    covariance[6] += pz * qx;
    covariance[7] += pz * qy;
    covariance[8] += pz * qz;
    refSpread += qx * qx + qy * qy + qz * qz;
  }

  if (refSpread < 1e-12) {
    return null;
  }

  const rotation = nearestRotation(covariance);
  // A negative determinant means the fit collapsed into a reflection, which
  // happens when the cloud is degenerate. Better to fall back than to flip.
  if (!rotation || det3(rotation) < 0.5) {
    return null;
  }

  let projected = 0;
  for (let i = 0; i < reference.length; i += 1) {
    const turned = rotate(
      rotation,
      reference[i].x - refCentroid.x,
      reference[i].y - refCentroid.y,
      reference[i].z - refCentroid.z,
    );
    projected +=
      (current[i].x - centroid.x) * turned.x +
      (current[i].y - centroid.y) * turned.y +
      (current[i].z - centroid.z) * turned.z;
  }

  const scale = projected / refSpread;
  if (!Number.isFinite(scale) || scale <= 1e-6) {
    return null;
  }

  return { rotation, scale, centroid };
}

export function applyPose(
  pose: HeadPose,
  refCentroid: Vec3,
  point: Vec3,
): Vec3 {
  const turned = rotate(
    pose.rotation,
    point.x - refCentroid.x,
    point.y - refCentroid.y,
    point.z - refCentroid.z,
  );
  return {
    x: pose.centroid.x + turned.x * pose.scale,
    y: pose.centroid.y + turned.y * pose.scale,
    z: pose.centroid.z + turned.z * pose.scale,
  };
}

// Euler angles in three.js "YXZ" order, ready for Object3D.rotation.set().
export function eulerYXZ(m: Float64Array) {
  const m13 = m[2];
  const m21 = m[3];
  const m22 = m[4];
  const m23 = m[5];
  const m31 = m[6];
  const m33 = m[8];
  const m11 = m[0];

  const clamped = Math.min(1, Math.max(-1, m23));
  const x = Math.asin(-clamped);
  if (Math.abs(m23) < 0.9999999) {
    return { x, y: Math.atan2(m13, m33), z: Math.atan2(m21, m22) };
  }
  return { x, y: Math.atan2(-m31, m11), z: 0 };
}
