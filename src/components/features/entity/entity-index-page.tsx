import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type EntityColumn<T> = {
  header: ReactNode;
  className?: string;
  cell: (row: T) => ReactNode;
};

export type EntityOffsetPagination = {
  mode: "offset";
  total: number;
  limit: number;
  offset: number;
  pageSizeOptions?: number[];
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
};

export type EntityPagePagination = {
  mode: "page";
  total: number;
  page: number;
  pageSize: number;
  totalLabel?: string;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  onPageChange: (page: number) => void;
};

export type EntityIndexPageProps<T> = {
  ariaLabel: string;
  title: string;
  description?: string;
  backTo?: string;
  backParams?: Record<string, string>;
  backLabel?: string;
  headerActions?: ReactNode;
  cardTitle?: ReactNode;
  cardHeaderExtras?: ReactNode;
  columns: EntityColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  expandedRowKey?: string | null;
  expandedRowContent?: (row: T) => ReactNode;
  loading?: boolean;
  validating?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  pagination?: EntityOffsetPagination | EntityPagePagination;
  footer?: ReactNode;
};

function LoadingRows({ columnCount }: { columnCount: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index}>
          {Array.from({ length: columnCount }, (__, cell) => (
            <TableCell key={cell} className="py-3">
              <Skeleton className="h-5 w-full max-w-36" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function EntityIndexPage<T>({
  ariaLabel,
  title,
  description,
  backTo,
  backParams,
  backLabel,
  headerActions,
  cardTitle,
  cardHeaderExtras,
  columns,
  rows,
  rowKey,
  rowClassName,
  onRowClick,
  expandedRowKey,
  expandedRowContent,
  loading,
  validating,
  hasError,
  errorMessage,
  onRetry,
  emptyMessage,
  pagination,
  footer,
}: EntityIndexPageProps<T>) {
  const columnCount = columns.length;

  const offsetPagination =
    pagination?.mode === "offset" ? pagination : undefined;
  const pagePagination = pagination?.mode === "page" ? pagination : undefined;

  const limit = offsetPagination?.limit ?? pagePagination?.pageSize ?? 0;
  const offset = offsetPagination?.offset ?? 0;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = pagePagination
    ? pagePagination.page + 1
    : Math.min(totalPages, Math.floor(offset / limit) + 1);

  const pageSizeOptions = offsetPagination?.pageSizeOptions ??
    pagePagination?.pageSizeOptions ?? [10, 20, 50];
  const onPageSizeChange = offsetPagination
    ? offsetPagination.onLimitChange
    : pagePagination?.onPageSizeChange;

  const goToPage = (nextPage: number) => {
    if (pagePagination) {
      pagePagination.onPageChange(nextPage);
      return;
    }
    offsetPagination!.onOffsetChange(nextPage * limit);
  };
  const currentPageIndex = currentPage - 1;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex >= totalPages - 1;

  return (
    <section
      aria-label={ariaLabel}
      className="mx-auto w-full max-w-7xl p-4 sm:p-6"
    >
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {backTo && (
              <Button
                render={<Link to={backTo} params={backParams as never} />}
                variant="ghost"
                size="sm"
                aria-label={backLabel ?? "Volver"}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="size-4" />
                Volver
              </Button>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>

        <Card>
          {(cardTitle || cardHeaderExtras) && (
            <CardHeader className="gap-4">
              {cardTitle && (
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  {cardTitle}
                </CardTitle>
              )}
              {cardHeaderExtras}
            </CardHeader>
          )}

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} className={column.className}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 ? (
                  <LoadingRows columnCount={columnCount} />
                ) : null}

                {hasError && (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="h-36 text-center"
                    >
                      <p className="mb-3 text-sm text-destructive">
                        {errorMessage ?? "No fue posible cargar los datos."}
                      </p>
                      {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          Reintentar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !hasError && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="h-36 text-center text-muted-foreground"
                    >
                      {emptyMessage ?? "No hay registros."}
                    </TableCell>
                  </TableRow>
                )}

                {!hasError &&
                  rows.map((row) => (
                    <Fragment key={rowKey(row)}>
                      <TableRow
                        className={cn(
                          "border-gray-100 hover:bg-gray-50/80",
                          rowClassName?.(row),
                          onRowClick && "cursor-pointer"
                        )}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                      >
                        {columns.map((column, index) => (
                          <TableCell
                            key={index}
                            className={cn("py-3", column.className)}
                          >
                            {column.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandedRowContent && expandedRowKey === rowKey(row) && (
                        <TableRow className="border-gray-100">
                          <TableCell
                            colSpan={columnCount}
                            className="bg-muted/40 py-3"
                          >
                            {expandedRowContent(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
              </TableBody>
            </Table>
            {validating && rows.length > 0 && (
              <div
                className="h-0.5 animate-pulse bg-primary/40"
                aria-label="Actualizando"
              />
            )}
          </CardContent>

          {(pagination || footer) && (
            <CardFooter className="justify-end gap-3 border-t">
              {pagination && (
                <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                  {onPageSizeChange && (
                    <>
                      <span>Filas por página</span>
                      <Select
                        value={String(limit)}
                        onValueChange={(value) =>
                          onPageSizeChange(Number(value))
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  <span className="mx-1">
                    Página {currentPage} de {totalPages}
                    {pagePagination?.totalLabel
                      ? ` · ${total} ${pagePagination.totalLabel}`
                      : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={isFirstPage}
                      aria-label="Primera página"
                      onClick={() => goToPage(0)}
                    >
                      <ChevronsLeftIcon />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={isFirstPage}
                      aria-label="Página anterior"
                      onClick={() =>
                        goToPage(Math.max(0, currentPageIndex - 1))
                      }
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={isLastPage}
                      aria-label="Página siguiente"
                      onClick={() =>
                        goToPage(Math.min(totalPages - 1, currentPageIndex + 1))
                      }
                    >
                      <ChevronRightIcon />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={isLastPage}
                      aria-label="Última página"
                      onClick={() => goToPage(totalPages - 1)}
                    >
                      <ChevronsRightIcon />
                    </Button>
                  </div>
                </div>
              )}
              {footer}
            </CardFooter>
          )}
        </Card>
      </div>
    </section>
  );
}
