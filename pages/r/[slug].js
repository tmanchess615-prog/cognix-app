import { useState } from 'react';
import Head from 'next/head';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9', muted: '#a5b3cb',
  electric: '#1f6fff', electricText: '#4db2ff', cyan: '#22d3ee', critical: '#f87171', success: '#4ade80'
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export async function getServerSideProps(context) {
  const { slug } = context.query;
  let clientData = null;

  try {
    // Queries the optimized Supabase v2 layout framework tables directly
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clients?slug=eq.${slug}&select=id,slug,business_name,google_review_url,manager_phone,logo_url`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        clientData = data[0]; // Extract the first matched client object listing parameters
      }
    }
  } catch (err) {
    console.error('Handshake verification failed:', err);
  }

  return {
    props: {
      client: clientData,
      slug: slug || ''
    }
  };
}

export default function ReviewRouterPage({ client, slug }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!client) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.critical, fontWeight: '700', fontFamily: sans, padding: '1.5rem', textAlign: 'center' }}>
        ⚠️ Invalid QR Code / Route Not Setup.
      </div>
    );
  }

  const handleRating = async (stars) => {
    setRating(stars);
    
    // Log the initial customer interaction touchpoint into your scans analytics table tracking logs
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/scans_log`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: client.id,
          interaction_type: stars >= 4 ? 'google_redirect' : 'private_intercept'
        })
      });
    } catch (e) {
      console.error(e);
    }

    if (stars >= 4) {
      window.location.href = client.google_review_url;
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);

    const whatsappMsg = `⚠️ *Cognix Feedback Alert*\n\n*Business:* ${client.business_name}\n*Rating:* ${rating}/5 Stars ⭐\n\n*Customer Complaint:*\n"${feedback}"`;
    const waUrl = `https://wa.me{client.manager_phone}?text=${encodeURIComponent(whatsappMsg)}`;

    // Open WhatsApp synchronously inside click handler to bypass mobile popup blockers completely
    const waWindow = window.open(waUrl, '_blank');

    try {
      // Write the bad review into private logs linked cleanly via corporate UUID parameters
      await fetch(`${SUPABASE_URL}/rest/v1/private_reviews`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          client_id: client.id,
          stars: rating,
          feedback: feedback
        })
      });

      setDone(true);
    } catch (err) {
      console.error(err);
      if (!waWindow) window.location.href = waUrl;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, padding: '1.25rem', fontFamily: sans, color: c.text }}>
      <Head>
        <title>Review Shield Engine | Cognix</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ width: '100%', maxWidth: '26rem', borderRadius: '1rem', backgroundColor: c.surface, padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)', textAlign: 'center', border: '1px solid ' + c.line }}>
        {client.logo_url && <img src={client.logo_url} alt="" style={{ height: '3.5rem', width: 'auto', marginBottom: '1rem' }} />}
        
        <h2 style={{ fontSize: '1.55rem', fontWeight: '800', margin: '0.5rem 0', lineHeight: 1.3 }}>
          How was your experience at <br />
          <span style={{ color: c.electricText }}>{client.business_name}</span>?
        </h2>
        <p style={{ color: c.muted, fontSize: '0.95rem', margin: '0 0 2rem 0' }}>Tap a star below to rate your visit today.</p>

        {!done && rating === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
            {[1, 2, 3, 4, 5].map((stars) => (
              <button key={stars} onClick={() => handleRating(stars)} style={{ fontSize: '2.6rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                ⭐
              </button>
            ))}
          </div>
        )}

        {!done && rating > 0 && rating <= 3 && (
          <form onSubmit={handleSubmitFeedback} style={{ textAlign: 'left' }}>
            <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(248, 113, 113, 0.2)', marginBottom: '1rem' }}>
              <p style={{ color: c.critical, fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>
                🔒 Reputation Shield Active: Your experience stays off Google.
              </p>
            </div>
            
            <textarea required rows="4" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell management how we can fix this immediately..." style={{ width: '100%', borderRadius: '0.5rem', backgroundColor: c.bg, border: '1px solid ' + c.line, padding: '0.85rem', fontSize: '0.92rem', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: sans, resize: 'none' }} />
            
            <button type="submit" disabled={submitting} style={{ marginTop: '1rem', width: '100%', borderRadius: '0.5rem', backgroundColor: c.electric, padding: '1rem', color: '#fff', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
              {submitting ? 'Connecting...' : '🚀 Send to the Manager'}
            </button>
          </form>
        )}

        {done && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ color: c.success, fontWeight: '800', fontSize: '1.15rem', margin: '0' }}>Feedback Routed.</p>
            <p style={{ color: c.muted, fontSize: '0.92rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Your response has been securely filed in our database and a direct emergency alert has been sent to management via WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
