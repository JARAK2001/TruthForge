/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta TruthForge (PRD + img/colores.png)
        void: {
          950: "#030712", // fondo principal
          900: "#070e1c", // espacio de trabajo profundo
          850: "#0b1528", // paneles y contenedores
          800: "#101d36", // tarjetas
          700: "#1a2c4e"  // bordes y divisores
        },
        neon: {
          DEFAULT: "#00F0FF", // cyan neón: acciones principales
          glow: "#38f8ff",
          dark: "#00b4cc"
        },
        electric: {
          DEFAULT: "#0EA5E9", // azul eléctrico: elementos activos
          hover: "#38bdf8",
          dark: "#0284c7"
        },
        muted: {
          DEFAULT: "#64748B", // gris azulado: texto secundario
          light: "#94A3B8"
        },
        gate: {
          and: "#10B981",   // AND verde esmeralda
          or: "#06B6D4",    // OR cian
          not: "#A855F7",   // NOT púrpura neón
          nand: "#F59E0B",  // NAND naranja ámbar
          xor: "#3B82F6",   // XOR azul royal
          nor: "#EC4899",   // NOR rosa neón
          xnor: "#8B5CF6"   // XNOR violeta
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"]
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 240, 255, 0.35)",
        "glow-sm": "0 0 12px rgba(0, 240, 255, 0.25)",
        "glow-lg": "0 0 45px rgba(0, 240, 255, 0.45)",
        "glow-electric": "0 0 25px rgba(14, 165, 233, 0.4)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.4)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.4)",
        card: "0 0 0 1px rgba(0, 240, 255, 0.12), 0 8px 32px rgba(2, 8, 23, 0.7)",
        "card-hover": "0 0 0 1px rgba(0, 240, 255, 0.35), 0 12px 40px rgba(0, 240, 255, 0.15)"
      },
      backgroundImage: {
        'cyber-grid': "radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)"
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-flow': 'signalFlow 2s linear infinite'
      }
    }
  },
  plugins: []
};
