import type { BinaryOperator } from "./types.js";
import { toVF } from "./types.js";

export interface OperatorMeta {
  op: BinaryOperator | "NOT";
  /** Símbolo canónico para normalizar y mostrar. */
  symbol: string;
  /** Palabra en español para explicaciones. */
  nameEs: string;
  precedence: number;
  /** Cómo se evalúa. Patrón Strategy: cada operador es una estrategia pura. */
  evaluate: (a: boolean, b?: boolean) => boolean;
  explain: (a: boolean, b: boolean, result: boolean) => string;
}

/**
 * Precedencia (mayor = se evalúa antes):
 * NOT > AND/NAND > XOR > OR/NOR > IMPLIES > IFF
 */
export const OPERATORS: Record<BinaryOperator | "NOT", OperatorMeta> = {
  NOT: {
    op: "NOT",
    symbol: "¬",
    nameEs: "negación",
    precedence: 5,
    evaluate: (a) => !a,
    explain: (a, _b, result) =>
      `¬${toVF(a)} = ${toVF(result)} porque la negación invierte el valor.`
  },
  AND: {
    op: "AND",
    symbol: "∧",
    nameEs: "conjunción",
    precedence: 4,
    evaluate: (a, b = false) => a && b,
    explain: (a, b, result) =>
      `${toVF(a)} ∧ ${toVF(b)} = ${toVF(result)} porque la conjunción solo es V cuando ambos son V.`
  },
  NAND: {
    op: "NAND",
    symbol: "⊼",
    nameEs: "NAND",
    precedence: 4,
    evaluate: (a, b = false) => !(a && b),
    explain: (a, b, result) =>
      `${toVF(a)} ⊼ ${toVF(b)} = ${toVF(result)} porque NAND es lo contrario de AND: solo es F cuando ambos son V.`
  },
  XOR: {
    op: "XOR",
    symbol: "⊕",
    nameEs: "disyunción exclusiva",
    precedence: 3,
    evaluate: (a, b = false) => a !== b,
    explain: (a, b, result) =>
      `${toVF(a)} ⊕ ${toVF(b)} = ${toVF(result)} porque XOR es V solo cuando los valores son diferentes.`
  },
  OR: {
    op: "OR",
    symbol: "∨",
    nameEs: "disyunción",
    precedence: 2,
    evaluate: (a, b = false) => a || b,
    explain: (a, b, result) =>
      `${toVF(a)} ∨ ${toVF(b)} = ${toVF(result)} porque la disyunción es F solo cuando ambos son F.`
  },
  NOR: {
    op: "NOR",
    symbol: "⊽",
    nameEs: "NOR",
    precedence: 2,
    evaluate: (a, b = false) => !(a || b),
    explain: (a, b, result) =>
      `${toVF(a)} ⊽ ${toVF(b)} = ${toVF(result)} porque NOR es lo contrario de OR: solo es V cuando ambos son F.`
  },
  IMPLIES: {
    op: "IMPLIES",
    symbol: "→",
    nameEs: "implicación",
    precedence: 1,
    evaluate: (a, b = false) => !a || b,
    explain: (a, b, result) =>
      `${toVF(a)} → ${toVF(b)} = ${toVF(result)} porque la implicación solo es F cuando el antecedente es V y el consecuente es F.`
  },
  IFF: {
    op: "IFF",
    symbol: "↔",
    nameEs: "bicondicional",
    precedence: 0,
    evaluate: (a, b = false) => a === b,
    explain: (a, b, result) =>
      `${toVF(a)} ↔ ${toVF(b)} = ${toVF(result)} porque el bicondicional es V solo cuando ambos tienen el mismo valor.`
  }
};
