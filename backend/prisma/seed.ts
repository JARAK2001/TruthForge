import prisma from "../src/lib/prisma.js";

const ACHIEVEMENTS = [
  { slug: "first-steps", name: "Primeros pasos", description: "Completa tu primer ejercicio.", xpReward: 5 },
  { slug: "racha-3", name: "Racha x3", description: "Estudia 3 días seguidos.", xpReward: 15 },
  { slug: "cien-xp", name: "100 XP", description: "Alcanza 100 puntos de experiencia.", xpReward: 10 }
];

/** Ids estables del currículum: deben coincidir con frontend/src/data/curriculum.ts */
const SLUGS: Record<string, string> = {
  "Si p = V, ¿cuánto vale p?": "fun-1",
  "Si p = F y q = V, ¿cuánto vale q?": "fun-2",
  "Si p = V, ¿cuánto vale ¬p?": "neg-1",
  "Si p = F, ¿cuánto vale ¬¬p?": "neg-2",
  "p = V, q = F. ¿Cuánto vale p ∧ q?": "and-1",
  "p = V, q = V. ¿Cuánto vale p NAND q?": "and-2",
  "p = F, q = F. ¿Cuánto vale p ∨ q?": "or-1",
  "p = F, q = F. ¿Cuánto vale p NOR q?": "or-2",
  "p = V, q = F. ¿Cuánto vale p ⊕ q?": "xor-1",
  "p = V, q = V. ¿Cuánto vale p ⊕ q?": "xor-2",
  "p = V, q = F. ¿Cuánto vale p → q?": "imp-1",
  "p = F, q = F. ¿Cuánto vale p → q?": "imp-2",
  "p = F, q = F. ¿Cuánto vale p ↔ q?": "bi-1",
  "p = V, q = F. ¿Cuánto vale p ↔ q?": "bi-2",
  "Clasifica p ∨ ¬p": "tau-1",
  "Clasifica ¬(p∨q)^(p∨q)": "tau-2",
  "Clasifica p ∧ q": "tau-3"
};

