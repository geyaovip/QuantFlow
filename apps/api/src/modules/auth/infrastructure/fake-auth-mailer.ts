import type { AuthMailer, SendOtpEmailInput } from "../domain/auth-mailer.js";

export class FakeAuthMailer implements AuthMailer {
  readonly sent: Array<SendOtpEmailInput & { providerMessageId: string }> = [];

  async sendOtpEmail(input: SendOtpEmailInput) {
    const providerMessageId = `fake-${this.sent.length + 1}`;
    this.sent.push({ ...input, providerMessageId });
    return { providerMessageId };
  }
}
