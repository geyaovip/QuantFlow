import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service.js";
import type {
  AuthRepository,
  SecurityEventInput,
} from "../domain/auth-repository.js";
import type {
  AuthPortal,
  AuthSubject,
  CreateChallengeInput,
  CreateSessionInput,
} from "../domain/auth-types.js";

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubjectByEmail(portal: AuthPortal, emailNormalized: string) {
    if (portal === "admin") {
      const admin = await this.prisma.adminUser.findUnique({
        where: { emailNormalized },
      });
      return admin
        ? ({
            id: admin.id,
            audience: "admin",
            status: admin.status,
          } satisfies AuthSubject)
        : null;
    }

    const user = await this.prisma.user.findUnique({
      where: { emailNormalized },
    });
    return user
      ? ({
          id: user.id,
          audience: "user",
          status: user.status,
        } satisfies AuthSubject)
      : null;
  }

  async createUser(email: string, emailNormalized: string) {
    const user = await this.prisma.user.create({
      data: { email, emailNormalized },
    });
    return {
      id: user.id,
      audience: "user",
      status: user.status,
    } satisfies AuthSubject;
  }

  async updateLastLogin(subject: AuthSubject, at: Date) {
    if (subject.audience === "admin") {
      await this.prisma.adminUser.update({
        where: { id: subject.id },
        data: { lastLoginAt: at },
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: subject.id },
      data: { lastLoginAt: at },
    });
  }

  async invalidateOpenChallenges(
    emailNormalized: string,
    portal: AuthPortal,
    at: Date,
  ) {
    await this.prisma.authEmailChallenge.updateMany({
      where: { emailNormalized, portal, usedAt: null },
      data: { usedAt: at },
    });
  }

  async createChallenge(input: CreateChallengeInput) {
    const challenge = await this.prisma.authEmailChallenge.create({
      data: {
        emailNormalized: input.emailNormalized,
        emailHash: input.emailHash,
        portal: input.portal,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        requestedIp: input.requestedIp,
        requestedUa: input.requestedUa,
      },
    });
    return {
      id: challenge.id,
      emailNormalized: challenge.emailNormalized,
      portal: challenge.portal,
      codeHash: challenge.codeHash,
      expiresAt: challenge.expiresAt,
      usedAt: challenge.usedAt,
      failedAttempts: challenge.failedAttempts,
      createdAt: challenge.createdAt,
    };
  }

  async setChallengeProviderMessage(
    challengeId: string,
    providerMessageId: string,
  ) {
    await this.prisma.authEmailChallenge.update({
      where: { id: challengeId },
      data: { resendMessageId: providerMessageId },
    });
  }

  async findLatestOpenChallenge(
    emailNormalized: string,
    portal: AuthPortal,
    now: Date,
  ) {
    const challenge = await this.prisma.authEmailChallenge.findFirst({
      where: {
        emailNormalized,
        portal,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return challenge
      ? {
          id: challenge.id,
          emailNormalized: challenge.emailNormalized,
          portal: challenge.portal,
          codeHash: challenge.codeHash,
          expiresAt: challenge.expiresAt,
          usedAt: challenge.usedAt,
          failedAttempts: challenge.failedAttempts,
          createdAt: challenge.createdAt,
        }
      : null;
  }

  async incrementChallengeFailures(challengeId: string) {
    await this.prisma.authEmailChallenge.update({
      where: { id: challengeId },
      data: { failedAttempts: { increment: 1 } },
    });
  }

  async markChallengeUsed(challengeId: string, at: Date) {
    await this.prisma.authEmailChallenge.update({
      where: { id: challengeId },
      data: { usedAt: at },
    });
  }

  async createSession(input: CreateSessionInput) {
    await this.prisma.authSession.create({
      data: {
        subjectId: input.subjectId,
        audience: input.audience,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdIp: input.createdIp,
        createdUa: input.createdUa,
      },
    });
  }

  async findActiveSessionByTokenHash(
    tokenHash: string,
    audience: AuthPortal,
    now: Date,
  ) {
    const session = await this.prisma.authSession.findFirst({
      where: {
        tokenHash,
        audience,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        subjectId: true,
        audience: true,
        expiresAt: true,
      },
    });
    return session
      ? {
          subjectId: session.subjectId,
          audience: session.audience,
          expiresAt: session.expiresAt,
        }
      : null;
  }

  async findUserProfileById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    return user ? { email: user.email, nickname: null } : null;
  }

  async touchSession(tokenHash: string, at: Date) {
    await this.prisma.authSession.update({
      where: { tokenHash },
      data: { lastSeenAt: at },
    });
  }

  async recordSecurityEvent(input: SecurityEventInput) {
    await this.prisma.userSecurityEvent.create({
      data: {
        userId: input.userId,
        emailNormalized: input.emailNormalized,
        eventType: input.eventType,
        portal: input.portal,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }
}
