// ---------------------------------------------------------------------------
// E-mail notifications for room bookings.
//
// Configure SMTP in backend/.env (see .env.example). If SMTP is not configured
// (or `nodemailer` has not been installed yet) e-mails are printed to the
// server console instead, so the booking flow never breaks.
// ---------------------------------------------------------------------------

import { getPool } from "../config/db.js";
import { APP_TIMEZONE, formatTime12 } from "../config/collegeTimings.js";

// ------------------------ Resend email setup ------------------------

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

const fromAddress = () => process.env.RESEND_FROM;

export async function verifyMailSetup() {
  if (!isMailConfigured()) {
    console.log(
      "📧 E-mail: Resend not configured. Notifications will be printed in the console."
    );
    return;
  }

  console.log(
    "📧 E-mail: Resend configured. Delivery will be tested when a notification is sent."
  );
}

export async function sendMail({ to, subject, text, html }) {
  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((email) => String(email).trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return { ok: false, error: "no recipient" };
  }

  if (!isMailConfigured()) {
    console.log(
      `\n📧 [E-MAIL NOT SENT – Resend not configured]
   To: ${recipients.join(", ")}
   Subject: ${subject}
   ${String(text || "").split("\n").join("\n   ")}\n`
    );
    return { ok: true, mode: "console" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: recipients,
        subject,
        text,
        html
      }),
      signal: AbortSignal.timeout(15000)
    });

    const result = await response.json();

    if (!response.ok) {
      const message = result.message || `HTTP ${response.status}`;
      console.error("❌ Resend email error:", message);
      return { ok: false, error: message };
    }

    console.log(
      `📧 E-mail accepted by Resend for ${recipients.join(", ")} – ID: ${result.id}`
    );

    return { ok: true, mode: "resend", id: result.id };
  } catch (err) {
    console.error("❌ E-mail request failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// ------------------------ Admin recipients ------------------------

export async function getAdminRecipients() {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  try {
    const [rows] = await getPool().query(
      "SELECT email FROM users WHERE role = 'Administrator'"
    );
    return rows.map((row) => row.email).filter(Boolean);
  } catch {
    return [];
  }
}

// ------------------------ Email templates ------------------------

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
  );

const prettyDate = (dateStr) => {
  const [year, month, day] = String(dateStr)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-IN",
    {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
};

const nowStamp = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: APP_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short"
  });

const APP_URL = () =>
  process.env.APP_URL || "http://localhost:5173";

const layout = (title, accent, bodyHtml) => `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f1f5f9;padding:24px">
  <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:${accent};color:#fff;padding:18px 24px">
      <div style="font-size:12px;letter-spacing:1px;opacity:.85">MITS SMART ROOM BOOKING</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">${esc(title)}</div>
    </div>
    <div style="padding:22px 24px;color:#0f172a;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <div style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:11px">
      This is an automated message from the MITS Smart Room Booking system.
    </div>
  </div>
</div>`;

