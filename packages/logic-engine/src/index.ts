/** @truthforge/logic-engine — API pública. */
export {
  FormulaError,
  MAX_VARIABLES,
  toVF,
  to01,
  type AstNode,
  type BinaryOperator,
  type ParseResult,
  type TableColumn,
  type TableRow,
  type TruthTable,
  type ColumnKind,
  type FormulaClass,
  type ExplanationStep,
  type GuidedStep,
  type CellFeedback
} from "./types.js";

export { OPERATORS, type OperatorMeta } from "./operators.js";
export { tokenize, type Token, type TokenKind } from "./tokenizer.js";
export {
  parseFormula,
  collectVariables,
  nodeToString,
  nodeDepth
} from "./parser.js";
export { evaluate, generateCombinations } from "./evaluator.js";
export { buildTruthTable, buildColumns } from "./table.js";
export { explainRow, getGuidedPlan } from "./explainer.js";
export { validateCell, scoreTable, equivalentTables } from "./validator.js";
export { classify, type Classification } from "./classifier.js";
