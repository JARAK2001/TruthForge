import { useEffect, useMemo, useState } from "react";
import {
  buildTruthTable,
  classify,
  evaluate,
  parseFormula,
  toVF,
  type FormulaClass
} from "@truthforge/logic-engine";
import { LEVELS, type Exercise } from "../data/curriculum";
import { levelFor, useProgress } from "../lib/progress";
import { api, type ServerExercise, type ServerProgress } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

const CLASS_LABELS: Record<FormulaClass, string> = {
  tautology: "Tautología",
  contradiction: "Contradicción",
  contingency: "Contingencia"
};

export default function LearnPage() {
  const { progress, awardExercise, awardLevel } = useProgress();
  const { user, handleExpired } = useAuth();
  const [levelId, setLevelId] = useState(LEVELS[0]?.id as string);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [serverIds, setServerIds] = useState<Record<string, string>>({});
  const [serverProgress, setServerProgress] = useState<ServerProgress | null>(null);

  const currentIndex = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[currentIndex] ?? LEVELS[0]!;
  const prevLevel = currentIndex > 0 ? LEVELS[currentIndex - 1] : null;
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  useEffect(() => {
    if (!user) {
      setServerIds({});
      setServerProgress(null);
      return;
    }
    void api<ServerExercise[]>("/exercises", {}, handleExpired)
      .then((list) => {
        const map: Record<string, string> = {};
        for (const ex of list) {
          if (ex.slug) map[ex.slug] = ex.id;
        }
        setServerIds(map);
      })
      .catch(() => {});
    void api<ServerProgress>("/progress", {}, handleExpired)
      .then(setServerProgress)
      .catch(() => {});
  }, [user, handleExpired]);

  const syncAttempt = (slug: string, answer: unknown): void => {
    if (!user) return;
    const exerciseId = serverIds[slug];
    if (!exerciseId) return;
    void api<{ xpEarned: number }>("/attempts", {
      method: "POST",
      body: JSON.stringify({ exerciseId, answer })
    }, handleExpired)
      .then(() => api<ServerProgress>("/progress", {}, handleExpired).then(setServerProgress))
      .catch(() => {});
  };

  const example = useMemo(() => {
    try {
      return { ok: true as const, table: buildTruthTable(level.example) };
    } catch {
      return { ok: false as const };
    }
  }, [level]);

  const checkValue = (exId: string, formula: string, assignment: Record<string, boolean>, choice: boolean): boolean => {
    const expected = evaluate(parseFormula(formula).ast, assignment);
    const correct = expected === choice;
    if (correct) awardExercise(exId);
    setPicked((p) => ({ ...p, [exId]: toVF(choice) }));
    if (correct) syncAttempt(exId, choice);
    return correct;
  };

  const checkClass = (exId: string, formula: string, choice: FormulaClass): boolean => {
    const expected = classify(buildTruthTable(formula)).class;
    const correct = expected === choice;
    if (correct) awardExercise(exId);
    setPicked((p) => ({ ...p, [exId]: CLASS_LABELS[choice] }));
    if (correct) syncAttempt(exId, choice);
    return correct;
  };

  const shownXp = user && serverProgress ? serverProgress.xp : progress.xp;
  const shownLevel = user && serverProgress ? serverProgress.level : levelFor(progress.xp);
  const shownStreak = user && serverProgress ? serverProgress.streak : progress.streak;

  const totalExercises = LEVELS.reduce((acc, l) => acc + l.exercises.length, 0);
  const completedCount = progress.doneExercises.length;
  const progressPercent = Math.min(100, Math.round((completedCount / (totalExercises || 1)) * 100));

  return (
    <section className="grid gap-5 md:gap-6 lg:grid-cols-[280px_1fr] w-full min-w-0 max-w-full overflow-hidden">
      {/* Route & Progress Sidebar / Mobile Banner */}
      <aside className="card h-fit p-4 sm:p-5 border-cyan-500/25 w-full min-w-0 max-w-full overflow-hidden">
        <div className="border-b border-cyan-500/15 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-white text-base">Ruta de Lógica</span>
            <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-xs text-neon font-bold">
              Nv. {shownLevel}
            </span>
          </div>

          {/* XP & Streak Bar */}
          <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">{shownXp} XP Acumulados</span>
            <span className="text-amber-300 font-bold">🔥 Racha {shownStreak}</span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-void-950">
            <div
              className="h-full bg-gradient-to-r from-neon to-electric transition-all duration-500 shadow-glow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted text-right font-mono">
            {completedCount}/{totalExercises} ejercicios completados ({progressPercent}%)
          </p>
        </div>

        {/* Mobile Level Switcher & Carousel */}
        <div className="mt-3.5 lg:hidden w-full min-w-0 max-w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
              Seleccionar Módulo ({currentIndex + 1}/{LEVELS.length}):
            </span>
            <span className="text-[10px] font-mono text-cyan-400/80">Desliza ↔</span>
          </div>

          {/* Horizontal scrollable pills with snap */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth w-full min-w-0 max-w-full">
            {LEVELS.map((l, index) => {
              const isCurrent = l.id === level.id;
              const isDone = progress.doneLevels.includes(l.id);
              const cleanTitle = l.title.replace(/^\d+\s*·\s*/, "");
              return (
                <button
                  key={l.id}
                  onClick={() => setLevelId(l.id)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-mono transition-all border flex items-center gap-1.5 active:scale-95 ${
                    isCurrent
                      ? "bg-cyan-500/25 border-neon text-neon font-bold shadow-glow-sm"
                      : isDone
                      ? "bg-void-950/70 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70"
                      : "bg-void-950/70 border-white/5 text-slate-300 hover:border-cyan-500/20 hover:text-white"
                  }`}
                >
                  <span className="font-bold">#{index + 1}</span>
                  <span className="truncate max-w-[140px]">{cleanTitle}</span>
                  {isDone ? (
                    <span className="text-emerald-400 font-bold text-[11px]">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Vertical Level List */}
        <div className="hidden lg:block mt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
            Módulos del Curso:
          </span>
          <ol className="mt-2 grid gap-1.5">
            {LEVELS.map((l, index) => {
              const isCurrent = l.id === level.id;
              const isDone = progress.doneLevels.includes(l.id);
              const cleanTitle = l.title.replace(/^\d+\s*·\s*/, "");
              return (
                <li key={l.id}>
                  <button
                    onClick={() => setLevelId(l.id)}
                    className={`rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition-all border flex items-center justify-between gap-2 w-full ${
                      isCurrent
                        ? "bg-cyan-500/20 border-neon text-neon font-bold shadow-glow-sm"
                        : "bg-void-950/60 border-white/5 text-slate-300 hover:border-cyan-500/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-xs text-muted w-4">{index + 1}.</span>
                      <span className="truncate">{cleanTitle}</span>
                    </div>
                    {isDone ? (
                      <span className="text-emerald-400 font-bold text-xs ml-1">✓</span>
                    ) : (
                      <span className="text-muted/40 text-xs ml-1">○</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* Main Content & Exercises */}
      <div className="grid gap-5 md:gap-6 min-w-0 w-full max-w-full">
        {/* Module Detail Card */}
        <div className="card p-4 sm:p-6 md:p-8 border-cyan-500/30 min-w-0 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/15 pb-4">
            <div>
              <span className="text-xs font-mono text-neon uppercase font-bold tracking-wider">
                Módulo {currentIndex + 1} de {LEVELS.length}
              </span>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                {level.title}
              </h1>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-void-950 border border-cyan-500/30 px-3 py-1 font-mono text-xs text-cyan-300 font-semibold shadow-inner">
              +20 XP al completar
            </span>
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            {level.goal}
          </p>

          <div className="mt-4 rounded-2xl bg-void-950 border border-cyan-500/25 p-4 sm:p-5 shadow-inner">
            <span className="text-[10px] font-mono text-neon uppercase tracking-wider font-bold">
              Regla Lógica Fundamental:
            </span>
            <p className="mt-1 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed break-words">
              {level.rule}
            </p>
          </div>

          {/* Example Table */}
          {example.ok ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-void-950/70 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted uppercase font-bold tracking-wider">
                  Tabla Demostrativa:
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 sm:hidden">Desliza ↔</span>
              </div>
              <p className="font-mono text-xs font-bold text-neon mt-0.5 mb-2">
                {example.table.normalized}
              </p>
              <div className="overflow-x-auto rounded-xl border border-cyan-500/15 no-scrollbar">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-void-900/80 text-slate-300">
                      {example.table.columns.map((c) => (
                        <th key={c.id} className="px-3 py-2 text-center font-bold tracking-wider">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {example.table.rows.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {r.values.map((v, j) => (
                          <td key={j} className="px-3 py-2 text-center">
                            <span
                              className={`inline-block min-w-[24px] rounded px-1.5 py-0.5 font-bold ${
                                v ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                              }`}
                            >
                              {toVF(v)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Action & Navigation Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-cyan-500/15">
            <button
              className={`btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center justify-center gap-2 ${
                progress.doneLevels.includes(level.id)
                  ? "opacity-80 cursor-default bg-emerald-600/25 border-emerald-500 text-emerald-300"
                  : ""
              }`}
              onClick={() => awardLevel(level.id)}
              disabled={progress.doneLevels.includes(level.id)}
            >
              {progress.doneLevels.includes(level.id) ? (
                <>
                  <span>✓</span>
                  <span>Módulo estudiado (+20 XP ganados)</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Marcar módulo como estudiado (+20 XP)</span>
                </>
              )}
            </button>

            {/* Quick Next / Prev Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (prevLevel) {
                    setLevelId(prevLevel.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                disabled={!prevLevel}
                className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-void-900 px-3 py-2 text-xs font-mono font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
                title="Módulo anterior"
              >
                <span>←</span>
                <span>Anterior</span>
              </button>
              <button
                onClick={() => {
                  if (nextLevel) {
                    setLevelId(nextLevel.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                disabled={!nextLevel}
                className="flex-1 sm:flex-initial rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-mono font-bold text-neon hover:bg-cyan-500/20 hover:border-neon disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
                title="Siguiente módulo"
              >
                <span>Siguiente</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exercises Card */}
        <div className="card p-4 sm:p-6 md:p-8 border-cyan-500/25 min-w-0 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-3">
            <div>
              <span className="text-xs font-mono text-muted uppercase font-bold">Práctica Guiada</span>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white">
                Ejercicios Prácticos (+10 XP c/u)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-0.5 text-xs font-mono text-neon font-bold">
                {level.exercises.filter((ex) => progress.doneExercises.includes(ex.id)).length} / {level.exercises.length} Listos
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:gap-4">
            {level.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                picked={picked[ex.id]}
                done={progress.doneExercises.includes(ex.id)}
                onValue={(v) =>
                  ex.kind === "value" ? checkValue(ex.id, ex.formula, ex.assignment, v) : false
                }
                onClass={(c) => (ex.kind === "classify" ? checkClass(ex.id, ex.formula, c) : false)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExerciseCard(props: {
  ex: Exercise;
  picked?: string;
  done: boolean;
  onValue: (v: boolean) => boolean;
  onClass: (c: FormulaClass) => boolean;
}) {
  const [result, setResult] = useState<boolean | undefined>(undefined);
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-void-950/80 p-4 sm:p-5 hover:border-cyan-500/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-sm sm:text-base text-slate-100 font-medium">
          {props.ex.prompt}
        </p>
        {props.done && (
          <span className="self-start sm:self-auto shrink-0 rounded-full bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
            Completado ✓
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {props.ex.kind === "value"
          ? ([true, false] as const).map((v) => {
              const label = toVF(v);
              const isSelected = props.picked === label;
              return (
                <button
                  key={label}
                  className={`flex-1 sm:flex-initial min-w-[72px] rounded-xl border py-2.5 px-5 font-mono text-base font-bold transition-all active:scale-95 text-center ${
                    isSelected
                      ? "border-neon bg-cyan-500/25 text-neon shadow-glow-sm"
                      : "border-cyan-500/30 bg-void-900 text-cyan-200 hover:border-neon hover:text-neon hover:bg-cyan-500/20"
                  }`}
                  onClick={() => setResult(props.onValue(v))}
                >
                  {label}
                </button>
              );
            })
          : (Object.keys(CLASS_LABELS) as FormulaClass[]).map((c) => {
              const label = CLASS_LABELS[c];
              const isSelected = props.picked === label;
              return (
                <button
                  key={c}
                  className={`flex-1 sm:flex-initial min-w-[110px] rounded-xl border py-2.5 px-3.5 text-xs sm:text-sm font-mono font-bold transition-all active:scale-95 text-center ${
                    isSelected
                      ? "border-neon bg-cyan-500/25 text-neon shadow-glow-sm"
                      : "border-cyan-500/30 bg-void-900 text-cyan-200 hover:border-neon hover:text-neon hover:bg-cyan-500/20"
                  }`}
                  onClick={() => setResult(props.onClass(c))}
                >
                  {label}
                </button>
              );
            })}
      </div>

      {props.picked && result !== undefined ? (
        <div
          className={`mt-3.5 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm font-medium border flex items-start gap-2 ${
            result
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : "border-red-500/40 bg-red-950/40 text-red-200"
          }`}
          role="status"
        >
          <span className="text-base leading-none">{result ? "✨" : "❌"}</span>
          <span>
            {result
              ? "¡Respuesta correcta! Has sumado +10 XP a tu cuenta."
              : "Incorrecto. Revisa la regla del módulo e inténtalo de nuevo."}
          </span>
        </div>
      ) : null}
    </div>
  );
}
