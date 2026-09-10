// File: ProductDetailScreen.tsx
// Product detail page — gallery, price, colours, CTAs, and info accordion.

import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { Glasses, Heart, ZoomIn } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { fetchProductById, getFallbackProduct } from "@/api/products";
import { AppShell } from "@/components/layout/app-shell";
import { useCart, type CartOption } from "@/features/cart/CartContext";
import { VirtualTryOnScreen } from "@/features/try-on/VirtualTryOnScreen";
import { captureFrontCameraFromGesture } from "@/features/try-on/prime-camera";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { colors, layout, spacing } from "@/theme";
import { Product } from "@/types/product";

import {
  AccordionSection,
  DetailAccordion,
} from "./components/DetailAccordion";
import { ProductImageZoom } from "./components/ProductImageZoom";

type Props = {
  id: string;
};

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

function buildSections(
  product: Product,
  sku: string,
  brand: string,
  name: string,
): AccordionSection[] {
  return [
    {
      id: "details",
      title: "Product details",
      body: `${brand} ${name} is a prescription-ready frame from our current collection. Finish your look with lenses at checkout. SKU ${sku}.`,
    },
    {
      id: "included",
      title: "What's included",
      body: "Your order includes the selected frame, a protective case, a cleaning cloth, and UK delivery on qualifying orders. Prescription lenses can be added in the next step.",
    },
    {
      id: "delivery",
      title: "Delivery & returns",
      body: "Standard UK delivery is typically 3–5 working days after your lenses are made. Unworn frames can be returned within 30 days in original condition.",
    },
    {
      id: "help",
      title: "Need help?",
      body: "Not sure about size or lens type? Use Home Try-On when available, or contact Specscart support and we will help you choose a frame that fits.",
    },
  ];
}

function collectItemImages(product: Product, swatchIndex: number): string[] {
  const selected = product.swatches[swatchIndex] ?? product.swatches[0];
  if (selected?.gallery?.length) {
    return selected.gallery;
  }
  return selected?.productImage ? [selected.productImage] : [];
}

