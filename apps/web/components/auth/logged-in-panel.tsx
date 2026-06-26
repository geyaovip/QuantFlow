import Link from "next/link";

import { Card } from "@quantflow/ui";

import { LogoutButton } from "./logout-button";

type LoggedInPanelProps = {
  apiBaseUrl: string;
  expiresAtLabel: string;
  nextPath: string;
};

export function LoggedInPanel({
  apiBaseUrl,
  expiresAtLabel,
  nextPath,
}: LoggedInPanelProps) {
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <Card className="auth-card logged-in-panel" aria-label="已登录状态">
      <div className="auth-card__header">
        <p>登录</p>
        <h1>你已登录</h1>
        <span>
          当前浏览器仍保持登录状态，可直接进入应用；如需更换账号，请先退出后重新登录。
        </span>
      </div>
      <div className="logged-in-panel__actions">
        <Link className="primary-link" href={nextPath}>
          继续进入应用
        </Link>
        <LogoutButton
          apiBaseUrl={apiBaseUrl}
          redirectTo={loginPath}
          variant="secondary"
        >
          退出并重新登录
        </LogoutButton>
      </div>
      <p className="logged-in-panel__meta">会话将于 {expiresAtLabel} 到期</p>
    </Card>
  );
}
