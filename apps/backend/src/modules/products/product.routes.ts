import { Router } from "express";
import { productController } from "./product.controller.js";
import {
  validateCreateProduct,
  validateProductIdParam,
  validateUpdateProduct,
} from "./product.validation.js";

export const productRouter = Router();

productRouter.post("/", validateCreateProduct, productController.createProduct);
productRouter.get("/", productController.getAllProducts);
productRouter.get("/:id", validateProductIdParam, productController.getProductById);
productRouter.put("/:id", validateUpdateProduct, productController.updateProduct);
productRouter.delete("/:id", validateProductIdParam, productController.deleteProduct);
