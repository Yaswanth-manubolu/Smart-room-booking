// Frontend API Service Layer for Express + MySQL Backend

const API_BASE_URL = "/api";;

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json"
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "API Request Failed");
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const apiService = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  requestResetOtp: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) }),
  getUsers: () => request("/users"),

  // Rooms
  getRooms: () => request("/rooms"),
  createRoom: (roomData) => request("/rooms", { method: "POST", body: JSON.stringify(roomData) }),
  updateRoom: (id, roomData) => request(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(roomData) }),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: "DELETE" }),

  // Bookings
  getBookings: () => request("/bookings"),
  createBooking: (bookingData) => request("/bookings", { method: "POST", body: JSON.stringify(bookingData) }),
  updateBookingStatus: (id, status, adminRemarks) =>
    request(`/bookings/${id}/status`, { method: "PUT", body: JSON.stringify({ status, adminRemarks }) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: "DELETE" }),

  // Notifications
  getNotifications: (userId) => request(`/notifications/${userId}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: (userId) => request(`/notifications/user/${userId}/read-all`, { method: "PUT" }),
  clearNotifications: (userId) => request(`/notifications/user/${userId}`, { method: "DELETE" })
};
