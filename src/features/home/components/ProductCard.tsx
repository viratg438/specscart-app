// File: ProductCard.tsx
// Single product card for home rail and listing grid. Opens product detail on tap.

import { Image } from "expo-image";
import { Href, router } from "expo-router";
import { Glasses, Heart } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { VirtualTryOnScreen } from "@/features/try-on/VirtualTryOnScreen";
import { captureFrontCameraFromGesture } from "@/features/try-on/prime-camera";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { colors, spacing } from "@/theme";
import { Product } from "@/types/product";

const CARD_WIDTH = 210;

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

type Props = {
  product: Product;
  layout?: "rail" | "grid";
};

export function ProductCard({ product, layout = "rail" }: Props) {
  const { has, toggle } = useWishlist();
  const [activeIndex, setActiveIndex] = useState(
    product.activeSwatchIndex ?? 0,
  );
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const selected = product.swatches[activeIndex] ?? product.swatches[0];
  const wishId = selected?.id ?? product.id;
  const wished = has(wishId);

  const image = selected?.productImage || product.image;
  const name = selected?.name || product.name;
  const brand = selected?.brand || product.brand;
  const price = selected?.price ?? product.price;
  const salePrice = selected?.salePrice ?? product.salePrice;
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;

  const swatches = useMemo(() => product.swatches, [product.swatches]);
  const canTryOn = swatches.some((swatch) => Boolean(swatch.glb));

  const openDetails = () => {
    router.push(`/product/${product.id}` as Href);
  };

  const openTryOn = async () => {
    try {
      await captureFrontCameraFromGesture();
    } catch {
      // Modal still opens; Allow camera can retry.
    }
    setTryOnOpen(true);
  };

  return (
    <View style={[styles.card, layout === "grid" && styles.cardGrid]}>
      {canTryOn ? (
        <Pressable hitSlop={8} style={styles.tryOn} onPress={openTryOn}>
          <Glasses size={20} color={colors.text} strokeWidth={1.75} />
        </Pressable>
      ) : null}
      <VirtualTryOnScreen
        visible={tryOnOpen}
        productId={product.id}
        swatchIndex={activeIndex}
        onClose={() => setTryOnOpen(false)}
      />
      <Pressable hitSlop={8} style={styles.wish} onPress={() => toggle(wishId)}>
        <Heart
          size={20}
          color={wished ? colors.sale : colors.text}
          fill={wished ? colors.sale : "transparent"}
          strokeWidth={1.75}
        />
      </Pressable>

      <Pressable onPress={openDetails}>
        <Image
          key={image}
          source={{ uri: image }}
          style={styles.image}
          contentFit="contain"
        />

        <Text style={styles.brand}>{brand}</Text>
        <Text style={styles.name}>{name}</Text>

        <View style={styles.priceRow}>
          {onSale ? (
            <>
              <Text style={styles.was}>{formatPrice(price)}</Text>
              <Text style={styles.sale}>{formatPrice(salePrice ?? price)}</Text>
            </>
          ) : (
            <Text style={styles.price}>{formatPrice(price)}</Text>
          )}
        </View>
      </Pressable>

      <View style={styles.swatches}>
        {swatches.map((swatch, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={swatch.id || String(index)}
              hitSlop={6}
              onPress={() => setActiveIndex(index)}
              style={[styles.swatchRing, isActive && styles.swatchRingActive]}
            >
              {swatch.image ? (
                <Image
                  source={{ uri: swatch.image }}
                  style={styles.swatch}
                  contentFit="cover"
                  pointerEvents="none"
                />
              ) : (
                <View
                  pointerEvents="none"
                  style={[
                    styles.swatch,
                    { backgroundColor: swatch.hex ?? colors.textMuted },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardGrid: {
    width: "100%",
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 250,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  tryOn: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    zIndex: 2,
  },
  wish: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  image: {
    width: "100%",
    height: 110,
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontWeight: "300",
    textTransform: "uppercase",
  },
  name: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  was: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  sale: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.sale,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "nowrap",
    overflowX: "auto",
    paddingBottom: 6,
    gap: 3,
    marginTop: spacing.md,
    zIndex: 2,
  },
  swatchRing: {
    width: 24,
    height: 24,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchRingActive: {
    borderColor: colors.accent,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
