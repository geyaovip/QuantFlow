import type { ReactNode } from "react";

import { getUserSession } from "../../lib/auth-session";
import { UserAppShell } from "../../components/user-app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();

  return <UserAppShell session={session}>{children}</UserAppShell>;
}
