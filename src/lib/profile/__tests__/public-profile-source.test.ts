import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import { logger } from "@/lib/logger"
import { API_BASE_URL } from "@/lib/constants"
import type { PublicProfile } from "../public-profile"
import { getPublicProfile, writeRegistryEntry } from "../public-profile-source"

const PROFILES_DIR = path.join(process.cwd(), "content", "profiles")

const sampleProfile: PublicProfile = {
  handle: "alice-adventures",
  displayName: "Alice In Wonderland",
  bio: "Curiouser and curiouser",
  moiScore: 92,
  countryCode: "GB",
  createdAt: "2026-01-01T00:00:00.000Z",
  avatarIpfsHash: "ipfs-hash-123",
  twitterUrl: "https://x.com/alice",
  githubUrl: "https://github.com/alice",
  walletAddressPreview: "GDTEST…WXYZ",
}

describe("public-profile-source", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("getPublicProfile", () => {
    it("returns null immediately for invalid handles without hitting API or filesystem", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const existsSpy = vi.spyOn(fs, "existsSync")

      const invalidHandles = [
        "",
        "al",
        "UPPERCASE",
        "-leading-dash",
        "trailing-dash-",
        "has spaces",
        "../path-traversal",
        "alice@domain",
      ]

      for (const handle of invalidHandles) {
        const result = await getPublicProfile(handle)
        expect(result).toBeNull()
      }

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(existsSpy).not.toHaveBeenCalled()
    })

    it("fetches profile from API and unwraps payload.data successfully", async () => {
      const handle = "valid-alice"
      const apiData = {
        displayName: "Alice",
        bio: "Explorer",
        moiScore: 100,
        email: "alice@private.com", // private field
      }

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ data: apiData }),
      } as unknown as Response)

      const profile = await getPublicProfile(handle)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${API_BASE_URL}/users/${encodeURIComponent(handle)}/public`,
        expect.objectContaining({
          headers: { accept: "application/json" },
          cache: "no-store",
        })
      )
      expect(profile).not.toBeNull()
      expect(profile?.handle).toBe(handle)
      expect(profile?.displayName).toBe("Alice")
      expect(profile?.bio).toBe("Explorer")
      expect(profile?.moiScore).toBe(100)
      // Confidential fields are omitted by projection
      expect((profile as unknown as Record<string, unknown>).email).toBeUndefined()
    })

    it("fetches profile from API when payload does not wrap data in an envelope", async () => {
      const handle = "bob-builder"
      const apiData = {
        displayName: "Bob",
        bio: "Can we fix it?",
        moiScore: 75,
      }

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => apiData,
      } as unknown as Response)

      const profile = await getPublicProfile(handle)
      expect(profile).not.toBeNull()
      expect(profile?.displayName).toBe("Bob")
      expect(profile?.moiScore).toBe(75)
    })

    it("falls back to flat-file registry when API returns a non-ok status code", async () => {
      const handle = "carol-cryptic"
      const expectedFilePath = path.join(PROFILES_DIR, `${handle}.json`)

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response)

      vi.spyOn(fs, "existsSync").mockImplementation((p) => p === expectedFilePath)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === expectedFilePath) {
          return JSON.stringify({
            displayName: "Carol File",
            bio: "From local disk",
            moiScore: 60,
          })
        }
        return ""
      })

      const profile = await getPublicProfile(handle)
      expect(profile).not.toBeNull()
      expect(profile?.displayName).toBe("Carol File")
      expect(profile?.bio).toBe("From local disk")
      expect(profile?.moiScore).toBe(60)
    })

    it("falls back to flat-file registry when API fetch throws an exception", async () => {
      const handle = "dave-offline"
      const expectedFilePath = path.join(PROFILES_DIR, `${handle}.json`)

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network connection refused"))

      vi.spyOn(fs, "existsSync").mockImplementation((p) => p === expectedFilePath)
      vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
        if (p === expectedFilePath) {
          return JSON.stringify({
            displayName: "Dave Local",
            bio: "Offline mode",
            moiScore: 40,
          })
        }
        return ""
      })

      const profile = await getPublicProfile(handle)
      expect(profile).not.toBeNull()
      expect(profile?.displayName).toBe("Dave Local")
      expect(profile?.bio).toBe("Offline mode")
    })

    it("returns null when API fails and registry file does not exist", async () => {
      const handle = "eve-unknown"
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response)
      vi.spyOn(fs, "existsSync").mockReturnValue(false)

      const profile = await getPublicProfile(handle)
      expect(profile).toBeNull()
    })

    it("logs error and returns null when registry file has invalid JSON", async () => {
      const handle = "frank-corrupt"
      const expectedFilePath = path.join(PROFILES_DIR, `${handle}.json`)

      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as unknown as Response)
      vi.spyOn(fs, "existsSync").mockReturnValue(true)
      vi.spyOn(fs, "readFileSync").mockReturnValue("{ malformed: json ]")
      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {})

      const profile = await getPublicProfile(handle)
      expect(profile).toBeNull()
      expect(loggerSpy).toHaveBeenCalledWith(
        "[public-profile] Failed to read registry entry:",
        expect.any(Error)
      )
    })
  })

  describe("writeRegistryEntry", () => {
    it("does nothing when the profile has an invalid handle", () => {
      const existsSpy = vi.spyOn(fs, "existsSync")
      const mkdirSpy = vi.spyOn(fs, "mkdirSync")
      const writeSpy = vi.spyOn(fs, "writeFileSync")

      const invalidProfile: PublicProfile = {
        ...sampleProfile,
        handle: "INV!ALID",
      }

      writeRegistryEntry(invalidProfile)

      expect(existsSpy).not.toHaveBeenCalled()
      expect(mkdirSpy).not.toHaveBeenCalled()
      expect(writeSpy).not.toHaveBeenCalled()
    })

    it("creates directory recursively if PROFILES_DIR does not exist and writes file", () => {
      const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(false)
      const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined as unknown as string)
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {})

      writeRegistryEntry(sampleProfile)

      expect(existsSpy).toHaveBeenCalledWith(PROFILES_DIR)
      expect(mkdirSpy).toHaveBeenCalledWith(PROFILES_DIR, { recursive: true })

      const expectedFilePath = path.join(PROFILES_DIR, `${sampleProfile.handle}.json`)
      expect(writeSpy).toHaveBeenCalledWith(
        expectedFilePath,
        JSON.stringify(sampleProfile, null, 2),
        "utf-8"
      )
    })

    it("does not call mkdirSync when PROFILES_DIR already exists", () => {
      vi.spyOn(fs, "existsSync").mockImplementation((p) => p === PROFILES_DIR)
      const mkdirSpy = vi.spyOn(fs, "mkdirSync")
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {})

      writeRegistryEntry(sampleProfile)

      expect(mkdirSpy).not.toHaveBeenCalled()

      const expectedFilePath = path.join(PROFILES_DIR, `${sampleProfile.handle}.json`)
      expect(writeSpy).toHaveBeenCalledWith(
        expectedFilePath,
        JSON.stringify(sampleProfile, null, 2),
        "utf-8"
      )
    })
  })
})
