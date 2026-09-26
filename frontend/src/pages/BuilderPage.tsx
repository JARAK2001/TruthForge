import { useMemo, useState } from "react";
import {
  buildTruthTable,
  classify,
  equivalentTables,
  toVF,
  type TruthTable
} from "@truthforge/logic-engine";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import LogicKeyboard from "../components/LogicKeyboard";

const CLASSIC_EQUIVALENCES: { name: string; a: string; b: string; rule: string }[] = [
  {
    name: "Leyes de De Morgan (AND)",
    a: "¬(p ∧ q)",
    b: "¬p ∨ ¬q",
    rule: "La negación de una conjunción es la disyunción de las negaciones."
  },
  {
    name: "Leyes de De Morgan (OR)",
    a: "¬(p ∨ q)",
    b: "¬p ∧ ¬q",
    rule: "La negación de una disyunción es la conjunción de las negaciones."
  },
  {
    name: "Implicación Material",
    a: "p → q",
    b: "¬p ∨ q",
    rule: "p implica q equivale a que p sea falso o q sea verdadero."
  },
  {
    name: "Ley Contrapositiva",
    a: "p → q",
    b: "¬q → ¬p",
    rule: "La implicación directa tiene idéntico valor de verdad que su contrapositiva."
  },
  {
    name: "Definición de Bicondicional",
    a: "p ↔ q",
    b: "(p → q) ∧ (q → p)",
    rule: "El bicondicional equivale a la doble implicación simultánea."
  },
  {
    name: "No Equivalente (Trampa Frecuente)",
    a: "p → q",
    b: "q → p",
    rule: "La conversa (q → p) NO equivale a la implicación original (p → q)."
  }
];

