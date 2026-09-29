import React, { useState } from "react";
import { Settings, Plus, Edit2, Trash2, Wrench, CheckCircle, ShieldAlert, Layers } from "lucide-react";

export default function RoomListAdmin({ rooms, onSaveRoom, onDeleteRoom }) {
  const [editingRoom, setEditingRoom] = useState(null);
  const [isNewRoom, setIsNewRoom] = useState(false);

  const emptyRoomForm = {
    id: "",
    name: "",
    code: "",
    building: "Block A - Ground Floor",
    capacity: 100,
    facilities: ["HD Projector", "Centralized AC"],
    status: "Available",
    type: "Seminar Hall",
    description: "",
    maintenanceReason: "",
    position: { x: 0, y: 0, z: 0 },
    dimensions: { width: 4, height: 2.5, depth: 4 },
    color: "#3b82f6"
  };

  const [formData, setFormData] = useState(emptyRoomForm);
  const [facilityInput, setFacilityInput] = useState("");

  const handleOpenAdd = () => {
    setIsNewRoom(true);
    setFormData({
      ...emptyRoomForm,
      id: `ROOM_${Date.now().toString().slice(-4)}`
    });
    setEditingRoom(true);
  };

  const handleOpenEdit = (room) => {
    setIsNewRoom(false);
    setFormData(room);
    setEditingRoom(true);
  };

  const handleAddFacility = () => {
    if (!facilityInput.trim()) return;
    setFormData({
      ...formData,
      facilities: [...formData.facilities, facilityInput.trim()]
    });
    setFacilityInput("");
  };

  const handleRemoveFacility = (idx) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter((_, i) => i !== idx)
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveRoom(formData);
    setEditingRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="text-cyan-400" size={26} /> Infrastructure Room Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure seminar halls, auditoriums, seating capacity, equipment, and maintenance schedules.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus size={16} /> Add New Infrastructure Room
        </button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl space-y-4 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{room.name}</h3>
                  <span className="text-xs text-cyan-400 font-mono">{room.code} • {room.building}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    room.status === "Maintenance"
                      ? "bg-slate-800 text-slate-400 border border-slate-700"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {room.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">{room.description}</p>

              <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
                <span className="text-slate-400">Seating Capacity:</span>
                <strong className="text-cyan-300 text-sm">{room.capacity} Seats</strong>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Facilities:</span>
                <div className="flex flex-wrap gap-1">
                  {room.facilities.map((fac, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md text-[10px]">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(room)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Edit2 size={14} /> Edit Room
              </button>
              <button
                onClick={() => onDeleteRoom(room.id)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {isNewRoom ? "Add New Infrastructure Space" : `Edit ${formData.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Seating Capacity *</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            {/* Facilities Management */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Facilities List</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Dolby Sound System"
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddFacility}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {formData.facilities.map((fac, idx) => (
                  <span key={idx} className="bg-slate-800 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    {fac}
                    <button type="button" onClick={() => handleRemoveFacility(idx)} className="text-rose-400 hover:text-rose-300">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Save Room Details
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
