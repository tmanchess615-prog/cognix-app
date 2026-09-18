export default function Home() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: '42rem', borderRadius: '1rem', backgroundColor: '#1e293b', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'inline-block', backgroundColor: '#2563eb', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cognix Smart Routing
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: '1.2', color: '#fff', marginBottom: '1rem' }}>
          Get 5-Star Google Reviews. <br />
          <span style={{ color: '#3b82f6' }}>Intercept the 1-Stars.</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Protect your reputation and boost your local search rankings automatically. Place a Cognix Smart Stand on your counter and manage your customer feedback on autopilot.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          <a href="/login" style={{ display: 'block', width: '100%', maxWidth: '20rem', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', borderRadius: '0.5rem', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.5)' }}>
            Client Portal Login
          </a>
          <a href="/login" style={{ display: 'block', width: '100%', maxWidth: '20rem', padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#9ca3af', fontWeight: '600', borderRadius: '0.5rem', textDecoration: 'none', border: '1px solid #4b5563' }}>
            Get Started (R1,499/mo)
          </a>
        </div>
      </div>
      <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>© 2026 Cognix South Africa. All Rights Reserved.</p>
    </div>
  );
}
