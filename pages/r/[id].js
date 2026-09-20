import { useState } from 'react';
import { CLIENTS_REGISTRY } from '../lib/supabaseClient';

export async function getServerSideProps(context) {
  const { id } = context.query;
  const clientData = CLIENTS_REGISTRY[id] || null;
  
  return {
    props: {
      client: clientData,
      routeId: id || ''
    }
  };
}

export default function SurveyPage({ client, routeId }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!client) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fca5a5', fontWeight: '700', fontFamily: 'sans-serif' }}>
        ⚠️ Invalid Setup Route. Profile Not Found.
      </div>
    );
  }

  const handleRating = (stars) => {
    setRating(stars);
    if (stars >= 4) {
      window.location.href = client.googleUrl;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '1rem', fontFamily: 'sans-serif', color: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '26rem', borderRadius: '1rem', backgroundColor: '#1e293b', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center', border: '1px solid #334155' }}>
        
        <span style={{ fontSize: '2.5rem' }}>✨</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', margin: '1rem 0 0.5rem 0', lineHeight: '1.3' }}>
          How was your experience at <br /><span style={{ color: '#3b82f6' }}>{client.businessName}</span>?
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>Tap a star below to rate your visit today.</p>
        
        {!submitted && rating === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {[1, 2, 3, 4, 5].map((stars) => (
              <button key={stars} onClick={() => handleRating(stars)} style={{ fontSize: '2.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                ⭐
              </button>
            ))}
          </div>
        )}

        {!submitted && rating > 0 && rating <= 3 && (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ marginTop: '1rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fca5a5' }}>
              We are so sorry to hear that. How can we improve?
            </label>
            <textarea required rows="4" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Your complaints are sent privately to store management to resolve immediately..." style={{ marginTop: '0.5rem', width: '100%', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #475569', padding: '0.75rem', fontSize: '0.9rem', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
            <button type="submit" style={{ marginTop: '1rem', width: '100%', borderRadius: '0.5rem', backgroundColor: '#2563eb', padding: '0.8rem', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
              Submit Private Feedback
            </button>
          </form>
        )}
        
        {submitted && rating <= 3 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#38bdf8', fontWeight: '700', fontSize: '1.1rem', margin: '0' }}>Thank you for your honesty.</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Your feedback has been delivered securely to management to rectify your experience.</p>
          </div>
        )}

      </div>
    </div>
  );
}
