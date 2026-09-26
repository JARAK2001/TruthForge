import { FormulaError } from "./types.js";

export type TokenKind =
  | "var"
  | "const"
  | "not"
  | "and"
  | "nand"
  | "or"
  | "nor"
  | "xor"
  | "implies"
  | "iff"
  | "lparen"
  | "rparen";

export interface Token {
  kind: TokenKind;
  /** Texto original (para errores). */
  text: string;
  position: number;
  /** Solo para var/const. */
  value?: string | boolean;
}

const KEYWORDS: Record<string, TokenKind> = {
  NOT: "not",
  AND: "and",
  NAND: "nand",
  OR: "or",
  NOR: "nor",
  XOR: "xor"
};

function isLetter(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isLetterOrDigit(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

/**
 * Tokenizer tolerante: acepta unicode (¬∧∨→↔⊕⊼⊽) y ascii (! & | -> <-> ...).
 * Reporta posición exacta para UX del laboratorio.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (kind: TokenKind, text: string, position: number, value?: string | boolean) => {
    if (value === undefined) tokens.push({ kind, text, position });
    else tokens.push({ kind, text, position, value });
  };

  while (i < input.length) {
    const ch = input[i] as string;
    const pos = i;

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    // Paréntesis
    if (ch === "(") {
      push("lparen", ch, pos);
      i += 1;
      continue;
    }
    if (ch === ")") {
      push("rparen", ch, pos);
      i += 1;
      continue;
    }

    // Operadores unicode de un char
    if (ch === "¬" || ch === "~") {
      push("not", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "!") {
      // != no existe en lógica; ! solo es NOT. Pero != sería error claro.
      if (input[i + 1] === "=") {
        throw new FormulaError(
          "El operador '!=' no existe en lógica proposicional. Usa '↔' o 'XOR' para comparar.",
          pos,
          "Prueba con 'p ↔ q' o 'p XOR q'."
        );
      }
      push("not", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "∧" || ch === "&" || ch === "·" || ch === "*" || ch === "^") {
      if (ch === "&" && input[i + 1] === "&") {
        push("and", "&&", pos);
        i += 2;
      } else {
        push("and", ch, pos);
        i += 1;
      }
      continue;
    }
    if (ch === "∨" || ch === "|") {
      if (ch === "|" && input[i + 1] === "|") {
        push("or", "||", pos);
        i += 2;
      } else {
        push("or", ch, pos);
        i += 1;
      }
      continue;
    }
    // XOR solo con símbolo propio o palabra: ^ es AND (convención de libros).
    if (ch === "⊕") {
      push("xor", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "⊼") {
      push("nand", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "⊽") {
      push("nor", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "→") {
      push("implies", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "↔") {
      push("iff", ch, pos);
      i += 1;
      continue;
    }
    if (ch === "-") {
      if (input[i + 1] === ">") {
        push("implies", "->", pos);
        i += 2;
        continue;
      }
      throw new FormulaError(`Carácter inesperado '${ch}'. ¿Quisiste escribir '->'?`, pos);
    }
    if (ch === "=") {
      if (input[i + 1] === ">") {
        push("implies", "=>", pos);
        i += 2;
        continue;
      }
      throw new FormulaError(`Carácter inesperado '${ch}'. Usa '->' para implicación.`, pos);
    }
    if (ch === "<") {
      const rest = input.slice(i, i + 3);
      if (rest === "<->" || rest === "<=>") {
        push("iff", rest, pos);
        i += 3;
        continue;
      }
      throw new FormulaError(`Carácter inesperado '${ch}'. Usa '<->' para bicondicional.`, pos);
    }

    // Identificadores / keywords / constantes V F
    // Nota: V/F/T de una letra solo son constantes en mayúscula.
    // Así `f` minúscula sigue siendo variable (evita colisión con F=falso).
    if (isLetter(ch)) {
      let j = i + 1;
      while (j < input.length && isLetterOrDigit(input[j] as string)) j += 1;
      const word = input.slice(i, j);
      const upper = word.toUpperCase();
      const isSingleLetterConst = word.length === 1 && (word === "V" || word === "F" || word === "T");
      const isWordConst = upper === "TRUE" || upper === "FALSE";

      // Alias de apuntes: 'v' minúscula aislada = OR (∨).
      // Consecuencia documentada: la variable de una letra 'v' no existe;
      // usen u, w, p, q... 'V' mayúscula sigue siendo constante verdadero.
      if (word === "v") {
        push("or", word, pos);
        i = j;
        continue;
      }

      if (isSingleLetterConst || isWordConst) {
        push("const", word, pos, upper === "TRUE" || word === "V" || word === "T");
        i = j;
        continue;
      }

      if (upper in KEYWORDS) {
        const kind = KEYWORDS[upper] as TokenKind;
        push(kind, word, pos);
        i = j;
        continue;
      }

      // Variables: p, q, A, B, OUT... (permitimos multi-letra para el laboratorio)
      if (word.length > 12) {
        throw new FormulaError(`Nombre de variable '${word}' demasiado largo.`, pos);
      }
      push("var", word, pos, word);
      i = j;
      continue;
    }

    if (ch === "0" || ch === "1") {
      push("const", ch, pos, ch === "1");
      i += 1;
      continue;
    }

    throw new FormulaError(
      `Carácter inesperado '${ch}'.`,
      pos,
      "Operadores válidos: ¬ ∧ ∨ → ↔ ⊕ AND OR NOT XOR NAND NOR (alias: ^ = ∧, v = ∨)."
    );
  }

  return tokens;
}
