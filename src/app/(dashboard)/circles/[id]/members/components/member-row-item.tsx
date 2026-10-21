"use client"

import React, { useRef, useEffect } from "react"
import { Hash, Calendar, Coins } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/shared/copy-button"
import { formatAddress, formatCurrency, formatDate } from "@/lib/formatters"
import { cn } from "@/lib/cn"
import type { CircleMember } from "@/types"
import { statusVariantMap } from "../utils/member-directory-helpers"

interface MemberRowItemProps {
  member: CircleMember
  isCurrentUser: boolean
  isOrganizer: boolean
  isFocused: boolean
  contributionTotal: number
  currency: string
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function MemberRowItem({
  member,
  isCurrentUser,
  isOrganizer,
  isFocused,
  contributionTotal,
  currency,
  onSelect,
  onKeyDown,
}: MemberRowItemProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const displayName = member.userName || "Anonymous"
  const statusCfg = statusVariantMap[member.status] || statusVariantMap.left

  useEffect(() => {
    if (isFocused && rowRef.current) {
      rowRef.current.focus()
      rowRef.current.scrollIntoView({ block: "nearest" })
    }
  }, [isFocused])

  return (
    <div
      ref={rowRef}
      tabIndex={isFocused ? 0 : -1}
      role="listitem"
      aria-label={`Member ${displayName}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-all outline-none",
        "border-l-4",
        isFocused
          ? "border-l-aurora-violet bg-aurora-violet/10 ring-1 ring-aurora-violet/50"
          : isCurrentUser
            ? "border-l-aurora-violet/70 bg-card/60"
            : "border-l-transparent bg-card/30 hover:bg-card/50 hover:border-l-aurora-violet/40",
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Avatar
          fallback={displayName}
          size="md"
          className="shrink-0 ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-semibold text-foreground text-sm truncate">
              {displayName}
            </span>
            {isOrganizer && (
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold bg-aurora-violet/20 text-aurora-violet rounded-full px-2 py-0.5 border border-aurora-violet/30">
                Organizer
              </span>
            )}
            {isCurrentUser && (
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 border border-emerald-500/30">
                You
              </span>
            )}
          </div>
          {member.userAddress && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono text-muted-foreground">
                {formatAddress(member.userAddress)}
              </span>
              <CopyButton text={member.userAddress} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
        <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 border border-border/60 text-xs font-mono">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-muted-foreground text-[11px]">Contributed:</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(contributionTotal, currency)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 border border-border/60 text-xs font-mono">
          <Calendar className="h-3.5 w-3.5 text-aurora-violet" />
          <span className="text-muted-foreground text-[11px]">Joined:</span>
          <span className="text-foreground">
            {formatDate(member.joinedAt)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-background/80 border border-border/60 px-2.5 py-1 text-xs font-heading font-medium text-foreground">
          <Hash className="h-3 w-3 text-aurora-violet" />
          #{member.position}
        </span>

        <Badge variant={statusCfg.variant} size="sm">
          {statusCfg.label}
        </Badge>
      </div>
    </div>
  )
}
