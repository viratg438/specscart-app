// File: DetailAccordion.tsx
// Expand/collapse sections on the product detail page (details, delivery, help).

import { ChevronDown } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/theme";

export type AccordionSection = {
  id: string;
  title: string;
  body: string;
};

type Props = {
  sections: AccordionSection[];
  openId: string | null;
  onToggle: (id: string) => void;
};

export function DetailAccordion({ sections, openId, onToggle }: Props) {
  return (
    <View style={styles.wrap}>
      {sections.map((section) => {
        const open = openId === section.id;
        return (
          <AccordionRow
            key={section.id}
            section={section}
            open={open}
            onToggle={() => onToggle(section.id)}
          />
        );
      })}
    </View>
  );
}

function AccordionRow({
  section,
  open,
  onToggle,
}: {
  section: AccordionSection;
  open: boolean;
  onToggle: () => void;
}) {
  const rotation = useDerivedValue(() =>
    withTiming(open ? 180 : 0, { duration: 220 }),
  );
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.item}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={onToggle}
      >
        <Text style={styles.title}>{section.title}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={colors.textMuted} strokeWidth={1.75} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.bodyWrap}
        >
          <Text style={styles.body}>{section.body}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  bodyWrap: {
    paddingBottom: spacing.lg,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textBody,
  },
});
