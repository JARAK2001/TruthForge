import type { FormulaClass, TruthTable } from "./types.js";

export interface Classification {
  class: FormulaClass;
  labelEs: string;
  detail: string;
  trueCount: number;
  falseCount: number;
}

/** Clasifica la fórmula: tautología, contradicción o contingencia. */
export function classify(table: TruthTable): Classification {
  const last = table.columns.length - 1;
  let trueCount = 0;
  for (const row of table.rows) {
    if (row.values[last]) trueCount += 1;
  }
  const falseCount = table.rows.length - trueCount;

  if (trueCount === table.rows.length) {
    return {
      class: "tautology",
      labelEs: "Tautología",
      detail: `Siempre es V (${trueCount}/${table.rows.length} filas). Ejemplo clásico: p ∨ ¬p.`,
      trueCount,
      falseCount
    };
  }
  if (falseCount === table.rows.length) {
    return {
      class: "contradiction",
      labelEs: "Contradicción",
      detail: `Siempre es F (${falseCount}/${table.rows.length} filas). Ejemplo clásico: p ∧ ¬p.`,
      trueCount,
      falseCount
    };
  }
  return {
    class: "contingency",
    labelEs: "Contingencia",
    detail: `A veces V (${trueCount}) y a veces F (${falseCount}). La mayoría de fórmulas son contingencias.`,
    trueCount,
    falseCount
  };
}
