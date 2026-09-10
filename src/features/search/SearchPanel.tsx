// File: SearchPanel.tsx
// Live search results for pages and products.

import { Image } from "expo-image";
import { Href, router } from "expo-router";
import { FileText } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchAllProducts, getAllFallbackProducts } from "@/api/products";
import { colors, spacing } from "@/theme";
import { Product } from "@/types/product";

import { SearchPage } from "./pages";
import { ProductHit, searchPages, searchProductHits } from "./query";

type Props = {
  query: string;
  listening: boolean;
  error: string | null;
  onNavigate: () => void;
};

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

export function SearchPanel({ query, listening, error, onNavigate }: Props) {
  const [products, setProducts] = useState<Product[]>(getAllFallbackProducts);

  useEffect(() => {
    let cancelled = false;
    fetchAllProducts().then((data) => {
      if (!cancelled && data.length > 0) {
        setProducts(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pages = useMemo(() => searchPages(query), [query]);
  const matchedProducts = useMemo(
    () => searchProductHits(products, query),
    [products, query],
  );

  const go = (href: Href) => {
    onNavigate();
    router.push(href);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {listening ? <Text style={styles.hint}>Listening… speak now</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {pages.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.heading}>Pages</Text>
          {pages.map((page) => (
            <PageRow key={page.id} page={page} onPress={() => go(page.href)} />
          ))}
        </View>
      ) : null}

      {matchedProducts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.heading}>
            Products ({matchedProducts.length})
          </Text>
          {matchedProducts.map((hit) => (
            <ProductRow
              key={hit.key}
              hit={hit}
              onPress={() => go(`/product/${hit.product.id}` as Href)}
            />
          ))}
        </View>
      ) : null}

      {!listening &&
      query.trim() &&
      pages.length === 0 &&
      matchedProducts.length === 0 ? (
        <Text style={styles.empty}>No pages or products match “{query}”.</Text>
      ) : null}
    </ScrollView>
  );
}

function PageRow({ page, onPress }: { page: SearchPage; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.pageIcon}>
        <FileText size={16} color={colors.brand} strokeWidth={1.75} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{page.title}</Text>
        <Text style={styles.rowSub}>{page.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ProductRow({
  hit,
  onPress,
}: {
  hit: ProductHit;
  onPress: () => void;
}) {
  const { product, swatchIndex } = hit;
  const selected = product.swatches[swatchIndex] ?? product.swatches[0];
  const image = selected?.productImage || product.image;
  const name = selected?.name || product.name;
  const brand = selected?.brand || product.brand;
  const color = selected?.color;
  const price = selected?.price ?? product.price;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Image
        source={{ uri: image }}
        style={styles.thumb}
        contentFit="contain"
      />
      <View style={styles.rowText}>
        <Text style={styles.rowSub}>
          {brand}
          {color ? ` · ${color}` : ""}
        </Text>
        <Text style={styles.rowTitle}>{name}</Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.sale,
  },
  empty: {
    marginTop: spacing.xl,
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    marginTop: spacing.md,
  },
  heading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  rowSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  price: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: colors.brand,
  },
});
