import React from "react";
import { AlertTriangle, Clock, MapPin, ArrowRight, X } from "lucide-react";

export default function ConflictModal({
  isOpen,
  onClose,
  conflicts,
  suggestions,
  proposedBooking,
  onSelectAlternateRoom,
  onSelectAlternateSlot
}) {
  if (!isOpen) return null;

  const { alternateRooms, alternateTimeSlots } = suggestions || { alternateRooms: [], alternateTimeSlots: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/50 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition"
        >
          <X size={18} />
        </button>

        {/* Warning Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
            <AlertTriangle size={26} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-rose-300">
              Booking Conflict Detected!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              The requested time slot overlaps with an existing booking in{" "}
              <strong className="text-white">{proposedBooking?.roomName}</strong>.
            </p>
          </div>
        </div>

        {/* Conflicting Event Details */}
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold uppercase text-rose-400 tracking-wider">
            Conflicting Booking:
          </span>
          {conflicts.map((conf) => (
            <div key={conf.id} className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-rose-500/20 text-xs">
              <div>
                <span className="font-bold text-white block">{conf.eventName}</span>
                <span className="text-slate-400">By {conf.facultyName} ({conf.department})</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-rose-300 font-bold block">{conf.startTime} - {conf.endTime}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-600/40">
                  {conf.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Smart Alternate Recommendations */}
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            🤖 AI Recommended Solutions:
          </h4>

          {/* Option A: Alternate Available Rooms */}
          {alternateRooms.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Option 1: Switch to an Available Hall (Same Date & Time)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alternateRooms.map(({ room, reason }) => (
                  <div
                    key={room.id}
                    className="bg-slate-950/80 p-3 rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-bold text-cyan-300 text-sm block">{room.name}</span>
                      <span className="text-[11px] text-slate-400 block">{reason}</span>
                    </div>
                    <button
                      onClick={() => onSelectAlternateRoom(room)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      Book {room.name} Instead <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alternateRooms.length === 0 && alternateTimeSlots.length === 0 && (
            <p className="text-xs text-slate-400">
              No other free slot was found for this day. Please try a different date.
            </p>
          )}

          {/* Option B: Alternate Available Time Slots */}
          {alternateTimeSlots.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Option 2: Shift Time Slot on {proposedBooking?.roomName}
              </span>
              <div className="flex flex-wrap gap-2">
                {alternateTimeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectAlternateSlot(slot.startTime, slot.endTime)}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-700 hover:border-amber-400 text-left transition flex items-center gap-3 text-xs"
                  >
                    <Clock size={16} className="text-amber-400" />
                    <div>
                      <span className="font-mono font-bold text-slate-100 block">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400">{slot.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel & Revise Details
          </button>
        </div>
      </div>
    </div>
  );
}
