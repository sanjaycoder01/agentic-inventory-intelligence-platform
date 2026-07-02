import type { NextFunction, Request, Response } from "express";
import { productService } from "./product.service.js";
import type { CreateProductDTO, UpdateProductDTO } from "./product.types.js";

export class ProductController {
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.createProduct(
        req.body as CreateProductDTO,
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.getProductById(
        req.params.id as string,
      );

      res.json({
        success: true,
        message: "Product retrieved successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  getAllProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await productService.getAllProducts();

      res.json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.updateProduct(
        req.params.id as string,
        req.body as UpdateProductDTO,
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.deleteProduct(
        req.params.id as string,
      );

      res.json({
        success: true,
        message: "Product deactivated successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const productController = new ProductController();
