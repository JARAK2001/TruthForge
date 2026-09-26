import { useMemo, useState, useRef } from "react";
import {
  FormulaError,
  buildTruthTable,
  classify,
  getGuidedPlan,
  toVF,
  validateCell,
  type TruthTable
} from "@truthforge/logic-engine";
import LogicKeyboard from "../components/LogicKeyboard";

const EXAMPLES = [
  { label: "Básico", formula: "p ∧ q → r" },
  { label: "De Morgan", formula: "¬(p ∧ q) ↔ (¬p ∨ ¬q)" },
  { label: "Paréntesis & Negación", formula: "(p → r) ∨ ¬(p → q)" },
  { label: "Contradicción", formula: "¬(p ∨ q) ∧ (p ∨ q)" }
];

type Answers = Record<string, (boolean | undefined)[]>;

interface Feedback {
  row: number;
  columnId: string;
  correct: boolean;
  reason: string;
}

function emptyAnswers(table: TruthTable): Answers {
  const out: Answers = {};
  for (const col of table.columns) {
    if (col.kind !== "variable") out[col.id] = Array<boolean | undefined>(table.rows.length).fill(undefined);
  }
  return out;
}

function columnIsComplete(answers: Answers, columnId: string): boolean {
  const col = answers[columnId];
  return !!col && col.every((v) => v !== undefined);
}

