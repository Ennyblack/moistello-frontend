"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useListMotion,
  defaultItemVariants,
  STAGGER_CHILDREN_LIMIT,
} from "@/lib/motion/list";
import {
  Bell,
  BellOff,
  ArrowUp,
  ArrowDown,
  CircleDot,
  AlertTriangle,
  CheckCheck,
  UserPlus,
  DollarSign,
  Shield,
  Info,
  Archive,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { useWsState } from "@/hooks/use-ws-state";
import {
  TYPE_FILTERS,
  filterNotifications,
  groupNotificationsByType,
} from "@/lib/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTimeLocalized } from "@/lib/formatters";
import { useDateLocale } from "@/hooks/use-date-locale";
import { useTranslate } from "@/lib/locale/context";
import { cn } from "@/lib/cn";
import { patch } from "@/lib/api-client";
import { useUIStore } from "@/stores/ui-store";
import type { Notification } from "@/types";

const iconMap: Record<string, React.ReactNode> = {
  contribution: <ArrowUp className="h-4 w-4" />,
  contribution_received: <ArrowDown className="h-4 w-4" />,
  payout: <ArrowDown className="h-4 w-4" />,
  payout_received: <DollarSign className="h-4 w-4" />,
  circle: <CircleDot className="h-4 w-4" />,
  circle_joined: <UserPlus className="h-4 w-4" />,
  circle_completed: <CheckCheck className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  penalty: <Shield className="h-4 w-4" />,
};

const gradientMap: Record<string, string> = {
  contribution: "from-emerald-500/30 to-green-600/30",
  contribution_received: "from-emerald-500/30 to-green-600/30",
  payout: "from-aurora-indigo/30 to-aurora-violet/30",
  payout_received: "from-aurora-indigo/30 to-aurora-violet/30",
  circle: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_joined: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_completed: "from-aurora-violet/30 to-fuchsia-500/30",
  system: "from-white/5 to-white/10",
  warning: "from-red-500/30 to-amber-500/30",
  penalty: "from-red-500/30 to-amber-500/30",
};

const iconColorMap: Record<string, string> = {
  contribution: "text-emerald-400",
  contribution_received: "text-emerald-400",
  payout: "text-aurora-violet",
  payout_received: "text-aurora-violet",
  circle: "text-fuchsia-400",
  circle_joined: "text-fuchsia-400",
  circle_completed: "text-fuchsia-400",
  system: "text-muted-foreground",
  warning: "text-red-400",
  penalty: "text-red-400",
};

const itemVariants = defaultItemVariants;

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  selected,
  onToggleSelect,
  largeList,
  onArchive,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (n: Notification) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  largeList: boolean;
  onArchive: (id: string) => void;
}) {
  const { dateFnsLocale } = useDateLocale();
  const { t } = useTranslate();
  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    onClick(notification);
  };

  const link =
    notification.data &&
    typeof notification.data === "object" &&
    "link" in notification.data
      ? String(notification.data.link)
      : null;

  const icon = iconMap[notification.type] ?? <Bell className="h-4 w-4" />;
  const grad = gradientMap[notification.type] ?? gradientMap.system;
  const icol = iconColorMap[notification.type] ?? iconColorMap.system;
  const isUnread = !notification.isRead;

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex items-center gap-3 px-5 py-4 transition-colors hover:glass-whisper",
        isUnread && "glass-strong",
      )}
    >
      {/* Bulk select checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={
          selected
            ? `${t("notifications.deselectNotification").replace("{title}", notification.title)}`
            : `${t("notifications.selectNotification").replace("{title}", notification.title)}`
        }
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(notification.id);
        }}
        className="shrink-0 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet/50"
      >
        {selected ? (
          <CheckSquare className="h-4 w-4 text-aurora-violet" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      <button
        type="button"
        onClick={handleClick}
        className="flex items-start gap-4 flex-1 min-w-0 text-left"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          {isUnread &&
            (!largeList ? (
              <motion.span
                layoutId="unread-dot"
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-aurora-cyan animate-pulse"
              />
            ) : (
              <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-aurora-cyan animate-pulse" />
            ))}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br",
              grad,
            )}
          >
            <span className={icol}>{icon}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium text-foreground",
                isUnread && "font-semibold",
              )}
            >
              {notification.title}
            </p>
            {isUnread && (
              <span className="h-1.5 w-1.5 rounded-full bg-aurora-violet" />
            )}
          </div>
          {notification.body && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.body}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            {formatRelativeTimeLocalized(
              notification.sentAt || notification.createdAt,
              dateFnsLocale,
            )}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(notification.id);
          }}
          aria-label={`Archive notification ${notification.title}`}
        >
          <Archive className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslate();
  const { addToast } = useUIStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    bulkArchive,
  } = useNotifications();

  const [selectedType, setSelectedType] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return filterNotifications(notifications, selectedType);
  }, [notifications, selectedType]);

  const allSelected =
    filtered.length > 0 && filtered.every((n) => selectedIds.includes(n.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((n) => n.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev)
      => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return;
    bulkArchive(selectedIds);
    addToast({ type: "success", title: "Archived selected notifications" });
    setSelectedIds([]);
  };

  const handleNotificationClick = (n: Notification) => {
    if (n.data && typeof n.data === "object" && "link" in n.data) {
      router.push(String(n.data.link));
    }
  };

  const { shouldReduce, variants } = useListMotion();
  const largeList = notifications.length > STAGGER_CHILDREN_LIMIT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={t("notifications.title")}
          description={t("notifications.subtitle")}
        />
        <div className="flex items-center gap-2">
          <Link href="/notifications/archive">
            <Button variant="outline" size="sm" leftIcon={<Archive className="h-4 w-4" />}>
              Archive
            </Button>
          </Link>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between glass-card p-3 rounded-xl">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkArchive} leftIcon={<Archive className="h-4 w-4" />}>
              Archive Selected
            </Button>
          </div>
        </div>
      )}

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="circles">Circles</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-6 w-6" />}
          title="No notifications"
          description="You are all caught up!"
        />
      ) : (
        <div className="border border-white/10 rounded-2xl overflow-hidden glass-card divide-y divide-white/[0.06]">
          <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.02] border-b border-white/10">
            <button
              type="button"
              role="checkbox"
              aria-checked={allSelected ? true : someSelected ? "mixed" : false}
              aria-label={
                allSelected
                  ? "Deselect all notifications"
                  : "Select all notifications"
              }
              onClick={handleToggleSelectAll}
              className="shrink-0 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet/50"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-aurora-violet" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-xs font-medium text-muted-foreground">
              Select All
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={variants}
            className="divide-y divide-white/[0.06]"
          >
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
                onClick={handleNotificationClick}
                selected={selectedIds.includes(n.id)}
                onToggleSelect={handleToggleSelect}
                largeList={largeList}
                onArchive={(id) => {
                  archiveNotification(id);
                  addToast({ type: "success", title: "Notification archived" });
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
