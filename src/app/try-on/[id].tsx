// File: [id].tsx
// Expo route /try-on/[id] — opens the same try-on modal used from listings.

import { router, useLocalSearchParams } from "expo-router";

import { VirtualTryOnScreen } from "@/features/try-on/VirtualTryOnScreen";

export default function TryOnPage() {
  const params = useLocalSearchParams<{ id: string; swatch?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const swatchRaw = Number(
    Array.isArray(params.swatch) ? params.swatch[0] : params.swatch,
  );

  return (
    <VirtualTryOnScreen
      visible
      productId={id ?? ""}
      swatchIndex={Number.isFinite(swatchRaw) ? swatchRaw : 0}
      onClose={() =>
        router.canGoBack() ? router.back() : router.replace("/home")
      }
    />
  );
}
