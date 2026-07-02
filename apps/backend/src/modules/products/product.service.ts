import { ConflictError, NotFoundError } from "../../middleware/app-errors.js";
import { logger } from "../../utils/logger.js";
import { ProductModel } from "./product.model.js";
import { PRODUCT_ERRORS, PRODUCT_LOG } from "./product.constants.js";
import {
  toProductResponseDTO,
  toProductResponseList,
  type ProductResponseDTO,
} from "./product.types.js";
import type { CreateProductDTO, UpdateProductDTO } from "./product.validation.js";

export class ProductService {
  async createProduct(data: CreateProductDTO): Promise<ProductResponseDTO> {
    logger.info(PRODUCT_LOG.CREATING, { sku: data.sku });

    const existing = await ProductModel.findOne({ sku: data.sku });
    if (existing) {
      throw new ConflictError(PRODUCT_ERRORS.ALREADY_EXISTS(data.sku));
    }

    const product = await ProductModel.create(data);

    logger.info(PRODUCT_LOG.CREATED, { productId: product._id.toString(), sku: data.sku });

    return toProductResponseDTO(product);
  }

  async getProductById(id: string): Promise<ProductResponseDTO> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundError(PRODUCT_ERRORS.NOT_FOUND(id));
    }

    return toProductResponseDTO(product);
  }

  async getAllProducts(): Promise<ProductResponseDTO[]> {
    const products = await ProductModel.find({ isActive: true }).sort({ name: 1 });
    return toProductResponseList(products);
  }

  async updateProduct(
    id: string,
    data: UpdateProductDTO,
  ): Promise<ProductResponseDTO> {
    logger.info(PRODUCT_LOG.UPDATING, { productId: id });

    const product = await ProductModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new NotFoundError(PRODUCT_ERRORS.NOT_FOUND(id));
    }

    logger.info(PRODUCT_LOG.UPDATED, { productId: id });

    return toProductResponseDTO(product);
  }

  async deleteProduct(id: string): Promise<ProductResponseDTO> {
    logger.info(PRODUCT_LOG.DEACTIVATING, { productId: id });

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      throw new NotFoundError(PRODUCT_ERRORS.NOT_FOUND(id));
    }

    logger.info(PRODUCT_LOG.DEACTIVATED, { productId: id });

    return toProductResponseDTO(product);
  }
}

export const productService = new ProductService();
