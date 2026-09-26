import { useMemo, useState, useRef } from "react";
import {
  FormulaError,
  buildTruthTable,
  classify,
  explainRow,
  toVF,
  type TruthTable
} from "@truthforge/logic-engine";
import LogicKeyboard from "../components/LogicKeyboard";

const EXAMPLES = [
  { label: "Ejemplo Clásico", formula: "(p→r) v ¬(p→q)" },
  { label: "De Morgan", formula: "¬(p ∧ q) ↔ (¬p ∨ ¬q)" },
  { label: "Tautología (Tercero Excluido)", formula: "p ∨ ¬p" },
  { label: "Contradicción", formula: "¬(p ∨ q) ∧ (p ∨ q)" },
  { label: "Modus Ponens", formula: "((p → q) ∧ p) → q" },
  { label: "XOR Lógico", formula: "(p ∨ q) ∧ ¬(p ∧ q)" }
];

interface TableState {
  table: TruthTable;
  labelEs: string;
  classificationClass: string;
}

function useTable(formula: string): { state?: TableState; error?: FormulaError | Error } {
  return useMemo(() => {
    try {
      const table = buildTruthTable(formula);
      const c = classify(table);
      return {
        state: {
          table,
          labelEs: c.labelEs,
          classificationClass: c.class
        }
      };
    } catch (e) {
      return { error: e as FormulaError | Error };
    }
  }, [formula]);
}

