import TryAgainButton from '../components/TryAgainButton';

export const metadata = {
  title: 'Offline | CVERSE Academy',
};

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div
        style={{
          background: 'var(--background-light)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '24rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem',
            border: '3px solid var(--text-light)',
            borderRadius: '50%',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            transform: 'rotate(-45deg)',
            position: 'relative',
          }}
          aria-hidden
        >
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '-5%',
              width: '110%',
              height: '3px',
              background: 'var(--text-light)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          You&apos;re offline
        </h1>
        <p
          style={{
            color: 'var(--text-light)',
            fontSize: '1rem',
            lineHeight: 1.5,
          }}
        >
          Please check your internet connection and try again.
        </p>
        <TryAgainButton />
      </div>
    </div>
  );
}
