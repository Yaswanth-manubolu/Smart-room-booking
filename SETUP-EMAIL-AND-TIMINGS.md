# What's new: college-hours booking, working calendar, e-mail notifications

## 1. One-time setup (backend)

```bash
cd backend
npm install            # installs the new dependency: nodemailer
copy .env.example .env # Windows   (Mac/Linux: cp .env.example .env)
```

Open `backend/.env` and fill in the e-mail section:

| Setting        | Meaning                                                                 |
|----------------|-------------------------------------------------------------------------|
| `SMTP_SERVICE` | `gmail` (or remove it and use `SMTP_HOST` / `SMTP_PORT` for other mail servers) |
| `SMTP_USER`    | the mailbox that SENDS the notifications                                |
| `SMTP_PASS`    | Gmail **App password** (Google Account → Security → 2-Step Verification → App passwords) |
| `ADMIN_EMAIL`  | mailbox(es) that receive the admin e-mails (comma separated). If empty, all users with the Administrator role are used – the seeded admin is `admin@gmail.com`, so set a real address here |

Start the backend (`node server.js`). The console prints either
`📧 E-mail: SMTP ready` or a clear error. Until SMTP is configured, the e-mails are
printed in the backend console instead, so nothing breaks.

Then start the frontend as usual (`npm install`, `npm run dev`).

## 2. What happens when someone clicks **Book Room**

1. The server checks: college hours, working day, not in the past, room not under
   maintenance, and **no overlap** with any approved/pending booking.
   If any check fails, nothing is saved and the user sees the reason.
2. The booking is saved as **Pending**.
3. E-mail to the **user**: *"Your request has been sent to the admin. After confirmation,
   your room will be booked."* (with room, date, time, booking id)
4. E-mail to the **admin**: *"Booking request for <room> by <user e-mail> at <time>"*
   (plus event, purpose, participants, equipment, requested slot).
5. When the admin approves / rejects, the user gets a third e-mail with the decision.
6. The same messages also appear in the in-app 🔔 notification panel (user and admin).

## 3. Changing the college timings

Edit **both** files (keep them identical):

* `src/config/collegeTimings.js`   (frontend – pickers, calendar, matrix)
* `backend/config/collegeTimings.js` (backend – the final safety check)

Defaults: **9:00 AM – 5:00 PM, Monday–Saturday** (Sunday closed).

## 4. Files changed / added

Added: `src/config/collegeTimings.js`, `src/components/common/DayTimeline.jsx`,
`backend/config/collegeTimings.js`, `backend/services/mailer.js`, `backend/.env.example`

Changed: `src/components/Calendar/CalendarView.jsx` (rewritten),
`src/components/Booking/BookingForm.jsx`, `src/components/Availability/AvailabilityChecker.jsx`,
`src/components/Notifications/NotificationPanel.jsx`, `src/components/Navbar.jsx`,
`src/App.jsx`, `src/utils/conflictDetector.js`, `src/components/Booking/ConflictModal.jsx`,
`backend/routes/api.js`, `backend/server.js`, `backend/package.json`, `.gitignore`

The `*-Madhava.*` files were left untouched (they are not imported by the app).