function tryBuild(formula: string): { ok: true; value: TruthTable } | { ok: false; error: Error } {
  try {
    return { ok: true, value: buildTruthTable(formula) };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

/** Primera asignación donde difieren (contraejemplo pedagógico). */
function counterexample(a: TruthTable, b: TruthTable): { assignment: Record<string, boolean>; rowIndex: number; valA: boolean; valB: boolean } | undefined {
  for (let i = 0; i < a.rows.length; i++) {
    const ra = a.rows[i]?.values[a.columns.length - 1] as boolean;
    const rb = b.rows[i]?.values[b.columns.length - 1] as boolean;
    if (ra !== rb) {
      return {
        assignment: a.rows[i]?.assignment ?? {},
        rowIndex: i,
        valA: ra,
        valB: rb
      };
    }
  }
  return undefined;
}

export default function BuilderPage() {
  const { handleExpired } = useAuth();
  const [fa, setFa] = useState(CLASSIC_EQUIVALENCES[0]!.a);
  const [fb, setFb] = useState(CLASSIC_EQUIVALENCES[0]!.b);
  const [activeInput, setActiveInput] = useState<"A" | "B">("A");
  const [saved, setSaved] = useState("");
  const [saveError, setSaveError] = useState("");

  const a = useMemo(() => tryBuild(fa), [fa]);
  const b = useMemo(() => tryBuild(fb), [fb]);
  const comparable = a.ok && b.ok && a.value.variables.join(",") === b.value.variables.join(",");
  const equivalent = comparable && a.ok && b.ok ? equivalentTables(a.value, b.value) : false;
  const counter = comparable && a.ok && b.ok && !equivalent ? counterexample(a.value, b.value) : undefined;

  const handleInsert = (symbol: string) => {
    if (activeInput === "A") setFa((prev) => prev + symbol);
    else setFb((prev) => prev + symbol);
  };

  const handleBackspace = () => {
    if (activeInput === "A") setFa((prev) => prev.slice(0, -1));
    else setFb((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (activeInput === "A") setFa("");
    else setFb("");
  };

  const saveA = async (): Promise<void> => {
    setSaved("");
    setSaveError("");
    if (!a.ok) return;
    try {
      await api("/exercises", {
        method: "POST",
        body: JSON.stringify({
          prompt: `Completa la tabla de ${a.value.normalized}`,
          formula: a.value.normalized,
          kind: "table"
        })
      }, handleExpired);
      setSaved("¡Ejercicio guardado exitosamente en tu perfil! ✓");
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "No se pudo guardar.");
    }
  };

  return (
    <section className="grid gap-6">
      {/* Top Banner & Inputs */}
      <div className="card p-6 md:p-8 border-cyan-500/30">
        <span className="font-mono text-xs uppercase tracking-wider text-neon font-semibold">
          Laboratorio de Equivalencias Lógicas
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
          Constructor de Expresiones & Validador ≡
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          ¿Dos proposiciones son lógicamente equivalentes en todas las filas de su tabla de verdad? Ponlas a prueba o descubre el contraejemplo exacto.
        </p>

        {/* Inputs A and B */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Formula A */}
          <div
            onClick={() => setActiveInput("A")}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeInput === "A"
                ? "bg-void-900 border-neon shadow-glow-sm"
                : "bg-void-950 border-white/10 hover:border-cyan-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-neon uppercase">
                Fórmula A {activeInput === "A" ? "(Editando)" : ""}
              </span>
              {a.ok && (
                <span className="text-[10px] font-mono text-muted bg-void-950 px-2 py-0.5 rounded border border-white/5">
                  {classify(a.value).labelEs}
                </span>
              )}
            </div>
            <input
              className="input-mono text-base font-bold"
              value={fa}
              onChange={(e) => setFa(e.target.value)}
              onFocus={() => setActiveInput("A")}
              spellCheck={false}
              aria-label="Fórmula A"
              placeholder="Ej: ¬(p ∧ q)"
            />
            {!a.ok && (
              <p className="mt-2 text-xs text-red-300">⚠️ {a.error.message}</p>
            )}
          </div>

          {/* Formula B */}
          <div
            onClick={() => setActiveInput("B")}
            className={`rounded-2xl p-4 border transition-all cursor-pointer ${
              activeInput === "B"
                ? "bg-void-900 border-electric shadow-glow-electric"
                : "bg-void-950 border-white/10 hover:border-electric/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-electric uppercase">
                Fórmula B {activeInput === "B" ? "(Editando)" : ""}
              </span>
              {b.ok && (
                <span className="text-[10px] font-mono text-muted bg-void-950 px-2 py-0.5 rounded border border-white/5">
                  {classify(b.value).labelEs}
                </span>
              )}
            </div>
            <input
              className="input-mono text-base font-bold"
              value={fb}
              onChange={(e) => setFb(e.target.value)}
              onFocus={() => setActiveInput("B")}
              spellCheck={false}
              aria-label="Fórmula B"
              placeholder="Ej: ¬p ∨ ¬q"
            />
            {!b.ok && (
              <p className="mt-2 text-xs text-red-300">⚠️ {b.error.message}</p>
            )}
          </div>
        </div>

        {/* Virtual Keyboard */}
        <div className="mt-4">
          <LogicKeyboard
            onInsert={handleInsert}
            onBackspace={handleBackspace}
            onClear={handleClear}
            compact
          />
        </div>

        {/* Classic Equivalence Presets */}
        <div className="mt-5 pt-4 border-t border-cyan-500/15">
          <span className="text-xs font-mono text-muted">Leyes Lógicas Notables:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLASSIC_EQUIVALENCES.map((eq) => (
              <button
                key={eq.name}
                className="rounded-lg px-2.5 py-1.5 text-xs font-mono border border-cyan-500/20 bg-void-950 text-slate-300 hover:border-neon hover:text-neon hover:bg-cyan-500/10 transition-all"
                onClick={() => {
                  setFa(eq.a);
                  setFb(eq.b);
                }}
                title={eq.rule}
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>

        {/* Warning if variables mismatch */}
        {a.ok && b.ok && !comparable ? (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200">
            ⚠️ Variables dispares: Fórmula A usa ({a.value.variables.join(", ")}) mientras que Fórmula B usa ({b.value.variables.join(", ")}). Para verificar equivalencia deben compartir las mismas variables proposicionales.
          </div>
        ) : null}
      </div>

      {/* Comparison Results Card */}
      {a.ok && b.ok && comparable ? (
        <div className="card p-6 md:p-8 border-cyan-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4">
            <div>
              <span className="text-xs font-mono text-muted">Veredicto Formal:</span>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-display font-bold border ${
                    equivalent
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  }`}
                  role="status"
                >
                  <span>{equivalent ? "✓ FÓRMULAS EQUIVALENTES (A ≡ B)" : "✗ NO EQUIVALENTES (A ≢ B)"}</span>
                </span>
              </div>
            </div>

            <div className="text-xs font-mono text-muted-light">
              <span>{a.value.normalized}</span> <span className="text-neon font-bold">vs</span> <span>{b.value.normalized}</span>
            </div>
          </div>

          {/* Counterexample Highlight if not equivalent */}
          {counter ? (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/30 p-5">
              <span className="font-mono text-xs uppercase tracking-wider text-red-400 font-bold">
                Contraejemplo Encontrado (Fila {counter.rowIndex + 1}):
              </span>
              <p className="mt-1 text-sm text-slate-200">
                Las fórmulas entregan resultados opuestos para la siguiente asignación de verdad:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 bg-void-950 p-3 rounded-xl border border-red-500/20 font-mono text-sm">
                <div>
                  <span className="text-muted">Asignación: </span>
                  <span className="text-white font-bold">
                    {Object.entries(counter.assignment)
                      .map(([k, v]) => `${k}=${toVF(v)}`)
                      .join(", ")}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div>
                  <span className="text-neon">A: </span>
                  <span className="cell-v">{toVF(counter.valA)}</span>
                </div>
                <div>
                  <span className="text-electric">B: </span>
                  <span className="cell-f">{toVF(counter.valB)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Synchronized Comparative Truth Table */}
          <div className="mt-6">
            <h3 className="font-display text-sm font-bold text-slate-200 mb-2">
              Tabla de Verdad Comparativa (Fila por fila):
            </h3>
            <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-void-950/80">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="bg-void-900 border-b border-cyan-500/20 text-slate-300">
                    <th className="p-2 text-center text-xs text-muted w-10">#</th>
                    {a.value.variables.map((v) => (
                      <th key={v} className="p-2 text-center text-cyan-300 font-bold">
                        {v}
                      </th>
                    ))}
                    <th className="p-2 text-center text-neon font-bold border-l border-cyan-500/20">
                      A: {a.value.normalized}
                    </th>
                    <th className="p-2 text-center text-electric font-bold border-l border-cyan-500/20">
                      B: {b.value.normalized}
                    </th>
                    <th className="p-2 text-center text-xs font-bold border-l border-cyan-500/20">
                      ¿Coinciden?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a.value.rows.map((rowA, i) => {
                    const rowB = b.value.rows[i]!;
                    const valA = rowA.values[a.value.columns.length - 1] as boolean;
                    const valB = rowB.values[b.value.columns.length - 1] as boolean;
                    const match = valA === valB;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-white/5 transition-colors ${
                          !match ? "bg-red-500/10" : "hover:bg-white/5"
                        }`}
                      >
                        <td className="p-2 text-center text-xs text-muted">{i + 1}</td>
                        {a.value.variables.map((v) => (
                          <td key={v} className="p-2 text-center">
                            <span className={rowA.assignment[v] ? "text-emerald-400" : "text-slate-500"}>
                              {toVF(rowA.assignment[v] as boolean)}
                            </span>
                          </td>
                        ))}
                        <td className="p-2 text-center border-l border-cyan-500/20">
                          <span className={valA ? "cell-v" : "cell-f"}>{toVF(valA)}</span>
                        </td>
                        <td className="p-2 text-center border-l border-cyan-500/20">
                          <span className={valB ? "cell-v" : "cell-f"}>{toVF(valB)}</span>
                        </td>
                        <td className="p-2 text-center border-l border-cyan-500/20">
                          <span className={match ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {match ? "✓" : "✗"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Exercise to Profile */}
          <div className="mt-6 pt-4 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-3">
            <button className="btn-primary text-xs" onClick={() => void saveA()}>
              Guardar Problema A en Mi Cuenta
            </button>
            {saved ? (
              <span className="text-xs font-mono text-emerald-400 font-semibold" role="status">
                {saved}
              </span>
            ) : null}
            {saveError ? (
              <span className="text-xs font-mono text-red-300" role="alert">
                {saveError}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
