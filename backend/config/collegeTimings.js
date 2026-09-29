// ---------------------------------------------------------------------------
// COLLEGE TIMINGS (server side) – bookings outside these hours are rejected.
// NOTE: keep in sync with  ../src/config/collegeTimings.js  (frontend).
// ---------------------------------------------------------------------------
export const COLLEGE_TIMINGS = {
  open: "09:00",
  close: "17:00",
  workingDays: [1, 2, 3, 4, 5, 6], // 0 = Sunday … 6 = Saturday
  minDurationMinutes: 30
};

// Timezone used to decide what "today" / "now" is (college is in India).
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

const pad = (n) => String(n).padStart(2, "0");

export const timeToMin = (t) => {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
};

export const formatTime12 = (t) => {
  const mins = timeToMin(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${h24 >= 12 ? "PM" : "AM"}`;
};

// Current date (YYYY-MM-DD) and minutes-since-midnight in the college timezone
export function nowInCollegeTz() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute"))
  };
}

// 0 (Sun) … 6 (Sat) for a YYYY-MM-DD string, independent of server timezone
const weekdayOf = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

// Returns { valid: true } or { valid: false, error: "..." }
export function validateBookingWindow({ date, startTime, endTime }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return { valid: false, error: "Invalid date. Use the format YYYY-MM-DD." };
  }
  if (!/^\d{2}:\d{2}$/.test(String(startTime || "")) || !/^\d{2}:\d{2}$/.test(String(endTime || ""))) {
    return { valid: false, error: "Invalid time. Use the 24-hour format HH:MM." };
  }

  const open = timeToMin(COLLEGE_TIMINGS.open);
  const close = timeToMin(COLLEGE_TIMINGS.close);
  const s = timeToMin(startTime);
  const e = timeToMin(endTime);
  const now = nowInCollegeTz();

  if (date < now.date) {
    return { valid: false, error: "This date is in the past. Please choose today or a future date." };
  }
  if (!COLLEGE_TIMINGS.workingDays.includes(weekdayOf(date))) {
    return { valid: false, error: "The college is closed on this day. Please choose a working day (Mon–Sat)." };
  }
  if (s < open || e > close) {
    return {
      valid: false,
      error: `Rooms can only be booked during college hours: ${formatTime12(COLLEGE_TIMINGS.open)} – ${formatTime12(COLLEGE_TIMINGS.close)}.`
    };
  }
  if (e - s < COLLEGE_TIMINGS.minDurationMinutes) {
    return { valid: false, error: "End time must be after the start time (minimum 30 minutes)." };
  }
  if (date === now.date && s < now.minutes) {
    return { valid: false, error: "This start time has already passed today. Please choose a later time." };
  }
  return { valid: true };
}
