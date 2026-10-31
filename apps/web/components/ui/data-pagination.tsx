"use client";

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type Props = { page: number; pageSize: number; totalItems: number; onPageChange: (page: number) => void };

export function DataPagination({ page, pageSize, totalItems, onPageChange }: Props) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems <= pageSize) return null;

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
    const visiblePages = pages.reduce<(number | "ellipsis")[]>((items, item, index) => {
        if (index > 0 && item - pages[index - 1] > 1) items.push("ellipsis");
        items.push(item);
        return items;
    }, []);
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return <div className="pagination-bar"><span className="pagination-summary">Showing {start}-{end} of {totalItems}</span><Pagination className="w-auto mx-0"><PaginationContent><PaginationItem><PaginationPrevious disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} /></PaginationItem>{visiblePages.map((item, index) => item === "ellipsis" ? <PaginationItem key={`ellipsis-${index}`}><span className="pagination-dots">...</span></PaginationItem> : <PaginationItem key={item}><PaginationLink isActive={item === page} onClick={() => onPageChange(item)}>{item}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} /></PaginationItem></PaginationContent></Pagination></div>;
}