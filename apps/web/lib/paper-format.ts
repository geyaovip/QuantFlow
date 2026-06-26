import type { PaperAccountListItem } from "@quantflow/contracts";

export function formatPaperStatus(status: PaperAccountListItem["status"]) {
  if (status === "running") {
    return "运行中";
  }
  if (status === "paused") {
    return "已暂停";
  }
  if (status === "ended") {
    return "已结束";
  }
  if (status === "data_error") {
    return "数据异常";
  }
  return "策略暂停";
}

export function formatMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRatio(value: string, signed = false) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  const percent = new Intl.NumberFormat("zh-CN", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(amount);

  return percent;
}
