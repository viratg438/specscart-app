// File: PageBackBar.tsx
// Shared back icon — returns to the previous screen.

import { usePathname, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme";

export function PageBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Pressable
      hitSlop={10}
      style={styles.button}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        if (pathname !== "/home") {
          router.replace("/home");
        }
      }}
    >
      <ChevronLeft size={22} color={colors.text} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
