/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import {
  Bell, CheckCircle, XCircle, RotateCcw, Info, Clock, X, CheckCheck, Trash2,
  Megaphone, AlertTriangle,
} from "lucide-react";
import { useSTSNStore } from "../../services/store";
import type { STSNNotification, NotificationType, NotificationEntityType, Announcement } from "../../types";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  approval: <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />,
  rejection: <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />,
  return: <RotateCcw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />,
  reminder: <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />,
  info: <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />,
};

const ENTITY_LABEL: Record<NotificationEntityType, string> = {
  assessment: "Assessment",
  discount: "Discount",
  enrollment: "Enrollment",
  leave: "Leave",
  payroll: "Payroll",
  void: "Void",
  grade: "Grades",
};

const TYPE_ROW_BG: Record<NotificationType, string> = {
  approval: "bg-emerald-50/60 border-l-2 border-emerald-400",
  rejection: "bg-red-50/60 border-l-2 border-red-400",
  return: "bg-amber-50/60 border-l-2 border-amber-400",
  reminder: "bg-blue-50/60 border-l-2 border-blue-400",
  info: "bg-stone-50/40 border-l-2 border-stone-300",
};

function timeAgo(isoStr: string): string {
  const ms = Date.now() - new Date(isoStr).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function NotificationBell() {
  const { notifications, announcements, currentUser, activeSchool, markNotificationRead, clearAllNotifications } = useSTSNStore();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "notices">("notifications");
  const panelRef = useRef<HTMLDivElement>(null);

  const myNotifs = notifications.filter(
    (n) => currentUser && n.targetRoles.includes(currentUser.role)
  );
  const unreadCount = myNotifs.filter(
    (n) => currentUser && !n.readBy.includes(currentUser.id)
  ).length;

  // Filter announcements for this user's role and school
  const myAnnouncements = (announcements as Announcement[]).filter((ann) => {
    if (isExpired(ann.expiresAt)) return false;
    if (ann.targetRoles && ann.targetRoles.length > 0 && currentUser) {
      if (!ann.targetRoles.includes(currentUser.role)) return false;
    }
    if (ann.targetSchool && activeSchool !== "ALL" && ann.targetSchool !== activeSchool) return false;
    return true;
  });

  // Urgent announcements for the persistent banner
  const urgentAnnouncements = myAnnouncements.filter((a) => a.priority === "urgent");

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && currentUser) {
      myNotifs
        .filter((n) => !n.readBy.includes(currentUser.id))
        .forEach((n) => markNotificationRead(n.id, currentUser.id));
    }
  };

  const totalUnread = unreadCount + (myAnnouncements.filter((a) => a.priority === "urgent").length > 0 ? 1 : 0);

  return (
    <>
      {/* Urgent announcement banner (persistent, below header) */}
      {urgentAnnouncements.length > 0 && (
        <div className="hidden" data-urgent-announcements={urgentAnnouncements.length} />
      )}

      <div className="relative" ref={panelRef}>
        <button
          onClick={handleOpen}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-200/70 hover:border-stsn-gold/40 hover:bg-stsn-cream/60 transition-all shadow-sm cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-stone-500" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full px-1 leading-none">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200/80 z-50 overflow-hidden animate-fade-in">
            {/* Panel header */}
            <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-stsn-cream/60 to-white border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-stsn-gold" />
                <span className="text-xs font-bold text-stsn-brown-dark">Activity</span>
              </div>
              <div className="flex items-center gap-1">
                {activeTab === "notifications" && myNotifs.length > 0 && (
                  <button
                    onClick={() => clearAllNotifications()}
                    title="Clear all"
                    className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "notifications"
                    ? "text-stsn-brown border-b-2 border-stsn-gold bg-stsn-cream/30"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Bell className="w-3 h-3" /> Notifications
                {unreadCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-full bg-red-500 text-white">{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("notices")}
                className={`flex-1 px-3 py-2 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "notices"
                    ? "text-stsn-brown border-b-2 border-stsn-gold bg-stsn-cream/30"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Megaphone className="w-3 h-3" /> Notices
                {myAnnouncements.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-full bg-stone-200 text-stone-600">{myAnnouncements.length}</span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
              {activeTab === "notifications" ? (
                myNotifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                    <CheckCheck className="w-8 h-8 text-stone-200" />
                    <p className="text-xs font-semibold text-stone-400">All caught up</p>
                    <p className="text-[10px] text-stone-300">No notifications right now.</p>
                  </div>
                ) : (
                  myNotifs.map((n: STSNNotification) => {
                    const isRead = currentUser ? n.readBy.includes(currentUser.id) : true;
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-2.5 px-4 py-3 transition-colors ${TYPE_ROW_BG[n.type]} ${isRead ? "opacity-60" : ""}`}
                      >
                        <div className="mt-0.5">{TYPE_ICON[n.type]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-bold px-1.5 py-px rounded bg-white/70 text-stone-500 border border-stone-200/60 uppercase tracking-wide">
                              {ENTITY_LABEL[n.entityType]}
                            </span>
                            {!isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-stsn-gold flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-stone-800 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                          <p className="text-[9px] text-stone-400 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                myAnnouncements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                    <Megaphone className="w-8 h-8 text-stone-200" />
                    <p className="text-xs font-semibold text-stone-400">No notices</p>
                    <p className="text-[10px] text-stone-300">No announcements for your role right now.</p>
                  </div>
                ) : (
                  myAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`flex gap-2.5 px-4 py-3 ${
                        ann.priority === "urgent"
                          ? "bg-red-50/70 border-l-2 border-red-400"
                          : "bg-blue-50/40 border-l-2 border-blue-300"
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {ann.priority === "urgent"
                          ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          : <Megaphone className="w-3.5 h-3.5 text-blue-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${
                            ann.priority === "urgent"
                              ? "bg-red-100 text-red-600 border border-red-200"
                              : "bg-white/70 text-stone-500 border border-stone-200/60"
                          }`}>
                            {ann.category}
                          </span>
                          {ann.priority === "urgent" && (
                            <span className="text-[9px] font-bold text-red-600 uppercase">Urgent</span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-stone-800 leading-tight">{ann.title}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-snug line-clamp-3">{ann.content}</p>
                        <p className="text-[9px] text-stone-400 mt-1 font-mono">{ann.author} · {ann.date}</p>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            {activeTab === "notifications" && myNotifs.length > 0 && (
              <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/40 text-center">
                <p className="text-[9.5px] text-stone-400 font-mono">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All notifications read"}
                  {" · "}showing latest {myNotifs.length}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** Urgent announcement banner — rendered in App.tsx below the header */
export function UrgentAnnouncementBanner() {
  const { announcements, currentUser, activeSchool } = useSTSNStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const urgentActive = (announcements as Announcement[]).filter((ann) => {
    if (dismissed.has(ann.id)) return false;
    if (ann.priority !== "urgent") return false;
    if (isExpired(ann.expiresAt)) return false;
    if (ann.targetRoles && ann.targetRoles.length > 0 && currentUser) {
      if (!ann.targetRoles.includes(currentUser.role)) return false;
    }
    if (ann.targetSchool && activeSchool !== "ALL" && ann.targetSchool !== activeSchool) return false;
    return true;
  });

  if (urgentActive.length === 0) return null;

  return (
    <div className="space-y-1">
      {urgentActive.map((ann) => (
        <div
          key={ann.id}
          className="flex items-center gap-3 px-4 py-2 bg-red-600 text-white text-xs animate-fade-in"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-200" />
          <div className="flex-1 min-w-0">
            <span className="font-bold mr-1.5">{ann.title}:</span>
            <span className="opacity-90 line-clamp-1">{ann.content}</span>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, ann.id]))}
            className="p-0.5 rounded hover:bg-white/20 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
