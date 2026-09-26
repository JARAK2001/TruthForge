import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/auth.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const lessons = await prisma.lesson.findMany({
      orderBy: { order: "asc" },
      include: {
        exercises: {
          select: { id: true, prompt: true, formula: true, kind: true, assignment: true }
        }
      }
    });
    res.json(lessons);
  })
);

export default router;
