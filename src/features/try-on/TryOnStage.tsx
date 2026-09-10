// File: TryOnStage.tsx
// Native try-on stage: camera plus GLB overlay. Face lock is web-only.

import { CameraView } from "expo-camera";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

import { TryOnOverlay } from "./TryOnOverlay";
import { TryOnPose } from "./pose";

type Props = {
  glbUri: string;
  active: boolean;
  refitToken?: number;
  startToken?: number;
  onReady?: () => void;
  onError?: () => void;
};

export function TryOnStage({ glbUri, active, onReady, onError }: Props) {
  const poseRef = useRef<TryOnPose>({ x: 0, y: 0.06, scale: 0.42 });

  return (
    <View style={styles.fill}>
      {active ? (
        <CameraView facing="front" mirror zoom={0} style={styles.fill} />
      ) : (
        <View style={styles.fallback} />
      )}
      {glbUri && active ? (
        <TryOnOverlay
          glbUri={glbUri}
          poseRef={poseRef}
          onReady={onReady}
          onError={onError}
        />
      ) : null}
    </View>
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
  fallback: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#222222",
  },
});
