import { z } from "zod";
import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { hashRefresh, newRefreshToken, refreshExpiry, signAccess } from "../../lib/jwt.js";
import { asyncHandler, requireAuth, type AuthRequest } from "../../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("Email inválido."),
  name: z.string().min(2, "Nombre muy corto.").max(60),
  password: z.string().min(8, "Mínimo 8 caracteres.")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      res.status(409).json({ error: "Ese email ya está registrado." });
      return;
    }
    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash: await hashPassword(data.password) }
    });
    const { token, hash } = newRefreshToken();
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: refreshExpiry() }
    });
    res.status(201).json({
      accessToken: signAccess(user.id),
      refreshToken: token,
      user: { id: user.id, email: user.email, name: user.name, xp: user.xp }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      res.status(401).json({ error: "Email o contraseña incorrectos." });
      return;
    }
    const { token, hash } = newRefreshToken();
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: refreshExpiry() }
    });
    res.json({
      accessToken: signAccess(user.id),
      refreshToken: token,
      user: { id: user.id, email: user.email, name: user.name, xp: user.xp }
    });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Falta refreshToken." });
      return;
    }
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefresh(parsed.data.refreshToken) },
      include: { user: true }
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      res.status(401).json({ error: "Sesión expirada. Inicia sesión de nuevo." });
      return;
    }
    // Rotación: el viejo muere, nace uno nuevo.
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const { token, hash } = newRefreshToken();
    await prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: hash, expiresAt: refreshExpiry() }
    });
    res.json({ accessToken: signAccess(stored.userId), refreshToken: token });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(req.body);
    if (parsed.success) {
      await prisma.refreshToken.deleteMany({ where: { tokenHash: hashRefresh(parsed.data.refreshToken) } });
    }
    res.status(204).end();
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId as string },
      select: { id: true, email: true, name: true, xp: true, streak: true, createdAt: true }
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }
    res.json(user);
  })
);

export default router;
