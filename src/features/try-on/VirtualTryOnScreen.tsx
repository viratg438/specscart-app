// File: VirtualTryOnScreen.tsx
// Centered try-on modal: camera + frame overlay, product panel, close control.

import { useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { Heart, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { fetchProductById, getFallbackProduct } from "@/api/products";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { colors, spacing } from "@/theme";
import { Product } from "@/types/product";

import { TryOnStage } from "./TryOnStage";
import {
  captureFrontCameraFromGesture,
  releaseFrontCamera,
} from "./prime-camera";

type Props = {
  visible: boolean;
  productId: string;
  swatchIndex?: number;
  onClose: () => void;
};

function firstGlbIndex(product: Product, preferred: number) {
  if (product.swatches[preferred]?.glb) {
    return preferred;
  }
  const found = product.swatches.findIndex((swatch) => Boolean(swatch.glb));
  return found >= 0 ? found : 0;
}

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

export function VirtualTryOnScreen({
  visible,
  productId,
  swatchIndex = 0,
  onClose,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= 760;
  const [permission, requestPermission] = useCameraPermissions();
  const { has, toggle } = useWishlist();
  const [product, setProduct] = useState<Product | undefined>(() =>
    getFallbackProduct(productId),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [modelState, setModelState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [refitToken, setRefitToken] = useState(0);
  const [startToken, setStartToken] = useState(0);
  const handleReady = useCallback(() => setModelState("ready"), []);
  const handleError = useCallback(() => setModelState("error"), []);

  useEffect(() => {
    if (!visible || !productId) {
      return;
    }

    let cancelled = false;
    const fallback = getFallbackProduct(productId);
    setProduct(fallback);
    setActiveIndex(fallback ? firstGlbIndex(fallback, swatchIndex) : 0);
    setModelState("loading");

    fetchProductById(productId).then((data) => {
      if (!cancelled && data) {
        setProduct(data);
        setActiveIndex(firstGlbIndex(data, swatchIndex));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible, productId, swatchIndex]);

  useEffect(() => {
    if (!visible) {
      releaseFrontCamera();
    }
  }, [visible]);

  const selected = product?.swatches[activeIndex] ?? product?.swatches[0];
  const glbUri = selected?.glb ?? "";
  const wishId = selected?.id ?? product?.id ?? productId;
  const wished = has(wishId);
  const price = selected?.price ?? product?.price ?? 0;
  const salePrice = selected?.salePrice ?? product?.salePrice;
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;
  const colorName = selected?.color ?? "";
  const tryOnSwatches = useMemo(
    () => (product?.swatches ?? []).map((swatch, index) => ({ swatch, index })),
    [product],
  );
  const cardWidth = Math.min(windowWidth * 0.88, isWide ? 980 : 430);
  const cardHeight = Math.min(windowHeight * 0.78, isWide ? 560 : 640);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropHit} onPress={onClose} />
        <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
          <View style={[styles.body, isWide ? styles.bodyRow : styles.bodyCol]}>
            <View style={[styles.stage, isWide ? styles.stageWide : null]}>
              <TryOnStage
                glbUri={glbUri}
                active={visible}
                refitToken={refitToken}
                startToken={startToken}
                onReady={handleReady}
                onError={handleError}
              />

              <Pressable
                style={styles.refit}
                onPress={() => setRefitToken((value) => value + 1)}
              >
                <Text style={styles.refitLabel}>Refit</Text>
              </Pressable>
              <Pressable style={styles.wish} onPress={() => toggle(wishId)}>
                <Heart
                  size={18}
                  color={wished ? colors.sale : colors.text}
                  fill={wished ? colors.sale : "transparent"}
                  strokeWidth={1.75}
                />
              </Pressable>
            </View>

            <View style={[styles.panel, isWide ? styles.panelWide : null]}>
              <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                <X size={20} color={colors.text} strokeWidth={2} />
              </Pressable>

              <Text style={styles.brand}>
                {selected?.brand || product?.brand || ""}
              </Text>
              <Text style={styles.name}>
                {product?.name || selected?.name || "Virtual try-on"}
              </Text>

              {(permission && !permission.granted) || modelState === "error" ? (
                <Pressable
                  style={[styles.buy, { marginTop: 20 }]}
                  onPress={async () => {
                    await requestPermission();
                    try {
                      await captureFrontCameraFromGesture();
                      setModelState("loading");
                      setStartToken((value) => value + 1);
                    } catch {
                      setModelState("error");
                    }
                  }}
                >
                  <Text style={styles.buyLabel}>Allow camera</Text>
                </Pressable>
              ) : null}

              <Text style={styles.sectionLabel}>Colour</Text>
              <View style={styles.swatches}>
                {tryOnSwatches.map(({ swatch, index }) => {
                  const selectedSwatch = index === activeIndex;
                  return (
                    <Pressable
                      key={swatch.id || String(index)}
                      onPress={() => setActiveIndex(index)}
                      style={[
                        styles.swatchRing,
                        selectedSwatch && styles.swatchRingActive,
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
                            { backgroundColor: colors.textMuted },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {colorName ? (
                <Text style={styles.colorName}>{colorName}</Text>
              ) : null}

              <Text style={styles.hint}>
                {modelState === "error"
                  ? "Allow camera access, then look at the lens."
                  : modelState === "loading"
                    ? "Look at the lens so the frame can sit on your face."
                    : "The frame follows your face. Change colour anytime."}
              </Text>

              <Pressable style={styles.buy}>
                <Text style={styles.buyLabel}>
                  {onSale
                    ? `Buy from ${formatPrice(salePrice ?? price)}`
                    : `Buy from ${formatPrice(price)}`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,20,20,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  backdropHit: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  body: {
    flex: 1,
  },
  bodyRow: {
    flexDirection: "row",
  },
  bodyCol: {
    flexDirection: "column",
  },
  stage: {
    flex: 1.15,
    backgroundColor: "#111111",
    overflow: "hidden",
  },
  stageWide: {
    flex: 1.35,
  },
  refit: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 16,
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  refitLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  wish: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  panelWide: {
    maxWidth: 360,
  },
  close: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: "uppercase",
    fontWeight: "300",
  },
  name: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  sectionLabel: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  swatches: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatchRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchRingActive: {
    borderColor: colors.text,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorName: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: "italic",
    color: colors.textBody,
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  buy: {
    marginTop: "auto",
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  buyLabel: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  permissionBox: {
    marginTop: 24,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  permissionBody: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
