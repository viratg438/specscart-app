// File: header.tsx
// Top bar with menu, logo, wishlist, cart, and search.

import { Href, useRouter } from "expo-router";
import { Heart, Menu, Mic, Search, ShoppingCart, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { PageBackButton } from "@/components/layout/PageBackBar";
import { useCart } from "@/features/cart/CartContext";
import { useWishlist } from "@/features/wishlist/WishlistContext";
import { colors, spacing } from "@/theme";

type Props = {
  onMenuPress: () => void;
  showBack?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  listening: boolean;
  onMicPress: () => void;
};

export function Header({
  onMenuPress,
  showBack = false,
  query,
  onQueryChange,
  listening,
  onMicPress,
}: Props) {
  const router = useRouter();
  const { count } = useWishlist();
  const { count: cartCount } = useCart();
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable hitSlop={12} style={styles.sideSlot} onPress={onMenuPress}>
          <Menu size={24} color={colors.text} strokeWidth={1.75} />
        </Pressable>

        <Text style={styles.logo}>Specscart.</Text>

        <View style={styles.rightIcons}>
          <Pressable hitSlop={8} style={styles.iconButton}>
            <Heart size={22} color={colors.text} strokeWidth={1.75} />
            {count > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            hitSlop={8}
            style={styles.iconButton}
            onPress={() => router.push("/cart" as Href)}
          >
            <ShoppingCart size={22} color={colors.text} strokeWidth={1.75} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        {showBack ? <PageBackButton /> : null}
        <View style={styles.search}>
          <Search size={15} color={colors.textMuted} strokeWidth={1.75} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder={
              listening ? "Listening…" : "Search frames, brands and styles"
            }
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable hitSlop={8} onPress={() => onQueryChange("")}>
              <X size={15} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          ) : null}
          <Pressable hitSlop={8} onPress={onMicPress}>
            <Mic
              size={16}
              color={listening ? colors.sale : colors.text}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 30,
  },
  sideSlot: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logo: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "700",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  iconButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.sale,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: "700",
  },
  searchRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 40,
    paddingHorizontal: spacing.lg,
    height: 40,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    paddingVertical: 0,
    height: "100%",
    width: "100%",
    outlineStyle: "solid",
    outlineWidth: 0,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
    textAlign: "left",
    textAlignVertical: "center",
  },
});
