"use client"

import React, { useState } from "react"
import { ShieldCheck, Undo2, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/shared/copy-button"
import { formatAddress, formatDate } from "@/lib/formatters"
import { useUIStore } from "@/stores/ui-store"
import { RevokeDelegationDialog } from "./revoke-delegation-dialog"
import { IncomingDelegationsList } from "./incoming-delegations-list"
import type { GovernanceDelegationState } from "@/lib/governance-api"

interface DelegationControlsProps {
  delegationState: GovernanceDelegationState
  onDelegate: (delegateAddress: string) => Promise<void>
  onRevoke: () => Promise<void>
  isDelegating: boolean
  isRevoking: boolean
}

export function DelegationControls({
  delegationState,
  onDelegate,
  onRevoke,
  isDelegating,
  isRevoking,
}: DelegationControlsProps) {
  const [delegateAddress, setDelegateAddress] = useState("")
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const active = delegationState.activeDelegation
  const incoming = delegationState.incomingDelegations
  const incomingTotal = incoming.reduce((sum, d) => sum + d.votingPower, 0)

  const handleDelegateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = delegateAddress.trim()
    if (!trimmed) {
      addToast({ type: "error", message: "Please enter a valid delegate address" })
      return
    }
    await onDelegate(trimmed)
    setDelegateAddress("")
  }

  const handleConfirmRevoke = async () => {
    await onRevoke()
    setShowRevokeModal(false)
  }

  return (
    <section
      aria-label="Voting Power Delegation"
      className="border border-border/80 bg-card/40 p-5 space-y-5"
      data-testid="delegation-controls-section"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-aurora-violet font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Voting Power & Contract Delegation</span>
          </div>
          <h2 className="font-heading text-lg font-bold text-foreground mt-0.5">
            Delegate Voting Power
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-background/80 border border-border/70 px-3 py-1.5 rounded-md">
            <span className="text-muted-foreground">Own Power: </span>
            <span className="font-semibold text-foreground">{delegationState.ownVotingPower} VP</span>
          </div>
          <div className="bg-aurora-violet/10 border border-aurora-violet/30 px-3 py-1.5 rounded-md">
            <span className="text-aurora-violet">Effective Power: </span>
            <span className="font-semibold text-aurora-violet">{delegationState.effectiveVotingPower} VP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3 border-l-2 border-l-aurora-violet pl-4">
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-foreground uppercase tracking-wide">
            <ArrowUpRight className="h-4 w-4 text-aurora-violet" />
            <span>Your Active Delegation</span>
          </div>

          {active ? (
            <div className="bg-background/60 border border-border/70 p-3.5 space-y-3" data-testid="active-delegation-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Delegated to:</p>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
                    <span>{formatAddress(active.delegateAddress)}</span>
                    <CopyButton text={active.delegateAddress} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Power</p>
                  <p className="font-mono text-sm font-bold text-aurora-violet">{active.votingPower} VP</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">Since: {formatDate(active.delegatedAt)}</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeModal(true)}
                  data-testid="revoke-delegation-btn"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" /> Revoke
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDelegateSubmit} className="space-y-2.5">
              <p className="text-xs text-muted-foreground">
                Delegate your voting power to a trusted community member to vote on your behalf.
              </p>
              <div className="flex gap-2">
                <Input
                  aria-label="Delegate public address"
                  placeholder="Delegate address (e.g. G...)"
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  className="font-mono text-xs"
                  data-testid="delegate-address-input"
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={isDelegating}
                  data-testid="delegate-power-btn"
                  className="shrink-0"
                >
                  Delegate
                </Button>
              </div>
            </form>
          )}
        </div>

        <IncomingDelegationsList incoming={incoming} incomingTotal={incomingTotal} />
      </div>

      <RevokeDelegationDialog
        isOpen={showRevokeModal}
        delegateAddress={active?.delegateAddress || ""}
        votingPower={active?.votingPower || 0}
        isRevoking={isRevoking}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleConfirmRevoke}
      />
    </section>
  )
}
