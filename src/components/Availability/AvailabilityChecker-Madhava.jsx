import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { timeToMinutes } from "../../utils/conflictDetector";

const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00"
];

export default function AvailabilityChecker({
  rooms = [],
  bookings = [],
  onSelectRoomToBook
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [minCapacity, setMinCapacity] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Check if a room is booked during a specific time slot
  const isSlotBooked = (roomId, slotStr) => {
    const [startStr, endStr] = slotStr.split(" - ");
    const slotStart = timeToMinutes(startStr);
    const slotEnd = timeToMinutes(endStr);

    const match = bookings.find((b) => {
      if (b.room_id !== roomId) return false;
      if (b.date !== selectedDate) return false;
      if (b.status === "Rejected" || b.status === "Cancelled") return false;

      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);

      return !(slotEnd <= bStart || slotStart >= bEnd);
    });

    return match;
  };

  const filteredRooms = rooms.filter((room) => {
    if (minCapacity && room.capacity < Number(minCapacity)) return false;
    if (selectedFloor !== "All" && !(room.floor || "").toLowerCase().includes(selectedFloor.toLowerCase())) return false;
    if (searchQuery && !room.name.toLowerCase().includes(searchQuery.toLowerCase()) && !room.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Live Room Availability Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select date and check hourly slot availability across all campus halls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs font-semibold rounded-xl glass-input bg-slate-900 text-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search room name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input"
            />
          </div>

          <div>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-slate-900"
            >
              <option value="All">All Floors</option>
              <option value="Ground">Ground Floor</option>
              <option value="1st">1st Floor</option>
              <option value="2nd">2nd Floor</option>
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Min Capacity (e.g. 50)"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input"
            />
          </div>
        </div>
      </div>

      {/* Availability Matrix Grid */}
      <div className="glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-3 px-4 min-w-[200px]">Room / Hall</th>
                <th className="py-3 px-3 text-center">Capacity</th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot} className="py-3 px-2 text-center whitespace-nowrap">
                    {slot}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRooms.map((room) => {
                const isUnderMaintenance = room.status === "Maintenance";
                return (
                  <tr key={room.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{room.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-indigo-400">{room.code}</span>
                        <span>•</span>
                        <span>{room.building}</span>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        <Users className="w-3 h-3 text-indigo-400" />
                        {room.capacity}
                      </span>
                    </td>

                    {TIME_SLOTS.map((slot) => {
                      if (isUnderMaintenance) {
                        return (
                          <td key={slot} className="py-4 px-2 text-center">
                            <span 
                              title={`Under Maintenance: ${room.maintenance_reason || "Scheduled maintenance"}`}
                              className="inline-block w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center leading-6 text-[10px]"
                            >
                              ??
                            </span>
                          </td>
                        );
                      }

                      const booked = isSlotBooked(room.id, slot);
                      if (booked) {
                        return (
                          <td key={slot} className="py-4 px-2 text-center">
                            <span 
                              title={`Booked: ${booked.event_name} (${booked.faculty_name} - ${booked.status})`}
                              className={`inline-block w-6 h-6 rounded-lg border text-center leading-6 text-[10px] ${
                                booked.status === "Approved"
                                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 font-bold"
                                  : "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-bold"
                              }`}
                            >
                              ?
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={slot} className="py-4 px-2 text-center">
                          <span 
                            title="Available"
                            className="inline-block w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center leading-6 text-[10px]"
                          >
                            ?
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectRoomToBook(room, selectedDate)}
                        disabled={isUnderMaintenance}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-40"
                      >
                        <span>Book</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
