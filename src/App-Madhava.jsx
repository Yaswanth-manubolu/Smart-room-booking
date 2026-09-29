import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import RoomVisualizer3D from "./components/3D/RoomVisualizer3D";
import AvailabilityChecker from "./components/Availability/AvailabilityChecker";
import BookingForm from "./components/Booking/BookingForm";
import CalendarView from "./components/Calendar/CalendarView";
import AdminApprovals from "./components/Approvals/AdminApprovals";
import RoomListAdmin from "./components/RoomManagement/RoomListAdmin";
import ReportsDashboard from "./components/Analytics/ReportsDashboard";
import NotificationPanel from "./components/Notifications/NotificationPanel";
import QRTicketModal from "./components/Notifications/QRTicketModal";
import AuthModal from "./components/Auth/AuthModal";
import { api } from "./services/api";
import { storage } from "./utils/storage";

export default function App() {
  const [activeTab, setActiveTab] = useState("3d-map");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(storage.getUser());
  
  // Modals & Navigation state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [qrModalBooking, setQrModalBooking] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingTargetRoom, setBookingTargetRoom] = useState(null);
  const [bookingTargetDate, setBookingTargetDate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [roomsData, bookingsData] = await Promise.all([
        api.getRooms(),
        api.getBookings()
      ]);
      setRooms(roomsData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      console.warn("Failed to load initial data", err);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      const notifs = await api.getNotifications(userId);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn("Failed to load notifications", err);
    }
  };

  const handleLogout = () => {
    storage.clearToken();
    storage.clearUser();
    setUser(null);
    setActiveTab("3d-map");
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    if (authUser.id) loadNotifications(authUser.id);
  };

  const handleStartBookingForRoom = (room, date = null) => {
    setBookingTargetRoom(room);
    if (date) setBookingTargetDate(date);
    setActiveTab("booking");
  };

  const handleQuickBook = () => {
    setBookingTargetRoom(null);
    setActiveTab("booking");
  };

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadNotifs}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onQuickBook={handleQuickBook}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === "3d-map" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                  3D Interactive Campus Visualizer
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time 3D spatial view of halls, interactive booking inspection, and dynamic occupancy simulation.
                </p>
              </div>
            </div>

            <RoomVisualizer3D
              rooms={rooms}
              bookings={bookings}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
              onBookRoom={(room) => handleStartBookingForRoom(room)}
              user={user}
            />
          </div>
        )}

        {activeTab === "availability" && (
          <AvailabilityChecker
            rooms={rooms}
            bookings={bookings}
            onSelectRoomToBook={(room, date) => handleStartBookingForRoom(room, date)}
          />
        )}

        {activeTab === "booking" && (
          <BookingForm
            rooms={rooms}
            bookings={bookings}
            initialRoom={bookingTargetRoom}
            initialDate={bookingTargetDate}
            user={user}
            onBookingCreated={() => {
              loadData();
              if (user?.id) loadNotifications(user.id);
            }}
            onViewQRTicket={(bkg) => setQrModalBooking(bkg)}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView
            rooms={rooms}
            bookings={bookings}
            onViewQRTicket={(bkg) => setQrModalBooking(bkg)}
          />
        )}

        {activeTab === "approvals" && user?.role === "Administrator" && (
          <AdminApprovals
            bookings={bookings}
            onRefresh={loadData}
            onViewQRTicket={(bkg) => setQrModalBooking(bkg)}
          />
        )}

        {activeTab === "rooms-admin" && user?.role === "Administrator" && (
          <RoomListAdmin
            rooms={rooms}
            onRefresh={loadData}
          />
        )}

        {activeTab === "analytics" && (
          <ReportsDashboard
            rooms={rooms}
            bookings={bookings}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Room Booking 3D • Multi-Tier Campus Infrastructure Suite</span>
          <span>Powered by React, Three.js, MySQL & Tailwind CSS</span>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <NotificationPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={() => user?.id && loadNotifications(user.id)}
      />

      <QRTicketModal
        isOpen={!!qrModalBooking}
        onClose={() => setQrModalBooking(null)}
        booking={qrModalBooking}
      />

    </div>
  );
}
