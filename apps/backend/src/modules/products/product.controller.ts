import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { sendSuccess } from "../../utils/response.js";
import { PRODUCT_MESSAGES } from "./product.constants.js";
import { productService } from "./product.service.js";
import type { CreateProductDTO, UpdateProductDTO } from "./product.validation.js";

export class ProductController {
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body as CreateProductDTO);

    sendSuccess(res, 201, PRODUCT_MESSAGES.CREATED, product);
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id);

    sendSuccess(res, 200, PRODUCT_MESSAGES.RETRIEVED, product);
  });

  getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
    const products = await productService.getAllProducts();

    sendSuccess(res, 200, PRODUCT_MESSAGES.RETRIEVED_ALL, products);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.updateProduct(
      req.params.id,
      req.body as UpdateProductDTO,
    );

    sendSuccess(res, 200, PRODUCT_MESSAGES.UPDATED, product);
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.deleteProduct(req.params.id);

    sendSuccess(res, 200, PRODUCT_MESSAGES.DEACTIVATED, product);
  });
}

export const productController = new ProductController();
