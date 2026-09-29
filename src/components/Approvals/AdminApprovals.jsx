import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, Calendar, Users, Building, MessageSquare, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { findConflicts } from "../../utils/conflictDetector";

export default function AdminApprovals({
  bookings,
  rooms,
  onApproveBooking,
  onRejectBooking
}) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [adminRemark, setAdminRemark] = useState("");

  const pendingBookings = bookings.filter((b) => b.status === "Pending");
  const processedBookings = bookings.filter((b) => b.status !== "Pending");

  const handleApprove = (booking) => {
    // Trigger celebratory confetti burst!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onApproveBooking(booking.id, adminRemark || "Approved by Infrastructure Administrator.");
    setSelectedBooking(null);
    setAdminRemark("");
  };

  const handleReject = (booking) => {
    if (!adminRemark.trim()) {
      alert("Please provide remarks/reason for rejection.");
      return;
    }
    onRejectBooking(booking.id, adminRemark);
    setSelectedBooking(null);
    setAdminRemark("");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 p-6 rounded-3xl border border-amber-500/30 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-amber-400" size={26} /> Booking Request Approvals Queue
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review faculty room reservation requests, prevent schedule collisions, and grant infrastructure access.
          </p>
        </div>
        <div className="bg-amber-950/80 border border-amber-500/40 px-4 py-2 rounded-2xl text-amber-300 font-bold text-xs">
          {pendingBookings.length} Requests Pending Review
        </div>
      </div>

      {/* Pending Requests List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
          Pending Verification ({pendingBookings.length})
        </h3>

        {pendingBookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <h4 className="text-lg font-bold text-slate-200">Approvals Queue Cleared!</h4>
            <p className="text-xs">There are no pending booking requests awaiting approval.</p>
          </div>
        ) : (
          pendingBookings.map((b) => {
            const conflicts = findConflicts(b, bookings, b.id);
            const roomObj = rooms.find((r) => r.id === b.roomId);

            return (
              <div
                key={b.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {b.id}
                      </span>
                      <h4 className="text-lg font-bold text-white">{b.eventName}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Requested by <strong className="text-cyan-300">{b.facultyName}</strong> ({b.department})
                    </p>
                  </div>

                  {/* Overlap Warning Badge */}
                  {conflicts.length > 0 ? (
                    <div className="bg-rose-950/80 border border-rose-500/50 px-3 py-1.5 rounded-xl text-rose-300 font-bold text-xs flex items-center gap-2">
                      <AlertCircle size={16} /> Schedule Overlap ({conflicts.length} Conflict)
                    </div>
                  ) : (
                    <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} /> Clear Slot (No Conflicts)
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Target Hall:</span>
                    <strong className="text-cyan-300 block">{b.roomName}</strong>
                    <span className="text-[10px] text-slate-400">Cap: {roomObj?.capacity} seats</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Date & Time:</span>
                    <strong className="text-slate-200 block">{b.date}</strong>
                    <span className="font-mono text-amber-400 font-semibold">{b.startTime} - {b.endTime}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Participants:</span>
                    <strong className="text-slate-200 block">{b.participants} Attendees</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Equipment Requested:</span>
                    <span className="text-[11px] text-slate-300">{b.equipment?.join(", ") || "Standard"}</span>
                  </div>
                </div>

                {/* Purpose text */}
                <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <strong className="text-slate-400">Purpose:</strong> {b.purpose}
                </div>

                {/* Admin Remarks & Action Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add admin remarks / instructions (e.g. Sound check at 8:30 AM)..."
                      value={selectedBooking?.id === b.id ? adminRemark : ""}
                      onChange={(e) => {
                        setSelectedBooking(b);
                        setAdminRemark(e.target.value);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        handleReject(b);
                      }}
                      className="px-5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <XCircle size={15} /> Reject Request
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBooking(b);
                        handleApprove(b);
                      }}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                    >
                      <CheckCircle2 size={15} /> Approve Booking
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History Log of Processed Bookings */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
          Recent Decision History ({processedBookings.length})
        </h3>

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800">
          {processedBookings.slice(0, 5).map((b) => (
            <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-200">{b.eventName}</span>
                <span className="text-slate-400 block">{b.roomName} • {b.date} ({b.startTime} - {b.endTime})</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    b.status === "Approved"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-950 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {b.status}
                </span>
                <span className="text-slate-400 text-[11px] max-w-xs truncate">{b.adminRemarks}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
