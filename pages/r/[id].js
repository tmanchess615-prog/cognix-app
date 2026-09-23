// pages/r/[id].js
import { supabase } from '../../lib/supabaseClient';

export async function getServerSideProps(context) {
  const { id } = context.params; // Extracts the unique UUID straight from the NFC URL path

  // Look up the store details using your exact active database columns
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, business_name, subscription_status, google_review_url')
    .eq('id', id)
    .single();

  // Safety Kill Switch: If store doesn't exist or hasn't paid, throw a 404/Not Found page
  if (error || !client || client.subscription_status !== 'active') {
    return { notFound: true };
  }

  return {
    props: { client }
  };
}

export default function SmartRoute({ client }) {
  const handleStarClick = (rating) => {
    if (rating >= 4) {
      // 🚀 Happy customers (4 or 5 stars) go instantly to their Google Review layout
      window.location.href = client.google_review_url;
    } else {
      // 🛑 1 to 3 star ratings are intercepted away from Google Maps entirely
      // Redirects them to a simple private customer service success route
      window.location.href = '/feedback-thanks';
    }
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '4rem 2rem', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111827',
      backgroundColor: '#fff',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          {client.business_name}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2.5rem' }}>
          How was your experience with us today?
        </p>
        
        {/* Five-Star Rating Selector */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.75rem', 
          fontSize: '2.75rem', 
          cursor: 'pointer',
          userSelect: 'none'
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span 
              key={star} 
              onClick={() => handleStarClick(star)}
              style={{ transition: 'transform 0.1s ease' }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.15)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              ⭐
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
