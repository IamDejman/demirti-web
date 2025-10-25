export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Sorry, the page you are looking for does not exist.
      </p>
      <a 
        href="/" 
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#0066cc',
          color: 'white',
          borderRadius: '50px',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        Go Back Home
      </a>
    </div>
  );
}

