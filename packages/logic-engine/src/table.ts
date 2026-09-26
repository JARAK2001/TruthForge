import type { AstNode, TableColumn, TruthTable } from "./types.js";
import { evaluate, generateCombinations } from "./evaluator.js";
import { nodeDepth, nodeToString, parseFormula } from "./parser.js";

/**
 * Builder de la tabla: variables + sub-expresiones ordenadas por
 * profundidad + resultado. El orden es pedagógico: se resuelve
 * de izquierda a derecha, de lo simple a lo compuesto.
 */
export function buildTruthTable(formula: string): TruthTable {
  const { ast, variables, normalized } = parseFormula(formula);

  const columns = buildColumns(ast, variables);
  const assignments = generateCombinations(variables);

  const rows = assignments.map((assignment) => ({
    assignment,
    values: columns.map((col) => evaluate(col.node, assignment))
  }));

  return { formula, normalized, ast, variables, columns, rows };
}

export function buildColumns(ast: AstNode, variables: string[]): TableColumn[] {
  const rootKey = nodeToString(ast);

  // 1. Columnas de variables (profundidad 0).
  const columns: TableColumn[] = variables.map((name, i) => ({
    id: `var-${i}-${name}`,
    label: name,
    kind: "variable" as const,
    node: { kind: "var", name } as AstNode,
    depth: 0
  }));

  // 2. Sub-expresiones compuestas únicas (dedup por forma canónica).
  const seen = new Map<string, AstNode>();
  const visit = (n: AstNode): void => {
    const key = nodeToString(n);
    if ((n.kind === "binary" || n.kind === "not") && !seen.has(key)) {
      seen.set(key, n);
    }
    if (n.kind === "not") visit(n.operand);
    else if (n.kind === "binary") {
      visit(n.left);
      visit(n.right);
    }
  };
  visit(ast);

  // El resultado no va en intermedias (va al final como `result`).
  seen.delete(rootKey);

  const intermediates = [...seen.entries()]
    .map(([label, node]) => ({ label, node, depth: nodeDepth(node) }))
    .sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label, "es"));

  intermediates.forEach(({ label, node, depth }, i) => {
    columns.push({ id: `int-${i}`, label, kind: "intermediate", node, depth });
  });

  // 3. Columna resultado (aunque sea una sola variable).
  const isBareVar = ast.kind === "var";
  columns.push({
    id: "result",
    label: rootKey,
    kind: "result",
    node: ast,
    depth: isBareVar ? 0 : nodeDepth(ast)
  });

  // Si la fórmula es una sola variable, variables ya tiene p y result es p.
  // Se dejan ambas (ids distintos) para mostrar "entrada → salida".
  // La UI puede colapsarlas si lo prefiere.
  return columns;
}
