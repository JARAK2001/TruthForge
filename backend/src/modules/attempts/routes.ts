import { z } from "zod";
import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { gradeAttempt, nextStreak } from "../../lib/grading.js";
import { checkAchievements } from "../../lib/achievements.js";
import { asyncHandler, requireAuth, type AuthRequest } from "../../middleware/auth.js";

const router = Router();

const submitSchema = z.object({
  exerciseId: z.string().min(1),
  answer: z.unknown()
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.userId as string;
    const data = submitSchema.parse(req.body);

    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise) {
      res.status(404).json({ error: "Ejercicio no encontrado." });
      return;
    }

    const alreadySolved = await prisma.attempt.findFirst({
      where: { userId, exerciseId: exercise.id, correct: true },
      select: { id: true }
    });

    let graded: { correct: boolean; xpEarned: number };
    try {
      graded = gradeAttempt(
        exercise.kind,
        exercise.formula,
        (exercise.assignment as Record<string, boolean> | null) ?? null,
        data.answer,
        !!alreadySolved
      );
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "Respuesta inválida." });
      return;
    }

    const now = new Date();
    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.attempt.create({
        data: {
          userId,
          exerciseId: exercise.id,
          answer: (data.answer ?? null) as object,
          correct: graded.correct,
          xpEarned: graded.xpEarned
        }
      });
      if (graded.xpEarned > 0 || graded.correct) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: { increment: graded.xpEarned },
            streak: nextStreak(user.lastStudyAt, user.streak, now),
            lastStudyAt: now
          }
        });
      }
      return created;
    });

    const newAchievements = graded.correct ? await checkAchievements(userId) : [];
    const progress = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, streak: true }
    });

    res.status(201).json({
      correct: graded.correct,
      xpEarned: graded.xpEarned,
      attemptId: attempt.id,
      xp: progress?.xp ?? 0,
      streak: progress?.streak ?? 0,
      newAchievements
    });
  })
);

export default router;
