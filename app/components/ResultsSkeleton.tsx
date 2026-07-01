function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

export function ResultsSkeleton() {
  return (
    <section aria-hidden="true" className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <Bar className="h-5 w-32" />
        <Bar className="h-6 w-28 rounded-full" />
      </div>

      <div className="space-y-2">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-11/12" />
        <Bar className="h-4 w-4/5" />
      </div>

      <div className="rounded-xl border border-line bg-panel p-4">
        <Bar className="mb-3 h-4 w-24" />
        <Bar className="h-4 w-3/4" />
      </div>

      <div className="space-y-3">
        <Bar className="h-4 w-20" />
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="h-12 w-full" />
        ))}
      </div>
    </section>
  );
}
