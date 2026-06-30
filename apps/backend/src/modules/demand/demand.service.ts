import { DemandEventModel } from "./demand.model.js";

export class DemandService {
  async recordCartEvent(productId: string, quantity = 1) {
    return DemandEventModel.create({
      productId,
      eventType: "cart",
      quantity,
    });
  }

  async recordOrderEvent(productId: string, quantity: number) {
    return DemandEventModel.create({
      productId,
      eventType: "order",
      quantity,
    });
  }

  async recordRating(productId: string, rating: number) {
    return DemandEventModel.create({
      productId,
      eventType: "rating",
      rating,
    });
  }

  async getCartCount(productId: string, since: Date) {
    return DemandEventModel.countDocuments({
      productId,
      eventType: "cart",
      createdAt: { $gte: since },
    });
  }

  async getConversionRate(productId: string, since: Date) {
    const [carts, orders] = await Promise.all([
      this.getCartCount(productId, since),
      DemandEventModel.countDocuments({
        productId,
        eventType: "order",
        createdAt: { $gte: since },
      }),
    ]);

    return carts === 0 ? 0 : orders / carts;
  }
}

export const demandService = new DemandService();
