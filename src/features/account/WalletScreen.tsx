import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { colors, spacing } from "@/theme";

import walletJson from "./wallet.json";

type WalletTx = {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
};

type WalletData = {
  balance: number;
  transactions: WalletTx[];
};

const WALLET = walletJson as WalletData;

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}£${Math.abs(value).toFixed(2)}`;
}

export default function WalletScreen() {
  return (
    <AppShell title="Wallet">
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Wallet</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balance}>£{WALLET.balance.toFixed(2)}</Text>
        </View>

        <Text style={styles.section}>Recent activity</Text>

        {WALLET.transactions.map((tx) => (
          <View key={tx.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.meta}>
                <Text style={styles.title}>{tx.title}</Text>
                <Text style={styles.date}>{formatDate(tx.date)}</Text>
              </View>
              <Text
                style={[
                  styles.amount,
                  tx.type === "credit" ? styles.credit : styles.debit,
                ]}
              >
                {formatMoney(tx.amount)}
              </Text>
            </View>
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
  balanceCard: {
    backgroundColor: colors.brand,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.background,
    opacity: 0.8,
  },
  balance: {
    marginTop: spacing.xs,
    fontSize: 28,
    fontWeight: "700",
    color: colors.background,
  },
  section: {
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
  credit: {
    color: colors.accent,
  },
  debit: {
    color: colors.sale,
  },
});
