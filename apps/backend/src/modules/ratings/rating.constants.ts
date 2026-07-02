export const RATING_MESSAGES = {
  SUBMITTED: "Rating submitted successfully",
  RATINGS_RETRIEVED: "Ratings retrieved successfully",
  SCORE_RETRIEVED: "Rating score retrieved successfully",
  TOP_RATED_RETRIEVED: "Top rated products retrieved successfully",
} as const;

export const RATING_ERRORS = {
  PRODUCT_NOT_FOUND: (productId: string) => `Product ${productId} not found`,
  DARK_STORE_NOT_FOUND: (darkStoreId: string) =>
    `Dark store ${darkStoreId} not found`,
  ORDER_NOT_FOUND: (orderId: string) => `Order ${orderId} not found`,
  ORDER_ALREADY_RATED: (orderId: string) =>
    `Order ${orderId} already has a rating`,
  ORDER_PRODUCT_MISMATCH: "Order does not match the rated product",
  ORDER_DARK_STORE_MISMATCH: "Order does not match the rated dark store",
} as const;

export const RATING_LOG = {
  SUBMITTING: "Submitting product rating",
  SUBMITTED: "Product rating submitted",
  AGGREGATE_UPDATED: "Product rating aggregate updated",
} as const;

export const MAX_RATING = 5;
