"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpCircle, ArrowDownCircle, Search, Filter, RotateCcw, ChevronLeft, ChevronRight, Calendar, DollarSign } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { get } from "@/lib/api-client"
import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { PageError, PageLoading } from "@/components/shared/page-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiResponse } from "@/types"
import { cn } from "@/lib/cn"
import { formatAddress } from "@/lib/formatters"

export interface TxItem {
  id: string
  type: "sent" | "received"
  amount: number
  description: string
  createdAt: string
  txnHash?: string
  source: "contribution" | "payout"
  status?: "completed" | "pending" | "failed"
}

export type DateRangeFilter = "all" | "7d" | "30d" | "1y"

export interface TransactionFilters {
  type: string
  source: string
  dateRange: DateRangeFilter
  minAmount: string
  maxAmount: string
  search: string
}

export function filterTransactions(txns: TxItem[], filters: TransactionFilters, now = new Date()): TxItem[] {
  return txns.filter((tx) => {
    // Type filter
    if (filters.type && filters.type !== "all" && tx.type !== filters.type) {
      return false
    }

    // Source filter
    if (filters.source && filters.source !== "all" && tx.source !== filters.source) {
      return false
    }

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      const matchesDesc = tx.description.toLowerCase().includes(q)
      const matchesHash = tx.txnHash?.toLowerCase().includes(q)
      const matchesId = tx.id.toLowerCase().includes(q)
      if (!matchesDesc && !matchesHash && !matchesId) {
        return false
      }
    }

    // Amount filter
    if (filters.minAmount !== "" && !isNaN(Number(filters.minAmount))) {
      if (tx.amount < Number(filters.minAmount)) return false
    }
    if (filters.maxAmount !== "" && !isNaN(Number(filters.maxAmount))) {
      if (tx.amount > Number(filters.maxAmount)) return false
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== "all") {
      const txTime = new Date(tx.createdAt).getTime()
      if (!isNaN(txTime)) {
        const daysMap: Record<Exclude<DateRangeFilter, "all">, number> = {
          "7d": 7,
          "30d": 30,
          "1y": 365,
        }
        const days = daysMap[filters.dateRange]
        if (days) {
          const minTime = now.getTime() - days * 24 * 60 * 60 * 1000
          if (txTime < minTime) return false
        }
      }
    }

    return true
  })
}

const PAGE_SIZE = 10