export default function GuidedPage() {
  const [formula, setFormula] = useState(EXAMPLES[0]!.formula);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const table = useMemo(() => {
    try {
      return { ok: true as const, value: buildTruthTable(formula) };
    } catch (e) {
      return { ok: false as const, error: e as FormulaError | Error };
    }
  }, [formula]);

  const plan = table.ok ? getGuidedPlan(table.value) : [];
  const finished = table.ok && plan.length > 0 && stepIdx >= plan.length;
  const active = !finished && table.ok ? plan[stepIdx] : undefined;

  const resetFor = (next: string) => {
    setFormula(next);
    setStepIdx(0);
    setAnswers({});
    setFeedback(undefined);
    setStreak(0);
  };

  const handleInsert = (symbol: string) => {
    resetFor(formula + symbol);
  };

  const handleBackspace = () => {
    if (formula.length > 0) resetFor(formula.slice(0, -1));
  };

  const handleClear = () => {
    resetFor("");
  };

  const answer = (t: TruthTable, row: number, columnId: string, value: boolean) => {
    const check = validateCell(t, row, columnId, value);
    if (!check.correct) {
      setFeedback({ row, columnId, correct: false, reason: check.reason });
      setStreak(0);
      return;
    }
    const base = answers[columnId] ?? Array<boolean | undefined>(t.rows.length).fill(undefined);
    const next: Answers = { ...answers, [columnId]: [...base] };
    (next[columnId] as (boolean | undefined)[])[row] = value;
    setAnswers(next);
    setStreak((s) => s + 1);
    setFeedback({ row, columnId, correct: true, reason: check.reason });
    if (columnIsComplete(next, columnId)) {
      setStepIdx((s) => s + 1);
    }
  };

  return (
    <section className="grid gap-6">
      {/* Top Controller Card */}
      <div className="card p-6 md:p-8 border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neon font-semibold">
              Modo Tutor Interactivo
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              Construye la Tabla Conmigo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-void-950 border border-cyan-500/30 px-3 py-1 font-mono text-xs text-amber-300">
              <span>🔥 Racha:</span>
              <span className="font-bold">{streak}</span>
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-300">
          Aprende a resolver tablas paso a paso: el tutor analiza la fórmula y te guía resolviendo una columna a la vez, de las subfórmulas más simples al resultado final.
        </p>

        {/* Input */}
        <div className="mt-4">
          <input
            ref={inputRef}
            className="input-mono text-base font-bold"
            value={formula}
            onChange={(e) => resetFor(e.target.value)}
            placeholder="Escribe una fórmula..."
            aria-label="Fórmula proposicional"
            spellCheck={false}
          />
        </div>

        {/* Virtual Keyboard */}
        <div className="mt-3">
          <LogicKeyboard
            onInsert={handleInsert}
            onBackspace={handleBackspace}
            onClear={handleClear}
            compact
          />
        </div>

        {/* Example Selector */}
        <div className="mt-4 pt-3 border-t border-cyan-500/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted mr-1">Ejercicios sugeridos:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.formula}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all border ${
                formula === ex.formula
                  ? "bg-cyan-500/20 border-neon text-neon font-bold shadow-glow-sm"
                  : "bg-void-950 border-white/10 text-slate-300 hover:border-cyan-500/30"
              }`}
              onClick={() => resetFor(ex.formula)}
            >
              {ex.formula}
            </button>
          ))}
        </div>

        {!table.ok ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            ⚠️ Error de fórmula: {table.error.message}
          </div>
        ) : null}
      </div>

      {/* Guided Workspace */}
      {table.ok && !finished && active ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main Table View */}
          <div className="card overflow-hidden p-6 border-cyan-500/25">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400 font-mono text-xs font-bold text-neon">
                  {active.step}
                </span>
                <span className="font-display text-sm font-semibold text-white">
                  Paso {active.step} de {active.total}: Columna{" "}
                  <span className="font-mono text-neon font-bold">{active.label}</span>
                </span>
              </div>

              {/* Step Progress Dots */}
              <div className="flex items-center gap-1.5">
                {plan.map((p, i) => (
                  <div
                    key={p.columnId}
                    className={`h-2 rounded-full transition-all ${
                      i < stepIdx
                        ? "w-4 bg-emerald-400 shadow-[0_0_8px_#10b981]"
                        : i === stepIdx
                        ? "w-6 bg-neon shadow-glow-sm animate-pulse"
                        : "w-2 bg-slate-700"
                    }`}
                    title={`Paso ${i + 1}: ${p.label}`}
                  />
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-void-950/80">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="bg-void-900 border-b border-cyan-500/20">
                    {table.value.columns.map((col) => {
                      const isActiveCol = col.id === active.columnId;
                      return (
                        <th
                          key={col.id}
                          className={`px-3 py-2.5 text-center font-bold transition-all ${
                            isActiveCol
                              ? "bg-cyan-500/25 text-neon border-x-2 border-t-2 border-neon shadow-glow"
                              : "text-slate-300"
                          }`}
                        >
                          {col.label}
                          {isActiveCol && (
                            <span className="block text-[9px] uppercase tracking-wider text-neon animate-pulse font-sans">
                              Objetivo Actual
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {table.value.rows.map((_row, r) => (
                    <tr key={r} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      {table.value.columns.map((col, c) => (
                        <td
                          key={col.id}
                          className={`px-3 py-2 text-center transition-all ${
                            col.id === active.columnId ? "bg-cyan-500/10 border-x border-cyan-500/30" : ""
                          }`}
                        >
                          <Cell
                            table={table.value}
                            row={r}
                            colIndex={c}
                            columnId={col.id}
                            activeId={active.columnId}
                            stepIdx={stepIdx}
                            planOrder={plan.findIndex((p) => p.columnId === col.id)}
                            given={answers[col.id]?.[r]}
                            onAnswer={(v) => answer(table.value, r, col.id, v)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-xs text-muted font-sans">
              <span>🎯 Responde cada casilla de la columna resaltada en cian.</span>
              <span>Fórmula: {table.value.normalized}</span>
            </div>
          </div>

          {/* Tutor Side Panel */}
          <aside className="card p-6 border-cyan-500/25 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-cyan-500/15 pb-3">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="font-display font-bold text-base text-neon">
                    Instrucción del Tutor
                  </h3>
                  <span className="text-[10px] font-mono text-muted uppercase">
                    Regla de inferencia
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-void-950 border border-cyan-500/20 p-4">
                <span className="text-[10px] font-mono text-muted uppercase">Pista Lógica:</span>
                <p className="mt-1 text-sm text-slate-200 font-medium leading-relaxed">
                  {active.hint}
                </p>
              </div>

              <div className="mt-3 rounded-xl bg-void-950/60 border border-white/10 p-4">
                <span className="text-[10px] font-mono text-muted uppercase">Explicación Detallada:</span>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {active.explanation}
                </p>
              </div>

              {/* Feedback toast card */}
              {feedback ? (
                <div
                  className={`mt-4 rounded-xl p-4 text-xs leading-relaxed border transition-all ${
                    feedback.correct
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-red-500/40 bg-red-950/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  }`}
                  role="status"
                >
                  <p className="font-bold flex items-center gap-1.5 font-display text-sm">
                    {feedback.correct ? "✅ ¡Correcto!" : "❌ No exactamente:"}
                  </p>
                  <p className="mt-1">{feedback.reason}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 pt-4 border-t border-cyan-500/15 text-[11px] text-muted">
              Consejo: Si dudas, revisa la tabla de verdad del operador principal en la sección <span className="text-neon">Aprender</span>.
            </div>
          </aside>
        </div>
      ) : null}

      {/* Finished Celebration Card */}
      {table.ok && finished ? (
        <div className="card p-8 md:p-12 text-center border-cyan-500/40 shadow-glow bg-gradient-to-b from-void-850 to-void-950">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-3xl shadow-[0_0_25px_rgba(16,185,129,0.5)] mb-4">
            🎉
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white">
            ¡Tabla de verdad completada con éxito!
          </h2>
          <p className="mt-2 text-base text-slate-300 max-w-xl mx-auto">
            Has construido toda la tabla celda por celda. La fórmula{" "}
            <span className="font-mono text-neon font-bold">{table.value.normalized}</span> se clasifica formalmente como:
          </p>

          <div className="mt-4">
            <span className="inline-block rounded-full border border-neon/50 bg-neon/15 px-6 py-2 font-display text-lg font-bold text-neon shadow-glow">
              {classify(table.value).labelEs}
            </span>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              className="btn-primary"
              onClick={() => {
                setStepIdx(0);
                setAnswers(table.ok ? emptyAnswers(table.value) : {});
                setFeedback(undefined);
                setStreak(0);
              }}
            >
              Repetir Ejercicio
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                const nextIndex = (EXAMPLES.findIndex((e) => e.formula === formula) + 1) % EXAMPLES.length;
                resetFor(EXAMPLES[nextIndex]!.formula);
              }}
            >
              Siguiente Fórmula →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Cell(props: {
  table: TruthTable;
  row: number;
  colIndex: number;
  columnId: string;
  activeId: string;
  stepIdx: number;
  planOrder: number;
  given: boolean | undefined;
  onAnswer: (v: boolean) => void;
}) {
  const col = props.table.columns[props.colIndex] as (typeof props.table.columns)[number];
  const expected = props.table.rows[props.row]?.values[props.colIndex] as boolean;

  if (col.kind === "variable") {
    return <span className={expected ? "cell-v" : "cell-f"}>{toVF(expected)}</span>;
  }
  // Columnas ya superadas: reveladas.
  if (props.planOrder !== -1 && props.planOrder < props.stepIdx) {
    return <span className={expected ? "cell-v" : "cell-f"}>{toVF(expected)}</span>;
  }
  // Columna activa: respondida o botones interactivos.
  if (props.columnId === props.activeId) {
    if (props.given !== undefined) {
      return <span className={props.given ? "cell-v" : "cell-f"}>{toVF(props.given)}</span>;
    }
    return (
      <span className="inline-flex gap-1.5 items-center justify-center">
        <button
          key="V"
          className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          onClick={() => props.onAnswer(true)}
          aria-label="Responder V (Verdadero)"
        >
          V
        </button>
        <button
          key="F"
          className="rounded-lg bg-slate-800 hover:bg-red-500/20 border border-white/20 hover:border-red-400/50 px-2.5 py-1 font-mono text-xs font-bold text-slate-300 hover:text-red-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          onClick={() => props.onAnswer(false)}
          aria-label="Responder F (Falso)"
        >
          F
        </button>
      </span>
    );
  }
  // Futuras: ocultas con indicador estilizado.
  return <span className="text-muted/40 font-mono">···</span>;
}
