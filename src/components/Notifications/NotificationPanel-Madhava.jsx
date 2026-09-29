import React from "react";
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { api } from "../../services/api";

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications = [],
  onRefresh
}) {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      onRefresh && onRefresh();
    } catch (err) {
      console.warn("Failed to mark read", err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 z-50 bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl p-6 flex flex-col justify-between animate-slideInRight text-white">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h4 className="font-display font-bold text-lg">Notifications</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                  n.is_read
                    ? "bg-slate-900/40 border-slate-800/60 opacity-60"
                    : "bg-slate-800/60 border-indigo-500/30 shadow-md shadow-indigo-500/5"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {n.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : n.type === "error" ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Info className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-200">{n.title}</div>
                    <div className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">{n.message}</div>
                    <div className="text-[9px] text-slate-500 mt-1.5 font-mono">
                      {new Date(n.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-center">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
