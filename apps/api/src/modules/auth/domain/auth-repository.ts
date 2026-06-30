import type {
  AuthPortal,
  AuthAdminProfile,
  AuthSessionSubject,
  AuthSubject,
  AuthUserProfile,
  CreateChallengeInput,
  CreateSessionInput,
  EmailChallenge,
} from "./auth-types.js";

export const AUTH_REPOSITORY = Symbol("AUTH_REPOSITORY");

export type SecurityEventInput = {
  userId?: string;
  emailNormalized?: string;
  eventType:
    | "auth_otp_requested"
    | "auth_otp_sent"
    | "auth_otp_send_failed"
    | "auth_otp_verified"
    | "auth_otp_failed"
    | "auth_session_created"
    | "auth_logout";
  portal?: AuthPortal;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface AuthRepository {
  findSubjectByEmail(
    portal: AuthPortal,
    emailNormalized: string,
  ): Promise<AuthSubject | null>;
  createUser(email: string, emailNormalized: string): Promise<AuthSubject>;
  updateLastLogin(subject: AuthSubject, at: Date): Promise<void>;
  invalidateOpenChallenges(
    emailNormalized: string,
    portal: AuthPortal,
    at: Date,
  ): Promise<void>;
  createChallenge(input: CreateChallengeInput): Promise<EmailChallenge>;
  setChallengeProviderMessage(
    challengeId: string,
    providerMessageId: string,
  ): Promise<void>;
  findLatestOpenChallenge(
    emailNormalized: string,
    portal: AuthPortal,
    now: Date,
  ): Promise<EmailChallenge | null>;
  incrementChallengeFailures(challengeId: string): Promise<void>;
  markChallengeUsed(challengeId: string, at: Date): Promise<void>;
  createSession(input: CreateSessionInput): Promise<void>;
  findActiveSessionByTokenHash(
    tokenHash: string,
    audience: AuthPortal,
    now: Date,
  ): Promise<AuthSessionSubject | null>;
  findAdminProfileById(adminUserId: string): Promise<AuthAdminProfile | null>;
  findUserProfileById(userId: string): Promise<AuthUserProfile | null>;
  touchSession(tokenHash: string, at: Date): Promise<void>;
  recordSecurityEvent(input: SecurityEventInput): Promise<void>;
  listSecurityEvents(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{
    items: Array<{
      id: string;
      eventType: string;
      occurredAt: Date;
      ip: string | null;
    }>;
    total: number;
  }>;
}
