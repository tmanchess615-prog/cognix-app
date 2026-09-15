import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getServerSideProps(context) {
  const { id } = context.query;
  const { data: client, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error || !client) return { props: { error: 'Invalid Code' } };
  return { props: { client } };
}

export default function SurveyPage({ client, error }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (error) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: '700' }}>Invalid QR Code</div>;
  
  if (client.subscription_status === 'suspended') {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '0 1rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>Service Temporarily Unavailable</h1>
        <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>Please contact the establishment administrator regarding platform access.</p>
      </div>
    );
  }

  const handleRating = (stars) => {
    setRating(stars);
    if (stars >= 4) {
      window.open(client.google_review_url, '_blank');
      setSubmitted(true);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '1rem', fontFamily: 'sans-serif', color: '#111827' }}>
      <div style={{ width: '100%', maxWidth: '28rem', borderRadius: '1rem', backgroundColor: '#fff', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>How was your experience at {client.business_name}?</h2>
        {!submitted && rating === 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => handleRating(star)} style={{ fontSize: '2.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>⭐</button>
            ))}
          </div>
        )}
        {submitted && rating >= 4 && <p style={{ marginTop: '1rem', color: '#16a34a', fontWeight: '500' }}>Thank you! Your feedback has been opened on Google.</p>}
        {!submitted && rating > 0 && rating <= 3 && (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ marginTop: '1rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>We are so sorry! How can we improve?</label>
            <textarea required style={{ marginTop: '0.5rem', width: '100%', borderRadius: '0.5rem', borderColor: '#d1d5db', padding: '0.5rem', fontSize: '0.875rem' }} rows="4" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Your complaints are sent privately to management..." />
            <button type="submit" style={{ marginTop: '0.75rem', width: '100%', borderRadius: '0.5rem', backgroundColor: '#2563eb', padding: '0.5rem', color: '#fff', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Submit Private Feedback</button>
          </form>
        )}
        {submitted && rating <= 3 && <p style={{ marginTop: '1rem', color: '#2563eb', fontWeight: '500' }}>Thank you. Your feedback has been sent directly to management to rectify immediately.</p>}
      </div>
    </div>
  );
}
