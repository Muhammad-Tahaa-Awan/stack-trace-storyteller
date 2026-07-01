export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-8 flex items-start gap-3 rounded-xl border border-conf-low-ring bg-conf-low-soft p-4 text-sm text-conf-low"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-conf-low-ring font-mono text-xs font-bold"
      >
        !
      </span>
      <p className="leading-relaxed text-fg-muted">{message}</p>
    </div>
  );
}
