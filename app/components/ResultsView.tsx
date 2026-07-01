import type { AnalyzeResponse } from "@/app/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CopyButton } from "./CopyButton";

interface ResultsViewProps {
  result: AnalyzeResponse;
  reportText: string;
}

export function ResultsView({ result, reportText }: ResultsViewProps) {
  const { rootCause, plainExplanation, fixSteps, confidence, relatedIssues } = result;

  return (
    <section aria-label="Analysis results" className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h2 className="text-lg font-semibold text-fg">Analysis</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ConfidenceBadge confidence={confidence} />
          <CopyButton text={reportText} label="Copy full report" copiedLabel="Report copied" />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-fg-muted sm:text-base">{plainExplanation}</p>

      <div className="rounded-xl border border-accent-ring bg-accent-soft p-4">
        <h3 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          Root cause
        </h3>
        <p className="text-sm leading-relaxed text-fg">{rootCause}</p>
      </div>

      {fixSteps.length > 0 && (
        <div>
          <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-fg-faint">
            Fix steps
          </h3>
          <ol className="space-y-2">
            {fixSteps.map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg border border-line bg-panel p-3 transition-colors duration-150 ease-out hover:border-accent-ring"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-relaxed text-fg">{step}</span>
                <CopyButton text={step} aria-label={`Copy fix step ${index + 1}`} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-fg-faint">
          Similar issues on GitHub
        </h3>
        {relatedIssues.length === 0 ? (
          <p className="text-sm text-fg-faint">No similar GitHub issues found.</p>
        ) : (
          <ul className="space-y-2">
            {relatedIssues.map((issue, index) => (
              <li key={index}>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-line bg-panel p-3 transition-colors duration-150 ease-out hover:border-accent"
                >
                  <span className="block text-sm font-medium text-fg">{issue.title}</span>
                  {issue.repo && (
                    <span className="mt-1 block font-mono text-xs text-fg-faint">{issue.repo}</span>
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
