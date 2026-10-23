import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import type { NextRequest } from "next/server"
import {
  getAuthenticatedUser,
  requireAuthenticatedUser,
  checkRateLimit,
} from "../auth-guard"

const SESSIONS_FILE = path.join(process.cwd(), "content", "sessions.json")
const USERS_FILE = path.join(process.cwd(), "content", "users.json")

function createMockRequest(options?: {
  cookie?: string
  headers?: Record<string, string>
}): NextRequest {
  const headers = options?.headers ?? {}
  return {
    cookies: {
      get: vi.fn((name: string) => {
        if (name === "moistello_session" && options?.cookie !== undefined) {
          return { value: options.cookie }
        }
        return undefined
      }),
    },
    headers: {
      get: vi.fn((key: string) => headers[key.toLowerCase()] ?? null),
    },
  } as unknown as NextRequest
}

describe("auth-guard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe("getAuthenticatedUser", () => {
    it("returns null when moistello_session cookie is missing", () => {
      const req = createMockRequest()
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when moistello_session cookie has empty value", () => {
      const req = createMockRequest({ cookie: "" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when sessions file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockImplementation((p) => p !== SESSIONS_FILE)
      const req = createMockRequest({ cookie: "valid-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when sessions file contains invalid JSON", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) return "invalid json{"
        return "[]"
      })
      const req = createMockRequest({ cookie: "valid-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when session token is not found in sessions file", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "different-token", userId: "user-1", createdAt: Date.now() },
          ])
        }
        return "[]"
      })
      const req = createMockRequest({ cookie: "my-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when session is older than 7 days", () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "expired-token", userId: "user-1", createdAt: eightDaysAgo },
          ])
        }
        return JSON.stringify([{ id: "user-1", username: "alice", role: "member" }])
      })
      const req = createMockRequest({ cookie: "expired-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when session is valid but user is not found in users file", () => {
      const freshCreatedAt = Date.now() - 1000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "active-token", userId: "non-existent-user", createdAt: freshCreatedAt },
          ])
        }
        if (p === USERS_FILE) {
          return JSON.stringify([{ id: "user-2", username: "bob", role: "admin" }])
        }
        return "[]"
      })
      const req = createMockRequest({ cookie: "active-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns null when users file contains invalid JSON", () => {
      const freshCreatedAt = Date.now() - 1000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "active-token", userId: "user-1", createdAt: freshCreatedAt },
          ])
        }
        if (p === USERS_FILE) return "corrupt json{"
        return "[]"
      })
      const req = createMockRequest({ cookie: "active-token" })
      expect(getAuthenticatedUser(req)).toBeNull()
    })

    it("returns authenticated user with full details when session and user are valid", () => {
      const freshCreatedAt = Date.now() - 60_000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "valid-token-123", userId: "user-abc", createdAt: freshCreatedAt },
          ])
        }
        if (p === USERS_FILE) {
          return JSON.stringify([
            { id: "user-abc", username: "carol", role: "moderator" },
          ])
        }
        return "[]"
      })
      const req = createMockRequest({ cookie: "valid-token-123" })
      const user = getAuthenticatedUser(req)
      expect(user).toEqual({
        id: "user-abc",
        username: "carol",
        role: "moderator",
      })
    })

    it("returns authenticated user when optional fields are omitted", () => {
      const freshCreatedAt = Date.now() - 10_000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "token-bare", userId: "user-bare", createdAt: freshCreatedAt },
          ])
        }
        if (p === USERS_FILE) {
          return JSON.stringify([{ id: "user-bare" }])
        }
        return "[]"
      })
      const req = createMockRequest({ cookie: "token-bare" })
      const user = getAuthenticatedUser(req)
      expect(user).toEqual({
        id: "user-bare",
        username: undefined,
        role: undefined,
      })
    })
  })

  describe("requireAuthenticatedUser", () => {
    it("returns ok: false and 401 response when user is not authenticated", async () => {
      const req = createMockRequest()
      const result = requireAuthenticatedUser(req)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.response.status).toBe(401)
        const body = await result.response.json()
        expect(body).toEqual({ error: "unauthenticated" })
      }
    })

    it("returns ok: true and the user when authenticated", () => {
      const freshCreatedAt = Date.now() - 5000
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === SESSIONS_FILE) {
          return JSON.stringify([
            { token: "session-ok", userId: "user-ok", createdAt: freshCreatedAt },
          ])
        }
        if (p === USERS_FILE) {
          return JSON.stringify([{ id: "user-ok", username: "dave", role: "admin" }])
        }
        return "[]"
      })

      const req = createMockRequest({ cookie: "session-ok" })
      const result = requireAuthenticatedUser(req)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.user).toEqual({
          id: "user-ok",
          username: "dave",
          role: "admin",
        })
      }
    })
  })

  describe("checkRateLimit", () => {
    it("allows the initial request and initializes bucket", () => {
      const req = createMockRequest({
        headers: { "x-forwarded-for": "10.0.0.1" },
      })
      const result = checkRateLimit(req, "/api/test-init", 5, 60_000)
      expect(result.allowed).toBe(true)
      expect(result.retryAfterMs).toBe(60_000)
    })

    it("extracts the first IP from comma-separated x-forwarded-for and trims whitespace", () => {
      const req = createMockRequest({
        headers: { "x-forwarded-for": "  192.168.1.100 , 10.0.0.1 " },
      })
      const result = checkRateLimit(req, "/api/test-ip-trim", 1, 60_000)
      expect(result.allowed).toBe(true)

      // Next request from same trimmed IP should hit limit
      const reqSame = createMockRequest({
        headers: { "x-forwarded-for": "192.168.1.100" },
      })
      const blocked = checkRateLimit(reqSame, "/api/test-ip-trim", 1, 60_000)
      expect(blocked.allowed).toBe(false)
    })

    it("falls back to x-real-ip when x-forwarded-for is missing", () => {
      const req = createMockRequest({
        headers: { "x-real-ip": "172.16.0.5" },
      })
      const result1 = checkRateLimit(req, "/api/test-real-ip", 2, 60_000)
      expect(result1.allowed).toBe(true)

      const result2 = checkRateLimit(req, "/api/test-real-ip", 2, 60_000)
      expect(result2.allowed).toBe(true)

      const result3 = checkRateLimit(req, "/api/test-real-ip", 2, 60_000)
      expect(result3.allowed).toBe(false)
    })

    it("falls back to unknown when neither header is present", () => {
      const req = createMockRequest()
      const result = checkRateLimit(req, "/api/test-unknown", 1, 60_000)
      expect(result.allowed).toBe(true)

      const second = checkRateLimit(req, "/api/test-unknown", 1, 60_000)
      expect(second.allowed).toBe(false)
    })

    it("blocks requests once the limit is reached and returns positive retryAfterMs", () => {
      const req = createMockRequest({
        headers: { "x-real-ip": "10.10.10.10" },
      })
      const endpoint = "/api/test-limit"
      const limit = 3
      const windowMs = 30_000

      for (let i = 0; i < limit; i++) {
        const res = checkRateLimit(req, endpoint, limit, windowMs)
        expect(res.allowed).toBe(true)
      }

      const blocked = checkRateLimit(req, endpoint, limit, windowMs)
      expect(blocked.allowed).toBe(false)
      expect(blocked.retryAfterMs).toBeGreaterThan(0)
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(windowMs)
    })

    it("resets rate limit after window expiration", () => {
      vi.useFakeTimers()
      const req = createMockRequest({
        headers: { "x-real-ip": "10.20.30.40" },
      })
      const endpoint = "/api/test-window-reset"
      const limit = 2
      const windowMs = 5000

      expect(checkRateLimit(req, endpoint, limit, windowMs).allowed).toBe(true)
      expect(checkRateLimit(req, endpoint, limit, windowMs).allowed).toBe(true)
      expect(checkRateLimit(req, endpoint, limit, windowMs).allowed).toBe(false)

      vi.advanceTimersByTime(5100)

      const afterExpiry = checkRateLimit(req, endpoint, limit, windowMs)
      expect(afterExpiry.allowed).toBe(true)
      expect(afterExpiry.retryAfterMs).toBe(windowMs)
    })

    it("isolates rate limits between different endpoints for the same client", () => {
      const req = createMockRequest({
        headers: { "x-real-ip": "10.0.0.99" },
      })
      const endpointA = "/api/resource-a"
      const endpointB = "/api/resource-b"
      const limit = 1

      expect(checkRateLimit(req, endpointA, limit, 60_000).allowed).toBe(true)
      expect(checkRateLimit(req, endpointA, limit, 60_000).allowed).toBe(false)

      // endpointB should still be allowed
      expect(checkRateLimit(req, endpointB, limit, 60_000).allowed).toBe(true)
      expect(checkRateLimit(req, endpointB, limit, 60_000).allowed).toBe(false)
    })

    it("isolates rate limits between different clients for the same endpoint", () => {
      const req1 = createMockRequest({ headers: { "x-real-ip": "1.1.1.1" } })
      const req2 = createMockRequest({ headers: { "x-real-ip": "2.2.2.2" } })
      const endpoint = "/api/shared-endpoint"
      const limit = 1

      expect(checkRateLimit(req1, endpoint, limit, 60_000).allowed).toBe(true)
      expect(checkRateLimit(req1, endpoint, limit, 60_000).allowed).toBe(false)

      expect(checkRateLimit(req2, endpoint, limit, 60_000).allowed).toBe(true)
      expect(checkRateLimit(req2, endpoint, limit, 60_000).allowed).toBe(false)
    })
  })
})
