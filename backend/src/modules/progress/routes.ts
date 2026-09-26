import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { levelFor } from "../../lib/grading.js";
import { asyncHandler, requireAuth, type AuthRequest } from "../../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId as string },
      select: {
        xp: true,
        streak: true,
        achievements: { include: { achievement: true } },
        _count: { select: { attempts: true } }
      }
    });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }
    res.json({
      xp: user.xp,
      level: levelFor(user.xp),
      streak: user.streak,
      attempts: user._count.attempts,
      achievements: user.achievements.map((a) => ({
        slug: a.achievement.slug,
        name: a.achievement.name,
        earnedAt: a.earnedAt
      }))
    });
  })
);

export default router;
