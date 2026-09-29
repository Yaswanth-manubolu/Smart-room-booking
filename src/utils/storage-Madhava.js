const TOKEN_KEY = "smart_room_jwt_token";
const USER_KEY = "smart_room_user_profile";
const LOCAL_BOOKINGS_KEY = "smart_room_local_bookings";
const LOCAL_ROOMS_KEY = "smart_room_local_rooms";

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),

  getLocalBookings: () => {
    try {
      const data = localStorage.getItem(LOCAL_BOOKINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setLocalBookings: (b) => localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(b)),

  getLocalRooms: () => {
    try {
      const data = localStorage.getItem(LOCAL_ROOMS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setLocalRooms: (r) => localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(r))
};
