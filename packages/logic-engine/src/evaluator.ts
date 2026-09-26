import type { AstNode } from "./types.js";
import { OPERATORS } from "./operators.js";

/** Interpreter: evalúa el AST contra una asignación. Función pura. */
export function evaluate(node: AstNode, assignment: Record<string, boolean>): boolean {
  switch (node.kind) {
    case "var": {
      const v = assignment[node.name];
      if (v === undefined) {
        throw new Error(`Falta el valor de '${node.name}' en la asignación.`);
      }
      return v;
    }
    case "const":
      return node.value;
    case "not":
      return OPERATORS.NOT.evaluate(evaluate(node.operand, assignment));
    case "binary":
      return OPERATORS[node.op].evaluate(
        evaluate(node.left, assignment),
        evaluate(node.right, assignment)
      );
  }
}

/** Genera las 2^n combinaciones en orden binario descendente (V...V primero). */
export function generateCombinations(variables: string[]): Record<string, boolean>[] {
  const n = variables.length;
  const total = 2 ** n;
  const out: Record<string, boolean>[] = [];

  for (let i = 0; i < total; i++) {
    const assignment: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) {
      const name = variables[j] as string;
      // Bit más significativo = primera variable. V=1 primero.
      const bit = (i >> (n - 1 - j)) & 1;
      assignment[name] = bit === 1;
    }
    out.push(assignment);
  }
  // Queremos V primero arriba: invertir para que (V,V) sea fila 0.
  return out.reverse();
}
