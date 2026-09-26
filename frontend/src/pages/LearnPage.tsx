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
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]!;

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
    <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Route & Progress Sidebar */}
      <aside className="card h-fit p-5 border-cyan-500/25">
        <div className="border-b border-cyan-500/15 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-white text-base">Ruta de Lógica</span>
            <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 font-mono text-xs text-neon font-bold">
              Nv. {shownLevel}
            </span>
          </div>

          {/* XP & Streak Bar */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
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

        {/* Level List */}
        <div className="mt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
            Módulos del Curso:
          </span>
          <ol className="mt-2 flex lg:grid gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
            {LEVELS.map((l, index) => {
              const isCurrent = l.id === level.id;
              const isDone = progress.doneLevels.includes(l.id);
              return (
                <li key={l.id} className="shrink-0 lg:shrink">
                  <button
                    onClick={() => setLevelId(l.id)}
                    className={`rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition-all border flex items-center justify-between gap-2 whitespace-nowrap lg:whitespace-normal w-auto lg:w-full ${
                      isCurrent
                        ? "bg-cyan-500/20 border-neon text-neon font-bold shadow-glow-sm"
                        : "bg-void-950/60 border-white/5 text-slate-300 hover:border-cyan-500/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-xs text-muted w-4">{index + 1}.</span>
                      <span className="truncate">{l.title}</span>
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
      <div className="grid gap-6">
        {/* Module Detail Card */}
        <div className="card p-6 md:p-8 border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <span className="text-xs font-mono text-neon uppercase font-bold tracking-wider">
                Módulo Activo
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
                {level.title}
              </h1>
            </div>
            <span className="rounded-full bg-void-950 border border-white/10 px-3 py-1 font-mono text-xs text-muted-light">
              +20 XP al completar
            </span>
          </div>

          <p className="mt-4 text-base text-slate-200 leading-relaxed font-medium">
            {level.goal}
          </p>

          <div className="mt-4 rounded-2xl bg-void-950 border border-cyan-500/25 p-5 shadow-inner">
            <span className="text-[10px] font-mono text-neon uppercase tracking-wider font-bold">
              Regla Lógica Fundamental:
            </span>
            <p className="mt-1 text-sm text-slate-100 font-mono leading-relaxed">
              {level.rule}
            </p>
          </div>

          {/* Example Table */}
          {example.ok ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-void-950/70 p-4">
              <span className="text-[11px] font-mono text-muted uppercase">Tabla Demostrativa:</span>
              <p className="font-mono text-xs font-bold text-neon mt-0.5 mb-2">
                {example.table.normalized}
              </p>
              <div className="overflow-x-auto">
                <table className="border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyan-500/20 text-slate-400">
                      {example.table.columns.map((c) => (
                        <th key={c.id} className="px-3 py-1 text-center">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {example.table.rows.map((r, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {r.values.map((v, j) => (
                          <td key={j} className="px-3 py-1 text-center">
                            <span className={v ? "text-emerald-400 font-bold" : "text-slate-500"}>
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

          <div className="mt-6 flex items-center justify-between">
            <button
              className={`btn-primary text-xs ${
                progress.doneLevels.includes(level.id) ? "opacity-60 cursor-default" : ""
              }`}
              onClick={() => awardLevel(level.id)}
              disabled={progress.doneLevels.includes(level.id)}
            >
              {progress.doneLevels.includes(level.id)
                ? "Módulo estudiado ✓ (+20 XP ganados)"
                : "Marcar módulo como estudiado (+20 XP)"}
            </button>
          </div>
        </div>

        {/* Exercises Card */}
        <div className="card p-6 md:p-8 border-cyan-500/25">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-3">
            <div>
              <span className="text-xs font-mono text-muted uppercase font-bold">Práctica Guiada</span>
              <h2 className="font-display font-bold text-lg text-white">
                Ejercicios Prácticos (+10 XP c/u)
              </h2>
            </div>
            <span className="text-xs font-mono text-neon">
              {level.exercises.filter((ex) => progress.doneExercises.includes(ex.id)).length} / {level.exercises.length} Listos
            </span>
          </div>

          <div className="mt-4 grid gap-4">
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
    <div className="rounded-2xl border border-cyan-500/20 bg-void-950/80 p-5 hover:border-cyan-500/40 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-100 font-medium">
          {props.ex.prompt}
        </p>
        {props.done && (
          <span className="rounded-full bg-emerald-500/20 border border-emerald-400 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
            Completado ✓
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {props.ex.kind === "value"
          ? ([true, false] as const).map((v) => (
              <button
                key={toVF(v)}
                className="rounded-xl border border-cyan-500/30 bg-void-900 px-4 py-1.5 font-mono text-sm font-bold text-cyan-200 hover:border-neon hover:text-neon hover:bg-cyan-500/20 active:scale-95 transition-all"
                onClick={() => setResult(props.onValue(v))}
              >
                {toVF(v)}
              </button>
            ))
          : (Object.keys(CLASS_LABELS) as FormulaClass[]).map((c) => (
              <button
                key={c}
                className="rounded-xl border border-cyan-500/30 bg-void-900 px-4 py-1.5 text-xs font-mono font-bold text-cyan-200 hover:border-neon hover:text-neon hover:bg-cyan-500/20 active:scale-95 transition-all"
                onClick={() => setResult(props.onClass(c))}
              >
                {CLASS_LABELS[c]}
              </button>
            ))}
      </div>

      {props.picked && result !== undefined ? (
        <div
          className={`mt-3 rounded-xl p-3 text-xs font-medium border ${
            result
              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
              : "border-red-500/40 bg-red-950/40 text-red-200"
          }`}
          role="status"
        >
          {result
            ? "✨ ¡Respuesta correcta! Has sumado +10 XP a tu cuenta."
            : "❌ Incorrecto. Revisa detenidamente la regla del módulo e inténtalo de nuevo."}
        </div>
      ) : null}
    </div>
  );
}
