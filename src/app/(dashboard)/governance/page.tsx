"use client"

import React, { useState, useMemo } from "react"
import { Landmark, Plus, RotateCcw } from "lucide-react"
import { Button, ButtonLink } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGovernanceProposals,
  useGovernanceDelegation,
  useDelegateVotingPower,
  useRevokeDelegation,
} from "@/hooks/use-governance"
import { useMultiWallet } from "@/hooks/use-multi-wallet"
import { useUIStore } from "@/stores/ui-store"
import { DelegationControls } from "./components/delegation-controls"
import { GovernanceFiltersBar } from "./components/governance-filters-bar"
import { ProposalCard } from "./components/proposal-card"
import { ProposalsPagination } from "./components/proposals-pagination"
import type { ProposalStatus } from "@/lib/governance-api"

export default function GovernancePage() {
  const [selectedStatus, setSelectedStatus] = useState<ProposalStatus>("all")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"newest" | "votes" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 3

  const { address } = useMultiWallet()
  const addToast = useUIStore((s) => s.addToast)

  const { data: proposals = [], isLoading, isError, refetch } = useGovernanceProposals(selectedStatus)
  const { data: delegationState } = useGovernanceDelegation(address || undefined)
  const delegateMutation = useDelegateVotingPower()
  const revokeMutation = useRevokeDelegation()

  const handleDelegate = async (delegateAddress: string) => {
    try {
      await delegateMutation.mutateAsync({ delegateAddress })
      addToast({ type: "success", message: `Voting power successfully delegated to ${delegateAddress.slice(0, 8)}...` })
    } catch {
      addToast({ type: "error", message: "Failed to delegate voting power. Please try again." })
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync()
      addToast({ type: "success", message: "Delegation revoked successfully. Your direct voting power is restored." })
    } catch {
      addToast({ type: "error", message: "Failed to revoke delegation. Please try again." })
    }
  }

  const filteredProposals = useMemo(() => {
    let result = [...proposals]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)),
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase())
    }

    result.sort((a, b) => {
      if (sortBy === "votes") {
        const totalA = a.votesFor + a.votesAgainst
        const totalB = b.votesFor + b.votesAgainst
        return totalB - totalA
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    return result
  }, [proposals, search, categoryFilter, sortBy])

  const totalPages = Math.ceil(filteredProposals.length / pageSize) || 1
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProposals.slice(start, start + pageSize)
  }, [filteredProposals, currentPage, pageSize])

  const handleClearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setSortBy("newest")
    setSelectedStatus("all")
    setCurrentPage(1)
  }

  return (
    <div className="relative overflow-hidden space-y-8" data-testid="governance-page">
      <div className="pointer-events-none absolute right-8 top-4 text-[11rem] font-heading font-black leading-none text-aurora-violet/5 select-none">
        GOV
      </div>

      <header className="relative border-l-4 border-l-aurora-violet py-3 pl-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-aurora-violet">
          On-Chain Governance
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground">Governance</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Propose and vote on parameter changes, treasury disbursements, and community rules.
            </p>
          </div>
          <ButtonLink href="/governance/create" leftIcon={<Plus className="h-4 w-4" />} variant="primary">
            Create proposal
          </ButtonLink>
        </div>
      </header>

      {/* Voting Power Delegation Controls (#475 & #500) */}
      {delegationState && (
        <DelegationControls
          delegationState={delegationState}
          onDelegate={handleDelegate}
          onRevoke={handleRevoke}
          isDelegating={delegateMutation.isPending}
          isRevoking={revokeMutation.isPending}
        />
      )}

      {/* Filters and Tabs */}
      <GovernanceFiltersBar
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status)
          setCurrentPage(1)
        }}
        search={search}
        onSearchChange={(query) => {
          setSearch(query)
          setCurrentPage(1)
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(cat) => {
          setCategoryFilter(cat)
          setCurrentPage(1)
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Main Content / Proposals List */}
      {isLoading ? (
        <div className="space-y-4" data-testid="governance-loading-skeleton">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-white/10 rounded-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center space-y-3" role="alert">
          <p className="text-sm text-red-400">Governance proposals could not be loaded. Try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="border border-white/10 rounded-xl py-12 text-center space-y-4" data-testid="governance-empty-state">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-aurora-violet">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">No proposals found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              There are no {selectedStatus !== "all" ? selectedStatus : ""} proposals matching your filter parameters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="proposals-list">
          {paginatedProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && (
        <ProposalsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProposals.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
