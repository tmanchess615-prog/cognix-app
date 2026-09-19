import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [clientProfile, setClientProfile] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
      fetchClientData(user.id);
    }
  }

  async function fetchClientData(userId) {
    // Look for any existing business profile connected to this user account
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);

    if (data && data.length > 0) {
      setClientProfile(data[0]); // Safely grab their profile without crashing if it's empty
    }
    setLoading(false);
  }

  async function handleRegisterBusiness(e) {
    e.preventDefault();
    if (!businessName || !googleUrl) return;

    const { error } = await supabase.from('clients').insert([
      { 
        business_name: businessName, 
        google_review_url: googleUrl,
        subscription_status: 'active',
        user_id: user.id
      }
    ]);

    if (!error) {
      router.reload();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading || !user) return <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Loading Secure Portal...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', padding: '2rem', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#3b82f6' }}>Cognix Dashboard</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Logged in as: {user.email}</p>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600' }}>Logout</button>
        </div>

        {!clientProfile ? (
          <form onSubmit={handleRegisterBusiness} style={{ marginTop: '2rem', backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: '700' }}>Initialize Your Review Stand Route</h3>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Business Name</label>
              <input type="text" required placeholder="e.g., Cape Town Coffee Shop" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: '#374151', border: 'none', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Google Review Direct URL</label>
              <input type="url" required placeholder="https://google.com..." value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: '#374151', border: 'none', color: '#fff', outline: 'none' }} />
            </div>
            <button type="submit" style={{ padding: '0.625rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Activate Stand Route</button>
          </form>
        ) : (
          <div style={{ marginTop: '2rem', backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{clientProfile.business_name}</h2>
              <span style={{ borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: clientProfile.subscription_status === 'active' ? '#064e3b' : '#7f1d1d', color: clientProfile.subscription_status === 'active' ? '#a7f3d0' : '#fecaca' }}>
                Account {clientProfile.subscription_status}
              </span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Your Physical NFC Tag / QR Target URL:</p>
              <p style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '1.1rem', marginTop: '0.25rem', userSelect: 'all' }}>
                https://cognix.co.za{clientProfile.id}
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Google Redirection Target:</p>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db', wordBreak: 'break-all', marginTop: '0.25rem' }}>{clientProfile.google_review_url}</p>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://cognix.co.za${clientProfile.id}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.375rem', fontWeight: '600', textDecoration: 'none' }}>
                Download Counter Stand QR Code ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
