import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, Printer, X, Award, CheckCircle, MapPin, Calendar, Clock, User, ShieldCheck } from "lucide-react";

export default function QRTicketModal({ booking, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (booking && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        booking.qrCodeData || booking.id,
        { width: 160, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } },
        (error) => {
          if (error) console.error("Error generating QR Code:", error);
        }
      );
    }
  }, [booking]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/50 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition"
        >
          <X size={18} />
        </button>

        {/* Header Pass Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-[11px]">
            <CheckCircle size={14} /> OFFICIAL EVENT PERMIT & PASS
          </div>
          <h3 className="text-xl font-black text-white">{booking.eventName}</h3>
          <span className="text-xs font-mono text-cyan-400 font-bold">Pass ID: {booking.id}</span>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/50 border border-slate-800 rounded-2xl p-5 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Assigned Hall</span>
              <span className="text-sm font-black text-cyan-300">{booking.roomName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Department</span>
              <span className="text-xs font-bold text-slate-200">{booking.department}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
              <span className="font-bold text-slate-100">{booking.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Time Window</span>
              <span className="font-mono font-bold text-amber-400">{booking.startTime} - {booking.endTime}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Lead</span>
              <span className="font-bold text-slate-200">{booking.facultyName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Size</span>
              <span className="font-bold text-slate-200">{booking.participants} Attendees</span>
            </div>
          </div>

          {/* QR Code Canvas Container */}
          <div className="flex flex-col items-center justify-center pt-3 border-t border-slate-800/80">
            <div className="p-2.5 bg-white rounded-2xl shadow-lg border-2 border-cyan-500">
              <canvas ref={canvasRef} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              Scan at Security & Estate Gate for Verification
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer size={16} /> Print Pass
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
}
