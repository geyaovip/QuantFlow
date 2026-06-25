import type { TurnstileVerifier } from "../domain/turnstile-verifier.js";

export class NoopTurnstileVerifier implements TurnstileVerifier {
  async verify() {
    return true;
  }
}
