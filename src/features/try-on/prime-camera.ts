// File: prime-camera.ts
// Capture the front camera during a real tap so the modal can start without a second button.

let pending: MediaStream | null = null;

export async function captureFrontCameraFromGesture() {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    return null;
  }

  const live = pending?.getVideoTracks().some((track) => track.readyState === "live");
  if (pending && live) {
    return pending;
  }

  pending = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });
  return pending;
}

export function peekFrontCamera() {
  const live = pending?.getVideoTracks().some((track) => track.readyState === "live");
  return live ? pending : null;
}

export function releaseFrontCamera() {
  pending?.getTracks().forEach((track) => track.stop());
  pending = null;
}
