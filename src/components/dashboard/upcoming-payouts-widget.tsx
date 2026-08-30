'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { Payout, Circle } from '@/types'

interface UpcomingPayoutsWidgetProps {
  payouts: Payout[]
  circles: Circle[]
  isLoading?: boolean
  isError?: boolean
}

/**
 * Upcoming payouts widget showing the next scheduled payouts per circle
 */
export function UpcomingPayoutsWidget({
  payouts,
  circles,
  isLoading = false,
  isError = false,
}: UpcomingPayoutsWidgetProps) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])

  const circleMap = new Map(circles.map((c) => [c.id, c]))

  const now = Date.now()
  const upcoming = payouts
    .filter((p) => new Date(p.createdAt).getTime() >= now)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  if (!isClient) {
    return null
  }

  return (
    <div className="glass rounded-2xl p-5 holo-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Upcoming Payouts
          </h3>
        </div>
        <Link
          href="/payouts"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 font-body"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <div className="space-y-2">
                <Skeleton variant="text" width="140px" />
                <Skeleton variant="text" width="90px" />
              </div>
              <Skeleton variant="text" width="80px" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6 text-red-400" />}
          title="Failed to load upcoming payouts"
          description="Could not retrieve scheduled payouts at this time."
        />
      ) : upcoming.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground font-body">No upcoming payouts scheduled</p>
          <p className="text-2xs text-muted-foreground">Your next circle payouts will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.slice(0, 4).map((payout, idx) => {
            const circle = circleMap.get(payout.circleId)
            const circleName = circle?.name || 'Savings Circle'
            const currency = circle?.currency || 'USDC'

            return (
              <motion.div
                key={payout.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl depth-4 bg-white/[0.02] hover:glass-whisper transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground font-heading">
                      {circleName}
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      Round {payout.roundNumber} • {formatDate(payout.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="gradient-text text-xs font-bold font-heading">
                  +{formatCurrency(payout.amount, currency)}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
