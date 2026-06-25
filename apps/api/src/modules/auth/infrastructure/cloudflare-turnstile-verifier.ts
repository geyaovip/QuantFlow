import type { TurnstileVerifier } from "../domain/turnstile-verifier.js";

type SiteVerifyResponse = {
  success?: boolean;
};

export class CloudflareTurnstileVerifier implements TurnstileVerifier {
  constructor(private readonly secretKey: string) {}

  async verify(token: string, ip?: string) {
    if (!this.secretKey) {
      return false;
    }

    const body = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });
    if (ip) {
      body.set("remoteip", ip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      },
    );
    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as SiteVerifyResponse;
    return data.success === true;
  }
}
