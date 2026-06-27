import { describe, expect, test } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  test("returns a translation by id and language", () => {
    expect(translate("en", "start.quickBattle")).toBe("Quick Battle");
    expect(translate("zh", "start.quickBattle")).toBe("快速战斗");
  });

  test("interpolates variables", () => {
    expect(translate("en", "game.round", { round: 2 })).toBe("Small Round 2 / 3");
    expect(translate("zh", "game.round", { round: 2 })).toBe("第 2 / 3 小局");
  });

  test("falls back to English when language entry is missing", () => {
    expect(translate("zh", "debug.missingInZh")).toBe("Debug fallback");
  });

  test("falls back to id when all entries are missing", () => {
    expect(translate("en", "missing.id")).toBe("missing.id");
  });
});
