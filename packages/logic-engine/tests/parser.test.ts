import { describe, expect, it } from "vitest";
import { parseFormula, nodeToString } from "../src/parser.js";
import { FormulaError } from "../src/types.js";

describe("parseFormula", () => {
  it("parsea variables simples", () => {
    const r = parseFormula("p");
    expect(r.variables).toEqual(["p"]);
    expect(r.ast).toEqual({ kind: "var", name: "p" });
  });

  it("acepta mayúsculas y multi-letra (A, B, OUT)", () => {
    const r = parseFormula("A ∧ B");
    expect(r.variables).toEqual(["A", "B"]);
  });

  it("respeta precedencia: AND antes que OR", () => {
    // p OR q AND r = p OR (q AND r)
    const r = parseFormula("p OR q AND r");
    expect(nodeToString(r.ast)).toBe("p ∨ q ∧ r");
    expect(r.ast.kind).toBe("binary");
    if (r.ast.kind === "binary") {
      expect(r.ast.op).toBe("OR");
      expect(r.ast.right.kind).toBe("binary");
    }
  });

  it("NOT tiene máxima precedencia", () => {
    const r = parseFormula("¬p ∧ q");
    expect(nodeToString(r.ast)).toBe("¬p ∧ q");
  });

  it("IMPLIES es asociativo a la derecha", () => {
    const r = parseFormula("p -> q -> r");
    // p -> (q -> r)
    expect(r.ast.kind).toBe("binary");
    if (r.ast.kind === "binary") {
      expect(r.ast.op).toBe("IMPLIES");
      expect(r.ast.right.kind).toBe("binary");
    }
  });

  it("acepta sintaxis ascii y unicode mezclada", () => {
    const a = parseFormula("p && q || !r");
    const b = parseFormula("p ∧ q ∨ ¬r");
    expect(nodeToString(a.ast)).toBe(nodeToString(b.ast));
  });

  it("acepta ->, =>, <-> y palabras AND OR NOT XOR NAND NOR", () => {
    expect(parseFormula("p -> q").ast.kind).toBe("binary");
    expect(parseFormula("p => q").ast.kind).toBe("binary");
    expect(parseFormula("p <-> q").ast.kind).toBe("binary");
    expect(parseFormula("p NAND q").variables).toEqual(["p", "q"]);
    expect(parseFormula("p NOR q").variables).toEqual(["p", "q"]);
    expect(parseFormula("p XOR q").variables).toEqual(["p", "q"]);
  });

  it("ordena variables para columnas estables", () => {
    const r = parseFormula("q ∧ p ∧ r");
    expect(r.variables).toEqual(["p", "q", "r"]);
  });

  it("lanza error con posición en fórmula vacía", () => {
    expect(() => parseFormula("   ")).toThrow(FormulaError);
  });

  it("lanza error si falta cerrar paréntesis", () => {
    expect(() => parseFormula("(p ∧ q")).toThrow(/cerrar/i);
  });

  it("lanza error ante operador duplicado", () => {
    expect(() => parseFormula("p ∧ ∧ q")).toThrow(FormulaError);
  });

  it("limita a 6 variables por legibilidad", () => {
    expect(() => parseFormula("a ∧ b ∧ c ∧ d ∧ e ∧ f ∧ g")).toThrow(/Demasiadas variables/);
  });

  it("normaliza a símbolos canónicos", () => {
    const r = parseFormula("p AND NOT q");
    expect(r.normalized).toBe("p ∧ ¬q");
  });
});
