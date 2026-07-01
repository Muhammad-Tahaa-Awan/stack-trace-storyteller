/**
 * Single point of contact between the app and any language model.
 *
 * `analyzeWithLLM` tries providers in order (Groq primary, Gemini fallback) and
 * returns parsed JSON from whichever answers first. A provider that throws,
 * aborts, times out, returns a non-2xx (e.g. 429), or emits malformed JSON is
 * treated as failed and the next provider is tried. The returned object shape is
 * identical regardless of which provider ran, so callers never learn which one
 * answered. If every provider fails, a single error object is thrown.
 */

const PROVIDER_TIMEOUT_MS = 5000;

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Extracts a JSON object from a model response, tolerating fences / stray text. */
function safeParseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

/** Runs a fetch with a hard timeout via AbortController; aborts throw. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Primary provider: Groq (OpenAI-compatible chat completions). */
async function callGroq(
  systemInstruction: string,
  userContent: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const response = await fetchWithTimeout(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`Groq request failed (${response.status})`);

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  const parsed = typeof text === "string" ? safeParseJson(text) : null;
  if (!parsed) throw new Error("Groq returned malformed JSON");

  return parsed;
}

/** Fallback provider: Gemini (JSON output forced via responseMimeType). */
async function callGemini(
  systemInstruction: string,
  userContent: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetchWithTimeout(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = typeof text === "string" ? safeParseJson(text) : null;
  if (!parsed) throw new Error("Gemini returned malformed JSON");

  return parsed;
}

/**
 * The only function the app uses to talk to a model. Tries Groq, then Gemini.
 * Always returns the same object shape; throws `{ error: "All providers
 * unavailable" }` if every provider fails.
 */
export async function analyzeWithLLM(
  systemInstruction: string,
  userContent: string,
): Promise<Record<string, unknown>> {
  const providers = [callGroq, callGemini];

  for (const provider of providers) {
    try {
      return await provider(systemInstruction, userContent);
    } catch {
      // Provider failed (threw, aborted, timed out, non-2xx, or bad JSON) —
      // fall through to the next one.
    }
  }

  throw { error: "All providers unavailable" };
}
