// Smart Room Booking and Availability System - Mock Dataset

export const INITIAL_ROOMS = [
  {
    id: "ROOM_HALL_A",
    name: "Seminar Hall A",
    code: "SHA-101",
    building: "Block A - Ground Floor",
    capacity: 120,
    facilities: ["HD Projector", "Centralized AC", "Dolby Audio", "High-speed Wi-Fi", "Podium"],
    status: "Available", // Available, Booked, Pending, Maintenance
    type: "Seminar Hall",
    description: "Spacious tiered seminar hall suitable for department lectures, guest talks, and interactive workshops.",
    position: { x: -6, y: 0, z: -4 },
    dimensions: { width: 4.5, height: 2.5, depth: 4 },
    color: "#10b981", // Emerald
    maintenanceReason: "",
    hourlyRate: "Free (Academic)",
    floor: "Ground Floor"
  },
  {
    id: "ROOM_HALL_B",
    name: "Seminar Hall B",
    code: "SHB-102",
    building: "Block A - First Floor",
    capacity: 80,
    facilities: ["HD Projector", "Wireless Mics", "Standard AC", "Whiteboard"],
    status: "Available",
    type: "Seminar Hall",
    description: "Compact modern hall optimized for small seminars, faculty discussions, and technical tutorials.",
    position: { x: 0, y: 0, z: -4 },
    dimensions: { width: 4, height: 2.5, depth: 3.5 },
    color: "#3b82f6", // Blue
    maintenanceReason: "",
    hourlyRate: "Free (Academic)",
    floor: "1st Floor"
  },
  {
    id: "ROOM_HALL_C",
    name: "Seminar Hall C",
    code: "SHC-201",
    building: "Block B - Ground Floor",
    capacity: 60,
    facilities: ["Interactive Smart Board", "Video Conferencing Camera", "AC", "Surround Sound"],
    status: "Maintenance",
    type: "Smart Classroom / Hall",
    description: "High-tech smart hall with interactive digital boards and video call studio integration.",
    position: { x: 6, y: 0, z: -4 },
    dimensions: { width: 3.8, height: 2.5, depth: 3.2 },
    color: "#6b7280", // Gray for maintenance
    maintenanceReason: "Projector lens calibration & audio wiring upgrades",
    hourlyRate: "Free (Academic)",
    floor: "Ground Floor"
  },
  {
    id: "ROOM_HALL_D",
    name: "Seminar Hall D",
    code: "SHD-202",
    building: "Block B - Second Floor",
    capacity: 100,
    facilities: ["Centralized AC", "Dual Screen Projection", "Wireless Microphones", "Podium Screen"],
    status: "Available",
    type: "Seminar Hall",
    description: "Versatile medium hall featuring dual projection screens and high-capacity acoustic treatment.",
    position: { x: -6, y: 0, z: 4 },
    dimensions: { width: 4.2, height: 2.5, depth: 3.8 },
    color: "#8b5cf6", // Purple
    maintenanceReason: "",
    hourlyRate: "Free (Academic)",
    floor: "2nd Floor"
  },
  {
    id: "ROOM_AUDITORIUM",
    name: "Main Auditorium",
    code: "AUD-001",
    building: "Central Cultural Complex",
    capacity: 500,
    facilities: ["Concert Sound System", "Grand Theater Stage", "Green Rooms", "Stage Spotlight System", "Live Streaming Suite", "Central AC"],
    status: "Available",
    type: "Auditorium",
    description: "Flagship multi-tier auditorium for university convocations, national conferences, cultural galas, and annual summits.",
    position: { x: 2, y: 0, z: 4 },
    dimensions: { width: 7, height: 3.5, depth: 6 },
    color: "#f59e0b", // Amber / Gold
    maintenanceReason: "",
    hourlyRate: "Free (Academic)",
    floor: "Ground & Balcony"
  }
];

