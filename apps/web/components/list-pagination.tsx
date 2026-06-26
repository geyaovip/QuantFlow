import Link from "next/link";

import type { Pagination } from "@quantflow/contracts";

type ListPaginationProps = {
  ariaLabel: string;
  basePath: string;
  pagination: Pagination;
  query?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

export function ListPagination({
  ariaLabel,
  basePath,
  pagination,
  query = {},
}: ListPaginationProps) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label={ariaLabel}>
      {page > 1 ? (
        <Link href={buildHref(basePath, page - 1, query)}>上一页</Link>
      ) : (
        <span aria-disabled="true">上一页</span>
      )}
      <span aria-current="page">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(basePath, page + 1, query)}>下一页</Link>
      ) : (
        <span aria-disabled="true">下一页</span>
      )}
    </nav>
  );
}
