"use client"

import React from "react"
import { Search, ListFilter } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { ProposalStatus } from "@/lib/governance-api"

export const statusTabs: { label: string; value: ProposalStatus }[] = [
  { label: "All Proposals", value: "all" },
  { label: "Active", value: "active" },
  { label: "Passed", value: "passed" },
  { label: "Defeated", value: "defeated" },
]

interface GovernanceFiltersBarProps {
  selectedStatus: ProposalStatus
  onStatusChange: (status: ProposalStatus) => void
  search: string
  onSearchChange: (search: string) => void
  categoryFilter: string
  onCategoryFilterChange: (category: string) => void
  sortBy: "newest" | "votes" | "oldest"
  onSortByChange: (sort: "newest" | "votes" | "oldest") => void
}

export function GovernanceFiltersBar({
  selectedStatus,
  onStatusChange,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
}: GovernanceFiltersBarProps) {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <nav className="flex gap-6 border-b border-white/10 overflow-x-auto" aria-label="Proposal status">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={selectedStatus === tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
              selectedStatus === tab.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`status-tab-${tab.value}`}
          >
            {tab.label}
            {selectedStatus === tab.value && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-aurora-violet" />
            )}
          </button>
        ))}
      </nav>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-white/10 rounded-xl p-4 bg-white/[0.02]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals by title or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
            data-testid="governance-search-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-aurora-violet" />
            <select
              aria-label="Proposal category"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-foreground"
              data-testid="category-filter-select"
            >
              <option value="all" className="bg-background">All Categories</option>
              <option value="circle parameter" className="bg-background">Circle Parameter</option>
              <option value="treasury release" className="bg-background">Treasury Release</option>
              <option value="rule amendment" className="bg-background">Rule Amendment</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <select
              aria-label="Sort proposals"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as "newest" | "votes" | "oldest")}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-foreground"
              data-testid="governance-sort-select"
            >
              <option value="newest" className="bg-background">Newest</option>
              <option value="votes" className="bg-background">Most Votes</option>
              <option value="oldest" className="bg-background">Oldest</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