const LESSONS: {
  slug: string;
  title: string;
  goal: string;
  rule: string;
  example: string;
  order: number;
  exercises: { prompt: string; formula: string; kind: string; assignment?: Record<string, boolean> }[];
}[] = [
  {
    slug: "fundamentos",
    title: "1 · Variables, V y F",
    goal: "Entender que una proposición vale V o F, y que la tabla enumera todos los casos.",
    rule: "Con n variables hay 2ⁿ filas. Con 1 variable: V, F. Con 2: VV, VF, FV, FF.",
    example: "p",
    order: 1,
    exercises: [
      { prompt: "Si p = V, ¿cuánto vale p?", formula: "p", kind: "value", assignment: { p: true } },
      { prompt: "Si p = F y q = V, ¿cuánto vale q?", formula: "q", kind: "value", assignment: { p: false, q: true } }
    ]
  },
  {
    slug: "negacion",
    title: "2 · Negación (¬)",
    goal: "Invertir valores: ¬V = F y ¬F = V.",
    rule: "La negación invierte el valor. Doble negación cancela: ¬¬p ≡ p.",
    example: "¬p",
    order: 2,
    exercises: [
      { prompt: "Si p = V, ¿cuánto vale ¬p?", formula: "¬p", kind: "value", assignment: { p: true } },
      { prompt: "Si p = F, ¿cuánto vale ¬¬p?", formula: "¬¬p", kind: "value", assignment: { p: false } }
    ]
  },
  {
    slug: "and",
    title: "3 · Conjunción (∧) y NAND",
    goal: "∧ solo es V con ambos en V. NAND es su contrario.",
    rule: "p ∧ q es V solo si p y q son V. NAND (⊼) es F solo si ambos son V. En apuntes: ^ = ∧.",
    example: "p ∧ q",
    order: 3,
    exercises: [
      { prompt: "p = V, q = F. ¿Cuánto vale p ∧ q?", formula: "p ∧ q", kind: "value", assignment: { p: true, q: false } },
      { prompt: "p = V, q = V. ¿Cuánto vale p NAND q?", formula: "p NAND q", kind: "value", assignment: { p: true, q: true } }
    ]
  },
  {
    slug: "or",
    title: "4 · Disyunción (∨) y NOR",
    goal: "∨ solo es F con ambos en F. NOR es su contrario.",
    rule: "p ∨ q es F solo si p y q son F. NOR (⊽) es V solo si ambos son F. En apuntes: v = ∨.",
    example: "p ∨ q",
    order: 4,
    exercises: [
      { prompt: "p = F, q = F. ¿Cuánto vale p ∨ q?", formula: "p ∨ q", kind: "value", assignment: { p: false, q: false } },
      { prompt: "p = F, q = F. ¿Cuánto vale p NOR q?", formula: "p NOR q", kind: "value", assignment: { p: false, q: false } }
    ]
  },
  {
    slug: "xor",
    title: "5 · Exclusiva (⊕)",
    goal: "XOR es V solo cuando los valores difieren.",
    rule: "p ⊕ q es V si uno es V y el otro F. Ojo: ^ NO es XOR en este laboratorio, es AND.",
    example: "p XOR q",
    order: 5,
    exercises: [
      { prompt: "p = V, q = F. ¿Cuánto vale p ⊕ q?", formula: "p XOR q", kind: "value", assignment: { p: true, q: false } },
      { prompt: "p = V, q = V. ¿Cuánto vale p ⊕ q?", formula: "p XOR q", kind: "value", assignment: { p: true, q: true } }
    ]
  },
  {
    slug: "implica",
    title: "6 · Implicación (→)",
    goal: "→ solo es F en el caso V → F.",
    rule: "p → q es F solo si p es V y q es F. Si el antecedente es F, la implicación es V.",
    example: "p → q",
    order: 6,
    exercises: [
      { prompt: "p = V, q = F. ¿Cuánto vale p → q?", formula: "p → q", kind: "value", assignment: { p: true, q: false } },
      { prompt: "p = F, q = F. ¿Cuánto vale p → q?", formula: "p → q", kind: "value", assignment: { p: false, q: false } }
    ]
  },
  {
    slug: "bicon",
    title: "7 · Bicondicional (↔)",
    goal: "↔ es V cuando ambos lados coinciden.",
    rule: "p ↔ q es V si p y q valen lo mismo (VV o FF). Equivale a (p → q) ∧ (q → p).",
    example: "p ↔ q",
    order: 7,
    exercises: [
      { prompt: "p = F, q = F. ¿Cuánto vale p ↔ q?", formula: "p ↔ q", kind: "value", assignment: { p: false, q: false } },
      { prompt: "p = V, q = F. ¿Cuánto vale p ↔ q?", formula: "p ↔ q", kind: "value", assignment: { p: true, q: false } }
    ]
  },
  {
    slug: "tautologias",
    title: "8 · Tautologías y contradicciones",
    goal: "Clasificar fórmulas: siempre V, siempre F, o mixtas.",
    rule: "Tautología: todo V (p ∨ ¬p). Contradicción: todo F (p ∧ ¬p). El resto son contingencias.",
    example: "p ∨ ¬p",
    order: 8,
    exercises: [
      { prompt: "Clasifica p ∨ ¬p", formula: "p ∨ ¬p", kind: "classify" },
      { prompt: "Clasifica ¬(p∨q)^(p∨q)", formula: "¬(p∨q)^(p∨q)", kind: "classify" },
      { prompt: "Clasifica p ∧ q", formula: "p ∧ q", kind: "classify" }
    ]
  }
];

async function main(): Promise<void> {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: { name: a.name, description: a.description, xpReward: a.xpReward },
      create: a
    });
  }

  for (const lesson of LESSONS) {
    const created = await prisma.lesson.upsert({
      where: { slug: lesson.slug },
      update: { title: lesson.title, goal: lesson.goal, rule: lesson.rule, example: lesson.example, order: lesson.order },
      create: {
        slug: lesson.slug,
        title: lesson.title,
        goal: lesson.goal,
        rule: lesson.rule,
        example: lesson.example,
        order: lesson.order
      }
    });
    for (const ex of lesson.exercises) {
      const slug = SLUGS[ex.prompt];
      const existing = await prisma.exercise.findFirst({
        where: { prompt: ex.prompt, levelId: created.id, authorId: null }
      });
      if (!existing) {
        await prisma.exercise.create({
          data: {
            slug,
            prompt: ex.prompt,
            formula: ex.formula,
            kind: ex.kind,
            assignment: ex.assignment ?? undefined,
            levelId: created.id
          }
        });
      } else if (!existing.slug && slug) {
        await prisma.exercise.update({ where: { id: existing.id }, data: { slug } });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed OK: logros, lecciones y ejercicios.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
