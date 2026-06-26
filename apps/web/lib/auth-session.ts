import { cookies } from "next/headers";

import { resolveApiBaseUrl } from "./api-base-url";

export type UserSession = {
  subjectId: string;
  audience: "user";
  expiresAt: string;
  email?: string;
  displayName?: string;
  membershipPlan?: string;
};

export async function getUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_user_session")?.value;
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${resolveApiBaseUrl()}/api/v1/auth/session?audience=user`,
      {
        headers: {
          cookie: `qf_user_session=${encodeURIComponent(token)}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: UserSession };
    return payload.data ?? null;
  } catch {
    return null;
  }
}
