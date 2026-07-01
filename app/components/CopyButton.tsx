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
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border border-terminal-border px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:border-terminal-accent hover:text-terminal-accent focus:outline-none focus:ring-1 focus:ring-terminal-accent ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
