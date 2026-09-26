import {
  buildTruthTable,
  classify,
  evaluate,
  parseFormula,
  scoreTable
} from "@truthforge/logic-engine";

export interface GradeResult {
  correct: boolean;
  xpEarned: number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Racha: mismo día = se mantiene; ayer = +1; otro = reinicia a 1. */
export function nextStreak(lastStudyAt: Date | null, streak: number, now = new Date()): number {
  if (!lastStudyAt) return 1;
  const last = dayKey(lastStudyAt);
  const today = dayKey(now);
  if (last === today) return streak;
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  return last === yesterday ? streak + 1 : 1;
}

export function levelFor(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/**
 * Califica un intento en el servidor (autoritativo, no confía en el cliente).
 * XP: 10 la primera vez que se acierta un ejercicio, 0 después.
 */
export function gradeAttempt(
  kind: string,
  formula: string,
  assignment: Record<string, boolean> | null,
  answer: unknown,
  alreadySolved: boolean
): GradeResult {
  let correct = false;

  if (kind === "value") {
    if (typeof answer !== "boolean" || !assignment) {
      throw new Error("Respuesta inválida: se esperaba V/F.");
    }
    correct = evaluate(parseFormula(formula).ast, assignment) === answer;
  } else if (kind === "classify") {
    if (typeof answer !== "string" || !["tautology", "contradiction", "contingency"].includes(answer)) {
      throw new Error("Respuesta inválida: tautology | contradiction | contingency.");
    }
    correct = classify(buildTruthTable(formula)).class === answer;
  } else if (kind === "table") {
    if (!Array.isArray(answer)) throw new Error("Respuesta inválida: matriz de booleanos.");
    const table = buildTruthTable(formula);
    const { accuracy, total } = scoreTable(table, answer as boolean[][]);
    if (total === 0) throw new Error("Respuesta vacía.");
    correct = accuracy === 1;
  } else {
    throw new Error(`Tipo de ejercicio desconocido: ${kind}`);
  }

  return { correct, xpEarned: correct && !alreadySolved ? 10 : 0 };
}

/** Valida que una fórmula de usuario compila y cabe en el laboratorio. */
export function normalizeFormula(formula: string): string {
  return buildTruthTable(formula).normalized;
}
