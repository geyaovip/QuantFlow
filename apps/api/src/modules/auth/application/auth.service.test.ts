import { beforeEach, describe, expect, it } from "vitest";

import { FakeAuthMailer } from "../infrastructure/fake-auth-mailer.js";
import { NodeAuthCrypto } from "../infrastructure/node-auth-crypto.js";
import { NoopTurnstileVerifier } from "../infrastructure/noop-turnstile-verifier.js";
import type {
  AuthRepository,
  SecurityEventInput,
} from "../domain/auth-repository.js";
import type {
  AuthPortal,
  AuthSessionSubject,
  AuthSubject,
  CreateChallengeInput,
  CreateSessionInput,
  EmailChallenge,
} from "../domain/auth-types.js";
import type { Clock } from "../domain/clock.js";
import {
  AuthAccessDeniedError,
  InvalidOtpError,
} from "../domain/auth-errors.js";
import { AuthService } from "./auth.service.js";
import { MembershipService } from "../../membership/application/membership.service.js";

class MemoryMembershipService {
  async getEntitlements() {
    return {
      tier: "free" as const,
      planName: "Free",
      strategySubscriptionsMax: 3,
      paperAccountsMax: 1,
      historyDays: 30,
    };
  }
}

class MutableClock implements Clock {
  constructor(private current: Date) {}

  now() {
    return this.current;
  }

  advanceSeconds(seconds: number) {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }
}

class MemoryAuthRepository implements AuthRepository {
  subjects: AuthSubject[] = [];
  challenges: EmailChallenge[] = [];
  sessions: CreateSessionInput[] = [];
  events: SecurityEventInput[] = [];
  userEmails = new Map<string, string>();

  constructor(private readonly clock: Clock) {}

  async findSubjectByEmail(portal: AuthPortal, emailNormalized: string) {
    return (
      this.subjects.find(
        (subject) =>
          subject.audience === portal && subject.id.includes(emailNormalized),
      ) ?? null
    );
  }

  async createUser(email: string, emailNormalized: string) {
    const subject: AuthSubject = {
      id: `user:${emailNormalized}`,
      audience: "user",
      status: "active",
    };
    this.subjects.push(subject);
    this.userEmails.set(subject.id, email);
    return subject;
  }

  async updateLastLogin() {}

  async invalidateOpenChallenges(
    emailNormalized: string,
    portal: AuthPortal,
    at: Date,
  ) {
    this.challenges = this.challenges.map((challenge) =>
      challenge.emailNormalized === emailNormalized &&
      challenge.portal === portal &&
      !challenge.usedAt
        ? { ...challenge, usedAt: at }
        : challenge,
    );
  }

  async createChallenge(input: CreateChallengeInput) {
    const challenge: EmailChallenge = {
      id: `challenge-${this.challenges.length + 1}`,
      emailNormalized: input.emailNormalized,
      portal: input.portal,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      failedAttempts: 0,
      createdAt: this.clock.now(),
    };
    this.challenges.push(challenge);
    return challenge;
  }

  async setChallengeProviderMessage() {}

  async findLatestOpenChallenge(
    emailNormalized: string,
    portal: AuthPortal,
    now: Date,
  ) {
    return (
      this.challenges
        .filter(
          (challenge) =>
            challenge.emailNormalized === emailNormalized &&
            challenge.portal === portal &&
            !challenge.usedAt &&
            challenge.expiresAt > now,
        )
        .at(-1) ?? null
    );
  }

  async incrementChallengeFailures(challengeId: string) {
    this.challenges = this.challenges.map((challenge) =>
      challenge.id === challengeId
        ? { ...challenge, failedAttempts: challenge.failedAttempts + 1 }
        : challenge,
    );
  }

  async markChallengeUsed(challengeId: string, at: Date) {
    this.challenges = this.challenges.map((challenge) =>
      challenge.id === challengeId ? { ...challenge, usedAt: at } : challenge,
    );
  }

  async createSession(input: CreateSessionInput) {
    this.sessions.push(input);
  }

