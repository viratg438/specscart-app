import { Product, ProductSwatch } from "@/types/product";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function imageByType(images: unknown, type: string): string {
  if (!Array.isArray(images)) {
    return "";
  }

  const match = images.find((image) => {
    const typeName = asString(asRecord(image)?.type).toLowerCase();
    return typeName === type.toLowerCase();
  });
  return asString(asRecord(match)?.img_path);
}

function firstAnyImage(images: unknown): string {
  if (!Array.isArray(images)) {
    return "";
  }
  for (const image of images) {
    const record = asRecord(image);
    const type = asString(record?.type).toLowerCase();
    if (type === "glb_image") {
      continue;
    }
    const path = asString(record?.img_path);
    if (path) {
      return path;
    }
  }
  return "";
}

function firstProductImage(images: unknown): string {
  return (
    imageByType(images, "p_img") ||
    imageByType(images, "m_img") ||
    firstAnyImage(images)
  );
}

function galleryImages(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  const rows = images
    .map((image, index) => {
      const record = asRecord(image);
      return {
        path: asString(record?.img_path),
        type: asString(record?.type).toLowerCase(),
        sort: asNumber(record?.sort_order) || index,
      };
    })
    .filter((row) => row.path && row.type === "p_img")
    .sort((left, right) => left.sort - right.sort);

  const seen = new Set<string>();
  const gallery: string[] = [];

  for (const row of rows) {
    if (seen.has(row.path)) {
      continue;
    }
    seen.add(row.path);
    gallery.push(row.path);
  }

  return gallery;
}

function variantColor(variant: Record<string, unknown>): string {
  const info = asRecord(variant.variant_info);
  const colorInfo = asRecord(info?.color);
  return (
    asString(colorInfo?.frame_color) ||
    asString(variant.color) ||
    ""
  );
}

function mapVariant(raw: unknown, index: number): ProductSwatch {
  const variant = asRecord(raw) ?? {};
  const info = asRecord(variant.variant_info) ?? {};
  const price = asNumber(variant.price);
  const special = asNumber(variant.special_price);
  const productImage = firstProductImage(variant.images);
  const swatchImage = imageByType(variant.images, "swatch_image");
  const glb = imageByType(variant.images, "glb_image");
  const gallery = galleryImages(variant.images);
  const color = variantColor(variant);

  return {
    id: asString(variant.id ?? variant.sku) || `variant-${index}`,
    sku: asString(variant.sku),
    image: swatchImage || productImage || undefined,
    productImage: productImage || undefined,
    name: asString(variant.name),
    color: color || undefined,
    brand: asString(info.brand),
    price,
    salePrice: special > 0 && special < price ? special : null,
    gallery: gallery.length > 0 ? gallery : productImage ? [productImage] : [],
    glb: glb || undefined,
  };
}

export function mapBestsellerProduct(raw: unknown, index = 0): Product {
  const item = asRecord(raw) ?? {};
  const variants = Array.isArray(item.variants) ? item.variants : [];

  if (variants.length > 0) {
    const swatches = variants.map(mapVariant);
    const activeSku = asString(item.active_sku);
    const activeIndex = variants.findIndex(
      (variant) => asString(asRecord(variant)?.sku) === activeSku,
    );
    const active = swatches[activeIndex] ?? swatches[0];

    return {
      id: asString(item.id) || `product-${index}`,
      sku: activeSku || active.id,
      urlKey: asString(item.url_key),
      brand: active.brand ?? "",
      name: active.name || asString(item.name),
      price: active.price ?? 0,
      salePrice: active.salePrice ?? null,
      image: active.productImage ?? "",
      gallery: active.gallery ?? [],
      activeSwatchIndex: activeIndex >= 0 ? activeIndex : 0,
      swatches,
    };
  }

  return {
    id: asString(item.id ?? item.sku) || `product-${index}`,
    sku: asString(item.sku),
    urlKey: asString(item.url_key),
    brand: asString(item.brand),
    name: asString(item.name),
    price: asNumber(item.price),
    salePrice: null,
    image: "",
    gallery: [],
    activeSwatchIndex: 0,
    swatches: [],
  };
}
