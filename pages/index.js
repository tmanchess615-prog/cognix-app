import Head from 'next/head';

export default function Home() {
  const PHONE_DISPLAY = '062 239 3280';
  const PHONE_TEL = '0622393280';
  const EMAIL = 'lekalakalamashilo23@gmail.com';
  const DELIVERY = '7-10 working days anywhere in South Africa via tracked express courier';
  
  return (
    <div style={{ background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif', minHeight: '100vh', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <Head>
        <title>Cognix | Smart Counter Stands South Africa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          Turn happy customers into Google reviews with one tap.
        </h1>
        <p style={{ color: '#a5b3cb', fontSize: '1.1rem', margin: '1.5rem 0 3rem 0', lineHeight: 1.6 }}>
          Place a Cognix Smart Counter Stand on your desk. Customers tap their phone or scan the QR code to leave a 5-star review instantly. Unhappy customers are safely routed to message your manager privately.
        </p>

        {/* Requirements & Benefits Section */}
        <div style={{ textAlign: 'left', background: '#131f38', border: '1px solid #22335a', padding: '2rem', borderRadius: '1rem', marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#fff', marginTop: 0 }}>What we need to get you running:</h3>
          
          <p style={{ fontSize: '0.95rem', color: '#a5b3cb' }}>
            <strong>1. Delivery Location:</strong> Needed to courier your acrylic stand. <span style={{ color: '#22d3ee' }}>Benefit: Free door-to-door tracked delivery anywhere in SA within {DELIVERY}.</span>
          </p>
          
          <p style={{ fontSize: '0.95rem', color: '#a5b3cb' }}>
            <strong>2. Google Review Short Link:</strong> Needed to map the stand routing. (Or give us owner/manager access to your Google Business Profile and we will grab it for you). <span style={{ color: '#22d3ee' }}>Benefit: 1-second customer review redirection with no searching.</span>
          </p>
          
          <p style={{ fontSize: '0.95rem', color: '#a5b3cb' }}>
            <strong>3. POS / Booking / CRM Tool (Optional):</strong> Tell us if you use HubSpot, Timely, Jane, or Zapier. <span style={{ color: '#22d3ee' }}>Benefit: Helps us plan automated follow-up triggers for your daily workflow.</span>
          </p>
        </div>

        {/* Pricing Matrix Component */}
        <div style={{ background: '#131f38', border: '2px solid #1f6fff', padding: '2.5rem', borderRadius: '1rem', marginBottom: '4rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4db2ff' }}>PREMIUM LICENSE</span>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, margin: '1rem 0', color: '#fff' }}>R1,499<span style={{ fontSize: '1.1rem', color: '#a5b3cb', fontWeight: 400 }}>/mo</span></div>
          <p style={{ color: '#a5b3cb', margin: '0 0 2rem 0' }}>Includes 1x Premium Stand • No Setup Fees • Cancel Anytime</p>
          <a href={`https://wa.me.`} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#1f6fff', color: '#fff', textDecoration: 'none', fontWeight: 800, padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 12px 32px rgba(31, 111, 255, 0.45)' }}>
            Get Started via WhatsApp
          </a>
        </div>

        {/* Clean Onboarding Footer */}
        <footer style={{ borderTop: '1px solid #22335a', padding: '2rem 0', fontSize: '1rem' }}>
          <p style={{ margin: '0.5rem 0', color: '#a5b3cb' }}>📞 Call/WhatsApp: <a href={`tel:${PHONE_TEL}`} style={{ color: '#4db2ff', textDecoration: 'none', fontWeight: 600 }}>{PHONE_DISPLAY}</a></p>
          <p style={{ margin: '0.5rem 0', color: '#a5b3cb' }}>✉️ Email Support: <a href={`mailto:${EMAIL}`} style={{ color: '#4db2ff', textDecoration: 'none', fontWeight: 600 }}>{EMAIL}</a></p>
          <p style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '3rem' }}>© 2026 Cognix South Africa. Backed secure transactions via Paystack.</p>
        </footer>
      </div>
    </div>
  );
}
