import { INITIAL_ROOMS, INITIAL_BOOKINGS, DEMO_USERS } from "../data/mockData";
import { storage } from "../utils/storage";

const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const token = storage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[API] Remote call to ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      return await request("/health");
    } catch {
      return { status: "fallback", database: "disconnected" };
    }
  },

  // Auth
  login: async (email, password) => {
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        storage.setToken(data.token);
        storage.setUser(data.user);
      }
      return data;
    } catch (err) {
      // Fallback demo logins if backend is offline
      if (email === "admin@gmail.com") {
        const demo = { token: "demo-admin-jwt", user: DEMO_USERS.admin };
        storage.setToken(demo.token);
        storage.setUser(demo.user);
        return demo;
      } else {
        const demo = { token: "demo-faculty-jwt", user: { ...DEMO_USERS.faculty, email } };
        storage.setToken(demo.token);
        storage.setUser(demo.user);
        return demo;
      }
    }
  },

  register: async (userData) => {
    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
      if (data.token) {
        storage.setToken(data.token);
        storage.setUser(data.user);
      }
      return data;
    } catch (err) {
      // Offline fallback
      const newUser = {
        id: "USR_" + Date.now(),
        name: userData.name,
        email: userData.email,
        department: userData.department,
        role: userData.role || "Faculty",
        phone: userData.phone || ""
      };
      const demo = { token: "demo-registered-jwt", user: newUser };
      storage.setToken(demo.token);
      storage.setUser(demo.user);
      return demo;
    }
  },

  getProfile: async () => {
    try {
      return await request("/auth/me");
    } catch {
      return storage.getUser();
    }
  },

  // Rooms
  getRooms: async () => {
    try {
      const rooms = await request("/rooms");
      storage.setLocalRooms(rooms);
      return rooms;
    } catch {
      return storage.getLocalRooms() || INITIAL_ROOMS;
    }
  },

  createRoom: async (roomData) => {
    try {
      return await request("/rooms", {
        method: "POST",
        body: JSON.stringify(roomData)
      });
    } catch {
      const local = storage.getLocalRooms() || INITIAL_ROOMS;
      const newRoom = { ...roomData, id: "ROOM_" + Date.now(), status: "Available" };
      local.push(newRoom);
      storage.setLocalRooms(local);
      return { message: "Room saved locally", roomId: newRoom.id };
    }
  },

  updateRoom: async (id, roomData) => {
    try {
      return await request(`/rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(roomData)
      });
    } catch {
      const local = storage.getLocalRooms() || INITIAL_ROOMS;
      const index = local.findIndex(r => r.id === id);
      if (index !== -1) local[index] = { ...local[index], ...roomData };
      storage.setLocalRooms(local);
      return { message: "Room updated locally" };
    }
  },

  updateRoomStatus: async (id, status, maintenanceReason = "") => {
    try {
      return await request(`/rooms/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, maintenance_reason: maintenanceReason })
      });
    } catch {
      const local = storage.getLocalRooms() || INITIAL_ROOMS;
      const index = local.findIndex(r => r.id === id);
      if (index !== -1) {
        local[index].status = status;
        local[index].maintenance_reason = maintenanceReason;
      }
      storage.setLocalRooms(local);
      return { message: "Status updated locally" };
    }
  },

  deleteRoom: async (id) => {
    try {
      return await request(`/rooms/${id}`, { method: "DELETE" });
    } catch {
      let local = storage.getLocalRooms() || INITIAL_ROOMS;
      local = local.filter(r => r.id !== id);
      storage.setLocalRooms(local);
      return { message: "Room deleted locally" };
    }
  },

  // Bookings
  getBookings: async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const bookings = await request(`/bookings${query ? `?${query}` : ""}`);
      storage.setLocalBookings(bookings);
      return bookings;
    } catch {
      return storage.getLocalBookings() || INITIAL_BOOKINGS;
    }
  },

  createBooking: async (bookingData) => {
    try {
      return await request("/bookings", {
        method: "POST",
        body: JSON.stringify(bookingData)
      });
    } catch (err) {
      if (err.message && err.message.includes("conflict")) {
        throw err;
      }
      const local = storage.getLocalBookings() || INITIAL_BOOKINGS;
      const newBkg = {
        ...bookingData,
        id: "BKG_" + Date.now(),
        status: "Pending",
        created_at: new Date().toISOString(),
        qr_code_data: JSON.stringify({
          bookingId: "BKG_" + Date.now(),
          room: bookingData.room_name,
          event: bookingData.event_name,
          date: bookingData.date,
          time: `${bookingData.start_time} - ${bookingData.end_time}`
        })
      };
      local.push(newBkg);
      storage.setLocalBookings(local);
      return { message: "Booking created locally", bookingId: newBkg.id, status: "Pending" };
    }
  },

  updateBookingStatus: async (id, status, adminRemarks = "") => {
    try {
      return await request(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, admin_remarks: adminRemarks })
      });
    } catch {
      const local = storage.getLocalBookings() || INITIAL_BOOKINGS;
      const index = local.findIndex(b => b.id === id);
      if (index !== -1) {
        local[index].status = status;
        local[index].admin_remarks = adminRemarks;
      }
      storage.setLocalBookings(local);
      return { message: `Booking ${status}` };
    }
  },

  deleteBooking: async (id) => {
    try {
      return await request(`/bookings/${id}`, { method: "DELETE" });
    } catch {
      let local = storage.getLocalBookings() || INITIAL_BOOKINGS;
      local = local.filter(b => b.id !== id);
      storage.setLocalBookings(local);
      return { message: "Booking deleted locally" };
    }
  },

  // Notifications
  getNotifications: async (userId) => {
    try {
      return await request(`/notifications/${userId}`);
    } catch {
      return [
        {
          id: "NTF_01",
          title: "System Ready",
          message: "Welcome to the Smart Room Booking 3D Portal.",
          type: "info",
          is_read: 0,
          created_at: new Date().toISOString()
        }
      ];
    }
  },

  markNotificationRead: async (id) => {
    try {
      return await request(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      return { message: "Marked as read" };
    }
  },

  // Analytics
  getAnalytics: async () => {
    try {
      return await request("/analytics/stats");
    } catch {
      return {
        summary: { totalRooms: 5, totalUsers: 8, totalBookings: 12 },
        statusBreakdown: [{ status: "Approved", count: 8 }, { status: "Pending", count: 3 }, { status: "Rejected", count: 1 }],
        departmentBreakdown: [
          { department: "Computer Science", count: 6 },
          { department: "Electronics & Comm", count: 4 },
          { department: "Mechanical Eng", count: 2 }
        ],
        popularRooms: [
          { room_name: "Seminar Hall A", count: 5 },
          { room_name: "Main Auditorium", count: 4 }
        ]
      };
    }
  }
};
