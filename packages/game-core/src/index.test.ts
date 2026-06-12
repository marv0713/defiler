import { describe, expect, it } from "vitest";
import { GAME_CORE_VERSION } from "./index";

describe("game-core package", () => {
  it("exposes the current scaffold version", () => {
    expect(GAME_CORE_VERSION).toBe("0.0.0");
  });
});

