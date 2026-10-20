const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const buckets = new Map();

const LIMITS = {
  topic: 20,
  name: 120,
  email: 200,
  organization: 160,
  field: 40,
  phone: 40,
  size: 20,
  times: 300,
  message: 2_000
};
const TOPICS = new Set(["call", "early-access", "question"]);
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function json(response, status, body) {
  response.status(status);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

function clientIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded || "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || now >= current.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Method not allowed." });
  }
  if (!sameOrigin(request)) {
    return json(response, 403, { error: "Cross-origin requests are not allowed." });
  }
  if (isRateLimited(clientIp(request))) {
    return json(response, 429, { error: "Too many requests. Please try again in a minute." });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || typeof body !== "object") {
    return json(response, 400, { error: "Invalid request." });
  }

  // Honeypot: bots fill the hidden field. Pretend success.
  if (typeof body.website === "string" && body.website.trim()) {
    return json(response, 200, { ok: true });
  }

  const fields = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = typeof body[key] === "string" ? body[key].trim() : "";
    if (value.length > max) return json(response, 400, { error: "One of the fields is too long." });
    fields[key] = value;
  }
  if (!fields.name) return json(response, 400, { error: "Please enter your name." });
  if (!EMAIL_PATTERN.test(fields.email)) return json(response, 400, { error: "Please enter a valid email address." });
  if (!TOPICS.has(fields.topic)) fields.topic = "call";

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("Contact form is not configured: set RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL.");
    return json(response, 503, { error: "The form is temporarily unavailable." });
  }

  const labels = {
    topic: "Request type", name: "Name", email: "Email", organization: "Organization", field: "Field",
    phone: "Phone", size: "Team size", times: "Preferred times", message: "Message"
  };
  const rows = Object.entries(labels).filter(([key]) => fields[key]);
  const subject = `PrivacyAI ${fields.topic} request from ${fields.name}`.replace(/[\r\n]+/g, " ");

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()),
        reply_to: fields.email,
        subject,
        text: rows.map(([key, label]) => `${label}: ${fields[key]}`).join("\n"),
        html: `<table>${rows
          .map(([key, label]) => `<tr><td><b>${label}</b></td><td>${escapeHtml(fields[key]).replace(/\n/g, "<br>")}</td></tr>`)
          .join("")}</table>`
      })
    });
    if (!upstream.ok) {
      console.error("Contact email failed", upstream.status, await upstream.text());
      return json(response, 502, { error: "We couldn't send your request." });
    }
  } catch (error) {
    console.error("Contact email error", error);
    return json(response, 502, { error: "We couldn't send your request." });
  }

  return json(response, 200, { ok: true });
}
