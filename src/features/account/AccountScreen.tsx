// File: AccountScreen.tsx
// Shows logged-in profile, or a guest card that opens login.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { BellRing, SquareText } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { STATIC_URL } from "@/constants/cdn";
import { useAuth } from "@/features/auth/AuthContext";
import { colors, spacing } from "@/theme";

const HERO = STATIC_URL("menu-passion.webp");

export function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <AppShell title="My Account">
      <View style={styles.page}>
        <Text style={styles.subtitle}>My Account</Text>

        {user ? (
          <View style={styles.profile}>
            <Image source={{ uri: HERO }} style={styles.profileImage} />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.profileNotLogin}>
            <View style={styles.profileNotLoginHeader}>
              <Image source={{ uri: HERO }} style={styles.profileImage} />
              <View style={styles.profileNotLoginContent}>
                <Text style={styles.profileName}>Hi Specsy!</Text>
                <Text style={styles.profileDescription}>
                  Login or Signup to track your orders and get access to
                  exclusive deals.
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.profileButtonText}>Login or Signup</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.profileSections}>
          <Pressable
            onPress={() => router.push("/orders")}
            style={styles.profileSection}
          >
            <SquareText size={20} color={colors.text} />
            <Text style={styles.profileSectionTitle} numberOfLines={2}>
              Orders
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/notifications" as Href)}
            style={styles.profileSection}
          >
            <BellRing size={20} color={colors.text} />
            <Text style={styles.profileSectionTitle} numberOfLines={2}>
              Notification
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/wallet" as Href)}
            style={styles.profileSection}
          >
            <MaterialCommunityIcons
              name="wallet-outline"
              size={20}
              color={colors.text}
            />
            <Text style={styles.profileSectionTitle} numberOfLines={2}>
              Wallet
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/gift-card" as Href)}
            style={styles.profileSection}
          >
            <MaterialCommunityIcons
              name="wallet-giftcard"
              size={20}
              color={colors.text}
            />
            <Text style={styles.profileSectionTitle} numberOfLines={2}>
              E-Gift Card
            </Text>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: spacing.sm,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  profileNotLogin: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  profileButton: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  profileButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "500",
  },
  profileNotLoginHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    width: "100%",
  },
  profileNotLoginContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  profileDescription: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "left",
    flexShrink: 1,
    width: "100%",
  },
  profileSections: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  profileSection: {
    flex: 1,
    aspectRatio: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  profileSectionTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
  },
});
