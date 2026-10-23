"use client"

import React from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatAddress } from "@/lib/formatters"

interface RevokeDelegationDialogProps {
  isOpen: boolean
  delegateAddress: string
  votingPower: number
  isRevoking: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RevokeDelegationDialog({
  isOpen,
  delegateAddress,
  votingPower,
  isRevoking,
  onClose,
  onConfirm,
}: RevokeDelegationDialogProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md border border-red-500/30 bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="revoke-dialog-title" className="font-heading text-lg font-bold text-foreground">
                Revoke Voting Power?
              </h3>
              <p className="text-xs text-muted-foreground">Action requires confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to revoke your delegation to{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatAddress(delegateAddress)}
          </span>
          ? Your voting power of{" "}
          <span className="font-mono font-semibold text-foreground">{votingPower} VP</span> will be
          restored to your direct control immediately.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isRevoking}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            loading={isRevoking}
            data-testid="confirm-revoke-btn"
          >
            Revoke Delegation
          </Button>
        </div>
      </div>
    </div>
  )
}
