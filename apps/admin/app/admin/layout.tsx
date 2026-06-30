import type { ReactNode } from "react";

import { AdminShell } from "../../components/admin-shell";
import { getAdminSession } from "../../lib/auth-session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  return <AdminShell session={session}>{children}</AdminShell>;
}
