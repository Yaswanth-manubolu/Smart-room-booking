import React from "react";
import {
  Box,
  Calendar,
  Clock,
  PlusCircle,
  CheckSquare,
  BarChart3,
  Settings,
  Bell,
  User,
  Shield,
  LogOut,
  Sparkles,
  LogIn,
  UserPlus
} from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuthModal,
  notifications,
  onOpenNotifications,
  pendingCount
}) {
  const unreadNotifs = currentUser
    ? notifications.filter((n) => n.user_id === currentUser.id && !n.is_read).length
    : 0;

  const isAdmin = currentUser?.role === "Administrator";

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab("3d-view")}
            title="MITS 3D Campus System"
          >
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <img src="/mits_logo.png" alt="MITS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-black text-white tracking-wide group-hover:text-cyan-300 transition">
                MITS Smart
              </span>
              <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                Room Booking
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("3d-view")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "3d-view"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles size={15} /> 3D Floorplan
            </button>

            <button
              onClick={() => setActiveTab("availability")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "availability"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Clock size={15} /> Availability Matrix
            </button>

            <button
              onClick={() => setActiveTab("book")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "book"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <PlusCircle size={15} /> Book Hall
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "calendar"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Calendar size={15} /> Schedule Calendar
            </button>

            {/* Admin Approvals Queue */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("approvals")}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "approvals"
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "text-amber-400 hover:bg-amber-950/40"
                }`}
              >
                <CheckSquare size={15} /> Approvals Queue
                {pendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin Analytics & Room Admin */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "analytics"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <BarChart3 size={15} /> Reports & Export
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab("room-admin")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "room-admin"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Settings size={15} /> Room Mgmt
              </button>
            )}
          </nav>

          {/* Right Action Menu: Auth & Notifications */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-cyan-400/50"
                  />
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-100 leading-tight">
                      {currentUser.name}
                    </span>
                    <span
                      className={`block text-[10px] font-semibold ${
                        isAdmin ? "text-amber-400" : "text-cyan-400"
                      }`}
                    >
                      {currentUser.role} • {currentUser.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-600/50 text-slate-400 hover:text-rose-300 transition"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
              >
                <LogIn size={15} /> Sign In / Register
              </button>
            )}
          </div>
        </div>

        {/* Mobile / tablet menu (the main menu above is hidden on small screens) */}
        <nav className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: "3d-view", label: "3D Floorplan", Icon: Sparkles },
            { id: "availability", label: "Availability", Icon: Clock },
            { id: "book", label: "Book Hall", Icon: PlusCircle },
            { id: "calendar", label: "Calendar", Icon: Calendar },
            ...(isAdmin
              ? [
                  { id: "approvals", label: `Approvals${pendingCount > 0 ? ` (${pendingCount})` : ""}`, Icon: CheckSquare },
                  { id: "analytics", label: "Reports", Icon: BarChart3 },
                  { id: "room-admin", label: "Rooms", Icon: Settings }
                ]
              : [])
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-300"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
