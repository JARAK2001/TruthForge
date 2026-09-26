import { z } from "zod";
import { Router } from "express";
import { FormulaError } from "@truthforge/logic-engine";
import prisma from "../../lib/prisma.js";
import { normalizeFormula } from "../../lib/grading.js";
import { asyncHandler, requireAuth, type AuthRequest } from "../../middleware/auth.js";

const router = Router();

const createSchema = z.object({
  prompt: z.string().min(3).max(200),
  formula: z.string().min(1).max(200),
  kind: z.enum(["value", "classify", "table"]).default("table"),
  assignment: z.record(z.string(), z.boolean()).optional(),
  levelId: z.string().optional()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const levelId = typeof req.query.levelId === "string" ? req.query.levelId : undefined;
    const exercises = await prisma.exercise.findMany({
      where: { levelId, authorId: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, prompt: true, formula: true, kind: true, assignment: true, levelId: true }
    });
    res.json(exercises);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ex = await prisma.exercise.findUnique({ where: { id: req.params.id as string } });
    if (!ex) {
      res.status(404).json({ error: "Ejercicio no encontrado." });
      return;
    }
    res.json(ex);
  })
);

// Crear problema propio (Constructor). Requiere cuenta; la fórmula se valida con el motor.
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = createSchema.parse(req.body);
    let normalized: string;
    try {
      normalized = normalizeFormula(data.formula);
    } catch (e) {
      if (e instanceof FormulaError) {
        res.status(400).json({ error: e.message, hint: e.hint, position: e.position });
        return;
      }
      throw e;
    }
    const ex = await prisma.exercise.create({
      data: {
        prompt: data.prompt,
        formula: normalized,
        kind: data.kind,
        assignment: data.assignment ?? undefined,
        authorId: req.userId as string
      }
    });
    res.status(201).json(ex);
  })
);

export default router;
