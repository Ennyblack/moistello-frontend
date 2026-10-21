import type { CircleMember, CircleRound, MemberStatus } from "@/types"

export const statusVariantMap: Record<
  MemberStatus,
  { variant: "success" | "warning" | "info" | "destructive" | "default" | "outline"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  pending: { variant: "warning", label: "Pending" },
  invited: { variant: "info", label: "Invited" },
  defaulter: { variant: "destructive", label: "Defaulter" },
  left: { variant: "default", label: "Left" },
  removed: { variant: "destructive", label: "Removed" },
}

export function buildContributionMap(rounds?: CircleRound[]): Map<string, number> {
  const map = new Map<string, number>()
  if (!rounds || !Array.isArray(rounds)) return map

  for (const round of rounds) {
    if (!round?.contributions) continue
    for (const contribution of round.contributions) {
      if (contribution.status !== "failed" && contribution.userId) {
        const current = map.get(contribution.userId) ?? 0
        map.set(contribution.userId, current + (Number(contribution.amount) || 0))
      }
    }
  }

  return map
}

export function getMemberContributionTotal(
  member: CircleMember,
  contributionsMap?: Map<string, number>,
): number {
  if (typeof member.totalContributed === "number") return member.totalContributed
  if (typeof member.totalContributions === "number") return member.totalContributions
  if (contributionsMap && contributionsMap.has(member.userId)) {
    return contributionsMap.get(member.userId) ?? 0
  }
  return 0
}
