export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-8 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
    >
      <span aria-hidden="true" className="mt-0.5 font-mono font-bold text-rose-400">
        !
      </span>
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
