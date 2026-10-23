import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PayoutTimelineChart } from '../payout-timeline-chart'
import type { Payout } from '@/types'

let resizeCallback: ((entries: Partial<ResizeObserverEntry>[]) => void) | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockResizeObserver {
  constructor(cb: (entries: Partial<ResizeObserverEntry>[]) => void) {
    resizeCallback = cb
  }
  observe = mockObserve
  unobserve = vi.fn()
  disconnect = mockDisconnect
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
})

function createPayout(
  daysFromNow: number,
  amount: number,
  overrides: Partial<Payout> = {}
): Payout {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
  return {
    id: `payout-${daysFromNow}-${amount}`,
    circleId: 'circle-1',
    recipientId: 'user-1',
    roundNumber: 1,
    amount,
    feeAmount: 0,
    txnHash: '0xabc',
    payoutType: 'fixed',
    createdAt: date.toISOString(),
    ...overrides,
  }
}

describe('PayoutTimelineChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resizeCallback = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders empty state when payouts array is empty', () => {
    render(<PayoutTimelineChart payouts={[]} />)

    expect(screen.getByText('Payout Timeline')).toBeDefined()
    expect(screen.getByText('No upcoming payouts')).toBeDefined()
    expect(screen.getByText('Scheduled payouts will appear here')).toBeDefined()
    expect(screen.queryByText('Total Due')).toBeNull()
  })

  it('renders empty state when all payouts are in the past', () => {
    const pastPayouts = [
      createPayout(-1, 200),
      createPayout(-10, 500),
      createPayout(-30, 1000),
    ]

    render(<PayoutTimelineChart payouts={pastPayouts} />)

    expect(screen.getByText('No upcoming payouts')).toBeDefined()
    expect(screen.queryByText('Total Due')).toBeNull()
  })

  it('renders empty state when payouts fall beyond the 60-day horizon', () => {
    const farFuturePayouts = [createPayout(75, 450)]

    render(<PayoutTimelineChart payouts={farFuturePayouts} />)

    expect(screen.getByText('No upcoming payouts')).toBeDefined()
    expect(screen.queryByText('Total Due')).toBeNull()
  })

  it('renders chart and correct summary metrics for future payouts within 60 days', () => {
    const payouts = [
      createPayout(2, 100),
      createPayout(5, 200),
    ]

    const { container } = render(<PayoutTimelineChart payouts={payouts} />)

    expect(screen.getByText('Payout Timeline')).toBeDefined()
    expect(screen.queryByText('No upcoming payouts')).toBeNull()

    // Metrics labels
    expect(screen.getByText('Total Due')).toBeDefined()
    expect(screen.getByText('Upcoming')).toBeDefined()
    expect(screen.getByText('Average')).toBeDefined()

    // Upcoming should be 2 days
    expect(screen.getByText('2')).toBeDefined()

    // SVG elements
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.getAttribute('viewBox')).toContain('0 0')

    const polygon = container.querySelector('polygon')
    expect(polygon).toBeDefined()
    expect(polygon?.getAttribute('fill')).toBe('url(#payoutGradient)')

    const polyline = container.querySelector('polyline')
    expect(polyline).toBeDefined()
    expect(polyline?.getAttribute('strokeWidth')).toBe('2')

    // Two data points rendered as circles
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(2)
  })

  it('aggregates multiple payouts occurring on the same day', () => {
    const payouts = [
      createPayout(3, 150, { id: 'p1' }),
      createPayout(3, 250, { id: 'p2' }),
    ]

    const { container } = render(<PayoutTimelineChart payouts={payouts} />)

    // Upcoming should be 1 day since both payouts share the same calendar day
    expect(screen.getByText('1')).toBeDefined()

    // 1 data point circle
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(1)
  })

  it('renders correctly with a single upcoming payout without NaN or zero-division errors', () => {
    const payouts = [createPayout(1, 500)]

    const { container } = render(<PayoutTimelineChart payouts={payouts} />)

    const polyline = container.querySelector('polyline')
    const pointsAttr = polyline?.getAttribute('points') || ''
    expect(pointsAttr).not.toContain('NaN')

    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(1)
  })

  it('attaches ResizeObserver on mount and updates SVG dimensions on container resize', () => {
    const payouts = [createPayout(2, 100)]

    const { container, unmount } = render(<PayoutTimelineChart payouts={payouts} />)

    expect(mockObserve).toHaveBeenCalled()

    // Simulate ResizeObserver container resize event
    act(() => {
      resizeCallback?.([{ contentRect: { width: 900 } as DOMRectReadOnly }])
    })

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 900 120')

    // Clean up observer on unmount
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('handles mixed payout types correctly', () => {
    const mixedPayouts = [
      createPayout(1, 100, { payoutType: 'fixed' }),
      createPayout(3, 200, { payoutType: 'auction' }),
      createPayout(7, 300, { payoutType: 'random' }),
    ]

    const { container } = render(<PayoutTimelineChart payouts={mixedPayouts} />)

    expect(screen.getByText('3')).toBeDefined()
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(3)
  })

  it('renders labels with appropriate spacing when there are multiple dates', () => {
    const payouts = [
      createPayout(1, 10),
      createPayout(2, 20),
      createPayout(3, 30),
      createPayout(4, 40),
      createPayout(5, 50),
      createPayout(6, 60),
    ]

    const { container } = render(<PayoutTimelineChart payouts={payouts} />)

    const textLabels = container.querySelectorAll('text')
    expect(textLabels.length).toBeGreaterThan(0)
  })
})
