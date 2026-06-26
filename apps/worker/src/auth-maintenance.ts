import type { PrismaClient } from "@prisma/client";

const CHALLENGE_RETENTION_DAYS = 30;
const SESSION_RETENTION_DAYS = 7;

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function purgeStaleAuthRecords(
  prisma: PrismaClient,
  now = new Date(),
) {
  const challengeCutoff = daysAgo(now, CHALLENGE_RETENTION_DAYS);
  const sessionCutoff = daysAgo(now, SESSION_RETENTION_DAYS);

  const [challenges, sessions] = await prisma.$transaction([
    prisma.authEmailChallenge.deleteMany({
      where: { createdAt: { lt: challengeCutoff } },
    }),
    prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: sessionCutoff } },
          { revokedAt: { lt: sessionCutoff } },
        ],
      },
    }),
  ]);

  return {
    challengesDeleted: challenges.count,
    sessionsDeleted: sessions.count,
  };
}
