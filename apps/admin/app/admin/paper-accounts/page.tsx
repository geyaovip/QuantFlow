import { PageHeader } from "@quantflow/ui";

export default function PaperAccountsPage() {
  return (
    <>
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘管理"
        description="这里只管理模拟余额、模拟订单与风险事件，不存在真实资产或订单。"
      />
      <div className="admin-empty">模拟盘管理将在后续业务切片实现</div>
    </>
  );
}
