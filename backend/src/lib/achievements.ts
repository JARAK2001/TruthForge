import prisma from "../lib/prisma.js";

/** Otorga los logros correspondientes tras un intento. Devuelve los slugs nuevos. */
export async function checkAchievements(userId: string): Promise<string[]> {
  const earned: string[] = [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: true, _count: { select: { attempts: true } } }
  });
  if (!user) return earned;
  const has = new Set(user.achievements.map((a) => a.achievementId));

  const grant = async (slug: string, xpReward: number): Promise<void> => {
    const ach = await prisma.achievement.findUnique({ where: { slug } });
    if (!ach || has.has(ach.id)) return;
    await prisma.$transaction([
      prisma.userAchievement.create({ data: { userId, achievementId: ach.id } }),
      prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpReward } } })
    ]);
    earned.push(slug);
  };

  if (user._count.attempts >= 1) await grant("first-steps", 5);
  if (user.streak >= 3) await grant("racha-3", 15);
  if (user.xp >= 100) await grant("cien-xp", 10);

  return earned;
}
