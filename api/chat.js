const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_INPUT_CHARS = 6_000;
const buckets = new Map();

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

function outputText(payload) {
  if (!Array.isArray(payload.output)) return "";
  return payload.output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
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
    return json(response, 429, { error: "Please wait a moment before trying again." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(response, 503, { error: "The demo API is not configured." });
  }

  const message =
    request.body && typeof request.body.message === "string"
      ? request.body.message.trim()
      : "";

  if (!message) {
    return json(response, 400, { error: "Enter a message first." });
  }
  if (message.length > MAX_INPUT_CHARS) {
    return json(response, 413, {
      error: `Keep the demo message under ${MAX_INPUT_CHARS.toLocaleString()} characters.`,
    });
  }

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        store: false,
        reasoning: { effort: "minimal" },
        max_output_tokens: 1_200,
        instructions:
          "You are a concise professional writing assistant. The user's message contains privacy placeholders such as [[PERSON_1]], [[SSN_1]], or [[ADDRESS_1]]. Preserve every placeholder exactly, including brackets, spelling, capitalization, and numbering. Never infer or invent the hidden values. Answer the request normally while retaining placeholders wherever the hidden information belongs.",
        input: message,
      }),
    });

    const payload = await openAIResponse.json().catch(() => ({}));
    if (!openAIResponse.ok) {
      const message =
        payload?.error?.message || "The AI provider could not complete this request.";
      return json(response, openAIResponse.status, { error: message });
    }

    const answer = outputText(payload);
    if (!answer) {
      return json(response, 502, { error: "The AI provider returned an empty response." });
    }

    return json(response, 200, { answer });
  } catch {
    return json(response, 502, {
      error: "The demo could not reach the AI provider. Please try again.",
    });
  }
}
