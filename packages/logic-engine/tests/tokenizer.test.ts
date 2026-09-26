import { describe, expect, it } from "vitest";
import { tokenize } from "../src/tokenizer.js";
import { FormulaError } from "../src/types.js";

describe("tokenize", () => {
  it("tokeniza unicode y ascii", () => {
    expect(tokenize("p ∧ q").map((t) => t.kind)).toEqual(["var", "and", "var"]);
    expect(tokenize("p && q").map((t) => t.kind)).toEqual(["var", "and", "var"]);
    expect(tokenize("p ^ q").map((t) => t.kind)).toEqual(["var", "and", "var"]);
    expect(tokenize("p ⊕ q").map((t) => t.kind)).toEqual(["var", "xor", "var"]);
    expect(tokenize("p XOR q").map((t) => t.kind)).toEqual(["var", "xor", "var"]);
    expect(tokenize("p || q").map((t) => t.kind)).toEqual(["var", "or", "var"]);
    expect(tokenize("!p").map((t) => t.kind)).toEqual(["not", "var"]);
    expect(tokenize("p -> q").map((t) => t.kind)).toEqual(["var", "implies", "var"]);
    expect(tokenize("p <-> q").map((t) => t.kind)).toEqual(["var", "iff", "var"]);
  });

  it("keywords insensibles a mayúsculas", () => {
    expect(tokenize("p and q").map((t) => t.kind)).toEqual(["var", "and", "var"]);
    expect(tokenize("P AND Q").map((t) => t.kind)).toEqual(["var", "and", "var"]);
  });

  it("constantes V/F/1/0", () => {
    const kinds = tokenize("V F 1 0").map((t) => [t.kind, t.value]);
    expect(kinds).toEqual([
      ["const", true],
      ["const", false],
      ["const", true],
      ["const", false]
    ]);
  });

  it("f minúscula es variable, F mayúscula es constante", () => {
    expect(tokenize("f").map((t) => t.kind)).toEqual(["var"]);
    expect(tokenize("F").map((t) => [t.kind, t.value])).toEqual([["const", false]]);
  });

  it("v minúscula aislada es OR (alias de apuntes)", () => {
    expect(tokenize("p v q").map((t) => t.kind)).toEqual(["var", "or", "var"]);
    expect(tokenize("p OR q").map((t) => t.kind)).toEqual(["var", "or", "var"]);
  });

  it("error con posición ante carácter inválido", () => {
    try {
      tokenize("p $ q");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(FormulaError);
      expect((e as FormulaError).position).toBe(2);
    }
  });

  it("sugiere <-> ante <", () => {
    expect(() => tokenize("p < q")).toThrow(/<->/);
  });
});
