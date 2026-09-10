import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell } from "@/components/layout/app-shell";
import { colors, spacing } from "@/theme";

import ordersJson from "./orders.json";

type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

type OrderItem = {
  name: string;
  qty: number;
};

type Order = {
  id: string;
  placedAt: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
};

const ORDERS = ordersJson as Order[];

const STATUS_FILTERS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusColor(status: OrderStatus) {
  if (status === "Delivered") return colors.accent;
  if (status === "Cancelled") return colors.sale;
  if (status === "Shipped") return colors.brand;
  return colors.textBody;
}

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const visibleOrders = useMemo(() => {
    const filtered =
      statusFilter === "All"
        ? ORDERS
        : ORDERS.filter((order) => order.status === statusFilter);

    return [...filtered].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
    );
  }, [statusFilter]);

  return (
    <AppShell title="Orders">
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Orders</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setStatusFilter(filter)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.count}>
          {visibleOrders.length} {visibleOrders.length === 1 ? "order" : "orders"}
        </Text>

        {visibleOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No orders in this filter</Text>
            <Text style={styles.emptyBody}>Try another status to see your history.</Text>
          </View>
        ) : (
          visibleOrders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.date}>{formatDate(order.placedAt)}</Text>
                </View>
                <Text style={[styles.status, { color: statusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>

              <View style={styles.items}>
                {order.items.map((item) => (
                  <Text key={`${order.id}-${item.name}`} style={styles.item}>
                    {item.qty} × {item.name}
                  </Text>
                ))}
              </View>

              <Text style={styles.total}>£{order.total.toFixed(2)}</Text>
            </View>
          ))
        )}
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
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  chipTextActive: {
    color: colors.background,
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
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  items: {
    gap: 4,
  },
  item: {
    fontSize: 14,
    color: colors.textBody,
  },
  total: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  empty: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  emptyBody: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
});
