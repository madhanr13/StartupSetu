/**
 * NotificationMenu — bell icon with unread count and dropdown list.
 * Uses demo notification data.
 */

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Bell, CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
import type { Notification, NotificationType } from "@/types";

/** Demo notifications for the shell. */
const demoNotifications: Notification[] = [
  {
    id: "n1",
    type: "action",
    title: "New Proposal Received",
    message: "TechVista Solutions submitted a proposal for Smart Traffic Management.",
    read: false,
    createdAt: "2026-09-05T10:30:00Z",
    actionUrl: "/gov/proposals",
  },
  {
    id: "n2",
    type: "success",
    title: "Pilot Milestone Reached",
    message: "Digital Health Records pilot has reached 75% completion.",
    read: false,
    createdAt: "2026-09-04T16:00:00Z",
  },
  {
    id: "n3",
    type: "warning",
    title: "KPI Below Target",
    message: "Response time KPI for Smart Parking is trending below target.",
    read: true,
    createdAt: "2026-09-03T09:15:00Z",
  },
  {
    id: "n4",
    type: "info",
    title: "System Update",
    message: "Platform maintenance scheduled for Sunday 10:00 PM IST.",
    read: true,
    createdAt: "2026-09-02T14:00:00Z",
  },
];

const typeIcons: Record<NotificationType, typeof Bell> = {
  action: Zap,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const typeColors: Record<NotificationType, string> = {
  action: "text-primary-500",
  success: "text-success-500",
  warning: "text-warning-500",
  info: "text-info-500",
};

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<Notification[]>(demoNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 z-50 mt-2 w-80 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs text-primary-500 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50">
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type];
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer",
                      !notif.read && "bg-primary-50/30"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("mt-0.5 shrink-0", typeColors[notif.type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800 leading-snug">
                          {notif.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-neutral-100 text-center">
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
