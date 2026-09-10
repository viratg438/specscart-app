// File: ProductImageZoom.tsx
// Full-screen image viewer with pinch, double-tap, and +/- zoom like eCommerce PDPs.

import { Image } from "expo-image";
import { Minus, Plus, X } from "lucide-react-native";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/theme";

type Props = {
  visible: boolean;
  uri: string;
  index: number;
  total: number;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ProductImageZoom({ visible, uri, index, total, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedX.value = 0;
    savedY.value = 0;
  };

  const applyScale = (next: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    scale.value = withTiming(clamped);
    savedScale.value = clamped;
    if (clamped <= MIN_SCALE) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedX.value = 0;
      savedY.value = 0;
    }
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * event.scale),
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) {
        return;
      }
      translateX.value = savedX.value + event.translationX;
      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  useEffect(() => {
    resetZoom();
  }, [uri, visible]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        return;
      }
      scale.value = withTiming(2.5);
      savedScale.value = 2.5;
    });

  const composed = Gesture.Simultaneous(doubleTap, Gesture.Simultaneous(pinch, pan));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.toolbar}>
          <Pressable hitSlop={12} onPress={handleClose} style={styles.iconBtn}>
            <X size={22} color={colors.background} strokeWidth={2} />
          </Pressable>
          <Text style={styles.counter}>
            {total > 0 ? `${index + 1} / ${total}` : ""}
          </Text>
          <View style={styles.zoomControls}>
            <Pressable
              hitSlop={8}
              style={styles.iconBtn}
              onPress={() => applyScale(savedScale.value - 0.5)}
            >
              <Minus size={20} color={colors.background} strokeWidth={2} />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={styles.iconBtn}
              onPress={() => applyScale(savedScale.value + 0.5)}
            >
              <Plus size={20} color={colors.background} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={composed}>
          <Animated.View style={styles.stage}>
            <Animated.View style={imageStyle}>
              <Image
                source={{ uri }}
                style={{ width, height: height * 0.7 }}
                contentFit="contain"
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        <Text style={styles.hint}>Pinch or use + / − to zoom</Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
  },
  toolbar: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "600",
  },
  zoomControls: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 12,
    paddingBottom: spacing.xl,
  },
});
