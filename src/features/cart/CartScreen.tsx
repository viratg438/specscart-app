import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { useCart, type CartOption } from "@/features/cart/CartContext";
import { colors, spacing } from "@/theme";

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

function optionLabel(option: CartOption) {
  return option === "lenses" ? "With lenses" : "Frame only";
}

export default function CartScreen() {
  const router = useRouter();
  const { items, count, total, remove, setQty } = useCart();

  return (
    <AppShell title="Cart">
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Cart</Text>
        <Text style={styles.count}>
          {count} {count === 1 ? "item" : "items"}
        </Text>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyBody}>
              Add a frame from a product page to see it here.
            </Text>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Pressable
                  onPress={() =>
                    router.push(`/product/${item.productId}` as Href)
                  }
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.image}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.image} />
                  )}
                </Pressable>
                <View style={styles.meta}>
                  <Text style={styles.brand}>{item.brand}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.option}>{optionLabel(item.option)}</Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>

                  <View style={styles.actions}>
                    <View style={styles.qty}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => setQty(item.id, item.qty - 1)}
                        style={styles.qtyBtn}
                      >
                        <Minus size={14} color={colors.text} strokeWidth={2} />
                      </Pressable>
                      <Text style={styles.qtyValue}>{item.qty}</Text>
                      <Pressable
                        hitSlop={8}
                        onPress={() => setQty(item.id, item.qty + 1)}
                        style={styles.qtyBtn}
                      >
                        <Plus size={14} color={colors.text} strokeWidth={2} />
                      </Pressable>
                    </View>
                    <Pressable hitSlop={8} onPress={() => remove(item.id)}>
                      <Trash2
                        size={16}
                        color={colors.sale}
                        strokeWidth={1.75}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryTotal}>{formatPrice(total)}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  count: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  emptyBody: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  image: {
    width: 84,
    height: 84,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  name: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  option: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textBody,
  },
  price: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  qtyValue: {
    minWidth: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  summary: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textBody,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
});
