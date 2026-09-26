# @truthforge/logic-engine

Motor puro de lógica proposicional para TruthForge. Dominio sin dependencias de framework: lo usan el frontend (feedback instantáneo) y el backend (validación autoritativa) sin duplicar lógica.

## Decisiones (ADR resumido)

- **Paquete puro `packages/logic-engine`, cero deps runtime.** Elegido sobre duplicar en frontend/backend porque la validación debe ser idéntica en ambos lados y testeable al 80%+.
- **Patrón Interpreter (AST) + Visitor (variables, columnas, explicación).** Cada operador es una Strategy en `operators.ts`.
- **Límite `MAX_VARIABLES = 6` (64 filas).** Trade-off pedagogía/rendimiento: más variables hacen tablas ilegibles y explotan 2^n.
- **Booleanos internos, V/F solo en presentación.** `toVF()` / `to01()` para la UI.
- **Errores `FormulaError` con `position` + `hint`.** La UI subraya el error y sugiere corrección (laboratorio, no calculadora).
- **Aliases de apuntes:** `^` = AND, `v` minúscula = OR. La variable de una letra `v` no existe (usar u, w, p, q…).

## Sintaxis aceptada

Variables `p, q, A, B, OUT…` · Constantes `V F 1 0 true false`

| Operador | Símbolos |
|---|---|
| NOT | `¬ ~ ! NOT` |
| AND | `∧ & && ^ · * AND` |
| NAND | `⊼ NAND` |
| OR | `∨ \| \|\| OR v` (`v` minúscula aislada, como en apuntes) |
| NOR | `⊽ NOR` |
| XOR | `⊕ XOR` (solo palabra o símbolo: `^` es AND por convención de libros) |
| → | `→ -> =>` |
| ↔ | `↔ <-> <=>` |

Precedencia: `¬ > ∧/⊼ > ⊕ > ∨/⊽ > → > ↔`. `→` asocia a la derecha.

## API

```ts
import { parseFormula, buildTruthTable, explainRow, getGuidedPlan, validateCell, classify } from "@truthforge/logic-engine";

const table = buildTruthTable("(A NAND B) OR (A XOR B)"); // tautología del ejemplo del laboratorio
explainRow(table, 0);      // pasos en español con el porqué
getGuidedPlan(table);      // columnas una a la vez para "Construye conmigo"
validateCell(table, 0, "result", true); // feedback por celda
classify(table);           // tautology | contradiction | contingency
```

## Scripts

```bash
npm test          # vitest
npm run build     # tsc → dist/
npm run typecheck
```