export default function LabPage() {
  const [formula, setFormula] = useState(EXAMPLES[0]!.formula);
  const [selectedRow, setSelectedRow] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { state, error } = useTable(formula);
  const steps = state && selectedRow < state.table.rows.length ? explainRow(state.table, selectedRow) : [];

  // Keyboard handlers
  const handleInsert = (symbol: string) => {
    const input = inputRef.current;
    if (!input) {
      setFormula((prev) => prev + symbol);
      return;
    }
    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;
    const next = formula.slice(0, start) + symbol + formula.slice(end);
    setFormula(next);
    setSelectedRow(0);
    // Restore focus and cursor position
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 10);
  };

  const handleBackspace = () => {
    const input = inputRef.current;
    if (!input) {
      setFormula((prev) => prev.slice(0, -1));
      return;
    }
    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;
    if (start === end && start > 0) {
      const next = formula.slice(0, start - 1) + formula.slice(end);
      setFormula(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      }, 10);
    } else if (start !== end) {
      const next = formula.slice(0, start) + formula.slice(end);
      setFormula(next);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 10);
    }
  };

  const handleClear = () => {
    setFormula("");
    setSelectedRow(0);
    inputRef.current?.focus();
  };

  // Export functions
  const copyMarkdown = () => {
    if (!state) return;
    const t = state.table;
    const headers = `| ${t.columns.map((c) => c.label).join(" | ")} |`;
    const separator = `| ${t.columns.map(() => "---").join(" | ")} |`;
    const rows = t.rows
      .map((r) => `| ${r.values.map((v) => toVF(v)).join(" | ")} |`)
      .join("\n");
    const md = `${headers}\n${separator}\n${rows}`;
    navigator.clipboard.writeText(md);
    setCopiedText("Markdown copiado ✓");
    setTimeout(() => setCopiedText(null), 2500);
  };

  const copyLaTeX = () => {
    if (!state) return;
    const t = state.table;
    const colAlign = "c".repeat(t.columns.length);
    const headers = t.columns.map((c) => `$${c.label}$`).join(" & ");
    const rows = t.rows
      .map((r) => r.values.map((v) => (v ? "V" : "F")).join(" & ") + " \\\\")
      .join("\n");
    const latex = `\\begin{tabular}{${colAlign}}\n\\hline\n${headers} \\\\\n\\hline\n${rows}\n\\hline\n\\end{tabular}`;
    navigator.clipboard.writeText(latex);
    setCopiedText("LaTeX copiado ✓");
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <section className="grid gap-6">
      {/* Formula Input Card */}
      <div className="card p-6 md:p-8 border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-neon font-semibold">
              Laboratorio de Análisis
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              Resolver Tabla de Verdad
            </h1>
          </div>
          {state && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted">Clasificación:</span>
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-bold font-mono border uppercase tracking-wider ${
                  state.classificationClass === "tautology"
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : state.classificationClass === "contradiction"
                    ? "bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                }`}
              >
                {state.labelEs}
              </span>
            </div>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-300">
          Ingresa cualquier fórmula con conectores lógicos (<span className="font-mono text-neon">¬ ∧ ∨ → ↔ ⊕</span> o <span className="font-mono text-electric">NOT, AND, OR, XOR</span>). El motor la desglosará automáticamente.
        </p>

        {/* Input Bar */}
        <div className="mt-4 relative">
          <input
            ref={inputRef}
            className="input-mono text-lg md:text-xl font-bold py-3.5 pr-10"
            value={formula}
            onChange={(e) => {
              setFormula(e.target.value);
              setSelectedRow(0);
            }}
            placeholder="Ej: (p ∧ q) → (r ∨ ¬p)"
            aria-label="Fórmula proposicional"
            spellCheck={false}
          />
          {formula && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 font-mono text-sm p-1 rounded-md transition-colors"
              title="Borrar fórmula"
            >
              ✕
            </button>
          )}
        </div>

        {/* Virtual Logic Keyboard */}
        <div className="mt-3">
          <LogicKeyboard
            onInsert={handleInsert}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </div>

        {/* Example Presets */}
        <div className="mt-4 pt-3 border-t border-cyan-500/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted mr-1">Ejemplos:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.formula}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all border ${
                formula === ex.formula
                  ? "bg-cyan-500/20 border-neon text-neon font-bold shadow-glow-sm"
                  : "bg-void-950 border-white/10 text-slate-300 hover:border-cyan-500/30 hover:text-white"
              }`}
              onClick={() => {
                setFormula(ex.formula);
                setSelectedRow(0);
              }}
              title={ex.label}
            >
              {ex.formula}
            </button>
          ))}
        </div>

        {/* Error Alert with Hint */}
        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200 shadow-md">
            <div className="flex items-center gap-2 font-display font-semibold text-red-300">
              <span>⚠️ Error de sintaxis:</span>
              <span>{error.message}</span>
            </div>
            {error instanceof FormulaError && error.hint && (
              <p className="mt-1 text-xs text-red-300/80">
                Sugerencia: {error.hint}
                {error.position !== undefined ? ` (cerca de posición ${error.position})` : ""}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Main Results: Table & Step-by-Step Explanation */}
      {state ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Truth Table */}
          <div className="card overflow-hidden p-6 border-cyan-500/25 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/15 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted uppercase">Fórmula Normalizada:</span>
                  <span className="font-mono text-sm font-bold text-neon bg-void-950 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    {state.table.normalized}
                  </span>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyMarkdown}
                    className="btn-ghost border border-white/10"
                    title="Copiar tabla en formato Markdown"
                  >
                    Copiar MD
                  </button>
                  <button
                    onClick={copyLaTeX}
                    className="btn-ghost border border-white/10"
                    title="Copiar tabla en formato LaTeX"
                  >
                    LaTeX
                  </button>
                  {copiedText && (
                    <span className="text-xs font-mono text-neon font-semibold ml-1">
                      {copiedText}
                    </span>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-void-950/80">
                <table className="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr className="bg-void-900 border-b border-cyan-500/20">
                      <th className="px-2 py-2.5 text-center text-xs text-muted w-10">#</th>
                      {state.table.columns.map((col) => {
                        const isResult = col.kind === "result";
                        const isVar = col.kind === "variable";
                        return (
                          <th
                            key={col.id}
                            className={`px-3 py-2.5 text-center font-bold tracking-tight ${
                              isResult
                                ? "text-neon bg-cyan-500/10 border-x border-cyan-500/30"
                                : isVar
                                ? "text-cyan-300"
                                : "text-slate-200"
                            }`}
                          >
                            <span className="inline-block">{col.label}</span>
                            {isResult && (
                              <span className="block text-[9px] uppercase tracking-widest text-neon/70 font-sans">
                                Resultado
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {state.table.rows.map((row, i) => {
                      const isSelected = i === selectedRow;
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedRow(i)}
                          className={`cursor-pointer border-b border-white/5 transition-all ${
                            isSelected
                              ? "bg-cyan-500/20 shadow-[inset_0_0_20px_rgba(0,240,255,0.2)]"
                              : "hover:bg-cyan-500/5"
                          }`}
                        >
                          <td className="px-2 py-2 text-center text-xs text-muted select-none">
                            {isSelected ? (
                              <span className="text-neon font-bold">▶</span>
                            ) : (
                              i + 1
                            )}
                          </td>
                          {row.values.map((v, j) => {
                            const isResultCol = state.table.columns[j]?.kind === "result";
                            return (
                              <td
                                key={j}
                                className={`px-3 py-2 text-center ${
                                  isResultCol ? "bg-cyan-500/5 font-extrabold" : ""
                                }`}
                              >
                                <span className={v ? "cell-v" : "cell-f"}>
                                  {toVF(v)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-xs text-muted font-sans">
              <span>💡 Haz clic en cualquier fila para ver el desglose en el panel derecho.</span>
              <span>Total: {state.table.rows.length} combinaciones</span>
            </div>
          </div>

          {/* Step-by-Step Reasoner Side Panel */}
          <aside className="card p-6 border-cyan-500/25 flex flex-col">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-3">
              <div>
                <span className="text-[10px] font-mono text-neon uppercase tracking-wider font-semibold">
                  Desglose Pedagógico
                </span>
                <h2 className="font-display font-bold text-lg text-white">
                  Fila {selectedRow + 1} de {state.table.rows.length}
                </h2>
              </div>
              <span className="rounded-full bg-void-950 border border-cyan-500/20 px-2.5 py-1 text-xs font-mono text-muted-light">
                {Object.entries(state.table.rows[selectedRow]?.assignment ?? {})
                  .map(([k, v]) => `${k}=${toVF(v)}`)
                  .join(", ")}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Orden de evaluación de operadores y subexpresiones para esta asignación de variables:
            </p>

            <ol className="mt-3 grid gap-2.5 text-sm flex-1 overflow-y-auto max-h-[500px] pr-1">
              {steps.map((s, idx) => (
                <li
                  key={s.columnId}
                  className="rounded-xl bg-void-950/90 border border-cyan-500/15 p-3.5 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted uppercase">Paso {idx + 1}</span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        s.result
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-white/10"
                      }`}
                    >
                      {toVF(s.result)}
                    </span>
                  </div>
                  <p className="font-mono text-sm font-bold text-neon mt-1">
                    {s.label}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {s.reason}
                  </p>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
