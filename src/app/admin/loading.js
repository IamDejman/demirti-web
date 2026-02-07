export default function AdminLoading() {
  return (
    <div
      className="admin-loading-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="admin-loading-spinner" />
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}
