import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle,
  FileText,
  ShieldAlert,
  Sparkles,
  Layers,
  Award,
  Mail,
  XCircle,
  Loader2
} from "lucide-react";
import { AVAILABLE_EQUIPMENT } from "../../data/mockData";
import { findConflicts, getSmartSuggestions } from "../../utils/conflictDetector";
import ConflictModal from "./ConflictModal";
import DayTimeline from "../common/DayTimeline";
import {
  COLLEGE_TIMINGS,
  CLOSE_MIN,
  timeToMin,
  minToTime,
  formatTime12,
  getLocalDateStr,
  nextWorkingDateStr,
  getStartOptions,
  getEndOptions,
  validateBookingWindow
} from "../../config/collegeTimings";

export default function BookingForm({
  rooms,
  bookings,
  currentUser,
  prefilledRoom,
  prefilledDate,
  prefilledSlot,
  onSubmitBooking
}) {
  const firstBookableRoom = rooms.find((r) => r.status !== "Maintenance") || rooms[0];
  const [roomId, setRoomId] = useState(prefilledRoom?.id || firstBookableRoom?.id || "");
  const [eventName, setEventName] = useState("");
  const [department, setDepartment] = useState(currentUser.department || "Computer Science & Engineering");
  const [date, setDate] = useState(prefilledDate || nextWorkingDateStr());
  const [startTime, setStartTime] = useState(prefilledSlot || "10:00");
  const [endTime, setEndTime] = useState(() => {
    const s = timeToMin(prefilledSlot || "10:00");
    return minToTime(Math.min(s + 60, CLOSE_MIN));
  });
  const [participants, setParticipants] = useState(80);
  const [purpose, setPurpose] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState(["HD Projector & Screen", "Centralized AC System"]);
  const [submitting, setSubmitting] = useState(false);

  // Conflict Modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictList, setConflictList] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState({ alternateRooms: [], alternateTimeSlots: [] });

  // pre-fill coming from the 3D map / availability matrix / calendar
  useEffect(() => {
    if (prefilledRoom) setRoomId(prefilledRoom.id);
    if (prefilledDate) setDate(prefilledDate);
    if (prefilledSlot) {
      setStartTime(prefilledSlot);
      setEndTime(minToTime(Math.min(timeToMin(prefilledSlot) + 60, CLOSE_MIN)));
    }
  }, [prefilledRoom, prefilledDate, prefilledSlot]);

  // rooms arrive asynchronously – select one as soon as they are loaded
  useEffect(() => {
    if (!roomId && rooms.length > 0) {
      setRoomId((rooms.find((r) => r.status !== "Maintenance") || rooms[0]).id);
    }
  }, [rooms, roomId]);

  const handleStartChange = (value) => {
    setStartTime(value);
    // keep the end time valid (after start, inside college hours)
    if (timeToMin(endTime) < timeToMin(value) + COLLEGE_TIMINGS.minDurationMinutes) {
      setEndTime(minToTime(Math.min(timeToMin(value) + 60, CLOSE_MIN)));
    }
  };

  const selectedRoomObj = rooms.find((r) => r.id === roomId);

  const toggleEquipment = (eqName) => {
    setSelectedEquipment((prev) =>
      prev.includes(eqName) ? prev.filter((item) => item !== eqName) : [...prev, eqName]
    );
  };

  // ---- live availability check (college timings + existing bookings) ----
  const windowCheck = validateBookingWindow({ date, startTime, endTime });
  const roomUnderMaintenance = selectedRoomObj?.status === "Maintenance";
  const liveConflicts =
    windowCheck.valid && roomId ? findConflicts({ roomId, date, startTime, endTime }, bookings) : [];
  const isSlotFree = windowCheck.valid && !roomUnderMaintenance && liveConflicts.length === 0;
  const roomDayBookings = bookings.filter(
    (b) =>
      b.roomId === roomId &&
      String(b.date).slice(0, 10) === date &&
      (b.status === "Approved" || b.status === "Pending")
  );

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!eventName.trim() || !purpose.trim()) {
      alert("Please fill in event title and purpose.");
      return;
    }

    if (!windowCheck.valid) {
      alert(windowCheck.error);
      return;
    }

    if (roomUnderMaintenance) {
      alert("This room is under maintenance and cannot be booked.");
      return;
    }

    const proposedBooking = {
      roomId,
      roomName: selectedRoomObj?.name || "Selected Hall",
      date,
      startTime,
      endTime,
      participants: Number(participants)
    };

    // Run conflict detection engine
    const conflicts = findConflicts(proposedBooking, bookings);

    if (conflicts.length > 0) {
      const suggestions = getSmartSuggestions(proposedBooking, rooms, bookings);
      setConflictList(conflicts);
      setSmartSuggestions(suggestions);
      setShowConflictModal(true);
      return;
    }

    // Process new booking request (the server assigns the final booking id)
    const newBooking = {
      roomId,
      roomName: selectedRoomObj?.name || "Selected Hall",
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      department,
      eventName,
      date,
      startTime,
      endTime,
      participants: Number(participants),
      purpose,
      equipment: selectedEquipment,
      status: "Pending",
      adminRemarks: ""
    };

    setSubmitting(true);
    try {
      await onSubmitBooking(newBooking);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Calendar className="text-cyan-400" size={26} /> Faculty Room Booking Request
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Submit a new infrastructure reservation request for seminars, conferences, and workshops.
        </p>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleFormSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200">
        
        {/* Section 1: Event Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText size={16} /> 1. Event Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National Conference on Machine Learning"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organizing Department *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Room Selection & Capacity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building size={16} /> 2. Room & Schedule Selection
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Room */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Infrastructure Room *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.status === "Maintenance"} className="bg-slate-900">
                    {r.name} ({r.code}) {r.status === "Maintenance" ? "• [MAINTENANCE]" : `• Cap: ${r.capacity}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                min={getLocalDateStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Expected Participants */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected Participants *
              </label>
              <input
                type="number"
                required
                min={1}
                max={600}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Time Slot Range (college timings only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Time * <span className="text-slate-500 font-normal">(college hours {formatTime12(COLLEGE_TIMINGS.open)} – {formatTime12(COLLEGE_TIMINGS.close)})</span>
              </label>
              <select
                required
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer font-mono"
              >
                {getStartOptions().map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {formatTime12(t)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Time *
              </label>
              <select
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer font-mono"
              >
                {getEndOptions(startTime).map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {formatTime12(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live availability result */}
          {roomUnderMaintenance ? (
            <div className="bg-slate-950 border border-slate-600 p-3 rounded-xl flex items-start gap-3 text-slate-300 text-xs">
              <XCircle size={18} className="shrink-0 text-slate-400" />
              <span><strong>Not available:</strong> {selectedRoomObj?.name} is under maintenance.</span>
            </div>
          ) : !windowCheck.valid ? (
            <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{windowCheck.error}</span>
            </div>
          ) : liveConflicts.length > 0 ? (
            <div className="bg-rose-950/60 border border-rose-500/50 p-3 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
              <XCircle size={18} className="shrink-0" />
              <span>
                <strong>Not available:</strong> {selectedRoomObj?.name} is already{" "}
                {liveConflicts[0].status === "Approved" ? "booked" : "requested"} from{" "}
                {formatTime12(liveConflicts[0].startTime)} to {formatTime12(liveConflicts[0].endTime)} ("{liveConflicts[0].eventName}").
                Pick another time or room.
              </span>
            </div>
          ) : (
            <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-xl flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle size={18} className="shrink-0" />
              <span>
                <strong>Available:</strong> {selectedRoomObj?.name} is free on {date} from {formatTime12(startTime)} to {formatTime12(endTime)}.
              </span>
            </div>
          )}

          {/* Day timeline for the chosen room */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">
                {selectedRoomObj?.name || "Room"} – schedule on {date}
              </span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/80" /> Booked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400/80" /> Pending</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border border-dashed border-cyan-300" /> Your slot</span>
              </span>
            </div>
            <DayTimeline
              bookings={roomDayBookings}
              proposed={{ startTime, endTime, ok: isSlotFree }}
            />
          </div>

          {/* Capacity warning alert */}
          {selectedRoomObj && Number(participants) > selectedRoomObj.capacity && (
            <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
              <ShieldAlert size={18} className="shrink-0" />
              <span>
                <strong>Capacity Warning:</strong> Expected participants ({participants}) exceeds{" "}
                {selectedRoomObj.name}'s max seating capacity ({selectedRoomObj.capacity}).
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Equipment Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers size={16} /> 3. Required Equipment & AV Support
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_EQUIPMENT.map((eq) => {
              const isChecked = selectedEquipment.includes(eq.name);
              return (
                <button
                  type="button"
                  key={eq.name}
                  onClick={() => toggleEquipment(eq.name)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                    isChecked
                      ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 font-semibold shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="truncate">{eq.name}</span>
                  {isChecked && <CheckCircle size={14} className="text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Purpose */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Event Description & Purpose *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe the nature of the event, chief guests, special technical requirements..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
            <Mail size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              When you submit, an email is sent to your registered address
              {currentUser.email ? <> (<strong className="text-slate-300">{currentUser.email}</strong>)</> : null} and to the admin.
              Your room is booked once the admin confirms.
            </span>
          </p>
          <button
            type="submit"
            disabled={submitting || !isSlotFree}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (<><Loader2 size={16} className="animate-spin" /> Sending request…</>) : "Book Room →"}
          </button>
        </div>
      </form>

      {/* Intelligent Conflict Resolution Pop-up */}
      <ConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflicts={conflictList}
        suggestions={smartSuggestions}
        proposedBooking={{ roomId, roomName: selectedRoomObj?.name, date, startTime, endTime }}
        onSelectAlternateRoom={(altRoom) => {
          setRoomId(altRoom.id);
          setShowConflictModal(false);
        }}
        onSelectAlternateSlot={(altStart, altEnd) => {
          setStartTime(altStart);
          setEndTime(altEnd);
          setShowConflictModal(false);
        }}
      />
    </div>
  );
}
