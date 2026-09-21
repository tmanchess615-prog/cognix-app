import { useState } from 'react';
import Head from 'next/head';

// ---- Your business details. Edit here if anything changes. ------------------
const PHONE_DISPLAY = '062 239 3280';
const PHONE_TEL = '0622393280';
const WHATSAPP_NUMBER = '27622393280'; // your number with 27 instead of the leading 0
const EMAIL = 'lekalakalamashilo23@gmail.com';
const DELIVERY = '7-10 working days anywhere in South Africa via tracked express courier';
const PAYSTACK_LINK = ''; // optional: paste a Paystack link to add a "Subscribe online" button
// -----------------------------------------------------------------------------

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9', muted: '#a5b3cb',
  electric: '#1f6fff', electricText: '#4db2ff', cyan: '#22d3ee', star: '#fbbf24',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const whatsappHref = 'https://wa.me/' + WHATSAPP_NUMBER;
const contactHref = whatsappHref + '?text=' + encodeURIComponent(
  'Hi Cognix, I would like to know more about the Smart Counter Stand (R1,499/mo).'
);
const CTA_TEXT = 'Contact us';

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
const section = { padding: '4.5rem 0', borderTop: '1px solid ' + c.line };
const ctaStyle = {
  display: 'inline-block', background: c.electric, color: '#fff', textDecoration: 'none',
  fontWeight: 800, fontSize: '1.1rem', padding: '1.05rem 1.9rem', borderRadius: '0.6rem',
  boxShadow: '0 12px 32px rgba(31, 111, 255, 0.45)',
};
const ghostStyle = {
  display: 'inline-block', color: c.text, textDecoration: 'none', fontWeight: 700,
  fontSize: '1.05rem', padding: '1rem 1.6rem', borderRadius: '0.6rem',
  border: '1px solid ' + c.line, background: c.surface,
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

const journey = [
  ['Contact us', 'Message or call us and we will answer your questions.'],
  ['Send us the details', 'Your delivery location and Google review link, as listed above.'],
  ['Stand at your door', 'Set up for your Google page and delivered in 7-10 working days.'],
];

const faqs = [
  ['Do my customers need an app?',
    'No. They tap their phone on the stand, or scan the QR code with the normal camera.'],
  ['Do I have to give you access to my Google account?',
    'No. We only need your Google review link. Adding us as a manager on your Business Profile '
    + 'is optional, and only if you would rather we find the link for you.'],
  ['Will this get me to number one on Google?',
    'We cannot promise rankings, and nobody outside Google can. More recent, genuine reviews '
    + 'help customers trust you, and that is what the stand is built to get.'],
  ['What happens to unhappy customers?',
    'They can post on Google or message your manager privately. Both options are shown to '
    + 'everyone.'],
  ['How long does delivery take?',
    '7-10 working days anywhere in South Africa, by tracked express courier, at no charge.'],
  ['How do I cancel?',
    'Message us and we will cancel your subscription and collect the stand.'],
];

function Logo({ height }) {
  return <img src={LOGO_SRC} alt="Cognix" style={{ display: 'block', height: height, width: 'auto' }} />;
}

// A drawing of the stand on a counter, with a phone tapping it
function qrPath(m) {
  let d = '';
  let seed = 11;
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      seed = (seed * 73 + 41) % 251;
      const finder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!finder && seed % 2 === 0) {
        d += 'M' + (x * m).toFixed(1) + ' ' + (y * m).toFixed(1)
          + 'h' + m.toFixed(1) + 'v' + m.toFixed(1) + 'h-' + m.toFixed(1) + 'z';
      }
    }
  }
  return d;
}

function Finder({ x, y, m }) {
  return (
    <g transform={'translate(' + x + ' ' + y + ')'}>
      <rect width={7 * m} height={7 * m} fill="#0b1224" />
      <rect x={m} y={m} width={5 * m} height={5 * m} fill="#ffffff" />
      <rect x={2 * m} y={2 * m} width={3 * m} height={3 * m} fill="#0b1224" />
    </g>
  );
}

