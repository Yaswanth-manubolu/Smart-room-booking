import React, { useState } from "react";
import { 
  CheckSquare, 
  Check, 
  X, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  Ticket, 
  Search, 
  MessageSquare,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { api } from "../../services/api";

export default function AdminApprovals({
  bookings = [],
  onRefresh,
  onViewQRTicket
}) {
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionModal, setActionModal] = useState(null); // { booking, type: 'Approved' | 'Rejected' }
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter !== "All" && b.status !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.event_name.toLowerCase().includes(q) ||
        b.faculty_name.toLowerCase().includes(q) ||
        b.room_name.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async () => {
    if (!actionModal) return;
    setLoading(true);
    try {
      await api.updateBookingStatus(actionModal.booking.id, actionModal.type, remarks);
      setActionModal(null);
      setRemarks("");
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || "Failed to update booking status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Administration Portal
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <h3 className="font-display text-2xl font-bold text-white mt-0.5">
            Booking Approvals & Gate Pass Review
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted reservation requests, approve or reject with custom administrative remarks.
          </p>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {["Pending", "Approved", "Rejected", "All"].map((tab) => {
            const count = tab === "All" ? bookings.length : bookings.filter((b) => b.status === tab).length;
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? tab === "Pending"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : tab === "Approved"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by event name, faculty, room or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-xs rounded-2xl glass-input bg-slate-900/60"
        />
      </div>

      {/* Bookings Table / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
            <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No {activeFilter} Bookings Found</h4>
            <p className="text-xs text-slate-500 mt-1">There are currently no bookings matching this criteria.</p>
          </div>
        ) : (
          filteredBookings.map((bkg) => (
            <div
              key={bkg.id}
              className="glass-panel p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    bkg.status === "Approved"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : bkg.status === "Pending"
                      ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                  }`}>
                    {bkg.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{bkg.id}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{bkg.event_name}</h4>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {bkg.faculty_name} ({bkg.department})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      {bkg.room_name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {bkg.date}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-indigo-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {bkg.start_time} - {bkg.end_time}
                  </span>
                  <span>
                    Participants: <strong>{bkg.participants}</strong>
                  </span>
                </div>

                {bkg.admin_remarks && (
                  <div className="text-xs text-slate-400 bg-slate-800/40 p-2 rounded-xl border border-slate-700/50">
                    <strong>Admin Note:</strong> {bkg.admin_remarks}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <button
                  onClick={() => onViewQRTicket(bkg)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  title="View Gate Pass"
                >
                  <Ticket className="w-5 h-5" />
                </button>

                {bkg.status === "Pending" && (
                  <>
                    <button
                      onClick={() => setActionModal({ booking: bkg, type: "Approved" })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setActionModal({ booking: bkg, type: "Rejected" })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation & Remarks Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white">
            <h4 className="font-display text-lg font-bold">
              {actionModal.type === "Approved" ? "Approve Booking Request" : "Reject Booking Request"}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Event: <strong className="text-white">{actionModal.booking.event_name}</strong> by {actionModal.booking.faculty_name}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrative Remarks / Notes (Optional)
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionModal.type === "Approved" ? "e.g. Approved. Audio technicians assigned." : "e.g. Hall required for annual board meeting."}
                className="w-full p-3 text-xs rounded-xl glass-input"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                  actionModal.type === "Approved" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {loading ? "Processing..." : `Confirm ${actionModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
