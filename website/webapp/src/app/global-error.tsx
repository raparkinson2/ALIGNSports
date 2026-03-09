'use client';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ background: '#080c14', color: '#f1f5f9', fontFamily: 'monospace', padding: '2rem' }}>
        <h2 style={{ color: '#f87171' }}>Application Error</h2>
        <p style={{ color: '#94a3b8' }}>{error.message}</p>
        <pre style={{ background: '#0f1a2e', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#67e8f9' }}>
          {error.stack}
        </pre>
        {error.digest && <p style={{ color: '#64748b' }}>Digest: {error.digest}</p>}
      </body>
    </html>
  );
}
