// File: [id].tsx
// Expo route /product/[id] — reads the id and renders ProductDetailScreen.

import { useLocalSearchParams } from "expo-router";

import { ProductDetailScreen } from "@/features/product/ProductDetailScreen";

export default function ProductPage() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <ProductDetailScreen id={id ?? ""} />;
}
