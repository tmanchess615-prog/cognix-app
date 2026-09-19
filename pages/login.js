import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage('✅ Success! Check your inbox for a confirmation email.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', fontFamily: 'sans-serif', color: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '24rem', backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', textAlign: 'center', margin: '0 0 1.5rem 0' }}>Cognix Login</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: '#374151', border: 'none', color: '#fff', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: '#374151', border: 'none', color: '#fff', outline: 'none' }} />
          </div>
          {message && <p style={{ fontSize: '0.875rem', textAlign: 'center', margin: '0' }}>{message}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Sign In'}
          </button>
          <button onClick={handleSignUp} disabled={loading} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', backgroundColor: 'transparent', color: '#9ca3af', fontWeight: '600', border: '1px solid #4b5563', cursor: 'pointer' }}>
            Create New Account
          </button>
        </form>
      </div>
    </div>
  );
}
