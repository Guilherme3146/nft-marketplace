import { Link } from "@tanstack/react-router";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function CatalogPagination({ currentPage, totalPages }: CatalogPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Paginação" className="flex items-center gap-2">
      {pages.map((page) => (
        <Link
          key={page}
          to="/"
          search={(prev) => ({ ...prev, page })}
          aria-current={page === currentPage ? "page" : undefined}
          className={
            page === currentPage
              ? "flex size-[35px] items-center justify-center rounded bg-primary text-lg font-bold text-primary-foreground"
              : "flex size-[35px] items-center justify-center rounded border border-border text-lg text-foreground"
          }
        >
          {page}
        </Link>
      ))}

      <Link
        to="/"
        search={(prev) => ({ ...prev, page: currentPage + 1 })}
        disabled={currentPage >= totalPages}
        aria-label="Próxima página"
        className="flex size-[35px] items-center justify-center rounded border border-border text-foreground aria-disabled:opacity-40"
      >
        →
      </Link>
    </nav>
  );
}
