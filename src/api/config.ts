export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);

/**
 * Change only these paths when backend routes change.
 * Base host stays in .env as EXPO_PUBLIC_API_URL.
 */
export const endpoints = {
  bestsellers: (category: string) => `/products/bestseller/${category}`,
  categoryListing: (category: string) => `/products?category=${category}`,
  productById: (id: string) => `/products/${id}`,
} as const;
