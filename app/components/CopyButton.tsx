"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  "aria-label"?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className = "",
  "aria-label": ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel ?? label}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs font-medium transition-colors duration-150 ease-out ${
        copied
          ? "border-conf-high-ring text-conf-high"
          : "border-line text-fg-faint hover:border-accent hover:text-accent"
      } ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
