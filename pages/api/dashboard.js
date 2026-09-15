import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*');
    if (data) setClients(data);
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!businessName || !googleUrl) return;

    const { error } = await supabase.from('clients').insert([
      { 
        business_name: businessName, 
        google_review_url: googleUrl,
        subscription_status: 'active'
      }
    ]);

    if (!error) {
      setBusinessName('');
      setGoogleUrl('');
      fetchClients();
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', padding: '2rem', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#3b82f6' }}>Cognix Admin Control</h1>
        <p style={{ color: '#9ca3af', marginTop: '0.25rem' }}>Manage infinite clients, QR routes, and active billing states.</p>

        <form onSubmit={handleAddClient} style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#9ca3af' }}>Business Name</label>
            <input 
              type="text" required placeholder="e.g., Cape Town Coffee Shop" value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={{ marginTop: '0.25rem', width: '100%', borderRadius: '0.5rem', backgroundColor: '#374151', padding: '0.625rem', color: '#fff', border: 'none', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#9ca3af' }}>Google Review Direct URL</label>
            <input 
              type="url" required placeholder="https://google.com..." value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              style={{ marginTop: '0.25rem', width: '100%', borderRadius: '0.5rem', backgroundColor: '#374151', padding: '0.625rem', color: '#fff', border: 'none', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', borderRadius: '0.5rem', backgroundColor: '#2563eb', padding: '0.625rem', fontWeight: '700', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Deploy New Client Link
          </button>
        </form>

        <div style={{ marginTop: '2rem', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Active Deployments</h2>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', color: '#d1d5db', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', fontWeight: '600' }}>
                <th style={{ paddingBottom: '0.75rem' }}>Business</th>
                <th style={{ paddingBottom: '0.75rem' }}>Status</th>
                <th style={{ paddingBottom: '0.75rem' }}>Dynamic Scan Link</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid rgba(55, 65, 81, 0.5)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '500', color: '#fff' }}>{client.business_name}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ borderRadius: '9999px', padding: '0.125rem 0.625rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: client.subscription_status === 'active' ? '#064e3b' : '#7f1d1d', color: client.subscription_status === 'active' ? '#a7f3d0' : '#fecaca' }}>
                      {client.subscription_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0', color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    https://cognix.co.za{client.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
