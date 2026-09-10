// File: HomeScreen.tsx
// Home page — category rail, banner, and bestsellers.

import { ScrollView, StyleSheet } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { colors } from "@/theme";

import { CategoryRail } from "./components/CategoryRail";
import { HomeBanner } from "./components/HomeBanner";
import { BestSellers } from "./components/BestSellers";

export function HomeScreen() {
  return (
    <AppShell title="Home" showBack={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoryRail />
        <HomeBanner />
        <BestSellers />
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
});
