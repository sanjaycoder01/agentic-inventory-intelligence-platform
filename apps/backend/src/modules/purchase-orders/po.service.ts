import { PurchaseOrderModel } from "./po.model.js";

export class PurchaseOrderService {
  async list(status?: string) {
    const filter = status ? { status } : {};
    return PurchaseOrderModel.find(filter).sort({ createdAt: -1 });
  }

  async create(data: {
    productId: string;
    productName: string;
    quantity: number;
    reason?: string;
  }) {
    return PurchaseOrderModel.create(data);
  }

  async approve(id: string, approvedBy: string) {
    return PurchaseOrderModel.findByIdAndUpdate(
      id,
      { status: "approved", approvedBy },
      { new: true },
    );
  }

  async reject(id: string, approvedBy: string) {
    return PurchaseOrderModel.findByIdAndUpdate(
      id,
      { status: "rejected", approvedBy },
      { new: true },
    );
  }
}

export const purchaseOrderService = new PurchaseOrderService();
