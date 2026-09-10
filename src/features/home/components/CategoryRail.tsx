// File: CategoryRail.tsx
// Horizontal category circles on home (Glasses, Sunglasses, etc.).

import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, spacing } from "@/theme";

import { HOME_CATEGORIES } from "../data/categories";

export function CategoryRail() {
  return (
    <ScrollView
      horizontal
      style={styles.rail}
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
    >
      {HOME_CATEGORIES.map((category) => (
        <Pressable
          key={category.title}
          style={styles.item}
          onPress={() => router.push(category.url)}
        >
          <Image
            source={{ uri: category.image }}
            style={styles.image}
            contentFit="cover"
          />
          <Text style={styles.title}>{category.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    height: 120,
  },
  item: {
    width: 75,
    alignItems: "center",
    gap: spacing.sm,
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textBody,
    textAlign: "center",
  },
});
