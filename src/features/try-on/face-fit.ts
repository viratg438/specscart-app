// File: face-fit.ts
// Locks glasses to the face. Once a frontal reference has been captured the fit
// comes from a single rigid pose solve (see head-pose.ts); until then it falls
// back to the per-feature estimates below.

import {
  Vec3,
  applyPose,
  centroidOf,
  eulerYXZ,
  solvePose,
} from "./head-pose";

export type FaceFit = {
  x: number;
  y: number;
  scale: number;
  roll: number;
  yaw: number;
  pitch: number;
  visible: boolean;
};

type Landmark = { x: number; y: number; z?: number };
type Vec = { x: number; y: number; z: number };

const RIGHT_OUTER = 33;
const RIGHT_INNER = 133;
const RIGHT_TOP = 159;
const RIGHT_BOTTOM = 145;
const LEFT_OUTER = 263;
const LEFT_INNER = 362;
const LEFT_TOP = 386;
const LEFT_BOTTOM = 374;
const NOSE_BRIDGE = 6;
const NOSE_TIP = 1;
const FOREHEAD = 10;
const CHIN = 152;
const RIGHT_EAR = 234;
const LEFT_EAR = 454;

const EYE_INDEXES = [
  RIGHT_OUTER,
  RIGHT_INNER,
  RIGHT_TOP,
  RIGHT_BOTTOM,
  LEFT_OUTER,
  LEFT_INNER,
  LEFT_TOP,
  LEFT_BOTTOM,
];

// Frame front width as a multiple of the outer eye-corner distance.
const FRAME_OVER_EYES = 1.42;
// How far the lens centre drops from the eye centre towards the nose bridge.
const NOSE_SHIFT = 0.16;
// A turned head foreshortens the eye line; never grow the frame by more than this.
const MIN_YAW_COS = 0.45;

// Face Mesh reports z on the same scale as the *normalised* x, but toWorld
// stretches x by 2 to span [-aspect, aspect]. Without the matching factor the
// landmark cloud is half as deep as it is wide and every rotation reads low.
const DEPTH_SCALE = 2;

// Landmarks that hold still through blinks, smiles and speech. The pose solve
// is only as rigid as the points fed to it, so eyelids, lips and jaw are out.
const RIGID_LANDMARKS = [
  33, 133, 263, 362, 130, 359, 226, 446, 6, 168, 197, 195, 4, 234, 454, 227,
  447, 10, 109, 338, 116, 345,
];
const RIGID_SLOT = new Map(RIGID_LANDMARKS.map((index, slot) => [index, slot]));

// Frames of a roughly front-on face averaged into the reference pose.
const REFERENCE_FRAMES = 20;
const REFERENCE_MAX_ANGLE = 0.12;
// Guards against a solve that has clearly lost the face.
const MAX_POSE_ANGLE = 1.3;
const MAX_POSE_SCALE = 3;

export const DEFAULT_FIT: FaceFit = {
  x: 0,
  y: 0.06,
  scale: 0.85,
  roll: 0,
  yaw: 0,
  pitch: 0,
  visible: true,
};

