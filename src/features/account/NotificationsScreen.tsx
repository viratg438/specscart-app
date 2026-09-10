import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { colors, spacing } from "@/theme";

import notificationsJson from "./notifications.json";

type Notification = {
  id: string;
  title: string;
  body: string;
  date: string;
  unread: boolean;
};

const NOTIFICATIONS = notificationsJson as Notification[];

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationsScreen() {
  const unread = NOTIFICATIONS.filter((item) => item.unread).length;

  return (
    <AppShell title="Notification">
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Notification</Text>
        <Text style={styles.count}>
          {unread} unread · {NOTIFICATIONS.length} total
        </Text>

        {NOTIFICATIONS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.title}</Text>
              {item.unread ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            <Text style={styles.body}>{item.body}</Text>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  body: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 20,
  },
});
