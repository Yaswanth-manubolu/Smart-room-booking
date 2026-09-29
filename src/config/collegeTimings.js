// ---------------------------------------------------------------------------
// COLLEGE TIMINGS  –  the single place to change when rooms may be booked.
// NOTE: keep this file in sync with backend/config/collegeTimings.js
// (the backend re-checks every booking, so both must agree).
// ---------------------------------------------------------------------------
export const COLLEGE_TIMINGS = {
  open: "09:00",               // first bookable minute of the day
  close: "17:00",              // bookings must END at or before this time
  workingDays: [1, 2, 3, 4, 5, 6], // 0 = Sunday … 6 = Saturday  (Sunday closed)
  stepMinutes: 30,             // granularity of the start/end time pickers
  minDurationMinutes: 30       // shortest allowed booking
};

const pad = (n) => String(n).padStart(2, "0");

export const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
};

export const minToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

// "14:30" -> "2:30 PM"
export const formatTime12 = (t) => {
  const mins = timeToMin(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${suffix}`;
};

export const OPEN_MIN = timeToMin(COLLEGE_TIMINGS.open);
export const CLOSE_MIN = timeToMin(COLLEGE_TIMINGS.close);

// ---- date helpers (always LOCAL time – never toISOString(), which is UTC) ----
export const toDateStr = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

export const getLocalDateStr = (d = new Date()) =>
  toDateStr(d.getFullYear(), d.getMonth(), d.getDate());

export const parseDateStr = (dateStr) => {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const isWorkingDay = (dateStr) =>
  COLLEGE_TIMINGS.workingDays.includes(parseDateStr(dateStr).getDay());

export const isPastDate = (dateStr) => String(dateStr).slice(0, 10) < getLocalDateStr();

export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

// next date (today or later) on which the college is open
export const nextWorkingDateStr = (from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // if today is already over, start from tomorrow
  if (nowMinutes(from) >= CLOSE_MIN) d.setDate(d.getDate() + 1);
  for (let i = 0; i < 8; i++) {
    if (isWorkingDay(getLocalDateStr(d))) return getLocalDateStr(d);
    d.setDate(d.getDate() + 1);
  }
  return getLocalDateStr(from);
};

export const prettyDate = (dateStr) =>
  parseDateStr(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

// Start-time choices (every stepMinutes from open up to the last possible start)
export const getStartOptions = () => {
  const out = [];
  for (let m = OPEN_MIN; m <= CLOSE_MIN - COLLEGE_TIMINGS.minDurationMinutes; m += COLLEGE_TIMINGS.stepMinutes) {
    out.push(minToTime(m));
  }
  return out;
};

// End-time choices for a given start time
export const getEndOptions = (startTime) => {
  const out = [];
  const first = timeToMin(startTime) + COLLEGE_TIMINGS.minDurationMinutes;
  for (let m = first; m <= CLOSE_MIN; m += COLLEGE_TIMINGS.stepMinutes) {
    out.push(minToTime(m));
  }
  return out;
};

// Hourly grid slots used by the availability matrix: ["09:00", …, "16:00"]
export const getHourlySlots = () => {
  const out = [];
  for (let m = OPEN_MIN; m + 60 <= CLOSE_MIN; m += 60) out.push(minToTime(m));
  return out;
};

// Validate a requested booking window against the college timings.
// Returns { valid: boolean, error?: string }
export const validateBookingWindow = ({ date, startTime, endTime }, now = new Date()) => {
  if (!date || !startTime || !endTime) {
    return { valid: false, error: "Please choose a date, start time and end time." };
  }
  if (isPastDate(date)) {
    return { valid: false, error: "This date is in the past. Please pick today or a future date." };
  }
  if (!isWorkingDay(date)) {
    return { valid: false, error: "The college is closed on this day. Please choose a working day (Mon–Sat)." };
  }
  const s = timeToMin(startTime);
  const e = timeToMin(endTime);
  if (s < OPEN_MIN || e > CLOSE_MIN) {
    return {
      valid: false,
      error: `Rooms can only be booked during college hours: ${formatTime12(COLLEGE_TIMINGS.open)} – ${formatTime12(COLLEGE_TIMINGS.close)}.`
    };
  }
  if (e - s < COLLEGE_TIMINGS.minDurationMinutes) {
    return { valid: false, error: "End time must be after the start time (minimum 30 minutes)." };
  }
  if (date === getLocalDateStr(now) && s < nowMinutes(now)) {
    return { valid: false, error: "This start time has already passed today. Please choose a later time." };
  }
  return { valid: true };
};
