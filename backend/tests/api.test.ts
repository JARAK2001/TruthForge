import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import prisma from "../src/lib/prisma.js";
import { createApp } from "../src/app.js";

const app = createApp();
const email = `test-${Date.now()}@truthforge.dev`;
let userId = "";
let accessToken = "";
let exerciseId = "";

beforeAll(async () => {
  // La BD y el seed deben existir (db:migrate + db:seed).
  const count = await prisma.exercise.count({ where: { authorId: null } });
  expect(count).toBeGreaterThan(0);
});

afterAll(async () => {
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("TruthForge API", () => {
  it("health responde", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("registra y devuelve tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, name: "Tester", password: "secreto123" });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken as string;
    userId = res.body.user.id as string;
  });

  it("rechaza email duplicado", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, name: "Otro", password: "secreto123" });
    expect(res.status).toBe(409);
  });

  it("login + me", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: "secreto123" });
    expect(login.status).toBe(200);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it("lista lecciones y ejercicios del seed", async () => {
    const lessons = await request(app).get("/api/lessons");
    expect(lessons.status).toBe(200);
    expect(lessons.body.length).toBe(8);
    const exercises = await request(app).get("/api/exercises");
    expect(exercises.status).toBe(200);
    expect(exercises.body.length).toBeGreaterThan(10);
    exerciseId = (exercises.body as { id: string }[])[0]?.id as string;
  });

  it("califica un intento correcto y da XP una sola vez", async () => {
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
    // Respuesta correcta calculada de forma independiente con el motor.
    const { buildTruthTable, classify, evaluate, parseFormula } = await import("@truthforge/logic-engine");
    let expected: unknown = true;
    if (ex.kind === "value") {
      expected = evaluate(parseFormula(ex.formula).ast, (ex.assignment ?? {}) as Record<string, boolean>);
    } else if (ex.kind === "classify") {
      expected = classify(buildTruthTable(ex.formula)).class;
    }
    const first = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ exerciseId, answer: expected });
    expect(first.status).toBe(201);
    expect(first.body.correct).toBe(true);
    expect(first.body.xpEarned).toBe(10);
    const again = await request(app)
      .post("/api/attempts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ exerciseId, answer: expected });
    expect(again.status).toBe(201);
    expect(again.body.correct).toBe(true);
    expect(again.body.xpEarned).toBe(0);
  });

  it("progreso refleja XP y logros", async () => {
    const res = await request(app).get("/api/progress").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.level).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.achievements)).toBe(true);
  });

  it("rechaza fórmula inválida al crear ejercicio", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ prompt: "Mala", formula: "p ∧ ∧ q" });
    expect(res.status).toBe(400);
  });
});
