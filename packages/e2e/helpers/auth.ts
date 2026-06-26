export const SEED_FREE_STRATEGY_ID = "11111111-1111-4111-8111-111111111111";

export function resolveE2eAuthBaseUrl() {
  return (
    process.env.E2E_WEB_URL ??
    process.env.E2E_BASE_URL ??
    process.env.E2E_API_URL ??
    "http://127.0.0.1:3002"
  );
}

export function resolveE2eDirectApiUrl() {
  return process.env.E2E_API_URL ?? "http://127.0.0.1:3002";
}

export const e2eEmail =
  process.env.E2E_USER_EMAIL ?? `e2e.user.${Date.now()}@quantflow.test`;

export async function loginWithEmailOtp(request: {
  post: (
    url: string,
    options?: { data?: unknown },
  ) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
  get: (
    url: string,
  ) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
}) {
  const authBaseUrl = resolveE2eAuthBaseUrl();
  const directApiUrl = resolveE2eDirectApiUrl();

  const requestResponse = await request.post(
    `${authBaseUrl}/api/v1/auth/email-otp/request`,
    {
      data: { email: e2eEmail, portal: "user" },
    },
  );
  if (!requestResponse.ok()) {
    throw new Error("OTP request failed");
  }

  const otpResponse = await request.get(
    `${directApiUrl}/api/v1/test/e2e/last-otp?email=${encodeURIComponent(e2eEmail)}`,
  );
  if (!otpResponse.ok()) {
    throw new Error("E2E OTP helper unavailable; set ENABLE_E2E_AUTH=true");
  }

  const otpPayload = (await otpResponse.json()) as {
    data: { code: string };
  };
  const verifyResponse = await request.post(
    `${authBaseUrl}/api/v1/auth/email-otp/verify`,
    {
      data: {
        email: e2eEmail,
        portal: "user",
        code: otpPayload.data.code,
      },
    },
  );
  if (!verifyResponse.ok()) {
    throw new Error("OTP verify failed");
  }

  return { email: e2eEmail, authBaseUrl, directApiUrl };
}
