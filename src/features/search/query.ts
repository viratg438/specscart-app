import { Product } from "@/types/product";

import { SEARCHABLE_PAGES, SearchPage } from "./pages";

export type ProductHit = {
  key: string;
  product: Product;
  swatchIndex: number;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(query: string) {
  return normalize(query).split(" ").filter(Boolean);
}

function matches(haystack: string, query: string) {
  const words = tokens(query);
  if (words.length === 0) {
    return false;
  }
  const text = normalize(haystack);
  return words.every((word) => text.includes(word));
}

function productFields(product: Product) {
  return [product.name, product.brand, product.sku, product.urlKey];
}

export function searchPages(query: string): SearchPage[] {
  return SEARCHABLE_PAGES.filter((page) =>
    matches([page.title, page.subtitle, ...page.keywords].join(" "), query),
  );
}

export function searchProductHits(
  products: Product[],
  query: string,
): ProductHit[] {
  const hits: ProductHit[] = [];

  for (const product of products) {
    if (product.swatches.length === 0) {
      if (matches(productFields(product).join(" "), query)) {
        hits.push({ key: product.id, product, swatchIndex: 0 });
      }
      continue;
    }

    const parentMatches = matches(productFields(product).join(" "), query);

    product.swatches.forEach((swatch, swatchIndex) => {
      const variantMatches = matches(
        [
          ...productFields(product),
          swatch.name,
          swatch.brand,
          swatch.color,
          swatch.sku,
        ].join(" "),
        query,
      );

      if (parentMatches || variantMatches) {
        hits.push({
          key: `${product.id}-${swatch.id}-${swatchIndex}`,
          product,
          swatchIndex,
        });
      }
    });
  }

  return hits;
}
