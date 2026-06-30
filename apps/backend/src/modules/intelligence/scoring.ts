export interface ScoreInput {
  cartCount: number;
  avgRating: number;
  conversionRate: number;
  availableQuantity: number;
  safetyStock: number;
  category: string;
}

export interface ProductScores {
  demandScore: number;
  ratingScore: number;
  conversionScore: number;
  compositeScore: number;
}

export function calculateDemandScore(cartCount: number, category: string): number {
  const baseline = category === "perishable" ? 5 : 2;
  return Math.min(cartCount / baseline, 1);
}

export function calculateRatingScore(avgRating: number): number {
  return avgRating / 5;
}

export function calculateConversionScore(conversionRate: number): number {
  return Math.min(conversionRate, 1);
}

export function calculateCompositeScore(scores: Omit<ProductScores, "compositeScore">): number {
  return (
    scores.demandScore * 0.4 +
    scores.ratingScore * 0.3 +
    scores.conversionScore * 0.3
  );
}

export function scoreProduct(input: ScoreInput): ProductScores {
  const demandScore = calculateDemandScore(input.cartCount, input.category);
  const ratingScore = calculateRatingScore(input.avgRating);
  const conversionScore = calculateConversionScore(input.conversionRate);
  const compositeScore = calculateCompositeScore({
    demandScore,
    ratingScore,
    conversionScore,
  });

  return { demandScore, ratingScore, conversionScore, compositeScore };
}
