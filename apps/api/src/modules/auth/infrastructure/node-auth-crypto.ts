import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import type { AuthCrypto } from "../domain/auth-crypto.js";

export class NodeAuthCrypto implements AuthCrypto {
  constructor(private readonly pepper: string) {}

  createNumericOtp(length: number) {
    const max = 10 ** length;
    return randomInt(0, max).toString().padStart(length, "0");
  }

  createOpaqueToken() {
    return randomBytes(32).toString("base64url");
  }

  hashOtp(emailNormalized: string, portal: string, code: string) {
    return createHmac("sha256", this.pepper)
      .update(`${portal}:${emailNormalized}:${code}`)
      .digest("hex");
  }

  hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  hashEmail(emailNormalized: string) {
    return createHmac("sha256", this.pepper)
      .update(`email:${emailNormalized}`)
      .digest("hex");
  }

  safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
