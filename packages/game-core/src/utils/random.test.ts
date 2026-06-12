import { describe, expect, it } from "vitest";
import { createSeededRandom, shuffleWithSeed } from "../index";

describe("seeded random utilities", () => {
  it("produces the same sequence for the same seed", () => {
    const first = createSeededRandom("battle-seed");
    const second = createSeededRandom("battle-seed");

    expect([first(), first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
      second(),
    ]);
  });

  it("keeps generated values in the Math.random compatible range", () => {
    const random = createSeededRandom("range-seed");

    const values = Array.from({ length: 20 }, () => random());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("shuffles deterministically without mutating the input array", () => {
    const cards = ["qin-1", "chu-1", "qi-1", "zhao-1", "neutral-1"];
    const original = [...cards];

    const firstShuffle = shuffleWithSeed(cards, "shuffle-seed");
    const secondShuffle = shuffleWithSeed(cards, "shuffle-seed");

    expect(firstShuffle).toEqual(secondShuffle);
    expect(firstShuffle).not.toEqual(original);
    expect(cards).toEqual(original);
  });

  it("usually produces different shuffles for different seeds", () => {
    const cards = ["qin-1", "chu-1", "qi-1", "zhao-1", "neutral-1"];

    expect(shuffleWithSeed(cards, "seed-a")).not.toEqual(
      shuffleWithSeed(cards, "seed-b"),
    );
  });
});
