import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  Mic, 
  Video, 
  Projector, 
  FileText,
  Send,
  Ticket
} from "lucide-react";
import { api } from "../../services/api";
import { checkBookingConflict } from "../../utils/conflictDetector";
import ConflictModal from "./ConflictModal";

const EQUIPMENT_OPTIONS = [
  { id: "HD Projector", label: "HD Projector & HDMI Cable" },
  { id: "Wireless Mics", label: "Cordless Lapel & Handheld Microphones" },
  { id: "Dolby Audio", label: "Dolby Surround Acoustic Amplifiers" },
  { id: "Live Stream Suite", label: "Live Streaming & Recording Rig" },
  { id: "Smart Board", label: "Interactive Touchscreen Smart Board" },
  { id: "Podium Setup", label: "Digital Lectern / Podium Screen" }
];

export default function BookingForm({
  rooms = [],
  bookings = [],
  initialRoom = null,
  initialDate = null,
  user,
  onBookingCreated,
  onViewQRTicket
}) {
  const [formData, setFormData] = useState({
    room_id: initialRoom?.id || (rooms[0]?.id || ""),
    room_name: initialRoom?.name || (rooms[0]?.name || ""),
    faculty_name: user?.name || "",
    department: user?.department || "Computer Science & Engineering",
    event_name: "",
    date: initialDate || new Date().toISOString().split("T")[0],
    start_time: "09:30",
    end_time: "12:30",
    participants: 40,
    purpose: "",
    equipment: ["HD Projector"]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [suggestedRooms, setSuggestedRooms] = useState([]);

  useEffect(() => {
    if (initialRoom) {
      setFormData((prev) => ({
        ...prev,
        room_id: initialRoom.id,
        room_name: initialRoom.name
      }));
    }
  }, [initialRoom]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        faculty_name: prev.faculty_name || user.name,
        department: prev.department || user.department
      }));
    }
  }, [user]);

  const selectedRoomObj = rooms.find((r) => r.id === formData.room_id) || rooms[0];

  const handleEquipmentToggle = (item) => {
    setFormData((prev) => {
      const exists = prev.equipment.includes(item);
      return {
        ...prev,
        equipment: exists
          ? prev.equipment.filter((x) => x !== item)
          : [...prev.equipment, item]
      };
    });
  };

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const r = rooms.find((x) => x.id === roomId);
    setFormData({
      ...formData,
      room_id: roomId,
      room_name: r?.name || ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessBooking(null);

    // 1. Client-Side Conflict Pre-Check
    const localConflict = checkBookingConflict(formData, bookings);
    if (localConflict.hasConflict) {
      setConflictData(localConflict);
      // Find suggested alternative rooms
      const alternatives = rooms.filter((r) => {
        if (r.id === formData.room_id) return false;
        if (r.status === "Maintenance") return false;
        if (r.capacity < formData.participants) return false;
        const testConflict = checkBookingConflict({ ...formData, room_id: r.id }, bookings);
        return !testConflict.hasConflict;
      });
      setSuggestedRooms(alternatives);
      return;
    }

    setLoading(true);

    try {
      const res = await api.createBooking(formData);
      
      // Trigger festive confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessBooking({
        ...formData,
        id: res.bookingId,
        status: res.status || "Pending"
      });

      onBookingCreated && onBookingCreated();
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("conflict")) {
        setConflictData({ reason: err.message });
      } else {
        setError(err.message || "Failed to submit booking request.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlternativeRoom = (room) => {
    setFormData({
      ...formData,
      room_id: room.id,
      room_name: room.name
    });
    setConflictData(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Success Notification Banner */}
      {successBooking && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/30 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-white">
                  Booking Request Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-300">
                  Request ID: <span className="font-mono font-bold">{successBooking.id}</span> • Status: Pending Admin Review
                </p>
              </div>
            </div>

            <button
              onClick={() => onViewQRTicket(successBooking)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Ticket className="w-4 h-4" />
              <span>View QR Gate Pass</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Booking Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Smart Reservation Engine
            </span>
            <h3 className="font-display text-2xl font-bold text-white mt-0.5">
              Book a Campus Hall / Room
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Real-Time Collision Prevention</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Room Selection & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Room / Seminar Hall
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                <select
                  value={formData.room_id}
                  onChange={handleRoomChange}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input bg-slate-900 text-white font-medium"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.status === "Maintenance"}>
                      {r.name} ({r.code}) - {r.capacity} Seats {r.status === "Maintenance" ? "[Maintenance]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Preview Specs */}
            {selectedRoomObj && (
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Location</div>
                  <div className="font-bold text-slate-200 mt-0.5">{selectedRoomObj.building}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Max Capacity</div>
                  <div className="font-bold text-indigo-400 mt-0.5">{selectedRoomObj.capacity} Attendees</div>
                </div>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Title / Purpose</label>
              <input
                type="text"
                required
                placeholder="e.g. National Cyber Security Symposium 2026"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                className="w-full px-4 py-2.5 text-xs rounded-xl glass-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Faculty Coordinator</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Name"
                  value={formData.faculty_name}
                  onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl glass-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  required
                  placeholder="CSE / ECE / Mech"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl glass-input"
                />
              </div>
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Event</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl glass-input bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl glass-input bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl glass-input bg-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Attendees Count & Warning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected Participants
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl glass-input"
                />
              </div>
            </div>

            {selectedRoomObj && formData.participants > selectedRoomObj.capacity && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 mt-4 sm:mt-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Warning: Attendees ({formData.participants}) exceed room capacity ({selectedRoomObj.capacity}).
                </span>
              </div>
            )}
          </div>

          {/* Equipment Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Audio / Visual Equipment & Stage Requirements
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {EQUIPMENT_OPTIONS.map((item) => {
                const checked = formData.equipment.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleEquipmentToggle(item.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-center gap-2.5 ${
                      checked
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm shadow-indigo-500/20"
                        : "bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      checked ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-600"
                    }`}>
                      {checked && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-medium text-[11px]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:brightness-110 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Submitting Booking..." : "Submit Reservation Request"}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Conflict Resolution Modal */}
      <ConflictModal
        isOpen={!!conflictData}
        onClose={() => setConflictData(null)}
        conflictData={conflictData}
        suggestedRooms={suggestedRooms}
        onSelectAlternative={handleSelectAlternativeRoom}
      />

    </div>
  );
}
