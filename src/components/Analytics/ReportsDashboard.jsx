import React from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Award,
  TrendingUp,
  PieChart,
  Users,
  CheckCircle2,
  AlertCircle,
  Building
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { calculateAnalytics } from "../../utils/conflictDetector";

export default function ReportsDashboard({ rooms, bookings }) {
  const analytics = calculateAnalytics(rooms, bookings);
  const { roomStats, deptMap, mostUsed, leastUsed } = analytics;

  // Export PDF Report
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SMART ROOM BOOKING & UTILIZATION REPORT", 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 25);

    // Key Stats Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Executive Summary Statistics", 14, 42);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`• Total Booking Requests: ${analytics.totalBookingsCount}`, 16, 50);
    doc.text(`• Approved Reservations: ${analytics.approvedCount}`, 16, 57);
    doc.text(`• Pending Review: ${analytics.pendingCount}`, 16, 64);
    doc.text(`• Most Utilized Infrastructure: ${mostUsed ? `${mostUsed.roomName} (${mostUsed.totalHours} hrs)` : "N/A"}`, 16, 71);

    // Table Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. Infrastructure Room Utilization Breakdown", 14, 85);

    let yPos = 95;
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, yPos - 5, 180, 8, "F");
    doc.setFontSize(9);
    doc.text("Room Name", 16, yPos);
    doc.text("Capacity", 80, yPos);
    doc.text("Approved Bookings", 115, yPos);
    doc.text("Total Hours Booked", 155, yPos);

    yPos += 10;
    roomStats.forEach((stat) => {
      doc.setFont("helvetica", "normal");
      doc.text(stat.roomName, 16, yPos);
      doc.text(`${stat.capacity} seats`, 80, yPos);
      doc.text(`${stat.bookingCount}`, 115, yPos);
      doc.text(`${stat.totalHours} hrs`, 155, yPos);
      yPos += 8;
    });

    doc.save(`Campus_Room_Utilization_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Export Excel (.xlsx) Report
  const handleExportExcel = () => {
    const excelData = roomStats.map((stat) => ({
      "Room ID": stat.roomId,
      "Infrastructure Room Name": stat.roomName,
      "Seating Capacity": stat.capacity,
      "Approved Bookings Count": stat.bookingCount,
      "Total Hours Booked": stat.totalHours,
      "Est. Utilization Rate %": `${stat.utilizationRate}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Room Utilization");

    // Add Second sheet for detailed booking logs
    const bookingsData = bookings.map((b) => ({
      "Booking ID": b.id,
      "Event Name": b.eventName,
      Faculty: b.facultyName,
      Department: b.department,
      "Target Room": b.roomName,
      Date: b.date,
      "Start Time": b.startTime,
      "End Time": b.endTime,
      Participants: b.participants,
      Status: b.status,
      "Admin Remarks": b.adminRemarks
    }));

    const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(workbook, bookingsSheet, "All Booking Records");

    XLSX.writeFile(workbook, `Campus_Booking_Database_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={26} /> Analytics & Reports Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track infrastructure room usage efficiency, department demand, and generate exportable reports.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
          >
            <FileText size={16} /> Export PDF Report
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <FileSpreadsheet size={16} /> Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block">Total Booking Demands</span>
          <div className="text-3xl font-black text-white mt-1">{analytics.totalBookingsCount}</div>
          <span className="text-[11px] text-cyan-400 font-medium mt-1 block"> Across all 5 infrastructure spaces</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block">Approved Reservations</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">{analytics.approvedCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active permitted campus events</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block">Most Used Infrastructure</span>
          <div className="text-xl font-bold text-cyan-300 truncate mt-1">{mostUsed?.roomName || "N/A"}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{mostUsed?.totalHours || 0} Hours Scheduled</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block">Least Used Infrastructure</span>
          <div className="text-xl font-bold text-amber-300 truncate mt-1">{leastUsed?.roomName || "N/A"}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{leastUsed?.totalHours || 0} Hours Scheduled</span>
        </div>
      </div>

      {/* Visual Chart Bars: Room Utilization Rates */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={18} /> Room Usage & Utilization Rate (%)
        </h3>

        <div className="space-y-4 pt-2">
          {roomStats.map((stat) => (
            <div key={stat.roomId} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">{stat.roomName} ({stat.capacity} Seats)</span>
                <span className="text-cyan-400 font-mono">{stat.totalHours} hrs ({stat.utilizationRate}%)</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(5, stat.utilizationRate)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <PieChart size={18} /> Department-wise Booking Demand
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(deptMap).map(([dept, count]) => (
            <div key={dept} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <strong className="text-slate-200 text-xs block">{dept}</strong>
                <span className="text-[11px] text-slate-400">Demand Share</span>
              </div>
              <span className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-300 font-bold text-sm flex items-center justify-center border border-cyan-500/40">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
