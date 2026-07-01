import type { AnalyzeResponse } from "@/app/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CopyButton } from "./CopyButton";

export function ResultsView({ result }: { result: AnalyzeResponse }) {
  const { rootCause, plainExplanation, fixSteps, confidence, relatedIssues } = result;

  return (
    <section aria-label="Analysis results" className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Analysis</h2>
        <ConfidenceBadge confidence={confidence} />
      </div>

      <p className="text-sm leading-relaxed text-gray-300 sm:text-base">{plainExplanation}</p>

      <div className="rounded-xl border border-terminal-accent/40 bg-terminal-accent/5 p-4">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-terminal-accent">
          Root cause
        </h3>
        <p className="text-sm leading-relaxed text-gray-100">{rootCause}</p>
      </div>

      {fixSteps.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Fix steps
          </h3>
          <ol className="space-y-2">
            {fixSteps.map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg border border-terminal-border bg-terminal-panel/60 p-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terminal-accent/15 text-xs font-semibold text-terminal-accent">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm leading-relaxed text-gray-200">{step}</span>
                <CopyButton text={step} aria-label={`Copy fix step ${index + 1}`} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Similar issues on GitHub
        </h3>
        {relatedIssues.length === 0 ? (
          <p className="text-sm text-gray-500">No similar GitHub issues found.</p>
        ) : (
          <ul className="space-y-2">
            {relatedIssues.map((issue, index) => (
              <li key={index}>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-terminal-border bg-terminal-panel/60 p-3 transition-colors hover:border-terminal-accent"
                >
                  <span className="block text-sm font-medium text-gray-100">{issue.title}</span>
                  {issue.repo && (
                    <span className="mt-1 block font-mono text-xs text-gray-500">{issue.repo}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
