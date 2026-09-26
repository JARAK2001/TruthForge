import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function AuthPage() {
  const { user, login, register, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  if (user) {
    return (
      <section className="card mx-auto max-w-lg p-6 md:p-8 border-cyan-500/30">
        <div className="flex items-center gap-3 border-b border-cyan-500/15 pb-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-display font-black text-xl text-neon shadow-glow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{user.name}</h1>
            <p className="text-xs font-mono text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-void-950 p-4 border border-cyan-500/20">
            <span className="text-[10px] font-mono uppercase text-muted">Experiencia Total</span>
            <p className="font-display text-2xl font-bold text-neon mt-0.5">{user.xp} XP</p>
          </div>
          <div className="rounded-xl bg-void-950 p-4 border border-cyan-500/20">
            <span className="text-[10px] font-mono uppercase text-muted">Estado de Sesión</span>
            <p className="font-display text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              Sincronizado
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-cyan-500/15 flex items-center justify-between">
          <span className="text-xs text-muted">Datos sincronizados con SQLite & Prisma</span>
          <button
            className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:border-red-400 transition-colors"
            onClick={logout}
          >
            Cerrar Sesión
          </button>
        </div>
      </section>
    );
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      navigate(location.state?.from ?? "/aprender", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card mx-auto max-w-md p-6 md:p-8 border-cyan-500/30">
      <div className="text-center mb-6">
        <span className="font-mono text-xs uppercase tracking-wider text-neon font-semibold">
          Perfil de Estudiante
        </span>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
          {mode === "login" ? "Acceso al Laboratorio" : "Crear Nueva Cuenta"}
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          Guarda tus fórmulas personalizadas, nivel, XP y rachas de aprendizaje.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-3.5">
        {mode === "register" ? (
          <div>
            <label className="text-[11px] font-mono uppercase text-muted block mb-1">Nombre</label>
            <input
              className="input-mono text-sm"
              placeholder="Tu nombre o alias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />
          </div>
        ) : null}

        <div>
          <label className="text-[11px] font-mono uppercase text-muted block mb-1">Correo Electrónico</label>
          <input
            className="input-mono text-sm"
            placeholder="usuario@ejemplo.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-muted block mb-1">Contraseña</label>
          <input
            className="input-mono text-sm"
            placeholder="Mínimo 8 caracteres"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200" role="alert">
            ⚠️ {error}
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Procesando..." : mode === "login" ? "Entrar al Sistema" : "Crear mi Cuenta"}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-cyan-500/15 text-center">
        <button
          className="text-xs text-slate-300 hover:text-neon transition-colors"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "¿Aún no tienes cuenta? Regístrate aquí"
            : "¿Ya tienes cuenta registrada? Inicia sesión"}
        </button>
      </div>
    </section>
  );
}
