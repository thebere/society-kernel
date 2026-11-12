declare const similaritySymbol: unique symbol;

export type Similarity = number & {
  readonly [similaritySymbol]: true;
};

export function similarity(value: number): Similarity {
  if (Number.isFinite(value) && value >= 0 && value <= 1) {
    return value as Similarity;
  }

  throw new Error('similarity must be a finite number >= 0 and <= 1');
}
