"use client"

import React from "react"
import { Search } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import type { CircleMember } from "@/types"
import { MemberRowItem } from "./member-row-item"
import { getMemberContributionTotal } from "../utils/member-directory-helpers"

interface MemberDirectoryListProps {
  members: CircleMember[]
  currentUserId?: string
  organizerId?: string
  currency: string
  contributionsMap?: Map<string, number>
  focusedIndex: number
  onFocusedIndexChange: (index: number) => void
  onClearFilters: () => void
}

export function MemberDirectoryList({
  members,
  currentUserId,
  organizerId,
  currency,
  contributionsMap,
  focusedIndex,
  onFocusedIndexChange,
  onClearFilters,
}: MemberDirectoryListProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="No matching members"
        description="Try changing or clearing the current filters."
        action={{ label: "Clear filters", onClick: onClearFilters }}
      />
    )
  }

  const handleItemKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      onFocusedIndexChange(Math.min(members.length - 1, index + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      onFocusedIndexChange(Math.max(0, index - 1))
    } else if (e.key === "Home") {
      e.preventDefault()
      onFocusedIndexChange(0)
    } else if (e.key === "End") {
      e.preventDefault()
      onFocusedIndexChange(members.length - 1)
    }
  }

  return (
    <div
      role="list"
      aria-label="Member directory list"
      className="overflow-hidden border border-border/80 bg-card/40 divide-y divide-border/60"
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-aurora-violet via-indigo-500/40 to-transparent" />
      {members.map((member, index) => {
        const isCurrentUser = member.userId === currentUserId
        const isOrganizer = member.userId === organizerId
        const isFocused = focusedIndex === index
        const total = getMemberContributionTotal(member, contributionsMap)

        return (
          <MemberRowItem
            key={member.id}
            member={member}
            isCurrentUser={isCurrentUser}
            isOrganizer={isOrganizer}
            isFocused={isFocused}
            contributionTotal={total}
            currency={currency}
            onSelect={() => onFocusedIndexChange(index)}
            onKeyDown={(e) => handleItemKeyDown(index, e)}
          />
        )
      })}
    </div>
  )
}
