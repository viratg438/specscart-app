export type BestsellerCategory = "glasses" | "sunglasses";

export type ProductSwatch = {
  id: string;
  hex?: string;
  image?: string;
  productImage?: string;
  name?: string;
  color?: string;
  brand?: string;
  sku?: string;
  price?: number;
  salePrice?: number | null;
  gallery?: string[];
  glb?: string;
};

export type Product = {
  id: string;
  sku: string;
  urlKey?: string;
  brand: string;
  name: string;
  price: number;
  salePrice?: number | null;
  image: string;
  gallery: string[];
  activeSwatchIndex?: number;
  swatches: ProductSwatch[];
};
