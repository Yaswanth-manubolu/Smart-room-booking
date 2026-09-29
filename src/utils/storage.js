// Local Storage & State Management Utility

import { INITIAL_ROOMS, INITIAL_FACULTY, INITIAL_BOOKINGS, INITIAL_NOTIFICATIONS } from "../data/mockData";

const STORAGE_KEYS = {
  ROOMS: "smart_room_booking_rooms_v1",
  BOOKINGS: "smart_room_booking_bookings_v1",
  FACULTY: "smart_room_booking_faculty_v1",
  NOTIFICATIONS: "smart_room_booking_notifs_v1",
  CURRENT_USER: "smart_room_booking_user_v1"
};

export const getStoredData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error("Error reading LocalStorage key:", key, e);
    return fallback;
  }
};

export const setStoredData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error writing LocalStorage key:", key, e);
  }
};

export const loadInitialState = () => {
  const rooms = getStoredData(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
  const bookings = getStoredData(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  const faculty = getStoredData(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
  const notifications = getStoredData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const currentUser = getStoredData(STORAGE_KEYS.CURRENT_USER, INITIAL_FACULTY[0]);

  // Ensure storage is seeded
  setStoredData(STORAGE_KEYS.ROOMS, rooms);
  setStoredData(STORAGE_KEYS.BOOKINGS, bookings);
  setStoredData(STORAGE_KEYS.FACULTY, faculty);
  setStoredData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  setStoredData(STORAGE_KEYS.CURRENT_USER, currentUser);

  return { rooms, bookings, faculty, notifications, currentUser };
};

export const resetToDefaults = () => {
  localStorage.removeItem(STORAGE_KEYS.ROOMS);
  localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  localStorage.removeItem(STORAGE_KEYS.FACULTY);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  return loadInitialState();
};
