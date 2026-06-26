import { PageHeader } from "@quantflow/ui";

export default function PaperAccountsPage() {
  return (
    <>
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘管理"
        description="这里只管理模拟余额、模拟订单与风险事件，不存在真实资产或订单。"
      />
      <div className="admin-empty">
        <strong>暂无模拟盘记录</strong>
        <span>
          用户创建模拟盘后会在这里展示权益、回撤、订单状态和风险事件。
        </span>
      </div>
    </>
  );
}
