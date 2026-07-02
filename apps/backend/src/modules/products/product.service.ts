import { AppError } from "../../middleware/error-handler.js";
import { ProductModel } from "./product.model.js";
import type { CreateProductDTO, UpdateProductDTO } from "./product.types.js";

export class ProductService {
  async createProduct(data: CreateProductDTO) {
    const existing = await ProductModel.findOne({ sku: data.sku });
    if (existing) {
      throw new AppError(409, `Product with SKU ${data.sku} already exists`);
    }

    return ProductModel.create(data);
  }

  async getProductById(id: string) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new AppError(404, `Product ${id} not found`);
    }

    return product;
  }

  async getAllProducts() {
    return ProductModel.find({ isActive: true }).sort({ name: 1 });
  }

  async updateProduct(id: string, data: UpdateProductDTO) {
    const updates: UpdateProductDTO = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.brand !== undefined) updates.brand = data.brand;
    if (data.sellingPrice !== undefined) updates.sellingPrice = data.sellingPrice;

    const product = await ProductModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new AppError(404, `Product ${id} not found`);
    }

    return product;
  }

  async deleteProduct(id: string) {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      throw new AppError(404, `Product ${id} not found`);
    }

    return product;
  }
}

export const productService = new ProductService();
