import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import authRoutes from "./modules/auth/routes.js";
import exerciseRoutes from "./modules/exercises/routes.js";
import attemptRoutes from "./modules/attempts/routes.js";
import progressRoutes from "./modules/progress/routes.js";
import lessonRoutes from "./modules/lessons/routes.js";
import { errorHandler } from "./middleware/auth.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "truthforge-backend" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/exercises", exerciseRoutes);
  app.use("/api/attempts", attemptRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/lessons", lessonRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada." });
  });

  // Zod → 400 con mensajes en español ya definidos en los schemas.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: err.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    next(err as Error);
  });
  app.use(errorHandler);

  return app;
}
