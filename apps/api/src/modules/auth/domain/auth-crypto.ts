export const AUTH_CRYPTO = Symbol("AUTH_CRYPTO");

export interface AuthCrypto {
  createNumericOtp(length: number): string;
  createOpaqueToken(): string;
  hashOtp(emailNormalized: string, portal: string, code: string): string;
  hashToken(token: string): string;
  hashEmail(emailNormalized: string): string;
  safeEqual(left: string, right: string): boolean;
}
