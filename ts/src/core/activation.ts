// activation.ts

export const ACTIVATION_RANGE = [0, 1] as const;

declare const activationSymbol: unique symbol;

export function activation(activation?: number | null) {
  if (typeof activation === "number" && (activation >= ACTIVATION_RANGE[0] && activation <= ACTIVATION_RANGE[1])) {
    return activation as number & {
      readonly [activationSymbol]: true,
    };
  }

  throw new Error("activation must be a number >= 0 and <= 1");
}


export type Activation = ReturnType<typeof activation>
