import type { CellFeedback, TruthTable } from "./types.js";
import { toVF } from "./types.js";
import { explainRow } from "./explainer.js";

/**
 * Validación por celda para el modo Resolver: feedback inmediato
 * sin revelar toda la tabla (laboratorio, no calculadora).
 */
export function validateCell(
  table: TruthTable,
  rowIndex: number,
  columnId: string,
  userValue: boolean
): CellFeedback {
  const row = table.rows[rowIndex];
  if (!row) throw new Error(`Fila ${rowIndex} fuera de rango.`);
  const colIndex = table.columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) throw new Error(`Columna '${columnId}' no existe.`);
  const expected = row.values[colIndex] as boolean;
  const correct = expected === userValue;

  if (correct) {
    return { expected, correct: true, reason: "¡Correcto! Vas bien." };
  }

  // Al fallar, damos la explicación del paso (aprender del error).
  const col = table.columns[colIndex] as (typeof table.columns)[number];
  if (col.kind === "variable") {
    return {
      expected,
      correct: false,
      reason: `Esa celda es la variable ${col.label}: en esta fila vale ${toVF(expected)}. Revisa la columna de combinaciones.`
    };
  }
  const steps = explainRow(table, rowIndex);
  const step = steps.find((s) => s.columnId === columnId);
  return {
    expected,
    correct: false,
    reason: step ? `Casi. ${step.reason}` : `El valor correcto es ${toVF(expected)}.`
  };
}

/** Puntaje de una tabla completa (para Retos y rachas). */
export function scoreTable(
  table: TruthTable,
  answers: boolean[][]
): { correct: number; total: number; accuracy: number } {
  let correct = 0;
  let total = 0;
  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r] as (typeof table.rows)[number];
    const ansRow = answers[r];
    if (!ansRow) continue;
    for (let c = 0; c < table.columns.length; c++) {
      if (ansRow[c] === undefined) continue;
      total += 1;
      if (ansRow[c] === row.values[c]) correct += 1;
    }
  }
  return { correct, total, accuracy: total === 0 ? 0 : correct / total };
}

/** Expresión del usuario evaluada contra la esperada (modo Constructor/Retos). */
export function equivalentTables(a: TruthTable, b: TruthTable): boolean {
  if (a.variables.join(",") !== b.variables.join(",")) return false;
  if (a.rows.length !== b.rows.length) return false;
  for (let i = 0; i < a.rows.length; i++) {
    const ra = a.rows[i] as (typeof a.rows)[number];
    const rb = b.rows[i] as (typeof b.rows)[number];
    const va = ra.values[ra.values.length - 1];
    const vb = rb.values[rb.values.length - 1];
    if (va !== vb) return false;
  }
  return true;
}
