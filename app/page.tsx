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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:py-16">
      <header className="mb-6 text-center sm:mb-8">
        <h1 className="text-5xl leading-[0.92] tracking-tight text-fg [overflow-wrap:anywhere] sm:text-7xl">
          <span className="block font-display">Stack-Trace</span>
          <span className="block font-serif italic text-accent">Storyteller</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md font-mono text-sm leading-relaxed text-fg-muted">
          <span className="text-accent">//</span> paste a trace — get the story behind it
        </p>
      </header>

      <div className="rounded-xl border border-line bg-panel p-2 shadow-2xl shadow-black/40 backdrop-blur transition-colors duration-150 ease-out focus-within:border-accent-ring">
        <textarea
          aria-label="Error or stack trace"
          value={trace}
          onChange={(event) => setTrace(event.target.value)}
          placeholder={
            "Paste your error or stack trace here...\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at HomePage (app/page.tsx:12:34)\n    at renderWithHooks (react-dom.development.js:15486:18)"
          }
          spellCheck={false}
          className="h-60 w-full resize-y rounded-lg bg-transparent p-4 font-mono text-sm leading-relaxed text-fg caret-accent placeholder:text-fg-faint focus:outline-none sm:h-72"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <span>Language</span>
          <select
            aria-label="Source language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="flex-1 rounded-lg border border-line bg-elevated px-3 py-2 font-mono text-sm text-fg transition-colors duration-150 ease-out hover:border-accent-ring focus:border-accent focus:outline-none sm:flex-none"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-on transition-colors duration-150 ease-out hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {isLoading && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-accent-on-soft border-t-accent-on"
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
          <p className="text-xs text-fg-faint">First time here?</p>
          <button
            type="button"
            onClick={loadSample}
            className="mt-2 rounded-lg border border-line px-4 py-2 text-sm text-fg-muted transition-colors duration-150 ease-out hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try a sample Python traceback →
          </button>
        </div>
      )}

    </main>
  );
}
