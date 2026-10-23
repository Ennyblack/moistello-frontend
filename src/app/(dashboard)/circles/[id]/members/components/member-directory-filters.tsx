"use client"

import React, { useMemo } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { CircleMember } from "@/types"
import type { JoinedFilter } from "../member-filters"

interface MemberDirectoryFiltersProps {
  members: CircleMember[]
  filteredCount: number
  totalCount: number
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  position: string
  onPositionChange: (value: string) => void
  joined: JoinedFilter
  onJoinedChange: (value: JoinedFilter) => void
  hasFilters: boolean
  onClearFilters: () => void
  onFocusList?: () => void
}

export function MemberDirectoryFilters({
  members,
  filteredCount,
  totalCount,
  search,
  onSearchChange,
  status,
  onStatusChange,
  position,
  onPositionChange,
  joined,
  onJoinedChange,
  hasFilters,
  onClearFilters,
  onFocusList,
}: MemberDirectoryFiltersProps) {
  const statusOptions = useMemo(
    () => [
      { label: "All statuses", value: "" },
      ...Array.from(new Set(members.map((member) => member.status))).map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
    ],
    [members],
  )

  const positionOptions = useMemo(
    () => [
      { label: "All positions", value: "" },
      ...Array.from(new Set(members.map((member) => member.position)))
        .sort((a, b) => a - b)
        .map((value) => ({ label: `Position #${value}`, value: String(value) })),
    ],
    [members],
  )

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && onFocusList) {
      e.preventDefault()
      onFocusList()
    } else if (e.key === "Escape") {
      onSearchChange("")
    }
  }

  return (
    <div className="border-y border-border/70 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4 text-aurora-violet" />
          <span>Member directory search & filters</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {filteredCount} of {totalCount} members
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search members"
            placeholder="Search by name, ID, or position (Press ↓ to navigate list)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[34rem]">
          <Select
            label="Member status"
            options={statusOptions}
            value={status}
            onChange={onStatusChange}
          />
          <Select
            label="Member position"
            options={positionOptions}
            value={position}
            onChange={onPositionChange}
          />
          <Select
            label="Joined period"
            options={[
              { label: "Joined anytime", value: "" },
              { label: "Joined in 7 days", value: "7d" },
              { label: "Joined in 30 days", value: "30d" },
              { label: "Joined this year", value: "1y" },
            ]}
            value={joined}
            onChange={(value) => onJoinedChange(value as JoinedFilter)}
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            leftIcon={<X className="h-4 w-4" />}
            className="self-start lg:self-center"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
