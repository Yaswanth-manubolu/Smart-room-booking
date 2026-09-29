import React from "react";
import { AlertOctagon, X, Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ConflictModal({
  isOpen,
  onClose,
  conflictData,
  suggestedRooms = [],
  onSelectAlternative
}) {
  if (!isOpen || !conflictData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-white">Booking Conflict Detected</h3>
            <p className="text-xs text-rose-300">The requested room is unavailable for this time slot.</p>
          </div>
        </div>

        {/* Conflicting Booking Details */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Conflicting Reservation
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-200">
              {conflictData.reason || conflictData.message}
            </div>
            {conflictData.conflictingBooking && (
              <div className="text-slate-400 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span>Event: <strong className="text-white">{conflictData.conflictingBooking.eventName}</strong></span>
                <span>Time: <strong className="text-white">{conflictData.conflictingBooking.startTime} - {conflictData.conflictingBooking.endTime}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Room Suggestions */}
        {suggestedRooms.length > 0 && (
          <div>
            <div className="text-xs font-bold text-indigo-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Recommended Available Alternative Rooms:
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {suggestedRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelectAlternative(room)}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800/80 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                      {room.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Capacity: {room.capacity} | {room.building}
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Modify Time Slot
          </button>
        </div>

      </div>
    </div>
  );
}
