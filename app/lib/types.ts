export type Confidence = "low" | "medium" | "high";

export interface Analysis {
  rootCause: string;
  plainExplanation: string;
  fixSteps: string[];
  confidence: Confidence;
  searchQuery: string;
}

export interface RelatedIssue {
  title: string;
  url: string;
  repo: string;
}

export interface AnalyzeResponse extends Analysis {
  relatedIssues: RelatedIssue[];
}

export interface AnalyzeRequest {
  trace: string;
  language: string;
}
