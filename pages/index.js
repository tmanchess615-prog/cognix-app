import { useState } from 'react';
import Head from 'next/head';

// ---- Your business details. Edit here if anything changes. -----------------
const PHONE_DISPLAY = '062 239 3280';
const PHONE_TEL = '0622393280';
const WHATSAPP_NUMBER = '27622393280'; // your number with 27 instead of the leading 0
const EMAIL = 'lekalakalamashilo23@gmail.com';
const DELIVERY = '7-10 working days anywhere in South Africa via tracked express courier';
const PAYSTACK_LINK = ''; // paste your Paystack payment page link here when it is ready
// ---------------------------------------------------------------------------

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9', muted: '#a5b3cb',
  electric: '#1f6fff', electricText: '#4db2ff', cyan: '#22d3ee',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const whatsappHref = 'https://wa.me/' + WHATSAPP_NUMBER;
const ctaHref = PAYSTACK_LINK || whatsappHref + '?text=' + encodeURIComponent(
  'Hi Cognix, I would like to get started with the R1,499/mo Smart Counter Stand.'
);
const ctaTarget = PAYSTACK_LINK ? '_blank' : undefined;
const CTA_TEXT = 'Get Started (R1,499/mo)';

const DESCRIPTION = 'The Cognix Smart Counter Stand makes it easy for customers to leave a Google '
  + 'review, and lets unhappy customers message your manager privately. R1,499 per month.';

const wrap = { maxWidth: '68rem', margin: '0 auto', padding: '0 1.25rem' };
const h2Style = {
  fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15,
  margin: '0 0 0.75rem 0',
};
const bodyStyle = { color: c.muted, fontSize: '1.02rem', lineHeight: 1.65, margin: 0 };
const navLink = { color: c.muted, textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' };
const contactLink = { color: c.electricText, textDecoration: 'none', fontWeight: 600 };
const section = { padding: '4.5rem 0' };

const ctaStyle = {
  display: 'inline-block', background: c.electric, color: '#fff', textDecoration: 'none',
  fontWeight: 800, fontSize: '1.1rem', padding: '1.05rem 1.9rem', borderRadius: '0.6rem',
  boxShadow: '0 12px 32px rgba(31, 111, 255, 0.45)',
};

const assets = [
  {
    title: 'Your delivery location',
    tag: '',
    why: 'So we can send your custom-branded acrylic Smart Counter Stand straight to your shop '
      + 'or point of sale.',
    benefit: 'Free, secure, tracked door-to-door delivery to your storefront within '
      + '7-10 working days.',
  },
  {
    title: 'Your Google review link',
    tag: '',
    why: 'Every stand is set up to open your own Google review page, so we need your short '
      + 'review link. If you would rather not look for it, add us as a manager on your Google '
      + 'Business Profile and we will find it for you.',
    benefit: 'Customers reach your live review page in one tap, with no searching and no typing. '
      + 'They can also send your manager a private message instead.',
  },
  {
    title: 'Your booking, POS or CRM tool',
    tag: 'Optional',
    why: 'Tell us which tool you use, for example HubSpot, Timely, Jane or Zapier. You do not '
      + 'need this to go live.',
    benefit: 'We use it to plan follow-up options around the tools you already use, and we will '
      + 'always tell you plainly what is available today.',
  },
];

const included = [
  'One custom-branded acrylic Smart Counter Stand with NFC tap and QR code',
  'Set up to open your own Google review page',
  'Private feedback goes to your manager on WhatsApp or email',
  'Free tracked delivery in 7-10 working days, anywhere in South Africa',
  'No setup fee. Cancel any time',
];

function Logo({ height }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Cognix</span>;
  }
  return (
    <img src="/cognix-logo.png" alt="Cognix" onError={() => setFailed(true)}
      style={{ display: 'block', height: height, width: 'auto' }} />
  );
}