export function ProductDetailScreen({ id }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const galleryWidth = Math.min(windowWidth, layout.phoneWidth);
  const router = useRouter();
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | undefined>(() =>
    getFallbackProduct(id),
  );
  const [activeIndex, setActiveIndex] = useState(
    () => getFallbackProduct(id)?.activeSwatchIndex ?? 0,
  );
  const [openId, setOpenId] = useState<string | null>("details");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fallback = getFallbackProduct(id);
    setProduct(fallback);
    setActiveIndex(fallback?.activeSwatchIndex ?? 0);
    setOpenId("details");
    setGalleryIndex(0);
    setZoomOpen(false);

    fetchProductById(id).then((data) => {
      if (!cancelled && data) {
        setProduct(data);
        setActiveIndex(data.activeSwatchIndex ?? 0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const selected = product?.swatches[activeIndex] ?? product?.swatches[0];
  const wishId = selected?.id ?? product?.id ?? id;
  const wished = has(wishId);
  const name = selected?.name || product?.name || "";
  const colorName = selected?.color ?? "";
  const brand = selected?.brand || product?.brand || "";
  const sku = selected?.sku || product?.sku || "";
  const price = selected?.price ?? product?.price ?? 0;
  const salePrice = selected?.salePrice ?? product?.salePrice;
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;
  const images = product ? collectItemImages(product, activeIndex) : [];
  const zoomUri = images[galleryIndex] ?? images[0] ?? "";

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
    if (next >= 0 && next < images.length) {
      setGalleryIndex(next);
    }
  };

  const sections = useMemo(
    () => (product ? buildSections(product, sku, brand, name) : []),
    [product, sku, brand, name],
  );

  const addToCart = (option: CartOption) => {
    if (!product) {
      return;
    }
    const unitPrice = onSale ? (salePrice ?? price) : price;
    add({
      id: `${wishId}:${option}`,
      productId: product.id,
      name,
      brand,
      image: images[0] ?? product.image ?? "",
      price: unitPrice,
      option,
    });
    router.push("/cart" as Href);
  };

  return (
    <AppShell title={name || "Product"}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.topActions}>
            {product?.swatches.some((swatch) => swatch.glb) ? (
              <Pressable
                hitSlop={10}
                onPress={async () => {
                  try {
                    await captureFrontCameraFromGesture();
                  } catch {
                    // Modal still opens; Allow camera can retry.
                  }
                  setTryOnOpen(true);
                }}
              >
                <Glasses size={22} color={colors.text} strokeWidth={1.75} />
              </Pressable>
            ) : null}
            <Pressable hitSlop={10} onPress={() => toggle(wishId)}>
              <Heart
                size={22}
                color={wished ? colors.sale : colors.text}
                fill={wished ? colors.sale : "transparent"}
                strokeWidth={1.75}
              />
            </Pressable>
          </View>
        </View>

        {!product ? (
          <Text style={styles.empty}>
            This frame is not available right now.
          </Text>
        ) : (
          <>
            <View style={styles.galleryWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.gallery}
                onMomentumScrollEnd={onGalleryScroll}
              >
                {images.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => {
                      setGalleryIndex(index);
                      setZoomOpen(true);
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={[styles.hero, { width: galleryWidth }]}
                      contentFit="contain"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={styles.zoomIcon}
                onPress={() => setZoomOpen(true)}
                hitSlop={8}
              >
                <ZoomIn size={18} color={colors.text} strokeWidth={2} />
              </Pressable>

              {images.length > 1 ? (
                <View style={styles.dots}>
                  {images.map((uri, index) => (
                    <View
                      key={`dot-${uri}-${index}`}
                      style={[
                        styles.dot,
                        index === galleryIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={styles.brand}>{brand}</Text>
            <View style={styles.productView}>
              <Text style={styles.name}>{name}</Text>

              <View style={styles.priceRow}>
                {onSale ? (
                  <>
                    <Text style={styles.was}>{formatPrice(price)}</Text>
                    <Text style={styles.sale}>
                      {formatPrice(salePrice ?? price)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.price}>{formatPrice(price)}</Text>
                )}
              </View>
            </View>
            <Text style={styles.sku}>SKU: {sku}</Text>

            {product.swatches.length > 0 ? (
              <View style={styles.swatchBlock}>
                <Text style={styles.swatchLabel}>
                  Colours:{colorName ? ` ${colorName}` : ""}
                </Text>
                <View style={styles.swatches}>
                  {product.swatches.map((swatch, index) => {
                    const active = index === activeIndex;
                    return (
                      <Pressable
                        key={swatch.id || String(index)}
                        onPress={() => {
                          setActiveIndex(index);
                          setGalleryIndex(0);
                        }}
                        style={[
                          styles.swatchRing,
                          active && styles.swatchRingActive,
                        ]}
                      >
                        {swatch.image ? (
                          <Image
                            source={{ uri: swatch.image }}
                            style={styles.swatch}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.swatch,
                              {
                                backgroundColor: swatch.hex ?? colors.textMuted,
                              },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Pressable style={styles.cta} onPress={() => addToCart("lenses")}>
              <Text style={styles.ctaLabel}>Select lenses</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryCta}
              onPress={() => addToCart("frame")}
            >
              <Text style={styles.secondaryLabel}>Add frame only</Text>
            </Pressable>

            <DetailAccordion
              sections={sections}
              openId={openId}
              onToggle={(sectionId) =>
                setOpenId((current) =>
                  current === sectionId ? null : sectionId,
                )
              }
            />
            <ProductImageZoom
              visible={zoomOpen}
              uri={zoomUri}
              index={galleryIndex}
              total={images.length}
              onClose={() => setZoomOpen(false)}
            />
            {product ? (
              <VirtualTryOnScreen
                visible={tryOnOpen}
                productId={product.id}
                swatchIndex={activeIndex}
                onClose={() => setTryOnOpen(false)}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </AppShell>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  empty: {
    marginTop: spacing.xl,
    fontSize: 15,
    color: colors.textMuted,
  },
  galleryWrap: {
    marginHorizontal: -spacing.lg,
    backgroundColor: colors.surface,
  },
  gallery: {
    backgroundColor: colors.surface,
  },
  hero: {
    height: 215,
    backgroundColor: colors.surface,
  },
  zoomIcon: {
    position: "absolute",
    right: spacing.lg,
    bottom: 28,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingBottom: spacing.md,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 16,
  },
  brand: {
    marginTop: spacing.lg,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "300",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  name: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  sku: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  was: {
    fontSize: 16,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  sale: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.sale,
  },
  swatchBlock: {
    marginTop: spacing.lg,
  },
  swatchLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchRingActive: {
    borderColor: colors.accent,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cta: {
    marginTop: spacing.xl,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryCta: {
    marginTop: spacing.sm,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  productView: {
    flex: 1,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
});
