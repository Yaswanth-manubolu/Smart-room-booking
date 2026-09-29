// Conflict Detection and Recommendation Engine
import {
  COLLEGE_TIMINGS,
  OPEN_MIN,
  CLOSE_MIN,
  formatTime12,
  validateBookingWindow
} from "../config/collegeTimings";

// Convert "HH:MM" time string to total minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Check if two time ranges on the same date overlap
export const checkTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
};

// Detect conflict for a proposed booking
export const findConflicts = (proposedBooking, allBookings, ignoreBookingId = null) => {
  const { roomId, date, startTime, endTime } = proposedBooking;

  const activeBookings = allBookings.filter(
    (b) =>
      b.id !== ignoreBookingId &&
      b.roomId === roomId &&
      b.date === date &&
      (b.status === "Approved" || b.status === "Pending")
  );

  const conflicting = activeBookings.filter((b) =>
    checkTimeOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  return conflicting;
};

// Auto-suggest alternate available rooms or time slots when a conflict occurs
// (suggestions are always inside the college timings)
export const getSmartSuggestions = (proposedBooking, allRooms, allBookings) => {
  const { roomId, date, startTime, endTime, participants } = proposedBooking;
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);
  const duration = reqEnd - reqStart;

  const currentRoom = allRooms.find((r) => r.id === roomId);
  const alternateRooms = [];

  // 1. Other rooms that are free for the exact same date & time, with enough capacity
  allRooms.forEach((room) => {
    if (room.id === roomId) return; // Skip target room
    if (room.status === "Maintenance") return; // Skip maintenance rooms
    if (room.capacity < (participants || 1)) return; // Must hold participants

    const conflicts = findConflicts({ roomId: room.id, date, startTime, endTime }, allBookings);

    if (conflicts.length === 0) {
      alternateRooms.push({
        room,
        reason: `Capacity: ${room.capacity} seats | Available for exact slot (${formatTime12(startTime)} - ${formatTime12(endTime)})`
      });
    }
  });

  // 2. Other free time windows (same length) for the requested room on the same day
  const candidates = [];
  for (
    let m = OPEN_MIN;
    m + duration <= CLOSE_MIN;
    m += COLLEGE_TIMINGS.stepMinutes
  ) {
    if (m === reqStart) continue; // skip the requested time itself

    const slotStartStr = minutesToTime(m);
    const slotEndStr = minutesToTime(m + duration);

    // don't suggest times that have already passed today
    const win = validateBookingWindow({ date, startTime: slotStartStr, endTime: slotEndStr });
    if (!win.valid) continue;

    const conflicts = findConflicts(
      { roomId, date, startTime: slotStartStr, endTime: slotEndStr },
      allBookings
    );

    if (conflicts.length === 0) {
      candidates.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        label: `${formatTime12(slotStartStr)} - ${formatTime12(slotEndStr)}`,
        roomName: currentRoom?.name || "Target Room",
        distance: Math.abs(m - reqStart)
      });
    }
  }

  // closest to the originally requested time first, keep the best 5
  const alternateTimeSlots = candidates
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return { alternateRooms, alternateTimeSlots };
};

// Calculate analytics & utilization statistics
export const calculateAnalytics = (allRooms, allBookings) => {
  const approvedBookings = allBookings.filter((b) => b.status === "Approved");

  // Calculate hours booked per room
  const roomStats = allRooms.map((room) => {
    const roomBookings = approvedBookings.filter((b) => b.roomId === room.id);
    let totalMinutes = 0;
    roomBookings.forEach((b) => {
      totalMinutes += Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime));
    });

    const totalHours = Number((totalMinutes / 60).toFixed(1));
    return {
      roomId: room.id,
      roomName: room.name,
      capacity: room.capacity,
      bookingCount: roomBookings.length,
      totalHours,
      // Utilization % based on 40 hours standard weekly operating window
      utilizationRate: Math.min(100, Math.round((totalHours / 40) * 100))
    };
  });

  // Department breakdown
  const deptMap = {};
  approvedBookings.forEach((b) => {
    const dept = b.department || "Other";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  // Sort most and least used halls
  const sortedByUsage = [...roomStats].sort((a, b) => b.totalHours - a.totalHours);
  const mostUsed = sortedByUsage[0] || null;
  const leastUsed = sortedByUsage[sortedByUsage.length - 1] || null;

  return {
    roomStats,
    deptMap,
    mostUsed,
    leastUsed,
    totalBookingsCount: allBookings.length,
    approvedCount: approvedBookings.length,
    pendingCount: allBookings.filter((b) => b.status === "Pending").length,
    rejectedCount: allBookings.filter((b) => b.status === "Rejected").length,
    cancelledCount: allBookings.filter((b) => b.status === "Cancelled").length
  };
};
