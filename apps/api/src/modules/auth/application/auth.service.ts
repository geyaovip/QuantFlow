import { Inject, Injectable } from "@nestjs/common";

import { loadAppConfig } from "../../../config/app-config.js";
import { AUTH_CRYPTO, type AuthCrypto } from "../domain/auth-crypto.js";
import {
  AuthAccessDeniedError,
  AuthUnavailableError,
  InvalidOtpError,
} from "../domain/auth-errors.js";
import { AUTH_MAILER, type AuthMailer } from "../domain/auth-mailer.js";
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from "../domain/auth-repository.js";
import type { AuthPortal, AuthSessionRecord } from "../domain/auth-types.js";
import { CLOCK, type Clock } from "../domain/clock.js";
import {
  TURNSTILE_VERIFIER,
  type TurnstileVerifier,
} from "../domain/turnstile-verifier.js";

export type AuthRequestContext = {
  ip?: string;
  userAgent?: string;
  turnstileToken?: string;
};

const GENERIC_REQUEST_MESSAGE =
  "如果邮箱可以登录 QuantFlow，我们会发送验证码。";

type EmailOtpRequestResult = {
  message: string;
  resendAvailableAt?: string;
};

@Injectable()
export class AuthService {
  private readonly config = loadAppConfig().auth;

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepository,
    @Inject(AUTH_MAILER) private readonly mailer: AuthMailer,
    @Inject(AUTH_CRYPTO) private readonly crypto: AuthCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(TURNSTILE_VERIFIER)
    private readonly turnstileVerifier: TurnstileVerifier,
  ) {}

  async requestEmailOtp(
    email: string,
    portal: AuthPortal,
    context: AuthRequestContext = {},
  ): Promise<EmailOtpRequestResult> {
    const now = this.clock.now();
    const emailNormalized = normalizeEmail(email);

    if (this.config.turnstileSecretKey) {
      const token = context.turnstileToken;
      const verified = token
        ? await this.turnstileVerifier.verify(token, context.ip)
        : false;
      if (!verified) {
        throw new AuthUnavailableError("人机校验失败，请刷新后重试");
      }
    }

    await this.repository.recordSecurityEvent({
      emailNormalized,
      eventType: "auth_otp_requested",
      portal,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    const subject = await this.repository.findSubjectByEmail(
      portal,
      emailNormalized,
    );
    if (portal === "admin" && subject?.status !== "active") {
      return { message: GENERIC_REQUEST_MESSAGE };
    }

    const existing = await this.repository.findLatestOpenChallenge(
      emailNormalized,
      portal,
      now,
    );
    if (existing) {
      const cooldownUntil = addSeconds(
        existing.createdAt,
        this.config.otpResendCooldownSeconds,
      );
      if (cooldownUntil > now) {
        return {
          message: GENERIC_REQUEST_MESSAGE,
          resendAvailableAt: cooldownUntil.toISOString(),
        };
      }
    }

    await this.repository.invalidateOpenChallenges(
      emailNormalized,
      portal,
      now,
    );

    const code = this.crypto.createNumericOtp(6);
    const challenge = await this.repository.createChallenge({
      email,
      emailNormalized,
      emailHash: this.crypto.hashEmail(emailNormalized),
      portal,
      codeHash: this.crypto.hashOtp(emailNormalized, portal, code),
      expiresAt: addSeconds(now, this.config.otpTtlSeconds),
      requestedIp: context.ip,
      requestedUa: context.userAgent,
    });

    try {
      const sent = await this.mailer.sendOtpEmail({
        to: emailNormalized,
        code,
        expiresInMinutes: Math.ceil(this.config.otpTtlSeconds / 60),
      });
      await this.repository.setChallengeProviderMessage(
        challenge.id,
        sent.providerMessageId,
      );
      await this.repository.recordSecurityEvent({
        emailNormalized,
        eventType: "auth_otp_sent",
        portal,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: { providerMessageId: sent.providerMessageId || null },
      });
    } catch (error) {
      await this.repository.markChallengeUsed(challenge.id, now);
      await this.repository.recordSecurityEvent({
        emailNormalized,
        eventType: "auth_otp_send_failed",
        portal,
        ip: context.ip,
        userAgent: context.userAgent,
      });
      if (error instanceof AuthUnavailableError) {
        throw error;
      }
      throw new AuthUnavailableError();
    }

    return {
      message: GENERIC_REQUEST_MESSAGE,
      resendAvailableAt: addSeconds(
        now,
        this.config.otpResendCooldownSeconds,
      ).toISOString(),
    };
  }

  async verifyEmailOtp(
    email: string,
    portal: AuthPortal,
    code: string,
    context: AuthRequestContext = {},
  ): Promise<AuthSessionRecord> {
    const now = this.clock.now();
    const emailNormalized = normalizeEmail(email);
    const challenge = await this.repository.findLatestOpenChallenge(
      emailNormalized,
      portal,
      now,
    );

    if (!challenge) {
      throw await this.recordOtpFailure(emailNormalized, portal, context);
    }

    if (challenge.failedAttempts >= this.config.otpMaxAttempts) {
      await this.repository.markChallengeUsed(challenge.id, now);
      throw await this.recordOtpFailure(emailNormalized, portal, context);
    }

    const expectedHash = this.crypto.hashOtp(emailNormalized, portal, code);
    if (!this.crypto.safeEqual(challenge.codeHash, expectedHash)) {
      await this.repository.incrementChallengeFailures(challenge.id);
      throw await this.recordOtpFailure(emailNormalized, portal, context);
    }

    let subject = await this.repository.findSubjectByEmail(
      portal,
      emailNormalized,
    );
    if (!subject && portal === "user") {
      subject = await this.repository.createUser(email, emailNormalized);
    }
    if (!subject || subject.status !== "active") {
      throw new AuthAccessDeniedError();
    }

    await this.repository.markChallengeUsed(challenge.id, now);
    await this.repository.updateLastLogin(subject, now);

    const token = this.crypto.createOpaqueToken();
    const expiresAt = addSeconds(now, this.config.sessionTtlSeconds);
    await this.repository.createSession({
      subjectId: subject.id,
      audience: portal,
      tokenHash: this.crypto.hashToken(token),
      expiresAt,
      createdIp: context.ip,
      createdUa: context.userAgent,
    });
    await this.repository.recordSecurityEvent({
      userId: portal === "user" ? subject.id : undefined,
      emailNormalized,
      eventType: "auth_otp_verified",
      portal,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    await this.repository.recordSecurityEvent({
      userId: portal === "user" ? subject.id : undefined,
      emailNormalized,
      eventType: "auth_session_created",
      portal,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return {
      subjectId: subject.id,
      audience: portal,
      token,
      expiresAt,
    };
  }

  async validateSession(token: string | undefined, audience: AuthPortal) {
    if (!token) {
      throw new AuthAccessDeniedError();
    }

    const tokenHash = this.crypto.hashToken(token);
    const session = await this.repository.findActiveSessionByTokenHash(
      tokenHash,
      audience,
      this.clock.now(),
    );

    if (!session) {
      throw new AuthAccessDeniedError();
    }

    await this.repository.touchSession(tokenHash, this.clock.now());
    return session;
  }

  private async recordOtpFailure(
    emailNormalized: string,
    portal: AuthPortal,
    context: AuthRequestContext,
  ) {
    await this.repository.recordSecurityEvent({
      emailNormalized,
      eventType: "auth_otp_failed",
      portal,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return new InvalidOtpError();
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}