export const INITIAL_FACULTY = [
  {
    id: "FAC_CSE_01",
    name: "Dr. Sarah Jenkins",
    department: "Computer Science & Engineering",
    email: "s.jenkins@college.edu",
    role: "Faculty",
    phone: "+1 (555) 019-2831",
    designation: "Professor & HOD",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "FAC_ECE_02",
    name: "Prof. Alan Turing",
    department: "Electronics & Communication",
    email: "a.turing@college.edu",
    role: "Faculty",
    phone: "+1 (555) 014-9982",
    designation: "Associate Professor",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "FAC_ME_03",
    name: "Dr. Marie Curie",
    department: "Mechanical & Physics Dept",
    email: "m.curie@college.edu",
    role: "Faculty",
    phone: "+1 (555) 018-3490",
    designation: "Senior Researcher",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "FAC_ADMIN_01",
    name: "Estate Infrastructure Admin",
    department: "Administration & Facilities",
    email: "admin.estate@college.edu",
    role: "Administrator",
    phone: "+1 (555) 010-0000",
    designation: "Chief Infrastructure Officer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  }
];

// Today's date string helper YYYY-MM-DD
const today = new Date();
export const formatDateStr = (offsetDays = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

export const INITIAL_BOOKINGS = [
  {
    id: "BOK-2026-001",
    roomId: "ROOM_HALL_A",
    roomName: "Seminar Hall A",
    facultyId: "FAC_CSE_01",
    facultyName: "Dr. Sarah Jenkins",
    department: "Computer Science & Engineering",
    eventName: "AI & Machine Learning National Symposium",
    date: formatDateStr(0), // Today
    startTime: "09:00",
    endTime: "12:00",
    participants: 110,
    purpose: "Keynote lectures and research paper presentations by visiting professors.",
    equipment: ["HD Projector", "Wireless Microphones (Pair)", "Centralized AC System", "Executive Digital Podium"],
    status: "Approved",
    adminRemarks: "Approved by Estate Admin. Technical team assigned for sound check at 8:30 AM.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    qrCodeData: "BOK-2026-001|ROOM_HALL_A|2026-07-24|09:00|Dr. Sarah Jenkins"
  },
  {
    id: "BOK-2026-002",
    roomId: "ROOM_HALL_B",
    roomName: "Seminar Hall B",
    facultyId: "FAC_ECE_02",
    facultyName: "Prof. Alan Turing",
    department: "Electronics & Communication",
    eventName: "VLSI Circuit Design Hands-on Workshop",
    date: formatDateStr(0), // Today
    startTime: "14:00",
    endTime: "17:00",
    participants: 75,
    purpose: "Student lab demonstration using FPGA development kits.",
    equipment: ["HD Projector & Screen", "Interactive Smart Board", "Centralized AC System"],
    status: "Approved",
    adminRemarks: "Approved. Extra power outlets requested have been arranged.",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    qrCodeData: "BOK-2026-002|ROOM_HALL_B|2026-07-24|14:00|Prof. Alan Turing"
  },
  {
    id: "BOK-2026-003",
    roomId: "ROOM_AUDITORIUM",
    roomName: "Main Auditorium",
    facultyId: "FAC_ME_03",
    facultyName: "Dr. Marie Curie",
    department: "Mechanical & Physics Dept",
    eventName: "Annual Quantum Energy Summit - Rehearsal",
    date: formatDateStr(1), // Tomorrow
    startTime: "10:00",
    endTime: "15:00",
    participants: 350,
    purpose: "Full stage trial, lighting synchronization, and guest choir practice.",
    equipment: ["Concert Sound System", "Stage Spotlight System", "Centralized AC System"],
    status: "Pending",
    adminRemarks: "",
    createdAt: new Date().toISOString(),
    qrCodeData: "BOK-2026-003|ROOM_AUDITORIUM|2026-07-25|10:00|Dr. Marie Curie"
  },
  {
    id: "BOK-2026-004",
    roomId: "ROOM_HALL_D",
    roomName: "Seminar Hall D",
    facultyId: "FAC_CSE_01",
    facultyName: "Dr. Sarah Jenkins",
    department: "Computer Science & Engineering",
    eventName: "Cyber Security Hackathon Briefing",
    date: formatDateStr(2),
    startTime: "11:00",
    endTime: "13:00",
    participants: 90,
    purpose: "Orientation session for undergraduate hackathon teams.",
    equipment: ["Centralized AC System", "Dual Screen Projection"],
    status: "Approved",
    adminRemarks: "Approved.",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    qrCodeData: "BOK-2026-004|ROOM_HALL_D|2026-07-26|11:00|Dr. Sarah Jenkins"
  },
  {
    id: "BOK-2026-005",
    roomId: "ROOM_HALL_A",
    roomName: "Seminar Hall A",
    facultyId: "FAC_ECE_02",
    facultyName: "Prof. Alan Turing",
    department: "Electronics & Communication",
    eventName: "Robotics & Automation Society Meet",
    date: formatDateStr(-1), // Yesterday
    startTime: "15:00",
    endTime: "17:00",
    participants: 95,
    purpose: "Monthly society updates and project showcase.",
    equipment: ["HD Projector & Screen", "Dolby Surround Audio"],
    status: "Approved",
    adminRemarks: "Completed.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    qrCodeData: "BOK-2026-005|ROOM_HALL_A|2026-07-23|15:00|Prof. Alan Turing"
  },
  {
    id: "BOK-2026-006",
    roomId: "ROOM_HALL_B",
    roomName: "Seminar Hall B",
    facultyId: "FAC_ME_03",
    facultyName: "Dr. Marie Curie",
    department: "Mechanical & Physics Dept",
    eventName: "Fluid Dynamics Guest Lecture",
    date: formatDateStr(3),
    startTime: "10:00",
    endTime: "12:00",
    participants: 70,
    purpose: "Guest speaker lecture from MIT Research Lab.",
    equipment: ["HD Projector & Screen", "Wireless Microphones (Pair)"],
    status: "Pending",
    adminRemarks: "",
    createdAt: new Date().toISOString(),
    qrCodeData: "BOK-2026-006|ROOM_HALL_B|2026-07-27|10:00|Dr. Marie Curie"
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-01",
    facultyId: "FAC_CSE_01",
    title: "Booking Request Approved! 🎉",
    message: "Your booking for Seminar Hall A on 'AI & Machine Learning National Symposium' has been APPROVED by Estate Admin.",
    type: "success",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: false,
    bookingId: "BOK-2026-001"
  },
  {
    id: "NOTIF-02",
    facultyId: "FAC_ECE_02",
    title: "Booking Approved",
    message: "Your request for Seminar Hall B on 'VLSI Circuit Design' was APPROVED.",
    type: "info",
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    read: true,
    bookingId: "BOK-2026-002"
  },
  {
    id: "NOTIF-03",
    facultyId: "FAC_ME_03",
    title: "Pending Approval",
    message: "Your booking for Main Auditorium ('Annual Quantum Energy Summit') is under review by Admin.",
    type: "warning",
    timestamp: new Date().toISOString(),
    read: false,
    bookingId: "BOK-2026-003"
  }
];

export const AVAILABLE_EQUIPMENT = [
  { name: "HD Projector & Screen", category: "Visual", icon: "Tv" },
  { name: "Interactive Smart Board", category: "Visual", icon: "Monitor" },
  { name: "Dual Screen Projection", category: "Visual", icon: "Layers" },
  { name: "Wireless Microphones (Pair)", category: "Audio", icon: "Mic" },
  { name: "Concert Sound System", category: "Audio", icon: "Volume2" },
  { name: "Dolby Surround Audio", category: "Audio", icon: "Speaker" },
  { name: "Stage Spotlight System", category: "Lighting", icon: "Sun" },
  { name: "Video Conferencing Camera", category: "Streaming", icon: "Video" },
  { name: "Centralized AC System", category: "Climate", icon: "Wind" },
  { name: "Executive Digital Podium", category: "Furniture", icon: "Award" }
];
