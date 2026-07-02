import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { WAREHOUSE_STATUSES } from "./warehouse.model.js";

const warehouseAddressSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  pincode: z.string().trim().min(1, "Pincode is required"),
});

const warehouseStatusSchema = z.enum(WAREHOUSE_STATUSES, {
  errorMap: () => ({ message: "Invalid warehouse status" }),
});

export const createWarehouseSchema = z.object({
  warehouseCode: z.string().trim().min(1, "Warehouse code is required"),
  name: z.string().trim().min(1, "Warehouse name is required"),
  address: warehouseAddressSchema,
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  storageCapacity: z
    .number()
    .positive("Storage capacity must be greater than 0"),
  status: warehouseStatusSchema.optional(),
});

export const updateWarehouseSchema = z
  .object({
    name: z.string().trim().min(1, "Warehouse name is required").optional(),
    address: warehouseAddressSchema.optional(),
    contactPerson: z.string().trim().min(1, "Contact person is required").optional(),
    contactNumber: z.string().trim().min(1, "Contact number is required").optional(),
    storageCapacity: z
      .number()
      .positive("Storage capacity must be greater than 0")
      .optional(),
    status: warehouseStatusSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required to update",
  });

export const warehouseIdParamSchema = z.object({
  id: z.string().trim().min(1, "Warehouse ID is required"),
});

export type CreateWarehouseDTO = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseDTO = z.infer<typeof updateWarehouseSchema>;

export const validateCreateWarehouse = validate({ body: createWarehouseSchema });
export const validateUpdateWarehouse = validate({
  params: warehouseIdParamSchema,
  body: updateWarehouseSchema,
});
export const validateWarehouseIdParam = validate({
  params: warehouseIdParamSchema,
});
