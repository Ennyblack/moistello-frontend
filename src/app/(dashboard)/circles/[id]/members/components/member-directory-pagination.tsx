"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MemberDirectoryPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function MemberDirectoryPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: MemberDirectoryPaginationProps) {
  if (totalItems <= pageSize && totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav
      aria-label="Member directory pagination"
      data-testid="members-pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70 pt-4"
    >
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground font-mono">
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
          <span className="font-semibold text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> members
        </p>

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show:</span>
            {[10, 20, 50].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                  pageSize === size
                    ? "bg-aurora-violet/20 font-semibold text-aurora-violet"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous members page"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          data-testid="prev-member-page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-xs font-mono text-muted-foreground px-2">
          Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next members page"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          data-testid="next-member-page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
