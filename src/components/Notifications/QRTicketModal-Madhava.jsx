import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, Download, Ticket, CheckCircle, Calendar, Clock, Building2, User, ShieldCheck } from "lucide-react";

export default function QRTicketModal({
  isOpen,
  onClose,
  booking
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const printRef = useRef(null);

  useEffect(() => {
    if (booking) {
      const payload = booking.qr_code_data || JSON.stringify({
        id: booking.id,
        room: booking.room_name,
        event: booking.event_name,
        date: booking.date,
        time: `${booking.start_time} - ${booking.end_time}`,
        faculty: booking.faculty_name
      });

      QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Ticket Container */}
        <div id="printable-ticket" ref={printRef} className="space-y-4">
          
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-2">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-white tracking-tight">
              Campus Gate & Room Pass
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Official Reservation Clearance • Smart Room 3D
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 shadow-inner">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Pass" className="w-44 h-44 rounded-lg object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                Generating QR Pass...
              </div>
            )}
            <div className="text-[10px] font-mono font-bold text-slate-600 mt-2">
              PASS ID: {booking.id}
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5 text-xs">
            <div className="flex justify-between items-start">
              <span className="text-slate-400">Event:</span>
              <span className="font-bold text-white text-right max-w-[200px]">{booking.event_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Room / Hall:</span>
              <span className="font-bold text-indigo-300">{booking.room_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Faculty Coordinator:</span>
              <span className="text-slate-200">{booking.faculty_name} ({booking.department})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="font-mono text-cyan-300">{booking.date} ({booking.start_time} - {booking.end_time})</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-700/60">
              <span className="text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                booking.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-300"
              }`}>
                {booking.status}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digitally Verified & Approved for Campus Entry</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass / PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
