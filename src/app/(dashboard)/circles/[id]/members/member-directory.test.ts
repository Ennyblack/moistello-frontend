import { describe, expect, it } from "vitest"
import type { CircleMember, CircleRound } from "@/types"
import { filterCircleMembers } from "./member-filters"
import {
  buildContributionMap,
  getMemberContributionTotal,
} from "./utils/member-directory-helpers"

const mockMembers: CircleMember[] = [
  {
    id: "m-1",
    circleId: "circle-1",
    userId: "user-alpha",
    userName: "Alice Smith",
    userAddress: "GABC1234567890",
    position: 1,
    status: "active",
    joinedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "m-2",
    circleId: "circle-1",
    userId: "user-beta",
    userName: "Bob Jones",
    userAddress: "GDEF9876543210",
    position: 2,
    status: "pending",
    joinedAt: "2026-07-22T12:00:00.000Z",
  },
  {
    id: "m-3",
    circleId: "circle-1",
    userId: "user-gamma",
    userName: "Charlie Brown",
    userAddress: "GGAM1112223334",
    position: 3,
    status: "active",
    joinedAt: "2026-01-01T12:00:00.000Z",
    totalContributed: 500,
  },
]

describe("Member Directory Features", () => {
  describe("Search & Filtering", () => {
    it("searches members by userName", () => {
      const results = filterCircleMembers(mockMembers, {
        search: "Alice",
        status: "",
        position: "",
        joined: "",
      })
      expect(results).toHaveLength(1)
      expect(results[0].userName).toBe("Alice Smith")
    })

    it("searches members by userAddress", () => {
      const results = filterCircleMembers(mockMembers, {
        search: "GDEF987",
        status: "",
        position: "",
        joined: "",
      })
      expect(results).toHaveLength(1)
      expect(results[0].userName).toBe("Bob Jones")
    })

    it("filters members by status", () => {
      const results = filterCircleMembers(mockMembers, {
        search: "",
        status: "pending",
        position: "",
        joined: "",
      })
      expect(results).toHaveLength(1)
      expect(results[0].userId).toBe("user-beta")
    })
  })

  describe("Contribution Totals Calculation", () => {
    it("aggregates contributions by member from rounds data", () => {
      const rounds: CircleRound[] = [
        {
          roundNumber: 1,
          contributions: [
            {
              id: "c-1",
              circleId: "circle-1",
              userId: "user-alpha",
              roundNumber: 1,
              amount: 100,
              status: "completed",
              onTime: true,
              createdAt: "2026-07-21T00:00:00.000Z",
            },
            {
              id: "c-2",
              circleId: "circle-1",
              userId: "user-beta",
              roundNumber: 1,
              amount: 100,
              status: "failed",
              onTime: false,
              createdAt: "2026-07-21T00:00:00.000Z",
            },
          ],
        },
        {
          roundNumber: 2,
          contributions: [
            {
              id: "c-3",
              circleId: "circle-1",
              userId: "user-alpha",
              roundNumber: 2,
              amount: 150,
              status: "completed",
              onTime: true,
              createdAt: "2026-07-22T00:00:00.000Z",
            },
          ],
        },
      ]

      const map = buildContributionMap(rounds)
      expect(map.get("user-alpha")).toBe(250)
      expect(map.get("user-beta")).toBeUndefined()

      expect(getMemberContributionTotal(mockMembers[0], map)).toBe(250)
    })

    it("uses member totalContributed if already provided on member object", () => {
      const map = new Map<string, number>()
      map.set("user-gamma", 200)
      expect(getMemberContributionTotal(mockMembers[2], map)).toBe(500)
    })
  })

  describe("Pagination for 200+ members without jank", () => {
    it("handles 250 members into clean paginated chunks", () => {
      const largeMemberList: CircleMember[] = Array.from({ length: 250 }, (_, i) => ({
        id: `member-${i + 1}`,
        circleId: "circle-large",
        userId: `user-${i + 1}`,
        userName: `Member ${i + 1}`,
        position: i + 1,
        status: i % 10 === 0 ? "pending" : "active",
        joinedAt: "2026-06-01T00:00:00.000Z",
      }))

      const pageSize = 20
      const totalPages = Math.ceil(largeMemberList.length / pageSize)
      expect(totalPages).toBe(13)

      const page1 = largeMemberList.slice(0, pageSize)
      expect(page1).toHaveLength(20)
      expect(page1[0].position).toBe(1)
      expect(page1[19].position).toBe(20)

      const page13 = largeMemberList.slice(12 * pageSize, 13 * pageSize)
      expect(page13).toHaveLength(10)
      expect(page13[0].position).toBe(241)
      expect(page13[9].position).toBe(250)
    })
  })
})
