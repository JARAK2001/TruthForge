import type { AstNode, ExplanationStep, GuidedStep, TruthTable } from "./types.js";
import { toVF } from "./types.js";
import { evaluate } from "./evaluator.js";
import { nodeToString } from "./parser.js";
import { OPERATORS } from "./operators.js";

/**
 * Explica una fila completa paso a paso, en el orden de las columnas.
 * No es una calculadora: cada paso enseña el *porqué*.
 */
export function explainRow(table: TruthTable, rowIndex: number): ExplanationStep[] {
  const row = table.rows[rowIndex];
  if (!row) throw new Error(`Fila ${rowIndex} fuera de rango.`);

  const steps: ExplanationStep[] = [];
  for (const col of table.columns) {
    if (col.kind === "variable") continue;
    const result = evaluate(col.node, row.assignment);
    steps.push({
      columnId: col.id,
      label: col.label,
      inputs: describeInputs(col.node, row.assignment),
      result,
      reason: reasonFor(col.node, row.assignment, result)
    });
  }
  return steps;
}

function describeInputs(node: AstNode, assignment: Record<string, boolean>): string {
  if (node.kind === "var") return `${node.name}=${toVF(assignment[node.name] as boolean)}`;
  if (node.kind === "const") return node.value ? "V" : "F";
  if (node.kind === "not") {
    const v = evaluate(node.operand, assignment);
    return `${nodeToString(node.operand)}=${toVF(v)}`;
  }
  const l = evaluate(node.left, assignment);
  const r = evaluate(node.right, assignment);
  return `${nodeToString(node.left)}=${toVF(l)}, ${nodeToString(node.right)}=${toVF(r)}`;
}

function reasonFor(node: AstNode, assignment: Record<string, boolean>, result: boolean): string {
  if (node.kind === "var") {
    return `La variable ${node.name} vale ${toVF(result)} en esta fila.`;
  }
  if (node.kind === "const") {
    return `Es una constante: siempre vale ${toVF(result)}.`;
  }
  if (node.kind === "not") {
    const v = evaluate(node.operand, assignment);
    return OPERATORS.NOT.explain(v, false, result);
  }
  const l = evaluate(node.left, assignment);
  const r = evaluate(node.right, assignment);
  return OPERATORS[node.op].explain(l, r, result);
}

/**
 * Plan guiado "Construye la tabla conmigo": una columna a la vez,
 * de lo simple a lo compuesto. La UI ilumina `columnId` en cada paso.
 */
export function getGuidedPlan(table: TruthTable): GuidedStep[] {
  const targets = table.columns.filter((c) => c.kind !== "variable");
  return targets.map((col, i) => ({
    step: i + 1,
    total: targets.length,
    columnId: col.id,
    label: col.label,
    hint: hintFor(col.node),
    explanation: ruleFor(col.node)
  }));
}

function hintFor(node: AstNode): string {
  if (node.kind === "var") return `Copia el valor de ${node.name}.`;
  if (node.kind === "const") return "Es constante, no depende de la fila.";
  if (node.kind === "not") {
    return `Invierte los valores de la columna ${nodeToString(node.operand)}.`;
  }
  return `Combina ${nodeToString(node.left)} con ${nodeToString(node.right)} usando ${OPERATORS[node.op].nameEs}.`;
}

function ruleFor(node: AstNode): string {
  if (node.kind === "var") return "Las variables son el punto de partida: se copian tal cual.";
  if (node.kind === "const") return "V siempre es V y F siempre es F.";
  if (node.kind === "not") return "Regla de la negación: ¬V = F y ¬F = V.";
  switch (node.op) {
    case "AND":
      return "Regla AND: V solo si ambos son V.";
    case "NAND":
      return "Regla NAND: F solo si ambos son V; en cualquier otro caso V.";
    case "OR":
      return "Regla OR: F solo si ambos son F.";
    case "NOR":
      return "Regla NOR: V solo si ambos son F.";
    case "XOR":
      return "Regla XOR: V solo si son diferentes.";
    case "IMPLIES":
      return "Regla →: F solo si tienes V → F. Todo lo demás es V.";
    case "IFF":
      return "Regla ↔: V solo si ambos son iguales.";
  }
}
