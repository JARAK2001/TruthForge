import { useState } from "react";
import { Link } from "react-router-dom";
import { buildTruthTable, classify } from "@truthforge/logic-engine";

const QUICK_TESTS = [
  "p ∧ q → r",
  "(p → r) ∨ ¬(p → q)",
  "p ∨ ¬p",
  "¬(p ∧ q) ↔ (¬p ∨ ¬q)"
];

export default function HomePage() {
  const [testFormula, setTestFormula] = useState(QUICK_TESTS[0] as string);

  const previewResult = (() => {
    try {
      const table = buildTruthTable(testFormula);
      const classification = classify(table);
      return {
        ok: true as const,
        table,
        labelEs: classification.labelEs,
        isTautology: classification.class === "tautology",
        isContradiction: classification.class === "contradiction"
      };
    } catch {
      return { ok: false as const };
    }
  })();

  return (
    <div className="grid gap-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-void-850 via-void-900 to-void-950 p-6 md:p-10 shadow-card">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Hero Text */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-neon shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="h-2 w-2 rounded-full bg-neon animate-pulse" />
              LABORATORIO DE LÓGICA PROPOSICIONAL · v2.0
            </div>

            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:leading-tight">
              Domina las <span className="bg-gradient-to-r from-neon via-cyan-300 to-electric bg-clip-text text-transparent">tablas de verdad</span> resolviendo
            </h1>

            <p className="mt-4 text-base text-slate-300 sm:text-lg leading-relaxed max-w-xl">
              Un entorno interactivo para estudiantes y entusiastas de la lógica. Comprende cada paso formal, celda por celda, y conecta la teoría matemática con circuitos de compuertas lógicas vivas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/resolver" className="btn-primary text-sm">
                <span>Abrir el Laboratorio</span>
                <span className="font-mono">→</span>
              </Link>
              <Link to="/simulador" className="btn-secondary text-sm">
                <span className="text-neon">⚡</span>
                <span>Simulador de Compuertas</span>
              </Link>
              <Link to="/guiado" className="nav-link border border-cyan-500/20 text-sm">
                Construye conmigo
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="mt-8 pt-6 border-t border-cyan-500/15 grid grid-cols-3 gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-neon">100%</p>
                <p className="text-xs text-muted">Didáctico y formal</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-emerald-400">8+</p>
                <p className="text-xs text-muted">Operadores lógicos</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-electric">Circuitos</p>
                <p className="text-xs text-muted">Simulador visual</p>
              </div>
            </div>
          </div>

          {/* Right Hero Image Frame */}
          <div className="lg:col-span-5">
            <div className="group relative rounded-2xl border border-cyan-500/30 bg-void-950 p-2 shadow-card hover:border-cyan-400/60 transition-all duration-500">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                <img
                  src="/assets/hero_core.jpg"
                  alt="TruthForge Holographic Core"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-transparent to-transparent opacity-80" />
                
                {/* Floating Chips inside Image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono">
                  <span className="rounded-lg bg-void-950/90 border border-cyan-500/40 px-2.5 py-1 text-neon backdrop-blur-md shadow-sm">
                    Nucleo Lógico Activo
                  </span>
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-2 py-1 text-emerald-300 font-bold backdrop-blur-md">
                    2ⁿ Combinaciones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Interactive Formula Tester */}
      <section className="card p-6 md:p-8 border-cyan-500/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span className="text-neon font-mono">⚡</span> Prueba Rápida de Proposiciones
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Escribe o selecciona cualquier expresión para ver su clasificación formal al instante.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TESTS.map((f) => (
              <button
                key={f}
                onClick={() => setTestFormula(f)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all ${
                  testFormula === f
                    ? "bg-cyan-500/20 text-neon border border-neon font-semibold"
                    : "bg-void-950 text-slate-400 border border-white/5 hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_260px] items-center">
          <input
            className="input-mono text-base"
            value={testFormula}
            onChange={(e) => setTestFormula(e.target.value)}
            placeholder="Ej: (p ∨ q) ∧ ¬p"
            spellCheck={false}
          />

          {previewResult.ok ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-void-950 border border-cyan-500/20">
              <div className="text-left">
                <span className="text-[10px] font-mono text-muted uppercase">Clasificación:</span>
                <p className="font-display text-sm font-bold text-neon">
                  {previewResult.labelEs}
                </p>
              </div>
              <Link
                to="/resolver"
                className="rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-xs font-mono font-semibold text-neon hover:bg-neon hover:text-void-950 transition-colors"
              >
                Ver Tabla →
              </Link>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              Fórmula con sintaxis inválida
            </div>
          )}
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Resolver & Explicar",
            detail: "Generación completa de tablas con explicación paso a paso por celda y fila seleccionada.",
            badge: "Didáctico",
            link: "/resolver",
            color: "text-neon"
          },
          {
            title: "Simulador de Compuertas",
            detail: "Circuitos electrónicos digitales con señales en vivo y compuertas AND, OR, NOT, NAND y XOR.",
            badge: "Nuevo",
            link: "/simulador",
            color: "text-emerald-400"
          },
          {
            title: "Construye Conmigo",
            detail: "Aprende resolviendo columna a columna, de proposiciones simples a fórmulas complejas.",
            badge: "Guiado",
            link: "/guiado",
            color: "text-electric"
          },
          {
            title: "Constructor & Equivalencias",
            detail: "Compara si dos expresiones son lógicamente idénticas o descubre contraejemplos exactos.",
            badge: "Analítico",
            link: "/constructor",
            color: "text-purple-400"
          }
        ].map((f) => (
          <Link
            key={f.title}
            to={f.link}
            className="group card p-6 card-hoverable flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-muted-light group-hover:text-neon transition-colors">
                  MÓDULO
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  {f.badge}
                </span>
              </div>
              <h3 className={`font-display text-lg font-bold ${f.color} group-hover:brightness-120 transition-all`}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {f.detail}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-muted group-hover:text-neon">
              <span>Explorar módulo</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Simulator Highlight Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-void-900 p-6 md:p-8 shadow-card">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-4 overflow-hidden rounded-2xl border border-cyan-500/20">
            <img
              src="/assets/circuit_art.jpg"
              alt="Circuit Simulator Art"
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
          <div className="md:col-span-8">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Conexión Hardware & Matemáticas
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              ¿Sabías que toda tabla de verdad es un circuito físico?
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              En TruthForge puedes alternar entre la notación formal matemática (<span className="font-mono text-neon">p ∧ q</span>) y las compuertas de silicio (<span className="font-mono text-emerald-400">AND, OR, NOT</span>) que dan vida a los procesadores modernos.
            </p>
            <div className="mt-4 flex gap-3">
              <Link to="/simulador" className="btn-primary text-xs">
                Abrir Simulador de Compuertas
              </Link>
              <Link to="/aprender" className="btn-secondary text-xs">
                Ruta de Aprendizaje
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
