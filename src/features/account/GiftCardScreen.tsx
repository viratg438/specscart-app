import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { colors, spacing } from "@/theme";

import giftCardsJson from "./gift-cards.json";

type GiftCardStatus = "Active" | "Used";

type GiftCard = {
  id: string;
  code: string;
  from: string;
  balance: number;
  original: number;
  expiresAt: string;
  status: GiftCardStatus;
};

const GIFT_CARDS = giftCardsJson as GiftCard[];

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GiftCardScreen() {
  const active = GIFT_CARDS.filter((card) => card.status === "Active").length;

  return (
    <AppShell title="E-Gift Card">
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>E-Gift Card</Text>
        <Text style={styles.count}>
          {active} active · {GIFT_CARDS.length} total
        </Text>

        {GIFT_CARDS.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.code}>{card.code}</Text>
              <Text
                style={[
                  styles.status,
                  card.status === "Used" ? styles.used : styles.active,
                ]}
              >
                {card.status}
              </Text>
            </View>
            <Text style={styles.from}>From {card.from}</Text>
            <Text style={styles.balance}>
              £{card.balance.toFixed(2)}{" "}
              <Text style={styles.original}>of £{card.original.toFixed(2)}</Text>
            </Text>
            <Text style={styles.expiry}>Expires {formatDate(card.expiresAt)}</Text>
          </View>
        ))}
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
  card: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  code: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  active: {
    color: colors.accent,
  },
  used: {
    color: colors.textMuted,
  },
  from: {
    fontSize: 13,
    color: colors.textBody,
  },
  balance: {
    marginTop: spacing.xs,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  original: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  expiry: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
