// A quiet skeleton shown while a lazy route chunk loads. Intentionally
// low-contrast so it does not flash noisily when the chunk is already cached.
export default function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[68ch] px-10 py-12" aria-busy="true">
      <div className="h-3 w-48 rounded-sm bg-vsc-panel animate-pulse" />
      <div className="mt-6 h-7 w-2/3 rounded-sm bg-vsc-panel animate-pulse" />
      <div className="mt-3 h-3 w-24 rounded-sm bg-vsc-panel animate-pulse" />
      <div className="mt-10 space-y-3">
        <div className="h-3 w-full rounded-sm bg-vsc-panel animate-pulse" />
        <div className="h-3 w-11/12 rounded-sm bg-vsc-panel animate-pulse" />
        <div className="h-3 w-10/12 rounded-sm bg-vsc-panel animate-pulse" />
      </div>
    </div>
  );
}
