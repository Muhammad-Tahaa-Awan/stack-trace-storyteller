import type { Confidence } from "@/app/lib/types";

const STYLES: Record<Confidence, string> = {
  low: "border-conf-low-ring bg-conf-low-soft text-conf-low",
  medium: "border-conf-medium-ring bg-conf-medium-soft text-conf-medium",
  high: "border-conf-high-ring bg-conf-high-soft text-conf-high",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide ${STYLES[confidence]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {confidence} confidence
    </span>
  );
}
