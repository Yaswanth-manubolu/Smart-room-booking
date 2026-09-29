# Smart Room Booking 3D ????

An interactive 3D WebGL and full-stack room booking system for university and campus facilities.

## ? Features

- **3D Spatial Campus Map (Three.js)**: Interactive 3D visualization of seminar halls, classrooms, and auditoriums with orbit controls, realistic lighting, and time-travel occupancy simulation.
- **Conflict Prevention Engine**: Real-time slot collision detection ensuring no double-bookings occur.
- **Live Availability Matrix**: Hour-by-hour availability grid with date and capacity filtering.
- **Admin Approvals & Gate Pass Review**: Approve or reject reservations with custom remarks.
- **Digital QR Gate Pass**: Instant QR-code pass generation with printable PDF passes.
- **Room Infrastructure Management**: CRUD operations for campus rooms with 3D coordinate editing and maintenance mode toggles.
- **Analytics & Reports**: Visual room utilization breakdown with one-click Excel (`xlsx`) and PDF (`jspdf`) export.
- **Full-Stack Architecture**: Express & MySQL backend with JWT authentication and seamless fallback mode.

## ?? Running the Project

### 1. Start Backend API Server
```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:5000`.

### 2. Start Frontend Dev Server
```bash
npm install
npm run dev
```
Runs on `http://localhost:5173`.

### ?? Demo Credentials
- **Admin**: `admin@gmail.com` / `admin@123`
- **Faculty**: `faculty@mits.ac.in` / `faculty@123`
