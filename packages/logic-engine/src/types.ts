/** Tipos centrales del motor. Dominio puro, sin dependencias de framework. */

export type BinaryOperator =
  | "AND"
  | "NAND"
  | "OR"
  | "NOR"
  | "XOR"
  | "IMPLIES"
  | "IFF";

export type UnaryOperator = "NOT";

export interface VarNode {
  kind: "var";
  name: string;
}

export interface ConstNode {
  kind: "const";
  value: boolean;
}

export interface NotNode {
  kind: "not";
  operand: AstNode;
}

export interface BinaryNode {
  kind: "binary";
  op: BinaryOperator;
  left: AstNode;
  right: AstNode;
}

export type AstNode = VarNode | ConstNode | NotNode | BinaryNode;

/** Error tipado con posición para poder subrayar en el input del laboratorio. */
export class FormulaError extends Error {
  readonly position: number;
  readonly hint: string | undefined;

  constructor(message: string, position: number, hint?: string) {
    super(message);
    this.name = "FormulaError";
    this.position = position;
    this.hint = hint;
  }
}

export interface ParseResult {
  ast: AstNode;
  variables: string[];
  normalized: string;
}

export type ColumnKind = "variable" | "intermediate" | "result";

export interface TableColumn {
  /** Id estable: label + índice para React keys. */
  id: string;
  label: string;
  kind: ColumnKind;
  node: AstNode;
  /** Profundidad del sub-árbol: orden pedagógico de evaluación. */
  depth: number;
}

export interface TableRow {
  assignment: Record<string, boolean>;
  /** Valores alineados con `columns` (mismo índice). */
  values: boolean[];
}

export interface TruthTable {
  formula: string;
  normalized: string;
  ast: AstNode;
  variables: string[];
  columns: TableColumn[];
  rows: TableRow[];
}

export type FormulaClass = "tautology" | "contradiction" | "contingency";

export interface ExplanationStep {
  columnId: string;
  label: string;
  inputs: string;
  result: boolean;
  /** Explicación pedagógica en español, no solo el resultado. */
  reason: string;
}

export interface GuidedStep {
  step: number;
  total: number;
  columnId: string;
  label: string;
  /** Pista antes de revelar (modo "construye conmigo"). */
  hint: string;
  explanation: string;
}

export interface CellFeedback {
  expected: boolean;
  correct: boolean;
  reason: string;
}

/** Límite pedagógico y de rendimiento: 2^n filas. 6 vars = 64 filas. */
export const MAX_VARIABLES = 6;

/** Representación en español para la UI (V/F). El motor interno usa boolean. */
export function toVF(value: boolean): "V" | "F" {
  return value ? "V" : "F";
}

export function to01(value: boolean): "1" | "0" {
  return value ? "1" : "0";
}
