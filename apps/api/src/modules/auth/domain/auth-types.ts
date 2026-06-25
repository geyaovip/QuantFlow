export type AuthPortal = "user" | "admin";

export type AuthSubject = {
  id: string;
  audience: AuthPortal;
  status: "active" | "disabled" | "risk_watch" | "deleting";
};

export type EmailChallenge = {
  id: string;
  emailNormalized: string;
  portal: AuthPortal;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  failedAttempts: number;
  createdAt: Date;
};

export type CreateChallengeInput = {
  email: string;
  emailNormalized: string;
  emailHash: string;
  portal: AuthPortal;
  codeHash: string;
  expiresAt: Date;
  requestedIp?: string;
  requestedUa?: string;
};

export type CreateSessionInput = {
  subjectId: string;
  audience: AuthPortal;
  tokenHash: string;
  expiresAt: Date;
  createdIp?: string;
  createdUa?: string;
};

export type AuthSessionRecord = {
  subjectId: string;
  audience: AuthPortal;
  token: string;
  expiresAt: Date;
};

export type AuthSessionSubject = {
  subjectId: string;
  audience: AuthPortal;
  expiresAt: Date;
};
