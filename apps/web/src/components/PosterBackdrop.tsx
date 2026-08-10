interface Props { posters: string[]; }

export function PosterBackdrop({ posters }: Props) {
  if (posters.length === 0) return null;
  return (
    <div aria-hidden="true" data-testid="poster-backdrop" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="flex justify-center gap-4 px-4">
        {posters.map((p, i) => (
          <img key={p} src={p} alt="" className="backdrop-poster w-28 shrink-0 rounded-lg"
            style={{ animationDelay: `${i * 1.7}s`, transform: `translateY(${(i % 3) * 18}px)` }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, color-mix(in srgb, var(--bg) 55%, transparent) 0%, var(--bg) 88%)",
      }} />
    </div>
  );
}
