"use client";

import { useEffect, useRef, useState } from "react";
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

const EDITOR_PLACEHOLDER =
  "TypeError: Cannot read properties of undefined (reading 'map')\n" +
  "    at HomePage (app/page.tsx:12:34)\n" +
  "    at renderWithHooks (react-dom.development.js:15486:18)\n" +
  "paste over this to explain your own trace";

export default function Home() {
  const [trace, setTrace] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = trace.trim().length === 0;
  const canSubmit = !isEmpty && !isLoading;

  // Editor gutter: line numbers track the content, falling back to the
  // placeholder's line count (plus a trailing blank line) when empty.
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const [sizeTick, setSizeTick] = useState(0);

  const headerLanguage = language === "auto" ? "plaintext" : language;
  // Number the actual content, or the placeholder while the field is empty.
  const editorLines = (trace.length > 0 ? trace : EDITOR_PLACEHOLDER).split("\n");

  function handleEditorScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
  }

  // Re-measure when the textarea width changes (e.g. viewport resize).
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setSizeTick((t) => t + 1));
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  // Measure each logical line's wrapped height via a hidden mirror, so the
  // gutter numbers stay aligned even when long lines wrap onto multiple rows.
  useEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textareaRef.current;
    if (!mirror || !textarea) return;
    mirror.style.width = `${textarea.clientWidth}px`;
    const heights = Array.from(mirror.children).map((child) => (child as HTMLElement).offsetHeight);
    setLineHeights(heights);
  }, [trace, sizeTick]);

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

      <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40 backdrop-blur transition-colors duration-150 ease-out focus-within:border-accent-ring">
        {/* Editor tab bar */}
        <div className="flex items-stretch justify-between border-b border-line bg-elevated">
          <div className="flex items-center border-t-2 border-accent bg-panel px-4 py-2 font-mono text-xs font-semibold text-fg">
            error.log
          </div>
          <span className="flex items-center px-4 font-mono text-xs text-fg-faint">
            {headerLanguage}
          </span>
        </div>

        {/* Editor body: line-number gutter + textarea */}
        <div className="relative flex h-60 sm:h-72">
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="shrink-0 select-none overflow-hidden py-4 pl-4 pr-3 text-right font-mono text-sm leading-6 text-fg-faint"
          >
            {editorLines.map((_, i) => (
              <div key={i} style={{ height: lineHeights[i] }}>
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            aria-label="Error or stack trace"
            value={trace}
            onChange={(event) => setTrace(event.target.value)}
            onScroll={handleEditorScroll}
            placeholder={EDITOR_PLACEHOLDER}
            spellCheck={false}
            className="h-full min-w-0 flex-1 resize-none overflow-auto whitespace-pre-wrap bg-transparent py-4 pl-1 pr-4 font-mono text-sm leading-6 text-fg caret-accent placeholder:text-fg-faint focus:outline-none [overflow-wrap:anywhere]"
          />
          {/* Hidden mirror: measures each wrapped line's height for the gutter. */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="pointer-events-none invisible absolute left-0 top-0 -z-10 whitespace-pre-wrap pl-1 pr-4 font-mono text-sm leading-6 [overflow-wrap:anywhere]"
          >
            {editorLines.map((line, i) => (
              <div key={i}>{line === "" ? " " : line}</div>
            ))}
          </div>
        </div>
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
