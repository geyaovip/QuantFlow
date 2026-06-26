import { describe, expect, it, vi } from "vitest";

import { purgeStaleAuthRecords } from "./auth-maintenance.js";

describe("purgeStaleAuthRecords", () => {
  it("deletes records older than retention windows", async () => {
    const challengeDelete = vi.fn().mockResolvedValue({ count: 3 });
    const sessionDelete = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      $transaction: (operations: Promise<{ count: number }>[]) =>
        Promise.all(operations),
      authEmailChallenge: { deleteMany: challengeDelete },
      authSession: { deleteMany: sessionDelete },
    };

    const result = await purgeStaleAuthRecords(prisma as never);
    expect(result).toEqual({ challengesDeleted: 3, sessionsDeleted: 2 });
    expect(challengeDelete).toHaveBeenCalledOnce();
    expect(sessionDelete).toHaveBeenCalledOnce();
  });
});
