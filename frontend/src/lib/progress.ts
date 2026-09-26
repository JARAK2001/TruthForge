import { useCallback, useState } from "react";

export interface Progress {
  xp: number;
  doneExercises: string[];
  doneLevels: string[];
  streak: number;
  lastDay: string | null;
}

const KEY = "truthforge-progress-v1";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // almacenamiento no disponible: empezar de cero
  }
  return { xp: 0, doneExercises: [], doneLevels: [], streak: 0, lastDay: null };
}

function touchStreak(p: Progress): Progress {
  const t = today();
  if (p.lastDay === t) return p;
  const streak = p.lastDay === yesterday() ? p.streak + 1 : 1;
  return { ...p, streak, lastDay: t };
}

export function levelFor(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  const save = useCallback((next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // modo privado u otros: el progreso solo vive en memoria
    }
  }, []);

  const awardExercise = useCallback(
    (id: string) => {
      setProgress((prev) => {
        if (prev.doneExercises.includes(id)) return prev;
        const next = touchStreak({
          ...prev,
          xp: prev.xp + 10,
          doneExercises: [...prev.doneExercises, id]
        });
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // sin persistencia
        }
        return next;
      });
    },
    []
  );

  const awardLevel = useCallback((id: string) => {
    setProgress((prev) => {
      if (prev.doneLevels.includes(id)) return prev;
      const next = touchStreak({ ...prev, xp: prev.xp + 20, doneLevels: [...prev.doneLevels, id] });
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // sin persistencia
      }
      return next;
    });
  }, []);

  return { progress, save, awardExercise, awardLevel };
}
