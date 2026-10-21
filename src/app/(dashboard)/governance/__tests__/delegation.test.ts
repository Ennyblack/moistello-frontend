import { describe, expect, it } from "vitest"
import {
  getGovernanceDelegations,
  delegateVotingPower,
  revokeDelegation,
  MOCK_DELEGATION_STATE,
} from "@/lib/governance-api"

describe("Governance Voting Power Delegation (#475 & #500)", () => {
  it("reflects contract state including incoming delegations made to you", async () => {
    const state = await getGovernanceDelegations("GCK4X9M3P6...8Y4T")

    expect(state.ownVotingPower).toBe(1250)
    expect(state.incomingDelegations.length).toBeGreaterThanOrEqual(1)
    expect(state.incomingDelegations[0].delegatorAddress).toBeDefined()
    expect(state.incomingDelegations[0].votingPower).toBe(450)

    // Effective power = own power (1250) + incoming delegations (450) = 1700
    expect(state.effectiveVotingPower).toBe(1700)
    expect(state.activeDelegation).toBeNull()
  })

  it("allows choosing a delegate and records outgoing active delegation", async () => {
    const delegateAddress = "GA2M4P1J5X8L9K2W3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q"
    const res = await delegateVotingPower(delegateAddress, 1250)

    expect(res.success).toBe(true)
    expect(res.delegation.delegateAddress).toBe(delegateAddress)
    expect(res.delegation.votingPower).toBe(1250)

    const updatedState = await getGovernanceDelegations()
    expect(updatedState.activeDelegation).not.toBeNull()
    expect(updatedState.activeDelegation?.delegateAddress).toBe(delegateAddress)

    // When delegated, user's effective direct voting power is only from incoming delegations (450)
    expect(updatedState.effectiveVotingPower).toBe(450)
  })

  it("revokes active delegation and restores direct voting power", async () => {
    const revokeRes = await revokeDelegation()
    expect(revokeRes.success).toBe(true)

    const restoredState = await getGovernanceDelegations()
    expect(restoredState.activeDelegation).toBeNull()
    expect(restoredState.effectiveVotingPower).toBe(1700)
  })
})
