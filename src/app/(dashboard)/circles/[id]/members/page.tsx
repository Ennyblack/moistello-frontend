"use client"

import React, { useMemo } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Inbox } from "lucide-react"
import { useCircleMembers, useCircle, useCircleRounds } from "@/hooks/use-circles"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState, MemberTabsEmptyState } from "@/components/shared/empty-state"
import { ButtonLink } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberDirectoryFilters } from "./components/member-directory-filters"
import { MemberDirectoryList } from "./components/member-directory-list"
import { MemberDirectoryPagination } from "./components/member-directory-pagination"
import { useMemberDirectory } from "./hooks/use-member-directory"
import { buildContributionMap } from "./utils/member-directory-helpers"

export default function CircleMembersPage() {
  const params = useParams()
  const circleId = params.id as string

  const { user } = useAuth()
  const { data: circle, isLoading: circleLoading } = useCircle(circleId)
  const { data: members = [], isLoading: membersLoading, isError } = useCircleMembers(circleId)

  // Safely invoke useCircleRounds in case test environments mock use-circles without it
  const roundsQuery = typeof useCircleRounds === "function" ? useCircleRounds(circleId) : undefined
  const rounds = roundsQuery?.data ?? []

  const contributionsMap = useMemo(() => buildContributionMap(rounds), [rounds])

  const {
    search,
    setSearch,
    status,
    setStatus,
    position,
    setPosition,
    joined,
    setJoined,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    focusedIndex,
    setFocusedIndex,
    filteredMembers,
    paginatedMembers,
    totalPages,
    clearFilters,
    hasFilters,
  } = useMemberDirectory(members, 20)

  const activeMembersCount = useMemo(
    () => members.filter((m) => m.status === "active").length,
    [members],
  )

  const isLoading = membersLoading || circleLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Members"
          breadcrumbs={[
            { label: "Circles", href: "/circles" },
            { label: "Circle", href: `/circles/${circleId}` },
            { label: "Members" },
          ]}
          action={
            <ButtonLink
              href={`/circles/${circleId}`}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </ButtonLink>
          }
        />
        <div className="border border-border/70 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-l-4 border-l-border/30">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="50%" />
              </div>
              <Skeleton variant="text" width={80} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members" />
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Failed to load members"
          description="Something went wrong. Please try again."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in this circle`}
        breadcrumbs={[
          { label: "Circles", href: "/circles" },
          { label: "Circle", href: `/circles/${circleId}` },
          { label: "Members" },
        ]}
        action={
          <ButtonLink
            href={`/circles/${circleId}`}
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Circle
          </ButtonLink>
        }
      />

      {/* Visual Anchor: Large Typography Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-l-4 border-l-aurora-violet bg-card/30 p-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Total Members</span>
          <p className="text-3xl font-heading font-bold text-foreground mt-0.5">{members.length}</p>
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Active Members</span>
          <p className="text-3xl font-heading font-bold text-emerald-400 mt-0.5">{activeMembersCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Target Contribution</span>
          <p className="text-3xl font-heading font-bold text-foreground mt-0.5">
            {circle?.contributionAmount ?? 0} <span className="text-xs font-mono text-muted-foreground">{circle?.currency || "XLM"}</span>
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <MemberTabsEmptyState />
      ) : (
        <>
          <MemberDirectoryFilters
            members={members}
            filteredCount={filteredMembers.length}
            totalCount={members.length}
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            position={position}
            onPositionChange={setPosition}
            joined={joined}
            onJoinedChange={setJoined}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onFocusList={() => setFocusedIndex(0)}
          />

          <MemberDirectoryList
            members={paginatedMembers}
            currentUserId={user?.id}
            organizerId={circle?.organizerId}
            currency={circle?.currency || "XLM"}
            contributionsMap={contributionsMap}
            focusedIndex={focusedIndex}
            onFocusedIndexChange={setFocusedIndex}
            onClearFilters={clearFilters}
          />

          <MemberDirectoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMembers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  )
}
