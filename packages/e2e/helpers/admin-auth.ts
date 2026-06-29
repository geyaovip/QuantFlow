import { resolveE2eAuthBaseUrl, resolveE2eDirectApiUrl } from "./auth.js";

export const e2eAdminEmail = process.env.E2E_ADMIN_EMAIL ?? "geyaovip@163.com";

export async function loginAsAdmin(request: {
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
      data: { email: e2eAdminEmail, portal: "admin" },
    },
  );
  if (!requestResponse.ok()) {
    throw new Error("admin OTP request failed");
  }

  const otpResponse = await request.get(
    `${directApiUrl}/api/v1/test/e2e/last-otp?email=${encodeURIComponent(e2eAdminEmail)}`,
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
        email: e2eAdminEmail,
        portal: "admin",
        code: otpPayload.data.code,
      },
    },
  );
  if (!verifyResponse.ok()) {
    throw new Error("admin OTP verify failed");
  }

  return { email: e2eAdminEmail, authBaseUrl, directApiUrl };
}
