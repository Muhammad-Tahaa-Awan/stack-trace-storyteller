"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/app/lib/types";
import { ResultsView } from "@/app/components/ResultsView";
import { ResultsSkeleton } from "@/app/components/ResultsSkeleton";
import { ErrorBanner } from "@/app/components/ErrorBanner";
import { buildReport, SAMPLE_TRACE } from "@/app/lib/report";
import { decodeState, encodeState, SHARE_HASH_PREFIX } from "@/app/lib/share";

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "other", label: "Other" },
] as const;

export default function Home() {
  const [trace, setTrace] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = trace.trim().length === 0;
  const canSubmit = !isEmpty && !isLoading;

  // Restore a shared analysis from the URL hash on first load.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith(SHARE_HASH_PREFIX)) return;

    const shared = decodeState(hash.slice(SHARE_HASH_PREFIX.length));
    if (shared) {
      setTrace(shared.trace);
      setLanguage(shared.language);
      setResult(shared.result);
    }
  }, []);

  async function handleExplain() {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trace, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "Something went wrong.");
        return;
      }

      const analysis = data as AnalyzeResponse;
      setResult(analysis);

      // Put the full analysis in the URL so it can be shared/bookmarked.
      const encoded = encodeState({ trace, language, result: analysis });
      window.history.replaceState(null, "", `${SHARE_HASH_PREFIX}${encoded}`);
    } catch {
      setError("Could not reach the analysis service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function loadSample() {
    setTrace(SAMPLE_TRACE);
    setLanguage("python");
    setError(null);
    setResult(null);
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            <span className="text-terminal-accent">Stack-Trace</span> Storyteller
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Paste a raw error or stack trace below and let the story unfold.
          </p>
        </header>

        <div className="rounded-xl border border-terminal-border bg-terminal-panel/70 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          <textarea
            aria-label="Error or stack trace"
            value={trace}
            onChange={(event) => setTrace(event.target.value)}
            placeholder={
              "Paste your error or stack trace here...\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at HomePage (app/page.tsx:12:34)\n    at renderWithHooks (react-dom.development.js:15486:18)"
            }
            spellCheck={false}
            className="h-60 w-full resize-y rounded-lg bg-transparent p-4 font-mono text-sm leading-relaxed text-gray-100 placeholder:text-gray-600 focus:outline-none sm:h-72"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <span>Language</span>
            <select
              aria-label="Source language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="flex-1 rounded-lg border border-terminal-border bg-terminal-panel px-3 py-2 font-mono text-sm text-gray-100 focus:border-terminal-accent focus:outline-none sm:flex-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleExplain}
            disabled={!canSubmit}
            aria-busy={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terminal-accent px-6 py-2.5 text-sm font-semibold text-terminal-bg transition-colors hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-terminal-accent focus:ring-offset-2 focus:ring-offset-terminal-bg disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {isLoading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-terminal-bg/40 border-t-terminal-bg"
              />
            )}
            {isLoading ? "Explaining..." : "Explain"}
          </button>
        </div>

        {isLoading && <ResultsSkeleton />}
        {!isLoading && error && <ErrorBanner message={error} />}
        {!isLoading && !error && result && (
          <ResultsView result={result} reportText={buildReport(trace, language, result)} />
        )}

        {!isLoading && !error && !result && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">First time here?</p>
            <button
              type="button"
              onClick={loadSample}
              className="mt-2 rounded-lg border border-terminal-border px-4 py-2 text-sm text-gray-300 transition-colors hover:border-terminal-accent hover:text-terminal-accent focus:outline-none focus:ring-1 focus:ring-terminal-accent"
            >
              Try a sample Python traceback →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
