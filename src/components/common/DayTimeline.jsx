import React from "react";
import { OPEN_MIN, CLOSE_MIN, timeToMin, formatTime12 } from "../../config/collegeTimings";

const SPAN = CLOSE_MIN - OPEN_MIN;
const pct = (mins) => Math.max(0, Math.min(100, ((mins - OPEN_MIN) / SPAN) * 100));

const STATUS_STYLE = {
  Approved: "bg-rose-500/80 border-rose-300/60",
  Pending: "bg-amber-400/80 border-amber-200/60"
};

// A horizontal bar covering the college day (open → close).
//   bookings : bookings of ONE room on ONE date (only Approved / Pending are drawn)
//   proposed : optional { startTime, endTime, ok } – the range the user is picking
export default function DayTimeline({ bookings = [], proposed = null, compact = false }) {
  const hourTicks = [];
  for (let m = Math.ceil(OPEN_MIN / 60) * 60; m <= CLOSE_MIN; m += 60) hourTicks.push(m);

  const active = bookings.filter((b) => b.status === "Approved" || b.status === "Pending");

  return (
    <div className="w-full select-none">
      <div className={`relative w-full ${compact ? "h-6" : "h-9"} rounded-lg bg-emerald-950/50 border border-emerald-500/30 overflow-hidden`}>
        {/* hour grid lines */}
        {hourTicks.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 border-l border-slate-700/60"
            style={{ left: `${pct(m)}%` }}
          />
        ))}

        {/* existing bookings */}
        {active.map((b) => {
          const left = pct(timeToMin(b.startTime));
          const width = Math.max(1.5, pct(timeToMin(b.endTime)) - left);
          return (
            <div
              key={b.id}
              title={`${b.eventName} • ${formatTime12(b.startTime)} - ${formatTime12(b.endTime)} • ${b.status}`}
              className={`absolute top-0 bottom-0 border ${STATUS_STYLE[b.status]} overflow-hidden`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {!compact && (
                <span className="px-1 text-[9px] font-bold text-slate-950 truncate block leading-9">
                  {b.eventName}
                </span>
              )}
            </div>
          );
        })}

        {/* the range being picked */}
        {proposed && proposed.startTime && proposed.endTime && (
          <div
            className={`absolute top-0.5 bottom-0.5 rounded-md border-2 border-dashed ${
              proposed.ok ? "border-cyan-300 bg-cyan-400/30" : "border-slate-300 bg-slate-500/40"
            }`}
            style={{
              left: `${pct(timeToMin(proposed.startTime))}%`,
              width: `${Math.max(1.5, pct(timeToMin(proposed.endTime)) - pct(timeToMin(proposed.startTime)))}%`
            }}
          />
        )}
      </div>

      {/* hour labels */}
      <div className="relative w-full h-4 mt-1">
        {hourTicks.map((m, i) => (
          <span
            key={m}
            className="absolute text-[9px] font-mono text-slate-400"
            style={{
              left: `${pct(m)}%`,
              transform: i === 0 ? "none" : i === hourTicks.length - 1 ? "translateX(-100%)" : "translateX(-50%)"
            }}
          >
            {formatTime12(`${String(m / 60).padStart(2, "0")}:00`).replace(":00", "")}
          </span>
        ))}
      </div>
    </div>
  );
}
