function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2.2fr_1fr_1.4fr_0.8fr] gap-4 border-t border-stone-200 px-6 py-4">
      <div className="h-5 animate-pulse rounded bg-stone-200" />
      <div className="h-5 animate-pulse rounded bg-stone-200" />
      <div className="h-5 animate-pulse rounded bg-stone-200" />
      <div className="h-5 animate-pulse rounded bg-stone-200" />
    </div>
  );
}

export default function LoadingPersonasPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-56 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-stone-200" />
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="h-12 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[2.2fr_1fr_1.4fr_0.8fr] gap-4 bg-stone-50 px-6 py-4">
          <div className="h-4 rounded bg-stone-200" />
          <div className="h-4 rounded bg-stone-200" />
          <div className="h-4 rounded bg-stone-200" />
          <div className="h-4 rounded bg-stone-200" />
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
