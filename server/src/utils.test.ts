import { describe, expect, it } from "vitest";
import { slugify } from "./utils.js";

describe("slugify", () => {
  it("creates stable URL slugs", () => {
    expect(slugify("  Shree Ji Library  ")).toBe("shree-ji-library");
  });
});
