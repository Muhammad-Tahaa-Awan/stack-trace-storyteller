export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            <span className="text-terminal-accent">Stack-Trace</span> Storyteller
          </h1>
          <p className="mt-3 text-sm text-gray-400 sm:text-base">
            Paste a raw error or stack trace below and let the story unfold.
          </p>
        </header>

        <div className="rounded-xl border border-terminal-border bg-terminal-panel/70 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          <textarea
            aria-label="Error or stack trace"
            placeholder={
              "Paste your error or stack trace here...\n\ne.g. TypeError: Cannot read properties of undefined (reading 'map')\n    at HomePage (app/page.tsx:12:34)\n    at renderWithHooks (react-dom.development.js:15486:18)"
            }
            spellCheck={false}
            className="h-72 w-full resize-y rounded-lg bg-transparent p-4 font-mono text-sm leading-relaxed text-gray-100 placeholder:text-gray-600 focus:outline-none"
          />
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Nothing is sent anywhere yet — this is the input surface.
        </p>
      </div>
    </main>
  );
}
