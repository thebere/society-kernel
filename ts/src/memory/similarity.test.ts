import { describe, expect, test } from "vitest";
import {
  similarity,
} from "./similarity";

describe("similarity", () => {
  test.each([
    0,
    0.25,
    0.5,
    1,
  ])("accepts %s", value => {
    expect(similarity(value)).toBe(value);
  });

  test.each([
    -0.01,
    1.01,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects invalid similarity %s", value => {
    expect(() => similarity(value))
      .toThrow(
        "similarity must be a finite number >= 0 and <= 1",
      );
  });
});