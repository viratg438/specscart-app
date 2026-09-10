// File: HomeBanner.tsx
// Hero banner image block on the home page.

import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { STATIC_URL } from "@/constants/cdn";
import { colors, spacing } from "@/theme";

export function HomeBanner() {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: STATIC_URL("dolceVita/dolce-vita-Homepage-new-web2.webp"),
        }}
        style={styles.banner}
        contentFit="cover"
      />

      <View style={styles.overlay}>
        <Image
          source={{
            uri: STATIC_URL("dolceVita/la-dolce-vita-logo-white.webp"),
          }}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.headline}>
          Explore 2000+ Glasses <br />
          Frame Styles
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    backgroundColor: colors.surface,
    position: "relative",
    overflow: "hidden",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    paddingHorizontal: spacing.lg,
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },
  logo: {
    width: 200,
    height: 50,
  },
  headline: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: "400",
    color: colors.background,
  },
});
