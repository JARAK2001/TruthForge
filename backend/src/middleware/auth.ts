import type { NextFunction, Request, Response } from "express";
import { verifyAccess } from "../lib/jwt.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Falta el token. Inicia sesión." });
    return;
  }
  try {
    const payload = verifyAccess(header.slice("Bearer ".length));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
}

/** Envuelve handlers async para que los errores lleguen al middleware final. */
export function asyncHandler(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req as AuthRequest, res, next).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // eslint-disable-line no-unused-vars
  if (err instanceof Error && "status" in err) {
    res.status((err as { status: number }).status).json({ error: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Error interno. Inténtalo de nuevo." });
}
