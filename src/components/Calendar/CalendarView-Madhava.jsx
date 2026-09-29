import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  Building2, 
  User, 
  Ticket,
  CheckCircle2
} from "lucide-react";

export default function CalendarView({
  rooms = [],
  bookings = [],
  onViewQRTicket
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("All");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const filteredBookings = bookings.filter((b) => {
    if (selectedRoomFilter !== "All" && b.room_id !== selectedRoomFilter) return false;
    return true;
  });

  const getBookingsForDay = (day) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredBookings.filter((b) => b.date === formattedDate);
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header & Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold text-white">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-400">Campus Schedule & Reservation Calendar</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Room Filter */}
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl glass-input bg-slate-900 text-white"
          >
            <option value="All">All Rooms & Halls</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Calendar Grid */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl">
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          
          {/* Leading Empty Cells */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-28 rounded-2xl bg-slate-900/20 border border-slate-800/30 opacity-40" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dayBookings = getBookingsForDay(day);
            const isToday = 
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[120px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? "bg-indigo-950/40 border-indigo-500/50 shadow-inner"
                    : "bg-slate-900/50 border-slate-800/70 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                    isToday ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] text-indigo-400 font-semibold">
                      {dayBookings.length} event{dayBookings.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Day Bookings List */}
                <div className="space-y-1.5 overflow-y-auto max-h-24 pr-0.5">
                  {dayBookings.map((bkg) => (
                    <div
                      key={bkg.id}
                      onClick={() => onViewQRTicket(bkg)}
                      className={`p-1.5 rounded-lg text-[10px] font-medium border cursor-pointer truncate transition-all ${
                        bkg.status === "Approved"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                          : bkg.status === "Pending"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}
                      title={`${bkg.event_name} (${bkg.start_time}-${bkg.end_time}) - ${bkg.room_name}`}
                    >
                      <div className="font-bold truncate">{bkg.event_name}</div>
                      <div className="text-[9px] opacity-75 truncate">{bkg.start_time} • {bkg.room_name}</div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}
