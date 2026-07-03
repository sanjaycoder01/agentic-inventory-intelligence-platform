export function happens(probability: number): boolean {
  return Math.random() < clampProbability(probability);
}

export function shouldAddToCart(cartInterestProbability: number): boolean {
  return happens(cartInterestProbability);
}

export function shouldRemoveFromCart(removeCartProbability: number): boolean {
  return happens(removeCartProbability);
}

export function shouldOrder(orderProbability: number): boolean {
  return happens(orderProbability);
}

export function shouldLeaveRating(ratingProbability: number): boolean {
  return happens(ratingProbability);
}

export function weightedPick<T extends { weight: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty weighted list");
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    throw new Error("Weighted list must have a positive total weight");
  }

  let cursor = Math.random() * totalWeight;

  for (const item of items) {
    cursor -= item.weight;

    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

export function pickOne<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function randomInt(min: number, max: number): number {
  const lowerBound = Math.ceil(min);
  const upperBound = Math.floor(max);

  return Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
}

export function ratingAroundAverage(averageRating: number): number {
  const variance = randomNormal() * 0.75;
  const rating = clamp(Math.round(averageRating + variance), 1, 5);

  return rating;
}

export function blendProbabilities(
  scenarioProbability: number,
  customerProbability: number,
): number {
  return clampProbability((scenarioProbability + customerProbability) / 2);
}

function clampProbability(probability: number): number {
  return clamp(probability, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomNormal(): number {
  const first = Math.max(Math.random(), Number.EPSILON);
  const second = Math.random();

  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}
