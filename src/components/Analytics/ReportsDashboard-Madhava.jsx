import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  Sparkles,
  PieChart
} from "lucide-react";
import { api } from "../../services/api";

export default function ReportsDashboard({
  rooms = [],
  bookings = []
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [bookings, rooms]);

  const fetchStats = async () => {
    try {
      const data = await api.getAnalytics();
      setStats(data);
    } catch (err) {
      console.warn("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = bookings.map((b) => ({
      "Booking ID": b.id,
      "Event Name": b.event_name,
      "Room": b.room_name,
      "Faculty": b.faculty_name,
      "Department": b.department,
      "Date": b.date,
      "Start Time": b.start_time,
      "End Time": b.end_time,
      "Participants": b.participants,
      "Status": b.status,
      "Admin Remarks": b.admin_remarks || ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings Report");
    XLSX.writeFile(wb, `Campus_Bookings_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Campus Room Reservation & Utilization Report", 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Bookings: ${bookings.length} | Total Rooms: ${rooms.length}`, 14, 36);

    let y = 48;
    doc.setFontSize(11);
    doc.text("Recent Reservations Summary:", 14, y);
    y += 8;

    bookings.slice(0, 15).forEach((b, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(9);
      doc.text(
        `${i + 1}. [${b.status}] ${b.date} | ${b.event_name} - ${b.room_name} (${b.faculty_name})`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`Campus_Booking_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const totalBookings = bookings.length;
  const approvedCount = bookings.filter((b) => b.status === "Approved").length;
  const pendingCount = bookings.filter((b) => b.status === "Pending").length;
  const rejectedCount = bookings.filter((b) => b.status === "Rejected").length;

  return (
    <div className="space-y-6">
      
      {/* Header & Export Actions */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Campus Intelligence
          </span>
          <h3 className="font-display text-2xl font-bold text-white mt-0.5">
            Reports & Utilization Dashboard
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time insights on room occupancy, department demand, and exportable audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-600/10"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Infrastructure Rooms</div>
            <div className="font-display text-2xl font-bold text-white">{rooms.length}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Booking Requests</div>
            <div className="font-display text-2xl font-bold text-white">{totalBookings}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Approved Events</div>
            <div className="font-display text-2xl font-bold text-emerald-400">{approvedCount}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Pending Review</div>
            <div className="font-display text-2xl font-bold text-amber-400">{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Room Popularity Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h4 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Top Booked Campus Halls
          </h4>
          <div className="space-y-3">
            {rooms.map((room) => {
              const count = bookings.filter((b) => b.room_id === room.id && b.status === "Approved").length;
              const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div key={room.id} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold">{room.name}</span>
                    <span className="text-slate-400">{count} events ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h4 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Reservation Status Distribution
          </h4>
          
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
                <span className="text-xs font-semibold text-slate-200">Approved & Confirmed</span>
              </div>
              <span className="font-mono font-bold text-sm text-emerald-400">{approvedCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                <span className="text-xs font-semibold text-slate-200">Pending Review</span>
              </div>
              <span className="font-mono font-bold text-sm text-indigo-400">{pendingCount}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
                <span className="text-xs font-semibold text-slate-200">Rejected / Cancelled</span>
              </div>
              <span className="font-mono font-bold text-sm text-rose-400">{rejectedCount}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
