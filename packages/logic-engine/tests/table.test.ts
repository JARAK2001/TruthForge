import { describe, expect, it } from "vitest";
import { buildTruthTable } from "../src/table.js";
import { explainRow, getGuidedPlan } from "../src/explainer.js";
import { validateCell, scoreTable, equivalentTables } from "../src/validator.js";
import { classify } from "../src/classifier.js";

describe("buildTruthTable", () => {
  it("construye columnas variables + intermedias + resultado en orden pedagógico", () => {
    const t = buildTruthTable("p ∧ q ∨ r");
    // vars p,q,r + (p∧q) + resultado
    expect(t.variables).toEqual(["p", "q", "r"]);
    expect(t.columns.map((c) => c.kind)).toEqual([
      "variable",
      "variable",
      "variable",
      "intermediate",
      "result"
    ]);
    expect(t.rows).toHaveLength(8);
  });

  it("p ∧ q tiene 4 filas y resultado correcto", () => {
    const t = buildTruthTable("p ∧ q");
    const resultIdx = t.columns.length - 1;
    // Orden V,V primero: [V,V]=V, [V,F]=F, [F,V]=F, [F,F]=F
    expect(t.rows[0]?.assignment).toEqual({ p: true, q: true });
    expect(t.rows.map((r) => r.values[resultIdx])).toEqual([true, false, false, false]);
  });

  it("dedup sub-expresiones repetidas", () => {
    const t = buildTruthTable("(p ∧ q) ∨ (p ∧ q)");
    const labels = t.columns.map((c) => c.label);
    expect(labels.filter((l) => l === "p ∧ q")).toHaveLength(1);
  });
});

describe("explainer (laboratorio, no calculadora)", () => {
  it("explica cada paso en español con el porqué", () => {
    const t = buildTruthTable("p ∧ q");
    const steps = explainRow(t, 1); // fila V,F
    expect(steps).toHaveLength(1);
    expect(steps[0]?.reason).toMatch(/conjunción|AND|ambos/i);
    expect(steps[0]?.result).toBe(false);
  });

  it("el plan guiado ilumina una columna a la vez", () => {
    const t = buildTruthTable("p ∧ q ∨ r");
    const plan = getGuidedPlan(t);
    expect(plan).toHaveLength(2);
    expect(plan[0]?.step).toBe(1);
    expect(plan[0]?.hint.length).toBeGreaterThan(0);
    expect(plan[1]?.columnId).toBe("result");
  });
});

describe("validator", () => {
  it("validateCell da feedback sin regalar toda la tabla", () => {
    const t = buildTruthTable("p ∧ q");
    const ok = validateCell(t, 0, "result", true);
    expect(ok.correct).toBe(true);
    const bad = validateCell(t, 0, "result", false);
    expect(bad.correct).toBe(false);
    expect(bad.expected).toBe(true);
    expect(bad.reason).toMatch(/conjunción/i);
  });

  it("scoreTable calcula precisión para Retos", () => {
    const t = buildTruthTable("p ∧ q");
    const answers = t.rows.map((r) => r.values.slice());
    expect(scoreTable(t, answers).accuracy).toBe(1);
    const wrong = t.rows.map((r) => r.values.map((v) => !v));
    expect(scoreTable(t, wrong).accuracy).toBe(0);
  });

  it("equivalentTables detecta fórmulas equivalentes (De Morgan)", () => {
    const a = buildTruthTable("¬(p ∧ q)");
    const b = buildTruthTable("¬p ∨ ¬q");
    expect(equivalentTables(a, b)).toBe(true);
    const c = buildTruthTable("p ∧ q");
    expect(equivalentTables(a, c)).toBe(false);
  });
});

describe("classify", () => {
  it("detecta tautología, contradicción y contingencia", () => {
    expect(classify(buildTruthTable("p ∨ ¬p")).class).toBe("tautology");
    expect(classify(buildTruthTable("p ∧ ¬p")).class).toBe("contradiction");
    expect(classify(buildTruthTable("p ∧ q")).class).toBe("contingency");
  });
});
