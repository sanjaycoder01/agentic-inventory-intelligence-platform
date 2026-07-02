import type { ProductDocument } from "./product.model.js";

export interface CreateProductDTO {
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  sellingPrice: number;
  reorderThreshold: number;
  safetyStock: number;
  shelfLifeDays?: number;
}

export interface UpdateProductDTO {
  name?: string;
  category?: string;
  brand?: string;
  sellingPrice?: number;
}

export type ProductResponse = ProductDocument & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};
