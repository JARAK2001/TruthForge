import { useState, useEffect } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import HomePage from "./pages/HomePage";
import LabPage from "./pages/LabPage";
import GuidedPage from "./pages/GuidedPage";
import BuilderPage from "./pages/BuilderPage";
import LearnPage from "./pages/LearnPage";
import AuthPage from "./pages/AuthPage";
import CircuitSimulatorPage from "./pages/CircuitSimulatorPage";
import PlaceholderPage from "./pages/PlaceholderPage";

import TruthForgeLogo from "./components/TruthForgeLogo";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "flex items-center justify-between px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-neon font-bold text-sm shadow-glow-sm"
    : "flex items-center justify-between px-4 py-3 rounded-xl bg-void-900/60 border border-white/5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-all";

function SessionChip({ onClick }: { onClick?: () => void }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <NavLink to="/cuenta" className={linkClass} onClick={onClick}>
        Entrar
      </NavLink>
    );
  }
  return (
    <NavLink to="/cuenta" className={`${linkClass} flex items-center gap-1.5`} onClick={onClick}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
      <span className="truncate max-w-[100px]">{user.name}</span>
      <span className="font-mono text-neon font-bold ml-1">{user.xp} XP</span>
    </NavLink>
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-void-950 text-slate-100 flex flex-col justify-between selection:bg-neon selection:text-void-950">
        <header className="sticky top-0 z-[60] border-b border-cyan-500/20 bg-void-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
            <NavLink to="/" className="group flex items-center">
              <TruthForgeLogo size={34} withText={true} />
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <NavLink to="/" className={linkClass} end>
                Inicio
              </NavLink>
              <NavLink to="/resolver" className={linkClass}>
                Resolver
              </NavLink>
              <NavLink to="/simulador" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  <span className="text-neon">⚡</span>
                  <span>Simulador</span>
                </span>
              </NavLink>
              <NavLink to="/guiado" className={linkClass}>
                Conmigo
              </NavLink>
              <NavLink to="/constructor" className={linkClass}>
                Constructor
              </NavLink>
              <NavLink to="/aprender" className={linkClass}>
                Aprender
              </NavLink>
              <SessionChip />
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-void-900 border border-cyan-500/30 text-neon transition-all focus:outline-none"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`w-5 h-0.5 bg-neon rounded-full transition-all duration-300 ${
                  mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-neon rounded-full my-1 transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-neon rounded-full transition-all duration-300 ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </header>

        {/* Mobile Drawer Menu - Placed OUTSIDE <header> to avoid backdrop-blur stacking context clipping */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[56px] bottom-0 z-[55] bg-void-950/98 backdrop-blur-3xl border-b border-cyan-500/30 px-4 py-6 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="grid gap-2">
              <NavLink to="/" className={mobileLinkClass} end onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-neon text-sm">⌂</span>
                  <span>Inicio</span>
                </div>
                <span className="text-xs font-mono text-muted">Principal</span>
              </NavLink>

              <NavLink to="/resolver" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-cyan-300 text-sm">▦</span>
                  <span>Resolver Tablas</span>
                </div>
                <span className="text-xs font-mono text-muted">Explicación</span>
              </NavLink>

              <NavLink to="/simulador" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="text-neon text-sm">⚡</span>
                  <span className="font-bold text-white">Simulador de Compuertas</span>
                </div>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-neon font-bold">
                  ESTUDIO
                </span>
              </NavLink>

              <NavLink to="/guiado" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="text-electric text-sm">🎯</span>
                  <span>Construye Conmigo</span>
                </div>
                <span className="text-xs font-mono text-muted">Tutor</span>
              </NavLink>

              <NavLink to="/constructor" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="text-purple-400 text-sm">⚖</span>
                  <span>Constructor & Equivalencias</span>
                </div>
                <span className="text-xs font-mono text-muted">Comparar</span>
              </NavLink>

              <NavLink to="/aprender" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 text-sm">📚</span>
                  <span>Ruta de Aprendizaje</span>
                </div>
                <span className="text-xs font-mono text-muted">Ejercicios & XP</span>
              </NavLink>
            </nav>

            <div className="mt-6 pt-4 border-t border-cyan-500/15 flex items-center justify-between">
              <SessionChip onClick={() => setMobileMenuOpen(false)} />
              <span className="text-[11px] font-mono text-muted">TruthForge Mobile v2.0</span>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl w-full px-3 py-4 sm:px-6 sm:py-8 flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/resolver" element={<LabPage />} />
            <Route path="/simulador" element={<CircuitSimulatorPage />} />
            <Route path="/guiado" element={<GuidedPage />} />
            <Route
              path="/constructor"
              element={
                <RequireAuth>
                  <BuilderPage />
                </RequireAuth>
              }
            />
            <Route path="/aprender" element={<LearnPage />} />
            <Route path="/cuenta" element={<AuthPage />} />
            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="404"
                  detail="Esa ruta no existe en el laboratorio de lógica."
                />
              }
            />
          </Routes>
        </main>

        <footer className="border-t border-cyan-500/15 bg-void-950/90 py-5 text-xs text-muted">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-300">TruthForge</span>
              <span>— Laboratorio de lógica proposicional & compuertas</span>
            </div>
            <div className="font-mono text-muted-light text-[11px]">
              Motor formal @truthforge/logic-engine
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
