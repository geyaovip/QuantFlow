import { cookies } from "next/headers";

import { authSessionSchema } from "@quantflow/contracts";

import { resolveApiBaseUrl } from "./strategy-api";

export type AdminSession = {
  subjectId: string;
  audience: "admin";
  expiresAt: string;
  email?: string;
  displayName?: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_admin_session")?.value;
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${resolveApiBaseUrl()}/api/v1/auth/session?audience=admin`,
      {
        headers: {
          cookie: `qf_admin_session=${encodeURIComponent(token)}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: unknown };
    const session = authSessionSchema.safeParse(payload.data);
    if (!session.success || session.data.audience !== "admin") {
      return null;
    }

    return session.data as AdminSession;
  } catch {
    return null;
  }
}
