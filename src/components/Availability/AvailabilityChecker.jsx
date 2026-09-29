import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Filter, CheckCircle2, AlertCircle, Info, RefreshCw } from "lucide-react";
import { checkTimeOverlap } from "../../utils/conflictDetector";
import {
  COLLEGE_TIMINGS,
  getHourlySlots,
  getLocalDateStr,
  isWorkingDay,
  nowMinutes,
  timeToMin,
  formatTime12
} from "../../config/collegeTimings";

export default function AvailabilityChecker({ rooms, bookings, onBookSpecificRoom }) {
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("ALL");

  // only the hours the college is open (see src/config/collegeTimings.js)
  const hourlySlots = getHourlySlots();
  const dayIsOpen = isWorkingDay(selectedDate);
  const todayStr = getLocalDateStr();
  const gridStyle = { gridTemplateColumns: `180px repeat(${hourlySlots.length}, minmax(0, 1fr))` };

  // Helper to get status of a room at a specific hourly slot
  const getSlotStatus = (room, timeSlot) => {
    if (room.status === "Maintenance") {
      return { status: "Maintenance", label: "Maintenance", color: "bg-slate-800 text-slate-400 border-slate-700" };
    }

    const slotStart = timeSlot;
    const [h] = timeSlot.split(":").map(Number);
    const slotEnd = `${(h + 1).toString().padStart(2, "0")}:00`;

    if (!dayIsOpen) {
      return { status: "Closed", label: "College closed", color: "bg-slate-900 text-slate-500 border-slate-800" };
    }
    if (selectedDate < todayStr || (selectedDate === todayStr && timeToMin(slotStart) < nowMinutes())) {
      return { status: "Past", label: "Past", color: "bg-slate-900/60 text-slate-500 border-slate-800" };
    }

    const activeBookings = bookings.filter(
      (b) => b.roomId === room.id && String(b.date).slice(0, 10) === selectedDate && (b.status === "Approved" || b.status === "Pending")
    );

    const match = activeBookings.find((b) => checkTimeOverlap(slotStart, slotEnd, b.startTime, b.endTime));

    if (!match) {
      return { status: "Available", label: "Available", color: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40" };
    }

    if (match.status === "Approved") {
      return {
        status: "Booked",
        label: match.eventName,
        color: "bg-rose-950/80 text-rose-300 border-rose-500/50 font-medium",
        booking: match
      };
    }

    return {
      status: "Pending",
      label: "Pending Approval",
      color: "bg-amber-950/70 text-amber-300 border-amber-500/40",
      booking: match
    };
  };

  const filteredRooms = selectedRoomFilter === "ALL"
    ? rooms
    : rooms.filter((r) => r.id === selectedRoomFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="text-cyan-400" size={26} /> Real-Time Availability Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Hourly availability of every room during college hours ({formatTime12(COLLEGE_TIMINGS.open)} – {formatTime12(COLLEGE_TIMINGS.close)}). Click a green block to book it.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-200 text-xs">
            <CalendarIcon size={16} className="text-cyan-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl text-slate-200 text-xs">
            <Filter size={16} className="text-cyan-400" />
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Rooms & Halls</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hourly Schedule Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Header Row (Hours) */}
          <div style={gridStyle} className="grid gap-2 border-b border-slate-800 pb-3 mb-4 text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left pl-2">
              Infrastructure Room
            </div>
            {hourlySlots.map((slot) => (
              <div key={slot} className="text-[11px] font-mono font-semibold text-slate-300">
                {formatTime12(slot)}
              </div>
            ))}
          </div>

          {!dayIsOpen && (
            <div className="mb-4 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 text-center">
              The college is closed on this day – rooms cannot be booked. Pick a working day (Mon–Sat).
            </div>
          )}

          {/* Room Rows */}
          <div className="space-y-4">
            {filteredRooms.map((room) => (
              <div key={room.id} style={gridStyle} className="grid gap-2 items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                {/* Room Info Cell */}
                <div className="col-span-1 min-w-0 pr-2">
                  <div className="font-bold text-sm text-cyan-300 truncate">{room.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>Cap: {room.capacity}</span>
                    <span>•</span>
                    <span className="truncate">{(room.building || "").split("-")[0]}</span>
                  </div>
                </div>

                {/* Hourly Status Blocks */}
                {hourlySlots.map((slot) => {
                  const { status, label, color, booking } = getSlotStatus(room, slot);
                  return (
                    <div
                      key={slot}
                      title={`${room.name} @ ${slot}: ${label}`}
                      className={`h-12 rounded-xl border p-1 flex flex-col justify-between text-[10px] truncate transition shadow-sm ${status === "Available" ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed"} ${color}`}
                      onClick={() => status === "Available" && onBookSpecificRoom(room, selectedDate, slot)}
                    >
                      <span className="font-mono opacity-80 text-[9px]">{formatTime12(slot)}</span>
                      <span className="font-semibold truncate leading-tight">
                        {status === "Available" ? "🟢 Free" : status === "Booked" ? `🔴 ${label}` : status === "Pending" ? "🟡 Pending" : status === "Maintenance" ? "⚫ Maint." : status === "Closed" ? "Closed" : "Past"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/80" /> Available (Click block to book)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/80" /> Already Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400/80" /> Pending Approval</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-600" /> Under Maintenance</span>
        </div>
        <span className="text-slate-400 text-[11px]">Selected Date: <strong className="text-cyan-400">{selectedDate}</strong></span>
      </div>
    </div>
  );
}
