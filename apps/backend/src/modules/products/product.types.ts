import type { ProductDocument } from "./product.model.js";

export interface ProductResponseDTO {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  sellingPrice: number;
  reorderThreshold: number;
  safetyStock: number;
  shelfLifeDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ProductLike = ProductDocument & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export function toProductResponseDTO(product: ProductLike): ProductResponseDTO {
  return {
    id: product._id.toString(),
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    unit: product.unit,
    sellingPrice: product.sellingPrice,
    reorderThreshold: product.reorderThreshold,
    safetyStock: product.safetyStock,
    shelfLifeDays: product.shelfLifeDays,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toProductResponseList(
  products: ProductLike[],
): ProductResponseDTO[] {
  return products.map(toProductResponseDTO);
}
