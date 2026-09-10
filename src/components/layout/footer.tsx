// File: footer.tsx
// Bottom tab bar — Home and Account.

import { Href, usePathname, useRouter } from "expo-router";
import { House, User, SquareText } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme";

const TABS: {
  href: Href;
  label: string;
  icon: "home" | "user" | "SquareText";
}[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/orders" as Href, label: "Orders", icon: "SquareText" },
  { href: "/account", label: "Account", icon: "user" },
];

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const color = active ? colors.brand : colors.textMuted;
        const Icon =
          tab.icon === "home"
            ? House
            : tab.icon === "SquareText"
              ? SquareText
              : User;

        return (
          <Pressable
            key={tab.label}
            style={styles.item}
            onPress={() => router.push(tab.href)}
          >
            <Icon size={22} color={color} strokeWidth={1.75} />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  labelActive: {
    color: colors.brand,
    fontWeight: "700",
  },
});
