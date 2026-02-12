export default function RootLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background-color, #fff)',
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border-color, #e1e4e8)',
          borderTopColor: 'var(--primary-color, #0066cc)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}
