import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import RoomVisualizer3D from "./components/3D/RoomVisualizer3D";
import AvailabilityChecker from "./components/Availability/AvailabilityChecker";
import BookingForm from "./components/Booking/BookingForm";
import AdminApprovals from "./components/Approvals/AdminApprovals";
import CalendarView from "./components/Calendar/CalendarView";
import RoomListAdmin from "./components/RoomManagement/RoomListAdmin";
import ReportsDashboard from "./components/Analytics/ReportsDashboard";
import NotificationPanel from "./components/Notifications/NotificationPanel";
import AuthModal from "./components/Auth/AuthModal";

import { CheckCircle2, Mail, CalendarDays } from "lucide-react";
import { apiService } from "./services/api";
import { formatTime12, prettyDate } from "./config/collegeTimings";

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("smart_room_user_auth_v2");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("3d-view");
  const [selected3DRoom, setSelected3DRoom] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [dbConnected, setDbConnected] = useState(true);
  const [submittedInfo, setSubmittedInfo] = useState(null); // shown after a booking request is sent

  // Booking prefill state
  const [prefilledBooking, setPrefilledBooking] = useState({
    room: null,
    date: null,
    slot: null
  });

  const showToast = (msg, type = "info") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Fetch initial data from MySQL backend
  const refreshData = async () => {
    try {
      const fetchedRooms = await apiService.getRooms();
      setRooms(fetchedRooms);

      const fetchedBookings = await apiService.getBookings();
      setBookings(fetchedBookings);

      if (currentUser) {
        const userNotifs = await apiService.getNotifications(currentUser.id);
        setNotifications(userNotifs);
      }
      setDbConnected(true);
    } catch (error) {
      console.warn("Backend API not reachable yet. Retrying connection...", error);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Polling every 10 seconds for real-time updates
    return () => clearInterval(interval);
  }, [currentUser]);

  // Auth Action Handlers
  const handleAuthAction = async (mode, credentials) => {
    try {
      let res;
      if (mode === "register") {
        res = await apiService.register(credentials);
      } else {
        res = await apiService.login(credentials.email, credentials.password);
      }

      if (res.user) {
        setCurrentUser(res.user);
        localStorage.setItem("smart_room_user_auth_v2", JSON.stringify(res.user));
        showToast(`Welcome ${res.user.name} (${res.user.role})!`, "success");
        refreshData();
        return { success: true };
      }
    } catch (err) {
      return { error: err.message };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("smart_room_user_auth_v2");
    showToast("Signed out successfully.", "info");
  };

  // Create Booking (server validates college timings + availability and sends the e-mails)
  const handleCreateBooking = async (newBooking) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast("Please sign in or register to book a hall.", "warning");
      return;
    }

    try {
      const res = await apiService.createBooking({
        ...newBooking,
        facultyId: currentUser.id,
        facultyName: currentUser.name,
        department: newBooking.department || currentUser.department
      });

      await refreshData();
      setSubmittedInfo({
        booking: { ...newBooking, id: res.bookingId },
        emailMode: res.emailMode,
        userEmail: currentUser.email
      });
    } catch (error) {
      showToast(error.message || "Failed to submit booking.", "error");
      await refreshData(); // pick up whatever made the slot unavailable
    }
  };

  // Approve / Reject Booking
  const handleApproveBooking = async (bookingId, remarks) => {
    try {
      await apiService.updateBookingStatus(bookingId, "Approved", remarks);
      showToast("Booking APPROVED successfully!", "success");
      await refreshData();
    } catch (error) {
      showToast(error.message || "Failed to approve booking.", "error");
    }
  };

  const handleRejectBooking = async (bookingId, remarks) => {
    try {
      await apiService.updateBookingStatus(bookingId, "Rejected", remarks);
      showToast("Booking request REJECTED.", "warning");
      await refreshData();
    } catch (error) {
      showToast(error.message || "Failed to reject booking.", "error");
    }
  };

  // Room Management (Admin)
  const handleSaveRoom = async (roomData) => {
    try {
      const exists = rooms.some((r) => r.id === roomData.id);
      if (exists) {
        await apiService.updateRoom(roomData.id, roomData);
      } else {
        await apiService.createRoom(roomData);
      }
      showToast(`Room ${roomData.name} saved successfully.`, "success");
      await refreshData();
    } catch (error) {
      showToast("Failed to save room.", "error");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        await apiService.deleteRoom(roomId);
        showToast("Room deleted.", "warning");
        await refreshData();
      } catch (error) {
        showToast("Failed to delete room.", "error");
      }
    }
  };

  const handleUpdateRoomStatus = async (roomId, newStatus, maintenanceReason = "") => {
    try {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      await apiService.updateRoom(roomId, {
        ...room,
        status: newStatus,
        maintenanceReason
      });
      showToast(`Updated ${room.name} status to ${newStatus}.`, "success");
      await refreshData();
    } catch (error) {
      showToast("Failed to update room status.", "error");
    }
  };

  const handleBookFrom3D = (room) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setPrefilledBooking({ room, date: null, slot: null });
    setActiveTab("book");
  };

  const handleBookFromMatrix = (room, date, slot) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setPrefilledBooking({ room, date, slot });
    setActiveTab("book");
  };

  const pendingApprovalsCount = bookings.filter((b) => b.status === "Pending").length;

  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    if (currentUser) {
      setNotifications((prev) =>
        prev.map((n) => (n.user_id === currentUser.id ? { ...n, is_read: 1, isRead: true } : n))
      );
      try {
        await apiService.markAllNotificationsRead(currentUser.id);
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/60 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2 text-xs font-bold">
          <span>✨ {toastMessage.msg}</span>
        </div>
      )}

      <div>
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            // opening "Book Hall" from the menu should start with a clean form
            if (tab === "book") setPrefilledBooking({ room: null, date: null, slot: null });
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuthModal={() => setShowAuthModal(true)}
          notifications={notifications}
          onOpenNotifications={handleOpenNotifications}
          pendingCount={pendingApprovalsCount}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "3d-view" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white tracking-tight">
                  Campus Explorer
                </h1>
              </div>

              <RoomVisualizer3D
                rooms={rooms}
                bookings={bookings}
                selectedRoom={selected3DRoom}
                onSelectRoom={setSelected3DRoom}
                onBookRoom={handleBookFrom3D}
                currentUser={currentUser}
                onUpdateRoomStatus={handleUpdateRoomStatus}
              />
            </div>
          )}

          {activeTab === "availability" && (
            <AvailabilityChecker
              rooms={rooms}
              bookings={bookings}
              onBookSpecificRoom={handleBookFromMatrix}
            />
          )}

          {activeTab === "book" && (
            <BookingForm
              rooms={rooms}
              bookings={bookings}
              currentUser={currentUser || { name: "Guest User", department: "Computer Science", id: "GUEST" }}
              prefilledRoom={prefilledBooking.room}
              prefilledDate={prefilledBooking.date}
              prefilledSlot={prefilledBooking.slot}
              onSubmitBooking={handleCreateBooking}
            />
          )}

          {activeTab === "approvals" && currentUser?.role === "Administrator" && (
            <AdminApprovals
              bookings={bookings}
              rooms={rooms}
              onApproveBooking={handleApproveBooking}
              onRejectBooking={handleRejectBooking}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView
              bookings={bookings}
              rooms={rooms}
              currentUser={currentUser}
              onBookSlot={(room, date) => handleBookFromMatrix(room, date, null)}
            />
          )}

          {activeTab === "analytics" && currentUser?.role === "Administrator" && (
            <ReportsDashboard rooms={rooms} bookings={bookings} />
          )}

          {activeTab === "room-admin" && currentUser?.role === "Administrator" && (
            <RoomListAdmin
              rooms={rooms}
              onSaveRoom={handleSaveRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>MITS Smart Room Booking & Availability System</p>
      </footer>

      {/* Booking request sent confirmation */}
      {submittedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/50 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Booking request sent!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Your request has been sent to the admin. After confirmation, your room will be booked.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between gap-3"><span className="text-slate-400">Room</span><strong className="text-cyan-300 text-right">{submittedInfo.booking.roomName}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Date</span><strong className="text-right">{prettyDate(submittedInfo.booking.date)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Time</span><strong className="text-right font-mono">{formatTime12(submittedInfo.booking.startTime)} – {formatTime12(submittedInfo.booking.endTime)}</strong></div>
              <div className="flex justify-between gap-3"><span className="text-slate-400">Status</span><strong className="text-amber-300">Pending admin approval</strong></div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-start gap-2">
              <Mail size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              {submittedInfo.emailMode === "smtp" ? (
                <span>
                  A confirmation email is on its way to <strong className="text-slate-200">{submittedInfo.userEmail}</strong>, and the admin has been notified by email.
                </span>
              ) : (
                <span>
                  E-mail sending is not configured on the server yet, so no e-mails were sent. Your request is saved and the admin can see it in the approvals queue.
                </span>
              )}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSubmittedInfo(null);
                  setActiveTab("calendar");
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
              >
                <CalendarDays size={14} /> View Schedule
              </button>
              <button
                onClick={() => {
                  setSubmittedInfo(null);
                  setActiveTab("3d-view");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleAuthAction}
      />

      {/* Notification Drawer Panel */}
      {currentUser && (
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          bookings={bookings}
          currentUser={currentUser}
          onMarkRead={async (id) => {
            await apiService.markNotificationRead(id);
            refreshData();
          }}
          onClearNotifications={async () => {
            await apiService.clearNotifications(currentUser.id);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
