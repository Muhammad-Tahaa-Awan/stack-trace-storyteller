import type { AnalyzeResponse } from "./types";

export const SAMPLE_TRACE = `Traceback (most recent call last):
  File "shop/app.py", line 42, in <module>
    main()
  File "shop/app.py", line 37, in main
    total = compute_total(cart)
  File "shop/app.py", line 21, in compute_total
    return sum(item["price"] for item in items)
  File "shop/app.py", line 21, in <genexpr>
    return sum(item["price"] for item in items)
KeyError: 'price'`;

/** Builds a plain-text, copy-pasteable version of the full analysis. */
export function buildReport(
  trace: string,
  language: string,
  result: AnalyzeResponse,
): string {
  const lines: string[] = [
    "Stack-Trace Storyteller — analysis report",
    "=========================================",
    "",
    `Language: ${language}`,
    `Confidence: ${result.confidence}`,
    "",
    "Root cause",
    "----------",
    result.rootCause,
    "",
    "Explanation",
    "-----------",
    result.plainExplanation,
    "",
    "Fix steps",
    "---------",
    ...result.fixSteps.map((step, index) => `${index + 1}. ${step}`),
  ];

  if (result.relatedIssues.length > 0) {
    lines.push("", "Similar GitHub issues", "---------------------");
    for (const issue of result.relatedIssues) {
      lines.push(`- ${issue.title}${issue.repo ? ` (${issue.repo})` : ""}\n  ${issue.url}`);
    }
  }

  lines.push("", "Original trace", "--------------", trace);

  return lines.join("\n");
}