function Demo() {
  const [n, setN] = useState(0);
  return (
    <div style={{ background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem',
                  padding: '1.5rem', width: '100%', maxWidth: '22rem' }}>
      <p style={{ margin: '0 0 0.25rem 0', color: c.electricText, fontSize: '0.85rem', fontWeight: 600 }}>
        Try it. This is what your customers see.
      </p>
      <p style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
        How was your visit to Example Cafe?
      </p>
      <div style={{ display: 'flex', gap: '0.15rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setN(i)} aria-label={i + ' out of 5 stars'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem',
                     fontSize: '2.2rem', lineHeight: 1, color: i <= n ? '#fbbf24' : '#34456b' }}>
            &#9733;
          </button>
        ))}
      </div>
      {n > 0 && (
        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ background: c.electric, color: '#fff', borderRadius: '0.5rem',
                        padding: '0.8rem', textAlign: 'center', fontWeight: 700 }}>
            Leave a public Google review
          </div>
          <div style={{ background: '#22335a', color: '#fff', borderRadius: '0.5rem',
                        padding: '0.8rem', textAlign: 'center', fontWeight: 700,
                        marginTop: '0.6rem' }}>
            Send to the manager on WhatsApp
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ background: c.bg, color: c.text, fontFamily: sans, minHeight: '100vh' }}>
      <Head>
        <title>Cognix | Google review stands for South African businesses</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: 'html{scroll-behavior:smooth}body{margin:0;background:#0f172a}',
        }} />
      </Head>

      <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 23, 42, 0.94)',
                    borderBottom: '1px solid ' + c.line }}>
        <div style={{ ...wrap, display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                      justifyContent: 'space-between', gap: '0.75rem 1.5rem', padding: '0.75rem 1.25rem' }}>
          <a href="#top" style={{ color: c.text, textDecoration: 'none' }}><Logo height="2.6rem" /></a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1.5rem' }}>
            <a href="#assets" style={navLink}>What we need</a>
            <a href="#pricing" style={navLink}>Pricing</a>
            <a href="#contact" style={navLink}>Contact</a>
            <a href={whatsappHref} style={{ ...navLink, color: '#fff', background: c.electric,
                                            padding: '0.55rem 1rem', borderRadius: '0.5rem' }}>
              WhatsApp us
            </a>
          </div>
        </div>
      </nav>

      <div style={wrap} id="top">
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center',
                         padding: '4.5rem 0 5rem 0' }}>
          <div style={{ flex: '1 1 26rem' }}>
            <h1 style={{ fontSize: '3.4rem', fontWeight: 800, letterSpacing: '-0.03em',
                         lineHeight: 1.06, margin: '0 0 1.4rem 0' }}>
              Turn happy customers into Google reviews with one tap.
            </h1>
            <p style={{ ...bodyStyle, fontSize: '1.15rem', maxWidth: '34rem' }}>
              The Cognix Smart Counter Stand sits on your counter. Customers tap their phone or scan
              the code, rate their visit and reach your Google page in seconds. Anyone with a
              problem can message your manager privately.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <a href={ctaHref} target={ctaTarget} rel="noreferrer" style={ctaStyle}>{CTA_TEXT}</a>
            </div>
            <p style={{ ...bodyStyle, fontSize: '0.92rem', marginTop: '1.1rem', maxWidth: '32rem' }}>
              No setup fee. Cancel any time. Delivered in {DELIVERY}.
            </p>
          </div>
          <div style={{ flex: '1 1 18rem', display: 'flex', justifyContent: 'center' }}>
            <Demo />
          </div>
        </header>

        <section id="assets" style={{ ...section, borderTop: '1px solid ' + c.line }}>
          <h2 style={h2Style}>What we need from you to get your stand live</h2>
          <p style={{ ...bodyStyle, maxWidth: '40rem', marginBottom: '2.5rem' }}>
            Once you subscribe, we ask for the following. The first two are required. The third is
            optional and not needed to go live.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid ' + c.line,
                        borderRadius: '1rem', overflow: 'hidden', background: c.surface }}>
            {assets.map((a, i) => (
              <div key={a.title} style={{ flex: '1 1 17rem', padding: '1.75rem',
                borderLeft: i === 0 ? 'none' : '1px solid ' + c.line,
                borderTop: '3px solid ' + (i === 2 ? c.line : c.electric) }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem 0' }}>
                  {a.title}
                  {a.tag && (
                    <span style={{ marginLeft: '0.6rem', fontSize: '0.78rem', fontWeight: 600,
                                   color: c.muted, border: '1px solid ' + c.line,
                                   borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>
                      {a.tag}
                    </span>
                  )}
                </h3>
                <div style={{ color: c.electricText, fontWeight: 700, fontSize: '0.9rem',
                              marginBottom: '0.3rem' }}>Why we need it</div>
                <p style={{ ...bodyStyle, marginBottom: '1.25rem' }}>{a.why}</p>
                <div style={{ color: c.electricText, fontWeight: 700, fontSize: '0.9rem',
                              marginBottom: '0.3rem' }}>What you get</div>
                <p style={bodyStyle}>{a.benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" style={{ ...section, borderTop: '1px solid ' + c.line }}>
          <h2 style={h2Style}>One simple monthly price</h2>
          <p style={{ ...bodyStyle, maxWidth: '40rem', marginBottom: '2.5rem' }}>
            Everything below is included. There is no setup fee and no contract to break.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', background: c.surface,
                        border: '1px solid ' + c.electric, borderRadius: '1rem', padding: '2rem',
                        boxShadow: '0 0 48px rgba(31, 111, 255, 0.18)' }}>
            <div style={{ flex: '1 1 14rem' }}>
              <div style={{ fontSize: '3.4rem', fontWeight: 800, letterSpacing: '-0.03em',
                            lineHeight: 1 }}>
                R1,499
              </div>
              <div style={{ color: c.muted, marginTop: '0.4rem' }}>per month, billed by card</div>
              <div style={{ marginTop: '1.75rem' }}>
                <a href={ctaHref} target={ctaTarget} rel="noreferrer" style={ctaStyle}>{CTA_TEXT}</a>
              </div>
            </div>
            <ul style={{ flex: '2 1 20rem', margin: 0, padding: 0, listStyle: 'none' }}>
              {included.map((item) => (
                <li key={item} style={{ display: 'flex', gap: '0.75rem', padding: '0.7rem 0',
                                        borderBottom: '1px solid ' + c.line, lineHeight: 1.5 }}>
                  <span style={{ color: c.cyan, fontWeight: 800 }}>&#10003;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer id="contact" style={{ ...section, borderTop: '1px solid ' + c.line, paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 20rem' }}>
              <h2 style={h2Style}>Talk to us</h2>
              <p style={{ ...bodyStyle, maxWidth: '30rem' }}>
                Questions, or want to see a stand before you subscribe? Call or message us and
                we will help.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <span style={{ color: c.muted }}>Phone and WhatsApp: </span>
                  <a href={'tel:' + PHONE_TEL} style={contactLink}>{PHONE_DISPLAY}</a>
                </div>
                <div>
                  <span style={{ color: c.muted }}>Email: </span>
                  <a href={'mailto:' + EMAIL} style={contactLink}>{EMAIL}</a>
                </div>
                <div>
                  <span style={{ color: c.muted }}>Delivery: </span>
                  <span>{DELIVERY}</span>
                </div>
              </div>
            </div>
            <div style={{ flex: '0 1 auto' }}>
              <Logo height="4rem" />
            </div>
          </div>
          <p style={{ ...bodyStyle, fontSize: '0.8rem', marginTop: '3rem' }}>
            &copy; 2026 Cognix South Africa. Payments are processed by Paystack. Google decides
            how businesses are ranked; Cognix makes it easier for your customers to leave a review.
          </p>
        </footer>
      </div>
    </div>
  );
}
