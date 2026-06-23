import type { ReactNode } from "react";

import { UserAppShell } from "../../components/user-app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <UserAppShell>{children}</UserAppShell>;
}
