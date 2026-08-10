export function SetupCard() {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-lg p-8 text-center" style={{ background: "var(--surface)" }}>
      <h2 className="logo mb-3 text-2xl">Episodic</h2>
      <p>No data yet. Run <code style={{ color: "var(--gold)" }}>npm run ingest</code> to download
        IMDb ratings (takes a few minutes), then refresh.</p>
    </div>
  );
}