function HeroScene() {
  const m = 120 / 21;
  const star = '\u2605';
  return (
    <svg viewBox="0 0 520 460" role="img" style={{ width: '100%', maxWidth: '34rem', height: 'auto' }}
      aria-label="A Cognix Smart Counter Stand on a counter, with a customer's phone tapping it">
      <defs>
        <radialGradient id="cxGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1f6fff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#1f6fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cxAcrylic" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fd0ff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#9fd0ff" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="cxCounterH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d2f57" stopOpacity="0" />
          <stop offset="18%" stopColor="#1d2f57" stopOpacity="1" />
          <stop offset="82%" stopColor="#1d2f57" stopOpacity="1" />
          <stop offset="100%" stopColor="#1d2f57" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cxFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="cxLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4d7fd6" stopOpacity="0" />
          <stop offset="20%" stopColor="#4d7fd6" stopOpacity="1" />
          <stop offset="80%" stopColor="#4d7fd6" stopOpacity="1" />
          <stop offset="100%" stopColor="#4d7fd6" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="260" cy="230" r="240" fill="url(#cxGlow)" />
      <rect y="372" width="520" height="88" fill="url(#cxCounterH)" />
      <rect y="372" width="520" height="88" fill="url(#cxFade)" />
      <rect y="372" width="520" height="3" fill="url(#cxLine)" />

      <text x="52" y="112" fontSize="22" fill={c.star} opacity="0.85">{star}</text>
      <text x="80" y="66" fontSize="14" fill={c.star} opacity="0.55">{star}</text>
      <text x="26" y="172" fontSize="12" fill={c.star} opacity="0.4">{star}</text>

      <g transform="translate(-50 0)">
        <ellipse cx="260" cy="378" rx="120" ry="8" fill="#000000" opacity="0.35" />
        <rect x="176" y="356" width="168" height="18" rx="6" fill="#0c1730" stroke="#35528d" />
        <rect x="150" y="60" width="220" height="304" rx="16" fill="url(#cxAcrylic)"
          stroke="#6fb4ff" strokeOpacity="0.6" strokeWidth="2" />
        <rect x="166" y="76" width="188" height="272" rx="10" fill="#ffffff" />
        <image href={LOGO_SRC} x="176" y="84" width="168" height="58" />
        <text x="260" y="168" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0b2a6b"
          fontFamily="system-ui, sans-serif">Tap or scan to rate us</text>
        <text x="260" y="200" textAnchor="middle" fontSize="22" fill={c.star} letterSpacing="3">
          {star + star + star + star + star}
        </text>
        <g transform="translate(200 214)">
          <rect width="120" height="120" fill="#ffffff" />
          <path d={qrPath(m)} fill="#0b1224" />
          <Finder x={0} y={0} m={m} />
          <Finder x={14 * m} y={0} m={m} />
          <Finder x={0} y={14 * m} m={m} />
        </g>
      </g>

      <g fill="none" stroke="#4db2ff" strokeWidth="3" strokeLinecap="round">
        <path d="M352 205 Q344 228 352 251" opacity="0.95" />
        <path d="M343 195 Q328 228 343 261" opacity="0.6" />
        <path d="M334 185 Q312 228 334 271" opacity="0.32" />
      </g>

      <g transform="translate(374 146) rotate(-10)">
        <rect width="106" height="200" rx="18" fill="#0b1224" stroke="#4a6fb5" strokeWidth="3" />
        <rect x="7" y="7" width="92" height="186" rx="12" fill="#101a33" />
        <rect x="38" y="12" width="30" height="5" rx="2.5" fill="#2a3b63" />
        <text x="53" y="46" textAnchor="middle" fontSize="9" fill={c.muted}>Example Cafe</text>
        <text x="53" y="70" textAnchor="middle" fontSize="15" fill={c.star} letterSpacing="1">
          {star + star + star + star + star}
        </text>
        <rect x="16" y="90" width="74" height="24" rx="6" fill="#1f6fff" />
        <text x="53" y="105" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
          Leave a Google review
        </text>
        <rect x="16" y="122" width="74" height="24" rx="6" fill="#22335a" />
        <text x="53" y="137" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
          Message the manager
        </text>
      </g>
    </svg>
  );
}

function NfcIcon() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" stroke={c.electricText}
      strokeWidth="5" strokeLinecap="round" aria-hidden="true">
      <circle cx="26" cy="42" r="5" fill={c.electricText} stroke="none" />
      <path d="M38 28 Q50 42 38 56" />
      <path d="M48 20 Q68 42 48 64" opacity="0.7" />
      <path d="M58 12 Q86 42 58 72" opacity="0.4" />
    </svg>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{ width: '13.5rem', height: '25rem', borderRadius: '2rem', border: '7px solid #2a3b63',
                  background: '#0b1224', padding: '0.7rem 0.8rem', boxSizing: 'border-box',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)' }}>
      <div style={{ width: '3.5rem', height: '0.3rem', background: '#2a3b63', borderRadius: '9999px',
                    margin: '0 auto 0.8rem auto' }} />
      {children}
    </div>
  );
}

function Step({ n, title, text, children }) {
  return (
    <div style={{ width: '13.5rem' }}>
      {children}
      <div style={{ marginTop: '1.1rem', display: 'flex', gap: '0.6rem', alignItems: 'baseline' }}>
        <span style={{ color: c.electricText, fontWeight: 800, fontSize: '1.2rem' }}>{n}</span>
        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{title}</span>
      </div>
      <p style={{ ...bodyStyle, fontSize: '0.95rem', marginTop: '0.35rem' }}>{text}</p>
    </div>
  );
}

