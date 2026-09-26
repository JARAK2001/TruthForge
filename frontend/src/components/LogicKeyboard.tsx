interface LogicKeyboardProps {
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  compact?: boolean;
}

export default function LogicKeyboard({
  onInsert,
  onBackspace,
  onClear,
  compact = false
}: LogicKeyboardProps) {
  const variables = ["p", "q", "r", "s"];

  const operators = [
    { symbol: "¬", name: "Negación", tip: "NOT (¬)" },
    { symbol: "∧", name: "Conjunción", tip: "AND (∧)" },
    { symbol: "∨", name: "Disyunción", tip: "OR (∨)" },
    { symbol: "→", name: "Condicional", tip: "IMPLICA (→)" },
    { symbol: "↔", name: "Bicondicional", tip: "SI Y SOLO SI (↔)" },
    { symbol: "⊕", name: "XOR", tip: "O EXCLUSIVA (⊕)" },
    { symbol: "(", name: "Abrir", tip: "Paréntesis (" },
    { symbol: ")", name: "Cerrar", tip: "Paréntesis )" },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-void-950/70 border border-cyan-500/20 backdrop-blur-sm ${compact ? "text-xs" : ""}`}>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-light/70 mr-1 hidden sm:inline">
        Teclado Lógico:
      </span>

      {/* Variables */}
      <div className="flex items-center gap-1 bg-void-900/80 p-0.5 rounded-lg border border-cyan-500/10">
        {variables.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onInsert(v)}
            title={`Variable ${v}`}
            className="h-8 min-w-[28px] px-2 rounded-md bg-void-850 hover:bg-cyan-500/20 text-cyan-300 hover:text-neon font-mono font-bold text-sm border border-cyan-500/20 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="h-5 w-[1px] bg-cyan-500/20 mx-0.5" />

      {/* Operators */}
      <div className="flex flex-wrap items-center gap-1">
        {operators.map((op) => (
          <button
            key={op.symbol}
            type="button"
            onClick={() => onInsert(` ${op.symbol} `)}
            title={`${op.name} — ${op.tip}`}
            className="group relative h-8 min-w-[32px] px-2.5 rounded-md bg-void-850 hover:bg-cyan-500/20 text-slate-100 hover:text-neon font-mono font-bold text-sm border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-glow-sm transition-all hover:scale-105 active:scale-95"
          >
            {op.symbol}
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded bg-void-900 border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-sans text-cyan-200 z-30 shadow-md">
              {op.name}
            </span>
          </button>
        ))}
      </div>

      <div className="h-5 w-[1px] bg-cyan-500/20 mx-0.5" />

      {/* Control keys */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          type="button"
          onClick={onBackspace}
          title="Borrar carácter anterior"
          className="h-8 px-2.5 rounded-md bg-void-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 font-mono text-xs border border-white/10 hover:border-red-500/30 transition-all"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Limpiar fórmula"
          className="h-8 px-2.5 rounded-md bg-void-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-sans text-xs border border-white/10 transition-all"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
