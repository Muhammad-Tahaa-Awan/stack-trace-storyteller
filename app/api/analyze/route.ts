import { NextResponse } from "next/server";
import type { Analysis, Confidence, RelatedIssue } from "@/app/lib/types";

export const runtime = "nodejs";

const GITHUB_SEARCH_ENDPOINT = "https://api.github.com/search/issues";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are an expert software engineer who diagnoses errors and stack traces.
Return ONLY valid JSON — no markdown, no code fences, no commentary — matching exactly this shape:
{
  "rootCause": string,
  "plainExplanation": string,
  "fixSteps": string[],
  "confidence": "low" | "medium" | "high",
  "searchQuery": string
}

Field guidance:
- rootCause: one concise sentence naming the underlying cause of the error.
- plainExplanation: 2-4 sentences explaining the error in plain language a junior developer would understand.
- fixSteps: an ordered array of concrete, actionable steps to fix the problem.
- confidence: how confident you are in this diagnosis given the information provided.
- searchQuery: a short phrase (3-8 words) well suited for searching GitHub issues for this error — no quotes, no error line numbers, just the salient keywords.

Do not include any text outside the JSON object.`;

const CONFIDENCE_VALUES: Confidence[] = ["low", "medium", "high"];

/**
 * Extracts a JSON object from a model response. Handles the common cases where
 * the model wraps the JSON in markdown fences or adds stray text around it.
 */
function safeParseAnalysis(raw: string): Analysis | null {
  const attempts: string[] = [];

  const trimmed = raw.trim();
  attempts.push(trimmed);

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) attempts.push(fenced[1].trim());

  // Fall back to the first {...} block in the text.
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      const validated = validateAnalysis(parsed);
      if (validated) return validated;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function validateAnalysis(value: unknown): Analysis | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  const rootCause = v.rootCause;
  const plainExplanation = v.plainExplanation;
  const fixSteps = v.fixSteps;
  const confidence = v.confidence;
  const searchQuery = v.searchQuery;

  if (typeof rootCause !== "string") return null;
  if (typeof plainExplanation !== "string") return null;
  if (!Array.isArray(fixSteps) || !fixSteps.every((s) => typeof s === "string")) return null;
  if (typeof confidence !== "string" || !CONFIDENCE_VALUES.includes(confidence as Confidence)) {
    return null;
  }
  if (typeof searchQuery !== "string") return null;

  return {
    rootCause,
    plainExplanation,
    fixSteps: fixSteps as string[],
    confidence: confidence as Confidence,
    searchQuery,
  };
}

/**
 * Searches GitHub issues for the given query and returns the top 3 matches by
 * relevance. Supplementary to the analysis, so any failure resolves to an empty
 * list rather than propagating an error.
 */
async function fetchRelatedIssues(query: string): Promise<RelatedIssue[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Restrict to issues (the endpoint otherwise mixes in pull requests).
  const q = `${trimmed} is:issue`;
  const url = `${GITHUB_SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}&per_page=3`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "stack-trace-storyteller",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    // Default sort is best-match (relevance); no `sort` param needed.
    const response = await fetch(url, { headers });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      items?: Array<{ title?: string; html_url?: string; repository_url?: string }>;
    };

    const items = data.items ?? [];
    if (items.length === 0) return [];

    return items.slice(0, 3).map((item) => ({
      title: item.title ?? "Untitled issue",
      url: item.html_url ?? "",
      repo: item.repository_url
        ? item.repository_url.replace("https://api.github.com/repos/", "")
        : "",
    }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The server is not configured with GEMINI_API_KEY." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { trace, language } = (body ?? {}) as { trace?: unknown; language?: unknown };

  if (typeof trace !== "string" || trace.trim().length === 0) {
    return NextResponse.json(
      { error: "A non-empty `trace` string is required." },
      { status: 400 },
    );
  }

  const languageHint =
    typeof language === "string" && language.trim().length > 0 && language !== "auto"
      ? language
      : "auto-detect the language";

  const userPrompt = `Language: ${languageHint}\n\nError / stack trace:\n\n${trace}`;

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach the Gemini API." },
      { status: 502 },
    );
  }

  if (!geminiResponse.ok) {
    return NextResponse.json(
      { error: `Gemini API returned an error (status ${geminiResponse.status}).` },
      { status: 502 },
    );
  }

  const data = (await geminiResponse.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json(
      { error: "The model returned an empty response." },
      { status: 502 },
    );
  }

  const analysis = safeParseAnalysis(text);
  if (!analysis) {
    return NextResponse.json(
      { error: "The model did not return valid JSON. Please try again." },
      { status: 502 },
    );
  }

  const relatedIssues = await fetchRelatedIssues(analysis.searchQuery);

  return NextResponse.json({ ...analysis, relatedIssues });
}
