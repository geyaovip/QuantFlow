import { Resend } from "resend";

import { AuthUnavailableError } from "../domain/auth-errors.js";
import type { AuthMailer, SendOtpEmailInput } from "../domain/auth-mailer.js";

export class ResendAuthMailer implements AuthMailer {
  private readonly client: Resend | null;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  async sendOtpEmail(input: SendOtpEmailInput) {
    if (!this.client) {
      throw new AuthUnavailableError("邮件服务尚未配置，请稍后再试");
    }

    const result = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: "QuantFlow 登录验证码",
      text: [
        `你的 QuantFlow 登录验证码是：${input.code}`,
        `验证码 ${input.expiresInMinutes} 分钟内有效。`,
        "如果不是你本人操作，可以忽略这封邮件。",
        "QuantFlow 不会向你索要验证码，请勿转发给他人。",
      ].join("\n"),
    });

    if (result.error) {
      throw new AuthUnavailableError("验证码邮件发送失败，请稍后再试");
    }

    return { providerMessageId: result.data?.id ?? "" };
  }
}
