/**
 * Utility to detect time range overlaps between bookings for a specific room and date.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, mins] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

export function checkBookingConflict(newBooking, existingBookings) {
  const newStart = timeToMinutes(newBooking.start_time);
  const newEnd = timeToMinutes(newBooking.end_time);

  if (newEnd <= newStart) {
    return {
      hasConflict: true,
      reason: "End time must be later than start time."
    };
  }

  const conflicting = existingBookings.find((bkg) => {
    // Ignore rejected or cancelled bookings
    if (bkg.status === "Rejected" || bkg.status === "Cancelled") return false;
    
    // Check if same room and same date
    if (bkg.room_id !== newBooking.room_id) return false;
    if (bkg.date !== newBooking.date) return false;

    // Ignore self when updating existing booking
    if (newBooking.id && bkg.id === newBooking.id) return false;

    const bkgStart = timeToMinutes(bkg.start_time);
    const bkgEnd = timeToMinutes(bkg.end_time);

    // Overlap exists if NOT (newEnd <= bkgStart OR newStart >= bkgEnd)
    const isOverlapping = !(newEnd <= bkgStart || newStart >= bkgEnd);
    return isOverlapping;
  });

  if (conflicting) {
    return {
      hasConflict: true,
      reason: `Slot overlaps with "${conflicting.event_name}" (${conflicting.start_time} - ${conflicting.end_time}) booked by ${conflicting.faculty_name}.`,
      conflictingBooking: conflicting
    };
  }

  return { hasConflict: false };
}

/**
 * Returns available time slots for a given room and date.
 */
export function getRoomOccupancyStatus(roomId, bookings, targetDate = new Date().toISOString().split("T")[0], targetTime = null) {
  const currentMins = targetTime ? timeToMinutes(targetTime) : (new Date().getHours() * 60 + new Date().getMinutes());

  const activeBooking = bookings.find((bkg) => {
    if (bkg.room_id !== roomId) return false;
    if (bkg.date !== targetDate) return false;
    if (bkg.status !== "Approved") return false;

    const s = timeToMinutes(bkg.start_time);
    const e = timeToMinutes(bkg.end_time);
    return currentMins >= s && currentMins < e;
  });

  if (activeBooking) {
    return {
      state: "Occupied",
      booking: activeBooking,
      label: `Occupied: ${activeBooking.event_name}`
    };
  }

  return {
    state: "Available",
    booking: null,
    label: "Available"
  };
}
