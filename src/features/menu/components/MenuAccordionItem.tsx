// File: MenuAccordionItem.tsx
// One menu row that expands children or navigates to a page.

import { ChevronDown } from "lucide-react-native";
import { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/theme";

import { MenuItem } from "../data/menu-items";

type Props = {
  item: MenuItem;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (href: Href) => void;
};

export function MenuAccordionItem({
  item,
  expanded,
  onToggle,
  onNavigate,
}: Props) {
  const hasChildren = Boolean(item.children?.length);
  const rotation = useDerivedValue(() =>
    withTiming(expanded ? 180 : 0, { duration: 220 }),
  );

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    if (hasChildren) {
      onToggle();
      return;
    }

    if (item.href) {
      onNavigate(item.href);
    }
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={handlePress}
      >
        <Text style={styles.label}>{item.label}</Text>
        {hasChildren ? (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={20} color={colors.textMuted} strokeWidth={1.75} />
          </Animated.View>
        ) : null}
      </Pressable>

      {hasChildren && expanded ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          {item.children?.map((child) => (
            <Pressable
              key={child.id}
              style={({ pressed }) => [styles.childRow, pressed && styles.pressed]}
              onPress={() => onNavigate(child.href)}
            >
              <Text style={styles.childLabel}>{child.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childRow: {
    minHeight: 44,
    paddingLeft: 36,
    paddingRight: spacing.xl,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  childLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textBody,
  },
});