export default function TransactionsPage() {
  const { data: txns = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const [cRes, pRes] = await Promise.allSettled([
        get<ApiResponse<{ contributions?: Record<string, unknown>[] }>>("/contributions"),
        get<ApiResponse<{ payouts?: Record<string, unknown>[] }>>("/payouts"),
      ])
      const all: TxItem[] = []
      if (cRes.status === "fulfilled") {
        (cRes.value.data?.contributions ?? []).forEach((c) =>
          all.push({
            id: String(c.id ?? ""),
            type: "sent",
            amount: Number(c.amount ?? 0),
            description: "Contribution",
            createdAt: String(c.createdAt ?? new Date().toISOString()),
            txnHash: c.txnHash ? String(c.txnHash) : undefined,
            source: "contribution",
            status: (c.status as "completed" | "pending" | "failed") ?? "completed",
          })
        )
      }
      if (pRes.status === "fulfilled") {
        (pRes.value.data?.payouts ?? []).forEach((p) =>
          all.push({
            id: String(p.id ?? ""),
            type: "received",
            amount: Number(p.amount ?? 0),
            description: "Payout",
            createdAt: String(p.createdAt ?? new Date().toISOString()),
            txnHash: p.txnHash ? String(p.txnHash) : undefined,
            source: "payout",
            status: (p.status as "completed" | "pending" | "failed") ?? "completed",
          })
        )
      }
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
  })

  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    source: "all",
    dateRange: "all",
    minAmount: "",
    maxAmount: "",
    search: "",
  })
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return filterTransactions(txns, filters)
  }, [txns, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleClearFilters = () => {
    setFilters({
      type: "all",
      source: "all",
      dateRange: "all",
      minAmount: "",
      maxAmount: "",
      search: "",
    })
    setPage(1)
  }

  const columns: DataTableColumn<TxItem>[] = [
    {
      id: "description",
      header: "Transaction",
      cell: (tx) => (
        <Link href={`/wallet/transactions/${tx.id}`} className="flex items-center gap-3 group">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full shrink-0 transition-transform group-hover:scale-105",
              tx.type === "received"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-aurora-violet/15 text-aurora-violet"
            )}
          >
            {tx.type === "received" ? (
              <ArrowDownCircle className="h-4 w-4" />
            ) : (
              <ArrowUpCircle className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground group-hover:text-aurora-violet transition-colors">
              {tx.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(tx.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </Link>
      ),
    },
    {
      id: "source",
      header: "Source",
      cell: (tx) => (
        <span className="text-xs font-mono uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-muted-foreground">
          {tx.source}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      accessor: (tx) => tx.amount,
      sortable: true,
      cell: (tx) => (
        <span
          className={cn(
            "font-semibold",
            tx.type === "received" ? "text-emerald-400" : "text-foreground"
          )}
        >
          {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
        </span>
      ),
    },
    {
      id: "hash",
      header: "Hash",
      cell: (tx) =>
        tx.txnHash ? (
          <span className="font-mono text-xs text-muted-foreground">
            {formatAddress(tx.txnHash)}
          </span>
        ) : (
          "—"
        ),
    },
  ]

  return (
    <div className="space-y-6" data-testid="wallet-transactions-page">
      <PageHeader
        title="Transactions"
        description="Full history of all contributions and payouts with advanced filtering."
      />

      {/* Advanced Filter Panel */}
      <div
        className="border border-white/10 rounded-xl p-4 bg-white/[0.02] space-y-4"
        data-testid="transaction-filter-panel"
      >
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }))
                setPage(1)
              }}
              placeholder="Search by description, ID or hash..."
              className="pl-9"
              data-testid="transaction-search-input"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1" data-testid="transaction-type-tabs">
            {[
              { label: "All", value: "all" },
              { label: "Sent", value: "sent" },
              { label: "Received", value: "received" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, type: tab.value }))
                  setPage(1)
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filters.type === tab.value
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`tx-type-tab-${tab.value}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Source, Date Range, Amount Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          {/* Source Filter */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, source: e.target.value }))
                setPage(1)
              }}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-white/30 cursor-pointer"
              data-testid="transaction-source-select"
            >
              <option value="all" className="bg-background">All Sources</option>
              <option value="contribution" className="bg-background">Contribution</option>
              <option value="payout" className="bg-background">Payout</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, dateRange: e.target.value as DateRangeFilter }))
                setPage(1)
              }}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-foreground focus:outline-none focus:border-white/30 cursor-pointer"
              data-testid="transaction-date-select"
            >
              <option value="all" className="bg-background">All Time</option>
              <option value="7d" className="bg-background">Past 7 Days</option>
              <option value="30d" className="bg-background">Past 30 Days</option>
              <option value="1y" className="bg-background">Past Year</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Min Amount ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, minAmount: e.target.value }))
                setPage(1)
              }}
              className="h-9 text-sm"
              data-testid="transaction-min-amount"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Max Amount ($)</label>
            <Input
              type="number"
              placeholder="10000.00"
              value={filters.maxAmount}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))
                setPage(1)
              }}
              className="h-9 text-sm"
              data-testid="transaction-max-amount"
            />
          </div>
        </div>

        {/* Reset Filter Action */}
        {(filters.type !== "all" ||
          filters.source !== "all" ||
          filters.dateRange !== "all" ||
          filters.minAmount !== "" ||
          filters.maxAmount !== "" ||
          filters.search !== "") && (
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              data-testid="transaction-reset-filters"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError onRetry={() => void refetch()} />
      ) : (
        <DataTable
          data={pageItems}
          columns={columns}
          getRowId={(tx) => tx.id}
          caption="Transaction history"
          emptyState={
            <EmptyState
              icon={<ArrowUpCircle className="h-6 w-6" />}
              title="No transactions found"
              description="No contributions or payouts match your filter criteria."
              action={
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Reset filters
                </Button>
              }
            />
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10" data-testid="transaction-pagination">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              data-testid="pagination-prev"
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground font-mono">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
              data-testid="pagination-next"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
