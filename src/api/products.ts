import { endpoints } from "@/api/config";
import { getJson } from "@/api/http";
import { mapBestsellerProduct } from "@/api/map-product";
import { unwrapProduct, unwrapProductList } from "@/api/parse-response";
import { BestsellerCategory, Product } from "@/types/product";

import glassesFallback from "./fallbacks/bestsellers-glasses.json";
import glassesListingFallback from "./fallbacks/glasses-listing.json";
import sunglassesFallback from "./fallbacks/bestsellers-sunglasses.json";
import sunglassesListingFallback from "./fallbacks/sunglasses-listing.json";

const FALLBACK_RAW: Record<BestsellerCategory, unknown[]> = {
  glasses: glassesFallback,
  sunglasses: sunglassesFallback,
};

const LISTING_FALLBACK: Record<BestsellerCategory, unknown> = {
  glasses: glassesListingFallback,
  sunglasses: sunglassesListingFallback,
};

const LISTING_CATEGORIES: BestsellerCategory[] = ["glasses", "sunglasses"];

function mapProducts(rawList: unknown[]): Product[] {
  return rawList
    .map(mapBestsellerProduct)
    .filter((item) => Boolean(item.name));
}

export function getFallbackBestsellers(category: BestsellerCategory): Product[] {
  return mapProducts(FALLBACK_RAW[category]);
}

export function getFallbackCategoryListing(
  category: BestsellerCategory,
): Product[] {
  return mapProducts(unwrapProductList(LISTING_FALLBACK[category]));
}

export async function fetchCategoryListing(
  category: BestsellerCategory,
): Promise<Product[]> {
  const fallback = getFallbackCategoryListing(category);
  const data = await getJson(endpoints.categoryListing(category));
  const mapped = mapProducts(unwrapProductList(data));
  return mapped.length > 0 ? mapped : fallback;
}

export async function fetchBestsellers(
  category: BestsellerCategory,
): Promise<Product[]> {
  const fallback = getFallbackBestsellers(category);
  const data = await getJson(endpoints.bestsellers(category));
  const mapped = mapProducts(unwrapProductList(data));
  return mapped.length > 0 ? mapped : fallback;
}

export function getFallbackProduct(id: string): Product | undefined {
  for (const category of LISTING_CATEGORIES) {
    const listingMatch = getFallbackCategoryListing(category).find(
      (item) => item.id === id,
    );
    if (listingMatch) {
      return listingMatch;
    }

    const bestsellerMatch = getFallbackBestsellers(category).find(
      (item) => item.id === id,
    );
    if (bestsellerMatch) {
      return bestsellerMatch;
    }
  }
  return undefined;
}

async function fetchProductFromDetailApi(id: string): Promise<Product | undefined> {
  const data = await getJson(endpoints.productById(id));
  const raw = unwrapProduct(data);
  if (!raw) {
    return undefined;
  }

  const product = mapBestsellerProduct(raw);
  return product.name ? product : undefined;
}

async function fetchProductFromListings(id: string): Promise<Product | undefined> {
  const lists = await Promise.all(
    LISTING_CATEGORIES.map((category) => fetchCategoryListing(category)),
  );
  return lists.flat().find((item) => item.id === id);
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  const unique: Product[] = [];
  for (const product of products) {
    if (seen.has(product.id)) {
      continue;
    }
    seen.add(product.id);
    unique.push(product);
  }
  return unique;
}

export function getAllFallbackProducts(): Product[] {
  return dedupeProducts(
    LISTING_CATEGORIES.flatMap((category) => [
      ...getFallbackCategoryListing(category),
      ...getFallbackBestsellers(category),
    ]),
  );
}

export async function fetchAllProducts(): Promise<Product[]> {
  const lists = await Promise.all(
    LISTING_CATEGORIES.map((category) => fetchCategoryListing(category)),
  );
  const merged = dedupeProducts([
    ...lists.flat(),
    ...getAllFallbackProducts(),
  ]);
  return merged.length > 0 ? merged : getAllFallbackProducts();
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  const fromDetail = await fetchProductFromDetailApi(id);
  if (fromDetail) {
    return fromDetail;
  }

  return (await fetchProductFromListings(id)) ?? getFallbackProduct(id);
}
