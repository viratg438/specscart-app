// File: BestSellers.tsx
// Home "Top Picks" section with glasses/sunglasses tabs and a horizontal product rail.

import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchBestsellers, getFallbackBestsellers } from "@/api/products";
import { colors, spacing } from "@/theme";
import { BestsellerCategory, Product } from "@/types/product";

import { ProductCard } from "./ProductCard";

const TABS: { id: BestsellerCategory; label: string }[] = [
  { id: "glasses", label: "Glasses" },
  { id: "sunglasses", label: "Sunglasses" },
];

const RAIL_HEIGHT = 200;

export function BestSellers() {
  const [category, setCategory] = useState<BestsellerCategory>("glasses");
  const [products, setProducts] = useState<Product[]>(() =>
    getFallbackBestsellers("glasses"),
  );

  useEffect(() => {
    let cancelled = false;
    setProducts(getFallbackBestsellers(category));

    fetchBestsellers(category).then((data) => {
      if (!cancelled) {
        setProducts(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Top Picks</Text>
      <Text style={styles.subtitle}>
        Complete prescription glasses starting at{" "}
        <Text style={styles.subtitleStrong}>£29.99</Text>
      </Text>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab.id === category;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setCategory(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.railWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {products.map((product) => (
            <ProductCard key={`${category}-${product.id}`} product={product} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textBody,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  subtitleStrong: {
    fontWeight: "700",
    color: colors.text,
  },
  tabs: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 4,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.background,
  },
  railWrap: {
    minHeight: RAIL_HEIGHT,
  },
  rail: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: "stretch",
  },
});
