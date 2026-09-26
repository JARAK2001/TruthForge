/** Currículum local de TruthForge. Sin backend: el progreso vive en localStorage. */

export interface ValueExercise {
  kind: "value";
  id: string;
  prompt: string;
  formula: string;
  assignment: Record<string, boolean>;
}

export interface ClassifyExercise {
  kind: "classify";
  id: string;
  prompt: string;
  formula: string;
}

export type Exercise = ValueExercise | ClassifyExercise;

export interface Level {
  id: string;
  title: string;
  goal: string;
  rule: string;
  example: string;
  exercises: Exercise[];
}

export const LEVELS: Level[] = [
  {
    id: "fundamentos",
    title: "1 · Variables, V y F",
    goal: "Entender que una proposición vale V o F, y que la tabla enumera todos los casos.",
    rule: "Con n variables hay 2ⁿ filas. Con 1 variable: V, F. Con 2: VV, VF, FV, FF.",
    example: "p",
    exercises: [
      { kind: "value", id: "fun-1", prompt: "Si p = V, ¿cuánto vale p?", formula: "p", assignment: { p: true } },
      { kind: "value", id: "fun-2", prompt: "Si p = F y q = V, ¿cuánto vale q?", formula: "q", assignment: { p: false, q: true } }
    ]
  },
  {
    id: "negacion",
    title: "2 · Negación (¬)",
    goal: "Invertir valores: ¬V = F y ¬F = V.",
    rule: "La negación invierte el valor. Doble negación cancela: ¬¬p ≡ p.",
    example: "¬p",
    exercises: [
      { kind: "value", id: "neg-1", prompt: "Si p = V, ¿cuánto vale ¬p?", formula: "¬p", assignment: { p: true } },
      { kind: "value", id: "neg-2", prompt: "Si p = F, ¿cuánto vale ¬¬p?", formula: "¬¬p", assignment: { p: false } }
    ]
  },
  {
    id: "and",
    title: "3 · Conjunción (∧) y NAND",
    goal: "∧ solo es V con ambos en V. NAND es su contrario.",
    rule: "p ∧ q es V solo si p y q son V. NAND (⊼) es F solo si ambos son V. En apuntes: ^ = ∧.",
    example: "p ∧ q",
    exercises: [
      { kind: "value", id: "and-1", prompt: "p = V, q = F. ¿Cuánto vale p ∧ q?", formula: "p ∧ q", assignment: { p: true, q: false } },
      { kind: "value", id: "and-2", prompt: "p = V, q = V. ¿Cuánto vale p NAND q?", formula: "p NAND q", assignment: { p: true, q: true } }
    ]
  },
  {
    id: "or",
    title: "4 · Disyunción (∨) y NOR",
    goal: "∨ solo es F con ambos en F. NOR es su contrario.",
    rule: "p ∨ q es F solo si p y q son F. NOR (⊽) es V solo si ambos son F. En apuntes: v = ∨.",
    example: "p ∨ q",
    exercises: [
      { kind: "value", id: "or-1", prompt: "p = F, q = F. ¿Cuánto vale p ∨ q?", formula: "p ∨ q", assignment: { p: false, q: false } },
      { kind: "value", id: "or-2", prompt: "p = F, q = F. ¿Cuánto vale p NOR q?", formula: "p NOR q", assignment: { p: false, q: false } }
    ]
  },
  {
    id: "xor",
    title: "5 · Exclusiva (⊕)",
    goal: "XOR es V solo cuando los valores difieren.",
    rule: "p ⊕ q es V si uno es V y el otro F. Ojo: ^ NO es XOR en este laboratorio, es AND.",
    example: "p XOR q",
    exercises: [
      { kind: "value", id: "xor-1", prompt: "p = V, q = F. ¿Cuánto vale p ⊕ q?", formula: "p XOR q", assignment: { p: true, q: false } },
      { kind: "value", id: "xor-2", prompt: "p = V, q = V. ¿Cuánto vale p ⊕ q?", formula: "p XOR q", assignment: { p: true, q: true } }
    ]
  },
  {
    id: "implica",
    title: "6 · Implicación (→)",
    goal: "→ solo es F en el caso V → F.",
    rule: "p → q es F solo si p es V y q es F. Si el antecedente es F, la implicación es V.",
    example: "p → q",
    exercises: [
      { kind: "value", id: "imp-1", prompt: "p = V, q = F. ¿Cuánto vale p → q?", formula: "p → q", assignment: { p: true, q: false } },
      { kind: "value", id: "imp-2", prompt: "p = F, q = F. ¿Cuánto vale p → q?", formula: "p → q", assignment: { p: false, q: false } }
    ]
  },
  {
    id: "bicon",
    title: "7 · Bicondicional (↔)",
    goal: "↔ es V cuando ambos lados coinciden.",
    rule: "p ↔ q es V si p y q valen lo mismo (VV o FF). Equivale a (p → q) ∧ (q → p).",
    example: "p ↔ q",
    exercises: [
      { kind: "value", id: "bi-1", prompt: "p = F, q = F. ¿Cuánto vale p ↔ q?", formula: "p ↔ q", assignment: { p: false, q: false } },
      { kind: "value", id: "bi-2", prompt: "p = V, q = F. ¿Cuánto vale p ↔ q?", formula: "p ↔ q", assignment: { p: true, q: false } }
    ]
  },
  {
    id: "tautologias",
    title: "8 · Tautologías y contradicciones",
    goal: "Clasificar fórmulas: siempre V, siempre F, o mixtas.",
    rule: "Tautología: todo V (p ∨ ¬p). Contradicción: todo F (p ∧ ¬p). El resto son contingencias.",
    example: "p ∨ ¬p",
    exercises: [
      { kind: "classify", id: "tau-1", prompt: "Clasifica p ∨ ¬p", formula: "p ∨ ¬p" },
      { kind: "classify", id: "tau-2", prompt: "Clasifica ¬(p∨q)^(p∨q)", formula: "¬(p∨q)^(p∨q)" },
      { kind: "classify", id: "tau-3", prompt: "Clasifica p ∧ q", formula: "p ∧ q" }
    ]
  }
];
