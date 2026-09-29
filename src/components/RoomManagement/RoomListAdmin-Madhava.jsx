import React, { useState } from "react";
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  Users, 
  Building2, 
  Layers,
  Sparkles,
  X
} from "lucide-react";
import { api } from "../../services/api";

export default function RoomListAdmin({
  rooms = [],
  onRefresh
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [maintenanceModal, setMaintenanceModal] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    building: "Block A - Ground Floor",
    capacity: 60,
    facilities: "HD Projector, AC, Wi-Fi",
    type: "Seminar Hall",
    description: "",
    floor: "Ground Floor",
    color: "#3b82f6",
    pos_x: 0,
    pos_z: 0
  });

  const openCreate = () => {
    setEditingRoom(null);
    setFormData({
      name: "",
      code: "",
      building: "Block A - Ground Floor",
      capacity: 60,
      facilities: "HD Projector, AC, Wi-Fi",
      type: "Seminar Hall",
      description: "",
      floor: "Ground Floor",
      color: "#3b82f6",
      pos_x: 0,
      pos_z: 0
    });
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      code: room.code,
      building: room.building,
      capacity: room.capacity,
      facilities: Array.isArray(room.facilities) ? room.facilities.join(", ") : room.facilities,
      type: room.type,
      description: room.description || "",
      floor: room.floor || "Ground Floor",
      color: room.color || "#3b82f6",
      pos_x: room.position?.x || 0,
      pos_z: room.position?.z || 0
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      code: formData.code,
      building: formData.building,
      capacity: Number(formData.capacity) || 50,
      facilities: formData.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      type: formData.type,
      description: formData.description,
      floor: formData.floor,
      color: formData.color,
      position: { x: Number(formData.pos_x) || 0, y: 0, z: Number(formData.pos_z) || 0 },
      dimensions: { width: 4.2, height: 2.5, depth: 3.8 }
    };

    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, payload);
      } else {
        await api.createRoom(payload);
      }
      setModalOpen(false);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || "Failed to save room details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this room? All associated bookings will be removed.")) return;
    try {
      await api.deleteRoom(id);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete room");
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceModal) return;
    const newStatus = maintenanceModal.status === "Maintenance" ? "Available" : "Maintenance";
    try {
      await api.updateRoomStatus(maintenanceModal.id, newStatus, maintenanceReason);
      setMaintenanceModal(null);
      setMaintenanceReason("");
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || "Failed to toggle maintenance");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Campus Infrastructure Management
          </span>
          <h3 className="font-display text-2xl font-bold text-white mt-0.5">
            Rooms, Halls & 3D Spatial Layout
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure room capacities, floor levels, 3D visualization coordinates, and maintenance downtime.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="glass-panel p-6 rounded-3xl border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {room.code}
                  </span>
                  <h4 className="font-display font-bold text-lg text-white mt-1">
                    {room.name}
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">{room.building}</div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  room.status === "Maintenance"
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                }`}>
                  {room.status}
                </span>
              </div>

              {room.maintenance_reason && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] mb-3">
                  <strong>Maintenance:</strong> {room.maintenance_reason}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400">Capacity</span>
                  <div className="font-bold text-slate-200">{room.capacity} Seats</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] text-slate-400">Floor</span>
                  <div className="font-bold text-slate-200">{room.floor || "Ground"}</div>
                </div>
              </div>

              {/* Facilities */}
              <div className="flex flex-wrap gap-1 mb-4">
                {(room.facilities || []).map((f, i) => (
                  <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setMaintenanceModal(room);
                  setMaintenanceReason(room.maintenance_reason || "");
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  room.status === "Maintenance"
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/40"
                    : "bg-amber-600/20 border-amber-500/30 text-amber-300 hover:bg-amber-600/40"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{room.status === "Maintenance" ? "Clear Downtime" : "Set Maintenance"}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(room)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Room"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="font-display text-xl font-bold mb-4">
              {editingRoom ? "Edit Infrastructure Room" : "Add New Campus Room"}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seminar Hall E"
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SHE-301"
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building Location</label>
                  <input
                    type="text"
                    required
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="Block C - 1st Floor"
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facilities (Comma separated)</label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="HD Projector, AC, Smart Board"
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor Level</label>
                  <select
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input bg-slate-900"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">3D Position (X / Z)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="X"
                      value={formData.pos_x}
                      onChange={(e) => setFormData({ ...formData, pos_x: Number(e.target.value) })}
                      className="p-2.5 rounded-xl glass-input text-center"
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      value={formData.pos_z}
                      onChange={(e) => setFormData({ ...formData, pos_z: Number(e.target.value) })}
                      className="p-2.5 rounded-xl glass-input text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  {loading ? "Saving..." : editingRoom ? "Update Room" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Toggle Modal */}
      {maintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 text-white">
            <h4 className="font-display text-lg font-bold">
              {maintenanceModal.status === "Maintenance" ? "Restore Room to Available" : "Set Maintenance Downtime"}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Room: <strong className="text-white">{maintenanceModal.name}</strong>
            </p>

            {maintenanceModal.status !== "Maintenance" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Maintenance / Upgrades
                </label>
                <textarea
                  rows="3"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="e.g. Projector bulb replacement & audio wiring maintenance."
                  className="w-full p-3 text-xs rounded-xl glass-input"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setMaintenanceModal(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleMaintenance}
                className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg ${
                  maintenanceModal.status === "Maintenance"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {maintenanceModal.status === "Maintenance" ? "Restore to Available" : "Confirm Maintenance"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