  async findActiveSessionByTokenHash(
    tokenHash: string,
    audience: AuthPortal,
    now: Date,
  ): Promise<AuthSessionSubject | null> {
    const session =
      this.sessions.find(
        (item) =>
          item.tokenHash === tokenHash &&
          item.audience === audience &&
          item.expiresAt > now,
      ) ?? null;
    return session
      ? {
          subjectId: session.subjectId,
          audience: session.audience,
          expiresAt: session.expiresAt,
        }
      : null;
  }

  async findUserProfileById(userId: string) {
    const email = this.userEmails.get(userId);
    return email ? { email, nickname: null } : null;
  }

  async touchSession() {}

  async recordSecurityEvent(input: SecurityEventInput) {
    this.events.push(input);
  }

  async listSecurityEvents(userId: string, page: number, pageSize: number) {
    const items = this.events
      .filter((event) => event.userId === userId)
      .map((event, index) => ({
        id: `event-${index}`,
        eventType: event.eventType,
        occurredAt: this.clock.now(),
        ip: event.ip ?? null,
      }));

    return {
      total: items.length,
      items: items.slice((page - 1) * pageSize, page * pageSize),
    };
  }
}

class MemoryAdminAccessService {
  async writeAuditLog() {}
}

describe("AuthService", () => {
  let repository: MemoryAuthRepository;
  let mailer: FakeAuthMailer;
  let clock: MutableClock;
  let service: AuthService;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    clock = new MutableClock(new Date("2026-06-25T00:00:00.000Z"));
    repository = new MemoryAuthRepository(clock);
    mailer = new FakeAuthMailer();
    service = new AuthService(
      repository,
      mailer,
      new NodeAuthCrypto("test-pepper"),
      clock,
      new NoopTurnstileVerifier(),
      new MemoryMembershipService() as unknown as MembershipService,
      new MemoryAdminAccessService() as never,
    );
  });

  it("creates a user session after a valid user OTP", async () => {
    await service.requestEmailOtp("User@Example.com", "user");
    const code = mailer.sent[0]?.code;

    const session = await service.verifyEmailOtp(
      "user@example.com",
      "user",
      code ?? "",
    );

    expect(session.audience).toBe("user");
    expect(session.subjectId).toBe("user:user@example.com");
    expect(repository.sessions).toHaveLength(1);
    expect(repository.challenges[0]?.usedAt).toBeInstanceOf(Date);
  });

  it("does not send admin OTP for unknown administrators", async () => {
    await service.requestEmailOtp("admin@example.com", "admin");

    expect(mailer.sent).toHaveLength(0);
    expect(repository.challenges).toHaveLength(0);
  });

  it("rejects reused OTP codes", async () => {
    await service.requestEmailOtp("user@example.com", "user");
    const code = mailer.sent[0]?.code ?? "";

    await service.verifyEmailOtp("user@example.com", "user", code);
    await expect(
      service.verifyEmailOtp("user@example.com", "user", code),
    ).rejects.toBeInstanceOf(InvalidOtpError);
  });

  it("does not send another code during the resend cooldown", async () => {
    const first = await service.requestEmailOtp("user@example.com", "user");
    clock.advanceSeconds(30);
    const second = await service.requestEmailOtp("user@example.com", "user");

    expect(mailer.sent).toHaveLength(1);
    expect(first.resendAvailableAt).toBeDefined();
    expect(second.resendAvailableAt).toBeDefined();
    expect(new Date(second.resendAvailableAt!).getTime()).toBeGreaterThan(
      clock.now().getTime(),
    );
  });

  it("validates an active session token for the expected audience", async () => {
    await service.requestEmailOtp("user@example.com", "user");
    const code = mailer.sent[0]?.code ?? "";
    const session = await service.verifyEmailOtp(
      "user@example.com",
      "user",
      code,
    );

    await expect(
      service.validateSession(session.token, "user"),
    ).resolves.toMatchObject({
      audience: "user",
      subjectId: "user:user@example.com",
      email: "user@example.com",
      displayName: "user",
      membershipPlan: "Free",
    });
    await expect(
      service.validateSession(session.token, "admin"),
    ).rejects.toBeInstanceOf(AuthAccessDeniedError);
  });
});
