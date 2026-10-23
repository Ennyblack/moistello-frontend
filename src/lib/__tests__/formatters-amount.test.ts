import { describe, expect, it } from "vitest"
import { formatAmount, formatBalance } from "../formatters"

describe("formatAmount unit tests", () => {
  describe("rounding edge cases", () => {
    it("rounds half-up correctly across decimal boundaries", () => {
      expect(formatAmount(1.234)).toBe("1.23")
      expect(formatAmount(1.235)).toBe("1.24")
      expect(formatAmount(1.236)).toBe("1.24")
      expect(formatAmount(9.995)).toBe("10.00")
      expect(formatAmount(0.005)).toBe("0.01")
      expect(formatAmount(0.0049)).toBe("0.00")
    })

    it("handles floating point representation jitter", () => {
      expect(formatAmount(0.1 + 0.2)).toBe("0.30")
      expect(formatAmount(1.005)).toBe("1.01")
      expect(formatAmount(1.0000000000000002)).toBe("1.00")
    })

    it("prevents signed negative zero (-0.00)", () => {
      expect(formatAmount(-0.00001)).toBe("0.00")
      expect(formatAmount(-0.0049)).toBe("0.00")
      expect(formatAmount(-0)).toBe("0.00")
    })
  })

  describe("tiny amounts", () => {
    it("formats tiny amounts with custom precision", () => {
      expect(
        formatAmount(0.000045, "en-US", {
          minimumFractionDigits: 6,
          maximumFractionDigits: 6,
        }),
      ).toBe("0.000045")

      expect(
        formatAmount(1e-6, "en-US", {
          minimumFractionDigits: 6,
          maximumFractionDigits: 6,
        }),
      ).toBe("0.000001")
    })

    it("handles zero, null, undefined, empty, and invalid values gracefully", () => {
      expect(formatAmount(0)).toBe("0.00")
      expect(formatAmount("0")).toBe("0.00")
      expect(formatAmount(null)).toBe("0.00")
      expect(formatAmount(undefined)).toBe("0.00")
      expect(formatAmount("")).toBe("0.00")
      expect(formatAmount("not-a-number")).toBe("0.00")
      expect(formatAmount(Number.NaN)).toBe("0.00")
      expect(formatAmount(Number.POSITIVE_INFINITY)).toBe("0.00")
      expect(formatAmount(Number.NEGATIVE_INFINITY)).toBe("0.00")
    })
  })

  describe("large amounts", () => {
    it("formats millions and billions with thousand separators", () => {
      expect(formatAmount(1000000)).toBe("1,000,000.00")
      expect(formatAmount(123456789.99)).toBe("123,456,789.99")
      expect(formatAmount(1000000000000)).toBe("1,000,000,000,000.00")
    })
  })

  describe("locale separators", () => {
    it("formats with en-US separators (comma grouping, dot decimal)", () => {
      expect(formatAmount(1234567.89, "en-US")).toBe("1,234,567.89")
    })

    it("formats with de-DE separators (dot grouping, comma decimal)", () => {
      expect(formatAmount(1234567.89, "de-DE")).toBe("1.234.567,89")
    })

    it("formats with fr-FR separators (space grouping, comma decimal)", () => {
      const formatted = formatAmount(1234567.89, "fr-FR")
      // French locale uses narrow no-break space or non-breaking space
      expect(formatted).toMatch(/1[\s\u202f]234[\s\u202f]567,89/)
    })
  })

  describe("formatBalance", () => {
    it("formats wallet balances with 4 decimal places by default", () => {
      expect(formatBalance("12.345678")).toBe("12.3457")
      expect(formatBalance(0.1)).toBe("0.1000")
      expect(formatBalance(undefined)).toBe("0.0000")
      expect(formatBalance(null)).toBe("0.0000")
      expect(formatBalance("")).toBe("0.0000")
      expect(formatBalance("invalid")).toBe("0.0000")
    })

    it("supports custom precision for balance", () => {
      expect(formatBalance("10.5", "en-US", 2)).toBe("10.50")
      expect(formatBalance("10.123456", "en-US", 6)).toBe("10.123456")
    })
  })

  describe("snapshots for edge values", () => {
    it("pins expected snapshot outputs for diverse edge amounts", () => {
      const edgeValues = [
        0,
        -0,
        0.00001,
        -0.00001,
        0.0049,
        0.005,
        0.01,
        0.999,
        1,
        1.005,
        12.345,
        99.999,
        1000,
        1234567.89,
        999999999.99,
        1e9,
        1e12,
      ]

      const results = edgeValues.map((val) => ({
        input: val,
        enUS: formatAmount(val, "en-US"),
        deDE: formatAmount(val, "de-DE"),
        balance: formatBalance(val, "en-US"),
      }))

      expect(results).toMatchSnapshot()
    })
  })
})
