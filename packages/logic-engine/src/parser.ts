import { FormulaError, MAX_VARIABLES, type AstNode, type ParseResult } from "./types.js";
import { tokenize, type Token } from "./tokenizer.js";
import { OPERATORS } from "./operators.js";

/** Parser recursivo por precedencia. Patrón Interpreter: construye el AST. */
export function parseFormula(input: string): ParseResult {
  if (!input.trim()) {
    throw new FormulaError("Escribe una fórmula primero.", 0, "Ejemplo: p ∧ q → r");
  }
  const tokens = tokenize(input);
  if (tokens.length === 0) {
    throw new FormulaError("No encontré nada para evaluar.", 0);
  }
  const parser = new Parser(tokens, input);
  const ast = parser.parseExpression(0);

  const leftover = parser.peek();
  if (leftover) {
    throw new FormulaError(
      `No esperaba '${leftover.text}' aquí.`,
      leftover.position,
      "Revisa paréntesis u operadores duplicados."
    );
  }

  const variables = collectVariables(ast);
  if (variables.length === 0) {
    throw new FormulaError("La fórmula no tiene variables.", 0, "Ejemplo: p ∨ ¬p");
  }
  if (variables.length > MAX_VARIABLES) {
    throw new FormulaError(
      `Demasiadas variables (${variables.length}). El laboratorio admite hasta ${MAX_VARIABLES} para que la tabla siga siendo legible.`,
      0
    );
  }

  return { ast, variables, normalized: nodeToString(ast) };
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly input: string
  ) {}

  peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new FormulaError("Fórmula incompleta.", this.input.length);
    this.pos += 1;
    return t;
  }

  /** Precedence climbing. minPrec 0 = más bajo (↔). */
  parseExpression(minPrec: number): AstNode {
    let left = this.parseUnary();

    for (;;) {
      const op = this.peekBinary();
      if (!op) return left;
      const prec = OPERATORS[op].precedence;
      if (prec < minPrec) return left;

      this.next(); // consume operador
      // IMPLIES es asociativo a la derecha: p -> q -> r = p -> (q -> r)
      const nextMin = op === "IMPLIES" ? prec : prec + 1;
      const right = this.parseExpression(nextMin);
      left = { kind: "binary", op, left, right };
    }
  }

  private parseUnary(): AstNode {
    const t = this.peek();
    if (t?.kind === "not") {
      this.next();
      const operand = this.parseUnary();
      return { kind: "not", operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const t = this.next();

    if (t.kind === "var" && typeof t.value === "string") {
      return { kind: "var", name: t.value };
    }
    if (t.kind === "const" && typeof t.value === "boolean") {
      return { kind: "const", value: t.value };
    }
    if (t.kind === "lparen") {
      const inner = this.parseExpression(0);
      const closing = this.peek();
      if (!closing || closing.kind !== "rparen") {
        throw new FormulaError(
          "Falta cerrar el paréntesis.",
          t.position,
          "Cada '(' necesita su ')'."
        );
      }
      this.next();
      return inner;
    }

    throw new FormulaError(
      `No esperaba '${t.text}' aquí.`,
      t.position,
      "Se esperaba una variable (p, q), un valor (V/F) o '('."
    );
  }

  private peekBinary():
    | "AND"
    | "NAND"
    | "OR"
    | "NOR"
    | "XOR"
    | "IMPLIES"
    | "IFF"
    | undefined {
    const t = this.peek();
    if (!t) return undefined;
    switch (t.kind) {
      case "and":
        return "AND";
      case "nand":
        return "NAND";
      case "or":
        return "OR";
      case "nor":
        return "NOR";
      case "xor":
        return "XOR";
      case "implies":
        return "IMPLIES";
      case "iff":
        return "IFF";
      default:
        return undefined;
    }
  }
}

/** Visitor: recolecta variables ordenadas (insensible a mayúsculas para ordenar, estable). */
export function collectVariables(node: AstNode): string[] {
  const set = new Set<string>();
  const visit = (n: AstNode): void => {
    if (n.kind === "var") set.add(n.name);
    else if (n.kind === "not") visit(n.operand);
    else if (n.kind === "binary") {
      visit(n.left);
      visit(n.right);
    }
  };
  visit(node);
  return [...set].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

/** Serializa el AST con símbolos canónicos. Útil para labels y keys estables. */
export function nodeToString(node: AstNode, parentPrec = -1): string {
  switch (node.kind) {
    case "var":
      return node.name;
    case "const":
      return node.value ? "V" : "F";
    case "not": {
      const inner = nodeToString(node.operand, OPERATORS.NOT.precedence);
      const needsParen = node.operand.kind === "binary";
      return `¬${needsParen ? `(${inner})` : inner}`;
    }
    case "binary": {
      const prec = OPERATORS[node.op].precedence;
      const left = nodeToString(node.left, prec);
      // IMPLIES derecha no lleva parén extra si misma precedencia (asoc. derecha)
      const rightPrec = node.op === "IMPLIES" ? prec : prec + 1;
      const right = nodeToString(node.right, rightPrec);
      const text = `${left} ${OPERATORS[node.op].symbol} ${right}`;
      return prec < parentPrec ? `(${text})` : text;
    }
  }
}

/** Profundidad del sub-árbol: orden pedagógico (primero lo más simple). */
export function nodeDepth(node: AstNode): number {
  switch (node.kind) {
    case "var":
    case "const":
      return 0;
    case "not":
      return nodeDepth(node.operand) + 1;
    case "binary":
      return Math.max(nodeDepth(node.left), nodeDepth(node.right)) + 1;
  }
}
