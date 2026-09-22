export default function Loading() {
  return (
    <div
      className="container page-content"
      aria-label="Loading jobs"
      role="status"
    >
      <div className="skeleton short" />
      <div className="job-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="loading-card">
            <div className="skeleton short" />
            <div className="skeleton tall" />
            <div className="skeleton" />
            <div className="skeleton short" />
          </div>
        ))}
      </div>
    </div>
  );
}
