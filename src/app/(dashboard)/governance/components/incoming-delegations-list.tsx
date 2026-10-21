"use client"

import React from "react"
import { ArrowDownLeft } from "lucide-react"
import { CopyButton } from "@/components/shared/copy-button"
import { formatAddress } from "@/lib/formatters"
import type { ActiveDelegation } from "@/lib/governance-api"

interface IncomingDelegationsListProps {
  incoming: ActiveDelegation[]
  incomingTotal: number
}

export function IncomingDelegationsList({
  incoming,
  incomingTotal,
}: IncomingDelegationsListProps) {
  return (
    <div className="space-y-3 border-l-2 border-l-emerald-500/70 pl-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-heading font-semibold text-foreground uppercase tracking-wide">
          <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
          <span>Delegations Made to You</span>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-semibold">
          +{incomingTotal} VP ({incoming.length})
        </span>
      </div>

      {incoming.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1" data-testid="incoming-delegations-list">
          {incoming.map((d, i) => (
            <div key={i} className="flex items-center justify-between bg-background/60 border border-border/70 p-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-foreground">{formatAddress(d.delegatorAddress)}</span>
                <CopyButton text={d.delegatorAddress} />
              </div>
              <span className="font-mono font-semibold text-emerald-400">+{d.votingPower} VP</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-background/40 border border-border/50 text-xs text-muted-foreground">
          No delegations received yet.
        </div>
      )}
    </div>
  )
}