const screen = { flex: 1, display: 'flex', flexDirection: 'column', fontSize: '0.9rem' };
const miniButton = {
  borderRadius: '0.5rem', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700,
  fontSize: '0.85rem', color: '#fff',
};

function Storyboard() {
  const [n, setN] = useState(0);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem 2rem', justifyContent: 'center' }}>
      <Step n="1" title="Tap or scan"
        text="Customers tap their phone on the stand or scan the code. No app to install.">
        <PhoneFrame>
          <div style={{ ...screen, alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        gap: '0.9rem' }}>
            <NfcIcon />
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Tap your phone on the stand</div>
            <div style={{ color: c.muted, fontSize: '0.85rem' }}>or scan the QR code with your camera</div>
          </div>
        </PhoneFrame>
      </Step>

      <Step n="2" title="Rate the visit"
        text="One tap on the stars, with your business name at the top. Try it here.">
        <PhoneFrame>
          <div style={{ ...screen, justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ color: c.electricText, fontWeight: 700, fontSize: '0.8rem' }}>Example Cafe</div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', margin: '0.4rem 0 0.9rem 0' }}>
              How was your visit?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.05rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setN(i)} aria-label={i + ' out of 5 stars'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                           fontSize: '2rem', lineHeight: 1, color: i <= n ? c.star : '#34456b' }}>
                  &#9733;
                </button>
              ))}
            </div>
            <div style={{ color: c.muted, fontSize: '0.8rem', marginTop: '0.7rem' }}>
              Tap a star to rate it
            </div>
          </div>
        </PhoneFrame>
      </Step>

      <Step n="3" title="Choose what to do"
        text="Post on Google, or write a private message. Everyone sees both options.">
        <PhoneFrame>
          <div style={{ ...screen, gap: '0.6rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', textAlign: 'center' }}>Thank you!</div>
            <div style={{ ...miniButton, background: c.electric }}>Leave a public Google review</div>
            <div style={{ borderTop: '1px solid ' + c.line, paddingTop: '0.6rem', color: c.muted,
                          fontSize: '0.75rem' }}>
              Or tell the manager privately
            </div>
            <div style={{ border: '1px solid ' + c.line, borderRadius: '0.5rem', padding: '0.5rem',
                          color: c.muted, fontSize: '0.78rem', lineHeight: 1.4, height: '3.6rem' }}>
              The coffee was cold and we waited 20 minutes.
            </div>
            <div style={{ ...miniButton, background: '#22335a' }}>Send on WhatsApp</div>
          </div>
        </PhoneFrame>
      </Step>

      <Step n="4" title="You hear about it"
        text="Private messages open in WhatsApp, ready to send to your manager.">
        <PhoneFrame>
          <div style={{ ...screen, borderRadius: '0.7rem', overflow: 'hidden', background: '#0d1b2a' }}>
            <div style={{ background: '#123c3a', padding: '0.6rem 0.7rem', fontWeight: 700,
                          fontSize: '0.85rem' }}>
              Manager
            </div>
            <div style={{ padding: '0.8rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ alignSelf: 'flex-start', maxWidth: '88%', background: '#1c2b3a',
                            borderRadius: '0.6rem 0.6rem 0.6rem 0.1rem', padding: '0.55rem 0.65rem',
                            fontSize: '0.8rem', lineHeight: 1.45 }}>
                Feedback for Example Cafe: 3 out of 5 stars. The coffee was cold and we waited
                20 minutes.
              </div>
              <div style={{ color: c.muted, fontSize: '0.7rem' }}>Example message</div>
            </div>
          </div>
        </PhoneFrame>
      </Step>
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

      <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 23, 42, 0.95)',
                    borderBottom: '1px solid ' + c.line }}>
        <div style={{ ...wrap, display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                      justifyContent: 'space-between', gap: '0.75rem 1.5rem',
                      padding: '0.75rem 1.25rem' }}>
          <a href="#top" style={{ display: 'block' }}><Logo height="2.6rem" /></a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1.5rem' }}>
            <a href="#how" style={navLink}>How it works</a>
            <a href="#assets" style={navLink}>What we need</a>
            <a href="#pricing" style={navLink}>Pricing</a>
            <a href="#faq" style={navLink}>Questions</a>
            <a href={contactHref} style={{ ...navLink, color: '#fff', background: c.electric,
                                           padding: '0.55rem 1.1rem', borderRadius: '0.5rem' }}>
              {CTA_TEXT}
            </a>
          </div>
        </div>
      </nav>

      <div id="top" style={{ background: 'radial-gradient(60rem 30rem at 78% 0%, rgba(31, 111, 255, 0.20), rgba(15, 23, 42, 0) 70%)' }}>
        <div style={wrap}>
          <header style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem 3rem', alignItems: 'center',
                           padding: '4rem 0 4.5rem 0' }}>
            <div style={{ flex: '1 1 26rem' }}>
              <h1 style={{ fontSize: 'clamp(2.3rem, 7vw, 3.4rem)', fontWeight: 800,
                           letterSpacing: '-0.03em', lineHeight: 1.06, margin: '0 0 1.4rem 0' }}>
                Turn happy customers into Google reviews with one tap.
              </h1>
              <p style={{ ...bodyStyle, fontSize: '1.15rem', maxWidth: '34rem' }}>
                The Cognix Smart Counter Stand sits on your counter. Customers tap their phone or
                scan the code, rate their visit and reach your Google page in seconds. Anyone with
                a problem can message your manager privately.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem',
                            alignItems: 'center' }}>
                <a href={contactHref} style={ctaStyle}>{CTA_TEXT}</a>
                <a href="#how" style={{ ...contactLink, fontSize: '1.02rem' }}>See how it works</a>
              </div>
              <p style={{ ...bodyStyle, fontSize: '0.92rem', marginTop: '1.25rem', maxWidth: '32rem' }}>
                R1,499 per month. No setup fee. Cancel any time. Delivered in {DELIVERY}.
              </p>
            </div>
            <div style={{ flex: '1 1 20rem', display: 'flex', justifyContent: 'center' }}>
              <HeroScene />
            </div>
          </header>
        </div>
      </div>

      <div style={wrap}>
        <section id="how" style={section}>
          <h2 style={h2Style}>See it in action</h2>
          <p style={{ ...bodyStyle, maxWidth: '40rem', marginBottom: '3rem' }}>
            Four steps, all on the customer's own phone. These are examples of what your customers
            and your manager see.
          </p>
          <Storyboard />
        </section>

        <section id="assets" style={section}>
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

        <section id="pricing" style={section}>
          <h2 style={h2Style}>One simple monthly price</h2>
          <p style={{ ...bodyStyle, maxWidth: '40rem', marginBottom: '2.5rem' }}>
            Everything below is included. There is no setup fee and no contract to break.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', background: c.surface,
                        border: '1px solid ' + c.electric, borderRadius: '1rem', padding: '2rem',
                        boxShadow: '0 0 48px rgba(31, 111, 255, 0.18)' }}>
            <div style={{ flex: '1 1 14rem' }}>
              <div style={{ fontSize: '3.4rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                R1,499
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: c.muted,
                               letterSpacing: 0 }}> /month</span>
              </div>
              <div style={{ color: c.text, marginTop: '0.75rem', fontWeight: 600, maxWidth: '15rem',
                            lineHeight: 1.45 }}>
                Your stand, setup and delivery are all included.
              </div>
              <div style={{ marginTop: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a href={contactHref} style={ctaStyle}>{CTA_TEXT}</a>
                {PAYSTACK_LINK && (
                  <a href={PAYSTACK_LINK} target="_blank" rel="noreferrer" style={ghostStyle}>
                    Subscribe online
                  </a>
                )}
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

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '3.5rem 0 1.5rem 0' }}>
            From first message to your counter
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem 2rem' }}>
            {journey.map((j, i) => (
              <div key={j[0]} style={{ flex: '1 1 15rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: '0 0 2.2rem', height: '2.2rem', borderRadius: '9999px',
                              background: c.electric, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontWeight: 800 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: '0.3rem' }}>{j[0]}</div>
                  <p style={{ ...bodyStyle, fontSize: '0.95rem' }}>{j[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" style={section}>
          <h2 style={h2Style}>Questions</h2>
          <div style={{ marginTop: '1.5rem' }}>
            {faqs.map((f) => (
              <div key={f[0]} style={{ padding: '1.1rem 0', borderTop: '1px solid ' + c.line }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{f[0]}</div>
                <p style={{ ...bodyStyle, maxWidth: '42rem' }}>{f[1]}</p>
              </div>
            ))}
          </div>
        </section>

        <footer id="contact" style={{ ...section, paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 22rem' }}>
              <h2 style={h2Style}>Contact us</h2>
              <p style={{ ...bodyStyle, maxWidth: '30rem' }}>
                Questions, or want to see a stand before you subscribe? Call or message us and we
                will help.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a href={contactHref} style={ctaStyle}>WhatsApp us</a>
                <a href={'tel:' + PHONE_TEL} style={ghostStyle}>Call {PHONE_DISPLAY}</a>
                <a href={'mailto:' + EMAIL} style={ghostStyle}>Email us</a>
              </div>
              <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

// The Cognix logo, embedded so that no image upload is needed. Do not edit this line.
const LOGO_SRC = 'data:image/webp;base64,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';
