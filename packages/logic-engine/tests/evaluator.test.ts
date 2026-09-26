import { describe, expect, it } from "vitest";
import { parseFormula } from "../src/parser.js";
import { evaluate, generateCombinations } from "../src/evaluator.js";

function ev(formula: string, assignment: Record<string, boolean>): boolean {
  return evaluate(parseFormula(formula).ast, assignment);
}

describe("evaluate", () => {
  it("evalúa AND / OR / NOT", () => {
    expect(ev("p ∧ q", { p: true, q: true })).toBe(true);
    expect(ev("p ∧ q", { p: true, q: false })).toBe(false);
    expect(ev("p ∨ q", { p: false, q: false })).toBe(false);
    expect(ev("p ∨ q", { p: false, q: true })).toBe(true);
    expect(ev("¬p", { p: true })).toBe(false);
    expect(ev("¬p", { p: false })).toBe(true);
  });

  it("evalúa NAND / NOR / XOR", () => {
    expect(ev("p NAND q", { p: true, q: true })).toBe(false);
    expect(ev("p NAND q", { p: true, q: false })).toBe(true);
    expect(ev("p NOR q", { p: false, q: false })).toBe(true);
    expect(ev("p NOR q", { p: true, q: false })).toBe(false);
    expect(ev("p XOR q", { p: true, q: false })).toBe(true);
    expect(ev("p XOR q", { p: true, q: true })).toBe(false);
  });

  it("evalúa IMPLIES (solo F en V->F) e IFF (V si iguales)", () => {
    expect(ev("p -> q", { p: true, q: false })).toBe(false);
    expect(ev("p -> q", { p: false, q: false })).toBe(true);
    expect(ev("p -> q", { p: false, q: true })).toBe(true);
    expect(ev("p <-> q", { p: true, q: true })).toBe(true);
    expect(ev("p <-> q", { p: true, q: false })).toBe(false);
  });

  it("detecta que (A NAND B) OR (A XOR B) NO es tautología (falla en A=V,B=V)", () => {
    // A=V,B=V: NAND=F, XOR=F, OR=F. El mockup del laboratorio es ilustrativo,
    // el motor dice la verdad: es contingencia, no tautología.
    expect(ev("(A NAND B) OR (A XOR B)", { A: true, B: true })).toBe(false);
    expect(ev("(A NAND B) OR (A XOR B)", { A: true, B: false })).toBe(true);
  });

  it("una tautología real: (A ∧ B) ∨ (A NAND B) siempre es V", () => {
    const combos: Record<string, boolean>[] = [
      { A: false, B: false },
      { A: false, B: true },
      { A: true, B: false },
      { A: true, B: true }
    ];
    for (const c of combos) {
      expect(ev("(A AND B) OR (A NAND B)", c)).toBe(true);
    }
  });

  it("¬(p∨q)^(p∨q) con ^ = AND es contradicción (caso del usuario)", () => {
    const combos: Record<string, boolean>[] = [
      { p: true, q: true },
      { p: true, q: false },
      { p: false, q: true },
      { p: false, q: false }
    ];
    for (const c of combos) {
      expect(ev("¬(p∨q)^(p∨q)", c)).toBe(false);
    }
  });

  it("v minúscula es OR: (p→r) v ¬(p→q) es contingencia con un solo F", () => {
    // Único F en p=V, q=V, r=F.
    expect(ev("(p→r) v ¬(p→q)", { p: true, q: true, r: false })).toBe(false);
    expect(ev("(p→r) v ¬(p→q)", { p: true, q: true, r: true })).toBe(true);
    expect(ev("(p→r) v ¬(p→q)", { p: false, q: false, r: false })).toBe(true);
  });

  it("respeta paréntesis", () => {
    expect(ev("¬(p ∧ q)", { p: true, q: true })).toBe(false);
    expect(ev("¬(p ∧ q)", { p: true, q: false })).toBe(true);
  });
});

describe("generateCombinations", () => {
  it("genera 2^n filas con V primero", () => {
    const combos = generateCombinations(["p", "q"]);
    expect(combos).toHaveLength(4);
    expect(combos[0]).toEqual({ p: true, q: true });
    expect(combos[3]).toEqual({ p: false, q: false });
  });

  it("una variable genera V,F", () => {
    expect(generateCombinations(["A"])).toEqual([{ A: true }, { A: false }]);
  });
});