const detailsTable = (rows) =>
  `<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13px">${rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) =>
        `<tr><td style="padding:7px 10px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;width:34%">${esc(key)}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:600">${esc(value)}</td></tr>`
    )
    .join("")}</table>`;

const slotText = (booking) =>
  `${prettyDate(booking.date)}, ${formatTime12(booking.startTime)} – ${formatTime12(booking.endTime)}`;

// ------------------------ Booking requested: user ------------------------

function requestedToUser(booking, requester) {
  const subject = `Room booking request received – ${booking.roomName}`;

  const text = [
    `Hello ${requester.name},`,
    "",
    "Your request has been sent to the admin. After confirmation, your room will be booked.",
    "",
    `Booking ID : ${booking.id}`,
    `Room       : ${booking.roomName}`,
    `Slot       : ${slotText(booking)}`,
    `Event      : ${booking.eventName}`,
    "Status     : Pending admin approval",
    "",
    "You will receive another e-mail as soon as the admin approves or rejects your request."
  ].join("\n");

  const html = layout(
    "Your booking request has been sent",
    "#0891b2",
    `<p>Hello ${esc(requester.name)},</p>
     <p><strong>Your request has been sent to the admin. After confirmation, your room will be booked.</strong></p>
     ${detailsTable([
       ["Booking ID", booking.id],
       ["Room", booking.roomName],
       ["Date & time", slotText(booking)],
       ["Event", booking.eventName],
       ["Status", "Pending admin approval"]
     ])}
     <p style="color:#475569">
       You will get another e-mail as soon as the admin approves or rejects your request.
     </p>`
  );

  return { subject, text, html };
}

// ------------------------ Booking requested: admin ------------------------

function requestedToAdmin(booking, requester) {
  const subject =
    `New booking request: ${booking.roomName} by ${requester.email}`;

  const text = [
    `Booking request for ${booking.roomName} by ${requester.email} at ${nowStamp()}.`,
    "",
    `Requested by : ${requester.name} <${requester.email}>`,
    `Department   : ${booking.department}`,
    `Room         : ${booking.roomName}`,
    `Slot         : ${slotText(booking)}`,
    `Event        : ${booking.eventName}`,
    `Participants : ${booking.participants}`,
    `Purpose      : ${booking.purpose}`,
    `Equipment    : ${(booking.equipment || []).join(", ") || "-"}`,
    `Booking ID   : ${booking.id}`,
    "",
    `Please review it in the Approvals Queue: ${APP_URL()}`
  ].join("\n");

  const html = layout(
    "New room booking request",
    "#d97706",
    `<p>
       The booking request for <strong>${esc(booking.roomName)}</strong>
       was made by <strong>${esc(requester.email)}</strong>
       at <strong>${esc(nowStamp())}</strong>.
     </p>
     ${detailsTable([
       ["Requested by", `${requester.name} (${requester.email})`],
       ["Department", booking.department],
       ["Room", booking.roomName],
       ["Requested slot", slotText(booking)],
       ["Event", booking.eventName],
       ["Participants", booking.participants],
       ["Purpose", booking.purpose],
       ["Equipment", (booking.equipment || []).join(", ")],
       ["Booking ID", booking.id]
     ])}
     <p>
       <a href="${esc(APP_URL())}"
          style="background:#d97706;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">
         Open Approvals Queue
       </a>
     </p>`
  );

  return { subject, text, html };
}

// ------------------------ Booking approved/rejected ------------------------

function decisionToUser(booking, requester, status, remarks) {
  const approved = status === "Approved";

  const subject = approved
    ? `Booking APPROVED – ${booking.roomName}`
    : `Booking ${status.toUpperCase()} – ${booking.roomName}`;

  const headline = approved
    ? "Your room is booked! The admin has confirmed your request."
    : `Your booking request was ${status.toLowerCase()} by the admin.`;

  const text = [
    `Hello ${requester.name},`,
    "",
    headline,
    "",
    `Booking ID : ${booking.id}`,
    `Room       : ${booking.roomName}`,
    `Slot       : ${slotText(booking)}`,
    `Event      : ${booking.eventName}`,
    `Status     : ${status}`,
    remarks ? `Admin remarks: ${remarks}` : ""
  ].join("\n");

  const html = layout(
    approved ? "Booking confirmed" : `Booking ${status.toLowerCase()}`,
    approved ? "#059669" : "#e11d48",
    `<p>Hello ${esc(requester.name)},</p>
     <p><strong>${esc(headline)}</strong></p>
     ${detailsTable([
       ["Booking ID", booking.id],
       ["Room", booking.roomName],
       ["Date & time", slotText(booking)],
       ["Event", booking.eventName],
       ["Status", status],
       ["Admin remarks", remarks]
     ])}`
  );

  return { subject, text, html };
}

// ------------------------ Notification helpers ------------------------

export async function notifyBookingRequested(booking, requester) {
  try {
    const admins = await getAdminRecipients();
    const toUser = requestedToUser(booking, requester);
    const toAdmin = requestedToAdmin(booking, requester);

    await Promise.allSettled([
      sendMail({ to: requester.email, ...toUser }),
      sendMail({ to: admins, ...toAdmin })
    ]);
  } catch (err) {
    console.error(
      "Booking e-mail notification error:",
      err.message
    );
  }
}

export async function notifyBookingDecision(
  booking,
  requester,
  status,
  remarks
) {
  try {
    await sendMail({
      to: requester.email,
      ...decisionToUser(booking, requester, status, remarks)
    });
  } catch (err) {
    console.error(
      "Decision e-mail notification error:",
      err.message
    );
  }
}
