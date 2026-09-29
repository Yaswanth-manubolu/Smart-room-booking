export const INITIAL_ROOMS = [
  {
    id: "ROOM_HALL_A",
    name: "Seminar Hall A",
    code: "SHA-101",
    building: "Block A - Ground Floor",
    capacity: 120,
    facilities: ["HD Projector", "Centralized AC", "Dolby Audio", "High-speed Wi-Fi", "Podium"],
    status: "Available",
    type: "Seminar Hall",
    description: "Spacious tiered seminar hall suitable for department lectures, guest talks, and interactive workshops.",
    position: { x: -9, y: 0, z: -4.5 },
    dimensions: { width: 4.5, height: 2.5, depth: 4 },
    color: "#10b981",
    maintenance_reason: "",
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
    position: { x: -3, y: 0, z: -4.5 },
    dimensions: { width: 4, height: 2.5, depth: 3.5 },
    color: "#3b82f6",
    maintenance_reason: "",
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
    position: { x: 3, y: 0, z: -4.5 },
    dimensions: { width: 3.8, height: 2.5, depth: 3.2 },
    color: "#6b7280",
    maintenance_reason: "Projector lens calibration & audio wiring upgrades",
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
    position: { x: 9, y: 0, z: -4.5 },
    dimensions: { width: 4.2, height: 2.5, depth: 3.8 },
    color: "#8b5cf6",
    maintenance_reason: "",
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
    position: { x: 0, y: 0, z: 4.5 },
    dimensions: { width: 7, height: 3.5, depth: 6 },
    color: "#f59e0b",
    maintenance_reason: "",
    floor: "Ground & Balcony"
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: "BKG_DEMO_01",
    room_id: "ROOM_HALL_A",
    room_name: "Seminar Hall A",
    user_id: "USR_FAC_01",
    faculty_name: "Dr. Ramesh Kumar",
    department: "Computer Science & Engineering",
    event_name: "AI & Machine Learning Symposium",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:30",
    end_time: "12:30",
    participants: 95,
    purpose: "Keynote presentation by industry leaders and research paper reviews.",
    equipment: ["HD Projector", "Dolby Audio", "Lapel Microphones"],
    status: "Approved",
    admin_remarks: "Approved. Audio technicians will assist at 9:00 AM.",
    qr_code_data: JSON.stringify({
      bookingId: "BKG_DEMO_01",
      room: "Seminar Hall A",
      event: "AI & Machine Learning Symposium",
      date: new Date().toISOString().split("T")[0],
      time: "09:30 - 12:30"
    }),
    created_at: new Date().toISOString()
  },
  {
    id: "BKG_DEMO_02",
    room_id: "ROOM_HALL_B",
    room_name: "Seminar Hall B",
    user_id: "USR_FAC_02",
    faculty_name: "Prof. Priya Sharma",
    department: "Electronics & Communication",
    event_name: "VLSI Circuit Design Workshop",
    date: new Date().toISOString().split("T")[0],
    start_time: "14:00",
    end_time: "17:00",
    participants: 60,
    purpose: "Hands-on FPGA development and simulation training for final year students.",
    equipment: ["HD Projector", "Wireless Mics"],
    status: "Pending",
    admin_remarks: "",
    qr_code_data: JSON.stringify({
      bookingId: "BKG_DEMO_02",
      room: "Seminar Hall B",
      event: "VLSI Circuit Design Workshop",
      date: new Date().toISOString().split("T")[0],
      time: "14:00 - 17:00"
    }),
    created_at: new Date().toISOString()
  }
];

export const DEMO_USERS = {
  faculty: {
    id: "USR_FAC_DEMO",
    name: "Dr. Ananya Reddy",
    email: "faculty@mits.ac.in",
    department: "Computer Science & Engineering",
    phone: "+91 98765 43210",
    role: "Faculty"
  },
  admin: {
    id: "USR_ADMIN_01",
    name: "System Administrator",
    email: "admin@gmail.com",
    department: "Infrastructure & Campus Admin",
    phone: "+91 98888 77777",
    role: "Administrator"
  }
};
