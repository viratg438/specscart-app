// File: app-shell.tsx
// Shared page frame — header, content, footer, and menu drawer.

import { ReactNode, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MenuDrawer } from "@/features/menu/MenuDrawer";
import { SearchPanel } from "@/features/search/SearchPanel";
import { useVoiceSearch } from "@/features/search/useVoiceSearch";
import { colors, layout } from "@/theme";

type Props = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
};

export function AppShell({ children, showBack = true }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { listening, error, toggle } = useVoiceSearch(setQuery);
  const searching = query.trim().length > 0 || listening || Boolean(error);

  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <SafeAreaView edges={["top"]} style={styles.bar}>
          <Header
            onMenuPress={() => setMenuOpen(true)}
            showBack={showBack}
            query={query}
            onQueryChange={setQuery}
            listening={listening}
            onMicPress={toggle}
          />
        </SafeAreaView>

        <View style={styles.content}>
          {searching ? (
            <SearchPanel
              query={query}
              listening={listening}
              error={error}
              onNavigate={() => setQuery("")}
            />
          ) : (
            children
          )}
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.bar}>
          <Footer />
        </SafeAreaView>

        <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      Platform.OS === "web" ? colors.webCanvas : colors.background,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? layout.phoneWidth : undefined,
    backgroundColor: colors.background,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      default: {},
    }),
  },
  bar: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
