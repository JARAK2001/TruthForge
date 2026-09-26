interface LogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
}

export default function TruthForgeLogo({
  size = 36,
  className = "",
  withText = false
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Vector Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_10px_rgba(0,240,255,0.45)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="tf-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="tf-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b172d" />
            <stop offset="100%" stopColor="#050a16" />
          </linearGradient>
          <filter id="tf-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagonal Shield */}
        <polygon
          points="50,4 90,26 90,74 50,96 10,74 10,26"
          fill="url(#tf-bg-grad)"
          stroke="url(#tf-cyan-grad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Inner Anvil / Forge Base Horn */}
        <path
          d="M 24 72 L 76 72 L 70 62 L 60 62 L 56 52 L 44 52 L 40 62 L 30 62 Z"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="2.5"
          opacity="0.85"
        />

        {/* AND Logic Gate in Center */}
        {/* Input wires */}
        <line x1="26" y1="36" x2="38" y2="36" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="46" x2="38" y2="46" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
        {/* Logic Gate Body */}
        <path
          d="M 38 30 L 52 30 C 64 30, 68 36, 68 41 C 68 46, 64 52, 52 52 L 38 52 Z"
          fill="rgba(0, 240, 255, 0.12)"
          stroke="#00F0FF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Output Wire */}
        <line x1="68" y1="41" x2="80" y2="41" stroke="#00F0FF" strokeWidth="3.5" strokeLinecap="round" />

        {/* Forge Energy Spark on Output */}
        <path
          d="M 76 34 L 84 41 L 76 48 L 79 41 Z"
          fill="#38bdf8"
          filter="url(#tf-glow)"
        />

        {/* Logic Signal Dots (HIGH / 1) */}
        <circle cx="26" cy="36" r="3" fill="#10B981" />
        <circle cx="26" cy="46" r="3" fill="#10B981" />
        <circle cx="80" cy="41" r="3.5" fill="#00F0FF" filter="url(#tf-glow)" />
      </svg>

      {/* Brand Typography */}
      {withText && (
        <div className="flex flex-col text-left">
          <span className="font-display text-xl font-extrabold tracking-tight text-white leading-none">
            Truth<span className="text-neon">Forge</span>
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-light mt-0.5">
            Logic Lab
          </span>
        </div>
      )}
    </div>
  );
}
