// ---------------------------------------------------------------------------
// E-mail notifications for room bookings.
//
// Configure SMTP in backend/.env (see .env.example). If SMTP is not configured
// (or `nodemailer` has not been installed yet) e-mails are printed to the
// server console instead, so the booking flow never breaks.
// ---------------------------------------------------------------------------
import { getPool } from "../config/db.js";
import { APP_TIMEZONE, formatTime12 } from "../config/collegeTimings.js";

let transporterPromise = null;
let warnedNoNodemailer = false;

export function isMailConfigured() {
  return Boolean(
    (process.env.SMTP_SERVICE || process.env.SMTP_HOST) && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

const fromAddress = () =>
  process.env.MAIL_FROM || `"MITS Smart Room Booking" <${process.env.SMTP_USER}>`;

async function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporterPromise) {
    transporterPromise = (async () => {
      let nodemailer;
      try {
        nodemailer = (await import("nodemailer")).default;
      } catch {
        if (!warnedNoNodemailer) {
          warnedNoNodemailer = true;
          console.warn("⚠️  'nodemailer' is not installed – run `npm install` inside the backend folder. E-mails will only be logged.");
        }
        return null;
      }
      const port = Number(process.env.SMTP_PORT) || 587;
      const base = process.env.SMTP_SERVICE
        ? { service: process.env.SMTP_SERVICE }
        : {
            host: process.env.SMTP_HOST,
            port,
            secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465
          };
      return nodemailer.createTransport({
        ...base,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
    })();
  }
  return transporterPromise;
}

// Called once at server start: tells you straight away whether SMTP works.
export async function verifyMailSetup() {
  if (!isMailConfigured()) {
    console.log("📧 E-mail: SMTP not configured → notification e-mails will be printed in this console. (Set SMTP_* in backend/.env)");
    return;
  }
  try {
    const transporter = await getTransporter();
    if (!transporter) return;
    await transporter.verify();
    console.log(`📧 E-mail: SMTP ready (sending as ${process.env.SMTP_USER}).`);
  } catch (err) {
    console.error("❌ E-mail: SMTP login/connection failed:", err.message);
  }
}

export async function sendMail({ to, subject, text, html }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: "no recipient" };

  const transporter = await getTransporter();
  if (!transporter) {
    console.log(
      `\n📧 [E-MAIL NOT SENT – SMTP or nodemailer not set up]\n   To: ${recipients.join(", ")}\n   Subject: ${subject}\n   ${text.split("\n").join("\n   ")}\n`
    );
    return { ok: true, mode: "console" };
  }

  try {
    await transporter.sendMail({ from: fromAddress(), to: recipients.join(", "), subject, text, html });
    console.log(`📧 E-mail sent to ${recipients.join(", ")} – "${subject}"`);
    return { ok: true, mode: "smtp" };
  } catch (err) {
    console.error(`❌ Failed to e-mail ${recipients.join(", ")}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// Admin recipients: ADMIN_EMAIL in .env (comma separated) or every Administrator in the DB
export async function getAdminRecipients() {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL.split(",").map((e) => e.trim()).filter(Boolean);
  }
  try {
    const [rows] = await getPool().query("SELECT email FROM users WHERE role = 'Administrator'");
    return rows.map((r) => r.email).filter(Boolean);
  } catch {
    return [];
  }
}

// ------------------------------- templates ---------------------------------
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const prettyDate = (dateStr) => {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const nowStamp = () =>
  new Date().toLocaleString("en-IN", { timeZone: APP_TIMEZONE, dateStyle: "medium", timeStyle: "short" });

const APP_URL = () => process.env.APP_URL || "http://localhost:5173";

const layout = (title, accent, bodyHtml) => `
<div style="font-family:Segoe UI,Arial,sans-serif;background:#f1f5f9;padding:24px">
  <div style="max-width:560px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:${accent};color:#fff;padding:18px 24px">
      <div style="font-size:12px;letter-spacing:1px;opacity:.85">MITS SMART ROOM BOOKING</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">${esc(title)}</div>
    </div>
    <div style="padding:22px 24px;color:#0f172a;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <div style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:11px">This is an automated message from the MITS Smart Room Booking system.</div>
  </div>
</div>`;

const detailsTable = (rows) =>
  `<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:13px">${rows
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 10px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;width:34%">${esc(k)}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:600">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;

const slotText = (b) => `${prettyDate(b.date)}, ${formatTime12(b.startTime)} – ${formatTime12(b.endTime)}`;

// booking = { id, roomName, date, startTime, endTime, eventName, purpose, participants, department, equipment }
// requester = { name, email }
function requestedToUser(booking, requester) {
  const subject = `Room booking request received – ${booking.roomName}`;
  const text = [
    `Hello ${requester.name},`,
    ``,
    `Your request has been sent to the admin. After confirmation, your room will be booked.`,
    ``,
    `Booking ID : ${booking.id}`,
    `Room       : ${booking.roomName}`,
    `Slot       : ${slotText(booking)}`,
    `Event      : ${booking.eventName}`,
    `Status     : Pending admin approval`,
    ``,
    `You will receive another e-mail as soon as the admin approves or rejects your request.`
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
     <p style="color:#475569">You will get another e-mail as soon as the admin approves or rejects your request.</p>`
  );
  return { subject, text, html };
}

function requestedToAdmin(booking, requester) {
  const subject = `New booking request: ${booking.roomName} by ${requester.email}`;
  const text = [
    `Booking request for ${booking.roomName} by ${requester.email} at ${nowStamp()}.`,
    ``,
    `Requested by : ${requester.name} <${requester.email}>`,
    `Department   : ${booking.department}`,
    `Room         : ${booking.roomName}`,
    `Slot         : ${slotText(booking)}`,
    `Event        : ${booking.eventName}`,
    `Participants : ${booking.participants}`,
    `Purpose      : ${booking.purpose}`,
    `Equipment    : ${(booking.equipment || []).join(", ") || "-"}`,
    `Booking ID   : ${booking.id}`,
    ``,
    `Please review it in the Approvals Queue: ${APP_URL()}`
  ].join("\n");
  const html = layout(
    "New room booking request",
    "#d97706",
    `<p>The booking request for <strong>${esc(booking.roomName)}</strong> was made by
       <strong>${esc(requester.email)}</strong> at <strong>${esc(nowStamp())}</strong>.</p>
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
     <p><a href="${esc(APP_URL())}" style="background:#d97706;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">Open Approvals Queue</a></p>`
  );
  return { subject, text, html };
}

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
    ``,
    headline,
    ``,
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

// --------------------------- public notify helpers -------------------------
// Both are "fire and forget": they never throw.
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
    console.error("Booking e-mail notification error:", err.message);
  }
}

export async function notifyBookingDecision(booking, requester, status, remarks) {
  try {
    await sendMail({ to: requester.email, ...decisionToUser(booking, requester, status, remarks) });
  } catch (err) {
    console.error("Decision e-mail notification error:", err.message);
  }
}
