import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  // ⚠️ EDIT THESE LINES WITH YOUR REAL SUPPORT DETAILS
  const PHONE_NUMBER = "+27 82 123 4567"; // <-- Type your phone/WhatsApp number here
  const EMAIL_ADDRESS = "tmanchess615@gmail.com"; // <-- Your business email address
  const PAYSTACK_LINK = "https://paystack.com"; // <-- We will swap this placeholder later

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', minHeight: '100vh', padding: '0', margin: '0' }}>
      
      {/* Top Navigation Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', maxWidth: '72rem', margin: '0 auto', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.05em' }}>Cognix<span style={{ color: '#38bdf8' }}>.</span></div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href={`https://wa.me{PHONE_NUMBER.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>⚡ Chat on WhatsApp</a>
          <a href={`tel:${PHONE_NUMBER}`} style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>{PHONE_NUMBER}</a>
        </div>
      </nav>

      {/* Main Pitch Section */}
      <header style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', padding: '5rem 1.5rem 4rem 1.5rem' }}>
        <span style={{ backgroundColor: '#1e3a8a', color: '#60a5fa', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', tracking: '0.05em' }}>South Africa's #1 Countertop Growth Tool</span>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: '1.1', color: '#ffffff', marginTop: '1.5rem', letterSpacing: '-0.02em' }}>
          Get 5-Star Google Reviews <br />
          <span style={{ color: '#3b82f6' }}>On Autopilot.</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '1.5rem', lineHeight: '1.6', maxWidth: '38rem', margin: '1.5rem auto 0 auto' }}>
          Boost your local search ranking, dominate local competitors, and flood your business with new customers. Place a Cognix Smart Stand on your counter and let your customers do the marketing for you.
        </p>

        {/* Subscription Checkout Button */}
        <div style={{ marginTop: '3rem' }}>
          <a href={PAYSTACK_LINK} target="_blank" rel="noreferrer" style={{ display: 'inline-block', backgroundColor: '#2563eb', padding: '1.2rem 2.5rem', borderRadius: '0.75rem', fontWeight: '800', fontSize: '1.1rem', textDecoration: 'none', color: '#fff', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.4)' }}>
            Get Started (R1,499/mo)
          </a>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem', fontWeight: '500' }}>
            Includes 1x Premium Smart Counter Stand • Free Setup • Cancel Anytime
          </p>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', fontSize: '1.75rem' }}>
          <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
        </div>
      </header>

      {/* Value Proposition / Benefits Grid */}
      <section style={{ backgroundColor: '#1e293b', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h2 style={{ textTransform: 'uppercase', color: '#38bdf8', fontSize: '0.9rem', fontWeight: '800', textAlign: 'center', tracking: '0.1em' }}>Why Google Reviews Matter</h2>
          <p style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginTop: '0.5rem', color: '#fff' }}>How Your Business Wins With Cognix</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '3rem' }}>
            
            {/* Benefit 1 */}
            <div style={{ flex: '1 1 18rem', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: '0' }}>Rank #1 on Google Maps</h3>
              <p style={{ color: '#94a3b8', marginTop: '0.75rem', lineHeight: '1.5', fontSize: '0.95rem' }}>Google rewards businesses with frequent, positive reviews. Cognix skyrockets your feedback volume, pushing your store to the top of local search listings automatically.</p>
            </div>

            {/* Benefit 2 */}
            <div style={{ flex: '1 1 18rem', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤝</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: '0' }}>Instant Customer Trust</h3>
              <p style={{ color: '#94a3b8', marginTop: '0.75rem', lineHeight: '1.5', fontSize: '0.95rem' }}>93% of local customers read online reviews before choosing a restaurant, hair salon, or retail shop. An active 5-star profile makes you the obvious choice in your area.</p>
            </div>

            {/* Benefit 3 */}
            <div style={{ flex: '1 1 18rem', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📲</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: '0' }}>1-Second Tap Technology</h3>
              <p style={{ color: '#94a3b8', marginTop: '0.75rem', lineHeight: '1.5', fontSize: '0.95rem' }}>No typing or searching. Customers simply tap their smartphones or scan your custom tabletop QR stand, and their review screen opens instantly.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Direct Contact & Support Footer */}
      <footer style={{ maxWidth: '64rem', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center', borderTop: '1px solid #1e293b' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>Have questions? Let's talk business.</h3>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Contact us directly for custom hardware orders or multi-store deployments across South Africa.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem', fontSize: '1.1rem' }}>
          <div>📞 <span style={{ fontWeight: '700', color: '#fff' }}>Call/WhatsApp:</span> <a href={`tel:${PHONE_NUMBER}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>{PHONE_NUMBER}</a></div>
          <div>✉️ <span style={{ fontWeight: '700', color: '#fff' }}>Email:</span> <a href={`mailto:${EMAIL_ADDRESS}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>{EMAIL_ADDRESS}</a></div>
        </div>

        <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '5rem' }}>
          © 2026 Cognix South Africa. All Rights Reserved. Fully backed, secure recurring payment processing via Paystack.
        </p>
      </footer>

    </div>
  );
}