function keepUpright(angle: number) {
  let next = angle;
  while (next > Math.PI / 2) {
    next -= Math.PI;
  }
  while (next < -Math.PI / 2) {
    next += Math.PI;
  }
  return next;
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerpAngle(from: number, to: number, amount: number) {
  let delta = to - from;
  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return from + delta * amount;
}

function follow(dt: number, tau: number) {
  return 1 - Math.exp(-dt / Math.max(tau, 0.001));
}

function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

// The forehead-to-chin vector is never perfectly vertical at rest, and how far
// off it sits is personal anatomy. Average the first frontal frames and treat
// that as "level", otherwise the frame wears a permanent tilt. "Refit" builds a
// new smoother, which re-runs this calibration.
const BIAS_FRAMES = 30;
const BIAS_MAX_ANGLE = 0.12;

export function createFaceSmoother() {
  let current: FaceFit | null = null;
  let last = 0;
  let pitchBias = 0;
  let biasSamples = 0;

  return function next(raw: FaceFit): FaceFit {
    if (!raw.visible) {
      return current ?? DEFAULT_FIT;
    }
    if (
      biasSamples < BIAS_FRAMES &&
      Math.abs(raw.yaw) < BIAS_MAX_ANGLE &&
      Math.abs(raw.roll) < BIAS_MAX_ANGLE
    ) {
      biasSamples += 1;
      pitchBias += (raw.pitch - pitchBias) / biasSamples;
    }
    const target: FaceFit = { ...raw, pitch: raw.pitch - pitchBias };

    const now = performance.now();
    const dt = last ? clamp((now - last) / 1000, 0.008, 0.08) : 0.016;
    last = now;
    if (!current) {
      current = { ...target };
      return current;
    }
    const pos = follow(dt, 0.032);
    const scl = follow(dt, 0.055);
    const rot = follow(dt, 0.045);
    current = {
      x: lerp(current.x, target.x, pos),
      y: lerp(current.y, target.y, pos),
      scale: lerp(current.scale, target.scale, scl),
      roll: lerpAngle(current.roll, target.roll, rot),
      yaw: lerpAngle(current.yaw, target.yaw, rot),
      pitch: lerpAngle(current.pitch, target.pitch, rot),
      visible: true,
    };
    return current;
  };
}

type Reference = {
  points: Vec3[];
  centroid: Vec3;
  // Where the frame sits on this particular face, in reference space.
  anchor: Vec3;
  // Frame width measured head-on, so it never changes as the head turns.
  frameWidth: number;
};

function rigidCloud(
  landmarks: Landmark[],
  toWorld: (point?: Landmark) => Vec | null,
): Vec3[] | null {
  const cloud: Vec3[] = [];
  for (const index of RIGID_LANDMARKS) {
    const point = toWorld(landmarks[index]);
    if (!point) {
      return null;
    }
    cloud.push(point);
  }
  return cloud;
}

function buildReference(samples: Vec3[][]): Reference | null {
  const count = RIGID_LANDMARKS.length;
  const points: Vec3[] = [];
  for (let slot = 0; slot < count; slot += 1) {
    points.push(average(samples.map((sample) => sample[slot])));
  }

  const at = (index: number) => {
    const slot = RIGID_SLOT.get(index);
    return slot === undefined ? null : points[slot];
  };
  const rightOuter = at(RIGHT_OUTER);
  const leftOuter = at(LEFT_OUTER);
  const rightInner = at(RIGHT_INNER);
  const leftInner = at(LEFT_INNER);
  const nose = at(NOSE_BRIDGE);
  if (!rightOuter || !leftOuter || !rightInner || !leftInner || !nose) {
    return null;
  }

  const eyeSpan = Math.hypot(
    leftOuter.x - rightOuter.x,
    leftOuter.y - rightOuter.y,
    leftOuter.z - rightOuter.z,
  );
  if (!(eyeSpan > 0.0001)) {
    return null;
  }

  const bridge = average([rightInner, leftInner]);
  const eyeLine = average([rightOuter, leftOuter]);

  return {
    points,
    centroid: centroidOf(points),
    anchor: {
      x: bridge.x,
      y: eyeLine.y * (1 - NOSE_SHIFT) + nose.y * NOSE_SHIFT,
      z: bridge.z,
    },
    frameWidth: eyeSpan * FRAME_OVER_EYES,
  };
}

/**
 * Tracks a face across frames. The first frames of a front-on face become the
 * reference pose; from then on every frame is a rigid fit back onto it, so
 * position, size and rotation all come from one solve and stay consistent as
 * the head moves. Falls back to `fitFromLandmarks` until the reference locks,
 * and whenever a solve fails. Build a new tracker to recalibrate ("Refit").
 */
export function createFaceTracker() {
  let smoother = createFaceSmoother();
  let samples: Vec3[][] = [];
  let reference: Reference | null = null;

  return function track(
    landmarks: Landmark[],
    viewWidth: number,
    viewHeight: number,
  ): FaceFit {
    const heuristic = fitFromLandmarks(landmarks, viewWidth, viewHeight);
    if (!heuristic.visible) {
      return smoother(heuristic);
    }

    const toWorld = makeToWorld(viewWidth, viewHeight);
    const cloud = rigidCloud(landmarks, toWorld);

    if (reference && cloud) {
      const pose = solvePose(reference.points, reference.centroid, cloud);
      if (pose) {
        const anchor = applyPose(pose, reference.centroid, reference.anchor);
        const euler = eulerYXZ(pose.rotation);
        const sane =
          pose.scale < MAX_POSE_SCALE &&
          Math.abs(euler.x) < MAX_POSE_ANGLE &&
          Math.abs(euler.y) < MAX_POSE_ANGLE &&
          Math.abs(euler.z) < MAX_POSE_ANGLE;
        if (sane) {
          return smoother({
            x: anchor.x,
            y: anchor.y,
            scale: pose.scale * reference.frameWidth,
            roll: euler.z,
            yaw: euler.y,
            pitch: euler.x,
            visible: true,
          });
        }
      }
    }

    if (
      !reference &&
      cloud &&
      Math.abs(heuristic.yaw) < REFERENCE_MAX_ANGLE &&
      Math.abs(heuristic.roll) < REFERENCE_MAX_ANGLE
    ) {
      samples.push(cloud);
      if (samples.length >= REFERENCE_FRAMES) {
        reference = buildReference(samples);
        samples = [];
        if (reference) {
          // The pose path measures rotation against the user's own resting
          // face, so the heuristic's learned pitch bias no longer applies.
          smoother = createFaceSmoother();
        }
      }
    }

    return smoother(heuristic);
  };
}

function average(points: Vec[]): Vec {
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

// Normalised landmarks -> the render space the stage draws in: +x right,
// +y up, +z towards the camera, y spanning [-1, 1] across the view.
function makeToWorld(viewWidth: number, viewHeight: number) {
  const aspect = viewWidth / Math.max(viewHeight, 1);
  return (point?: Landmark): Vec | null => {
    if (!point) {
      return null;
    }
    return {
      x: (point.x * 2 - 1) * aspect,
      y: 1 - point.y * 2,
      z: -(point.z ?? 0) * aspect * DEPTH_SCALE,
    };
  };
}

export function fitFromLandmarks(
  landmarks: Landmark[],
  viewWidth: number,
  viewHeight: number,
): FaceFit {
  const toWorld = makeToWorld(viewWidth, viewHeight);

  const eyes: Vec[] = [];
  for (const index of EYE_INDEXES) {
    const point = toWorld(landmarks[index]);
    if (point) {
      eyes.push(point);
    }
  }
  const rightOuter = toWorld(landmarks[RIGHT_OUTER]);
  const leftOuter = toWorld(landmarks[LEFT_OUTER]);
  if (!rightOuter || !leftOuter || eyes.length < 4) {
    return { ...DEFAULT_FIT, visible: false };
  }

  const eyeMid = average(eyes);
  const nose =
    toWorld(landmarks[NOSE_BRIDGE]) ??
    toWorld(landmarks[NOSE_TIP]) ??
    eyeMid;
  // The frame is anchored on its bridge, so track the inner eye corners rather
  // than the eye centroid — the bridge stays put when the head turns.
  const rightInner = toWorld(landmarks[RIGHT_INNER]);
  const leftInner = toWorld(landmarks[LEFT_INNER]);
  const bridge =
    rightInner && leftInner ? average([rightInner, leftInner]) : eyeMid;
  const forehead = toWorld(landmarks[FOREHEAD]);
  const chin = toWorld(landmarks[CHIN]);
  const rightEar = toWorld(landmarks[RIGHT_EAR]) ?? rightOuter;
  const leftEar = toWorld(landmarks[LEFT_EAR]) ?? leftOuter;

  const screenLeft = rightOuter.x <= leftOuter.x ? rightOuter : leftOuter;
  const screenRight = rightOuter.x <= leftOuter.x ? leftOuter : rightOuter;
  const eyeDx = screenRight.x - screenLeft.x;
  const eyeDy = screenRight.y - screenLeft.y;
  const eyeSpan = Math.hypot(eyeDx, eyeDy);

  const roll = clamp(keepUpright(Math.atan2(eyeDy, eyeDx)), -0.4, 0.4);

  const earLeft = rightEar.x <= leftEar.x ? rightEar : leftEar;
  const earRight = rightEar.x <= leftEar.x ? leftEar : rightEar;
  // Positive = the on-screen right side of the head is nearer the camera. No
  // gain here any more: DEPTH_SCALE already puts z on the same footing as x.
  const headYaw = clamp(
    Math.atan2(earRight.z - earLeft.z, earRight.x - earLeft.x + 0.0001),
    -0.9,
    0.9,
  );

  // Positive = chin up, so the top of the head leans away from the camera.
  let headPitch = 0;
  if (forehead && chin) {
    const up = sub(forehead, chin);
    headPitch = clamp(Math.atan2(-up.z, up.y + 0.0001), -0.45, 0.45) * 0.75;
  }

  // A turned head foreshortens the eye line, which would otherwise shrink the
  // frame; undo the projection so the width stays locked to the face.
  const spanCorrection = Math.max(Math.cos(headYaw), MIN_YAW_COS);

  return {
    x: bridge.x,
    y: eyeMid.y * (1 - NOSE_SHIFT) + nose.y * NOSE_SHIFT,
    scale: Math.max((eyeSpan / spanCorrection) * FRAME_OVER_EYES, 0.4),
    roll,
    // Three.js rotates the model's +x towards -z for a positive rotation.y (and
    // +y towards +z for a positive rotation.x), which is the opposite of the
    // head angles above. Negate here so callers can feed these straight into
    // `rotation.set(pitch, yaw, roll)`.
    yaw: -headYaw,
    pitch: -headPitch,
    visible: true,
  };
}
