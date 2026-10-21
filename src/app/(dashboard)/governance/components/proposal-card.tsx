"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, Clock, CircleCheckBig, CircleX, FileText } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import type { GovernanceProposal } from "@/lib/governance-api"

interface ProposalCardProps {
  proposal: GovernanceProposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst
  const forPercent = totalVotes > 0 ? Math.round((proposal.votesFor / totalVotes) * 100) : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-aurora-violet/30 bg-aurora-violet/10 px-2.5 py-0.5 text-xs text-aurora-violet font-semibold">
            <Clock className="h-3 w-3" /> Active
          </span>
        )
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400 font-semibold">
            <CircleCheckBig className="h-3 w-3" /> Passed
          </span>
        )
      case "defeated":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400 font-semibold">
            <CircleX className="h-3 w-3" /> Defeated
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
            <FileText className="h-3 w-3" /> {status}
          </span>
        )
    }
  }

  return (
    <div
      className="group border border-white/10 rounded-xl p-6 hover:border-aurora-violet/30 hover:bg-white/[0.02] transition-all space-y-4"
      data-testid={`proposal-card-${proposal.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusBadge(proposal.status)}
          {proposal.category && (
            <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
              {proposal.category}
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground">ID: #{proposal.id}</span>
      </div>

      <Link href={`/governance/${proposal.id}`} className="block">
        <h2 className="font-heading text-xl font-bold text-foreground group-hover:text-aurora-violet transition-colors">
          {proposal.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
      </Link>

      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-emerald-400 font-medium">For: {proposal.votesFor} ({forPercent}%)</span>
          <span className="text-red-400 font-medium">Against: {proposal.votesAgainst} ({100 - forPercent}%)</span>
        </div>
        <div className="h-2 w-full bg-red-500/20 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${forPercent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-muted-foreground">
          Total Votes: <strong className="text-foreground">{totalVotes}</strong>
        </span>

        <ButtonLink href={`/governance/${proposal.id}`} variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
          View & Vote
        </ButtonLink>
      </div>
    </div>
  )
}
