import { useState } from 'react';
import Head from 'next/head';

// ---- Your business details. Hardcoded perfectly. --------------------------
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

const DESCRIPTION = 'The Cognix Smart Counter Stand makes it easy for customers to leave a Google review, and lets unhappy customers message your manager privately. R1,499 per month.';

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
    title: 'Your physical delivery location',
    why: 'Necessary to route and safely dispatch your custom-branded acrylic Smart Counter Stands directly to your retail shop floor or point of sale checkout desk.',
    benefit: 'Free, secure, tracked door-to-door courier delivery direct to your storefront anywhere in South Africa within 7-10 working days.',
  },
  {
    title: 'Google Business Profile Manager access or direct link',
    why: 'Necessary so our systems can look up and pull your short review link configuration safely to map out our intelligent customer survey routing engine layout.',
    benefit: 'Customers land instantly on your live review page in 1 second with zero manual keyword typing or browsing, boosting your Maps profile positioning layout.',
  },
  {
    title: 'Automation / POS / CRM system hooks',
    why: 'Optional integration data from the customer tracking systems you already use day-to-day (such as HubSpot, Zapier, Jane, or Timely) to map customer workflows.',
    benefit: 'Allows seamless synchronization of hardware touchpoints with automated marketing milestones without adding manual administration to your plate.',
  },
];

function Logo({ height }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Cognix<span style={{color: c.cyan}}>.</span></span>;
  }
  return (
    <img src="/cognix-logo.png" alt="Cognix" onError={() => setFailed(true)}
      style={{ display: 'block', height: height, width: 'auto' }} />
  );
}

function Demo() {
  const [n, setN] = useState(0);
  return (
    <div style={{ background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '22rem' }}>
      <p style={{ margin: '0 0 0.25rem 0', color: c.electricText, fontSize: '0.85rem', fontWeight: 600 }}>
        Try it. This is what your customers see.
      </p>
      <p style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
        How was your visit to Example Cafe?
      </p>
      <div style={{ display: 'flex', gap: '0.15rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setN(i)} aria-label={i + ' out of 5 stars'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', fontSize: '2.2rem', lineHeight: 1, color: i <= n ? '#fbbf24' : '#34456b' }}>
            ★
          </button>
        ))}
      </div>
      {n > 0 && (
        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ background: c.electric, color: '#fff', borderRadius: '0.5rem', padding: '0.8rem', textAlign: 'center', fontWeight: 700 }}>
            Leave a public Google review
          </div>
          <div style={{ background: '#22335a', color: '#fff', borderRadius: '0.5rem', padding: '0.8rem', textAlign: 'center', fontWeight: 700, marginTop: '0.6rem' }}>
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

      <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(15, 23, 42, 0.94)', borderBottom: '1px solid ' + c.line }}>
        <div style={{ ...wrap, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem 1.5rem', padding: '0.75rem 1.25rem' }}>
          <a href="#top" style={{ color: c.text, textDecoration: 'none' }}><Logo height="2.6rem" /></a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1.5rem' }}>
            <a href="#assets" style={navLink}>What we need</a>
            <a href="#pricing" style={navLink}>Pricing</a>
            <a href="#contact" style={navLink}>Contact</a>
            <a href={whatsappHref} style={{ ...navLink, color: '#fff', background: c.electric, padding: '0.55rem 1rem', borderRadius: '0.5rem' }}>
              WhatsApp us
            </a>
          </div>
        </div>
      </nav>

      <div style={wrap} id="top">
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'center', padding: '4.5rem 0 5rem 0' }}>
          <div style={{ flex: '1 1 26rem' }}>
            <h1 style={{ fontSize: '3.4rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, margin: '0 0 1.4rem 0' }}>
              Turn happy customers into Google reviews with one tap.
            </h1>
            <p style={{ ...bodyStyle, fontSize: '1.15rem', maxWidth: '34rem' }}>
              The Cognix Smart Counter Stand sits on your counter. Customers tap their phone or scan the code, rate their visit and reach your Google page in seconds. Anyone with a problem can message your manager privately.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <a href={ctaHref} target={ctaTarget} rel="noreferrer" style={ctaStyle}>{CTA_TEXT}</a>
            </div>
          </div>
          <div style={{ flex: '1 1 20rem', display: 'flex', justifyContent: 'center' }}>
            <Demo />
          </div>
        </header>

        <section id="assets" style={{ ...section, borderTop: '1px solid ' + c.line }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={h2Style}>What we need to get you running</h2>
            <p style={{ ...bodyStyle, maxWidth: '36rem', margin: '0 auto' }}>
              To deliver your custom smart stand setup within {DELIVERY}, we collect three key specifications at checkout:
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {assets.map((item, idx) => (
              <div key={idx} style={{ flex: '1 1 18rem', background: c.surface, border: '1px solid ' + c.line, padding: '2rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>{item.title}</h3>
                <p style={{ ...bodyStyle, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  <strong style={{ color: '#fff' }}>Why it is needed:</strong> {item.why}
                </p>
                <p style={{ ...bodyStyle, fontSize: '0.95rem' }}>
                  <strong style={{ color: c.cyan }}>The Benefit:</strong> {item.benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" style={{ ...section, borderTop: '1px solid ' + c.line, textAlign: 'center' }}>
          <h2 style={h2Style}>One simple monthly license</h2>
          <p style={{ ...bodyStyle, marginBottom: '2.5rem' }}>No contracts, no setup loops, cancel at any time.</p>
          <div style={{ background: c.surface, border: '2px solid ' + c.electric, padding: '3rem 2rem', borderRadius: '1rem', maxWidth: '24rem', margin: '0 auto' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: c.electricText }}>PREMIUM PLAN</span>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, margin: '1rem 0' }}>R1,499<span style={{ fontSize: '1.1rem', color: c.muted, fontWeight: 400 }}>/mo</span></div>
            <p style={{ ...bodyStyle, fontSize: '0.95rem', marginBottom: '2rem' }}>Includes 1x Pre-Programmed Acrylic Smart Stand</p>
