import React from 'react';

export default function Pagination({
    page,
    pageSize,
    totalCount,
    onPageChange,
    itemLabel = 'mục',
    ariaLabel = 'Phân trang'
}) {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const firstItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const lastItem = Math.min(page * pageSize, totalCount);

    return (
        <nav aria-label={ariaLabel} className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500" aria-live="polite">
                {`Hiển thị ${firstItem}-${lastItem} trong ${totalCount} ${itemLabel}`}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1 || totalCount === 0}
                    className="rounded-xl border border-pink-200 px-3 py-2 font-bold text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ‹ Trước
                </button>
                <span className="min-w-20 text-center font-semibold text-slate-600">
                    Trang {page} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages || totalCount === 0}
                    className="rounded-xl border border-pink-200 px-3 py-2 font-bold text-pink-700 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Sau ›
                </button>
            </div>
        </nav>
    );
}
