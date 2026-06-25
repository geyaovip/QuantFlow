export const AUTH_MAILER = Symbol("AUTH_MAILER");

export type SendOtpEmailInput = {
  to: string;
  code: string;
  expiresInMinutes: number;
};

export interface AuthMailer {
  sendOtpEmail(
    input: SendOtpEmailInput,
  ): Promise<{ providerMessageId: string }>;
}
