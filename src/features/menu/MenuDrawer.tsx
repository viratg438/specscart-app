// File: MenuDrawer.tsx
// Slide-in hamburger menu overlay with accordion links.

import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/theme";

import { MENU_ITEMS } from "./data/menu-items";
import { MenuAccordionItem } from "./components/MenuAccordionItem";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MenuDrawer({ open, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    progress.value = withTiming(
      0,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
          runOnJS(setExpandedId)(null);
        }
      },
    );
  }, [open, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * -320 }],
  }));

  const handleNavigate = (href: Href) => {
    onClose();
    router.push(href);
  };

  if (!mounted) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents={open ? "auto" : "none"}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.overlay, overlayStyle]} />
      </Pressable>

      <Animated.View style={[styles.drawer, drawerStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>Specscart.</Text>
          <Pressable hitSlop={12} onPress={onClose}>
            <X size={22} color={colors.text} strokeWidth={1.75} />
          </Pressable>
        </View>

        {MENU_ITEMS.map((item) => (
          <MenuAccordionItem
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() =>
              setExpandedId((current) => (current === item.id ? null : item.id))
            }
            onNavigate={handleNavigate}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "82%",
    maxWidth: 320,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brand,
  },
});
