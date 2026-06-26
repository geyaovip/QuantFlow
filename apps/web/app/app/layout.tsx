import type { ReactNode } from "react";

import { getUserSession } from "../../lib/auth-session";
import { resolveApiBaseUrl } from "../../lib/api-base-url";
import { UserAppShell } from "../../components/user-app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();

  return (
    <UserAppShell apiBaseUrl={resolveApiBaseUrl()} session={session}>
      {children}
    </UserAppShell>
  );
}
