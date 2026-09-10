// File: ProductListingScreen.tsx
// Shared 2-column product listing used by Glasses and Sunglasses pages.

import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import {
  fetchCategoryListing,
  getFallbackCategoryListing,
} from "@/api/products";
import { AppShell } from "@/components/layout/app-shell";
import { ProductCard } from "@/features/home/components/ProductCard";
import { colors, spacing } from "@/theme";
import { BestsellerCategory, Product } from "@/types/product";

type Props = {
  category: BestsellerCategory;
  title: string;
};

export function ProductListingScreen({ category, title }: Props) {
  const [products, setProducts] = useState<Product[]>(() =>
    getFallbackCategoryListing(category),
  );

  useEffect(() => {
    let cancelled = false;
    setProducts(getFallbackCategoryListing(category));

    fetchCategoryListing(category).then((data) => {
      if (!cancelled) {
        setProducts(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <AppShell title={title} showBack={false}>
      <FlatList
        style={styles.flex}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.count}>{products.length} styles</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} layout="grid" />
          </View>
        )}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  count: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: "flex-start",
  },
  cell: {
    width: "48%",
    flexGrow: 0,
  },
});
