export const TURNSTILE_VERIFIER = Symbol("TURNSTILE_VERIFIER");

export interface TurnstileVerifier {
  verify(token: string, ip?: string): Promise<boolean>;
}
