import { useState } from 'react';
import Head from 'next/head';

// ---------------------------------------------------------------------------
// /send-request  ->  a small tool for the BUSINESS (or you) to send a review
// request to someone who is not at the stand: a past customer, or someone
// without a phone that can tap or scan.
//
// Nothing is sent by Cognix. Each button opens the person's OWN email, WhatsApp
// or messaging app on their own device, with the message already written and
// addressed, and they press send themselves. That is why it costs R0, needs no
// accounts or approvals, and cannot be misused through your servers.
//
// The link in the message is the same /r/<slug> survey the stand uses, so a
// customer who had a bad time is routed to private feedback, not Google.
// ---------------------------------------------------------------------------

function toWhatsAppNumber(raw) {
  let d = String(raw || '').replace(/[^0-9]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '27' + d.slice(1); // South African local number
  return d;
}

function buildMessage(business, name, link) {
  const greeting = name.trim() ? 'Hi ' + name.trim() + ',' : 'Hi,';
  return greeting + ' thank you for visiting ' + business.trim() + '. '
    + "We'd love to hear how it went - it only takes a few seconds: " + link.trim();
}

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9',
  muted: '#a5b3cb', electric: '#1f6fff',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const fieldStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.8rem', borderRadius: '0.6rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans,
};
const labelStyle = { display: 'block', color: c.muted, fontSize: '0.85rem', margin: '1rem 0 0.35rem 0' };

function ActionButton({ href, label, enabled, primary }) {
  const base = {
    display: 'block', boxSizing: 'border-box', width: '100%', padding: '0.95rem',
    borderRadius: '0.6rem', fontSize: '1rem', fontWeight: 700, textAlign: 'center',
    textDecoration: 'none', marginTop: '0.7rem',
  };
  if (!enabled) {
    return (
      <span style={{ ...base, background: '#1a2744', color: '#5b6b8c', cursor: 'not-allowed' }}>
        {label}
      </span>
    );
  }
  return (
    <a href={href} style={{ ...base, background: primary ? c.electric : '#22335a', color: '#fff' }}>
      {label}
    </a>
  );
}

export default function SendRequest() {
  const [business, setBusiness] = useState('');
  const [link, setLink] = useState('https://cognix.co.za/r/');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const ready = business.trim().length > 0 && /^https?:\/\/\S+\/r\/\S+/.test(link.trim());
  const message = ready ? buildMessage(business, name, link) : '';
  const subject = 'How was your visit to ' + business.trim() + '?';
  const number = toWhatsAppNumber(phone);
  const phoneOk = number.length >= 11 && number.length <= 15;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const emailHref = 'mailto:' + email.trim() + '?subject=' + encodeURIComponent(subject)
    + '&body=' + encodeURIComponent(message);
  const waHref = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
  const smsHref = 'sms:+' + number + '?&body=' + encodeURIComponent(message);

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: sans,
                  display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
      <Head>
        <title>Send a review request</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: 'body{margin:0;background:#0f172a}' }} />
      </Head>
      <div style={{ width: '100%', maxWidth: '28rem', background: c.surface,
                    border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.75rem',
                    alignSelf: 'flex-start' }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.4rem 0' }}>Send a review request</h1>
        <p style={{ color: c.muted, lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>
          For a past customer, or someone who cannot tap or scan the stand. Fill in the details,
          then choose how to send it. It opens your own app with the message ready - you press send.
        </p>

        <label style={labelStyle}>Business name</label>
        <input style={fieldStyle} value={business} onChange={(e) => setBusiness(e.target.value)}
          placeholder="e.g. Cape Coffee Club" />

        <label style={labelStyle}>The business's link</label>
        <input style={fieldStyle} value={link} onChange={(e) => setLink(e.target.value)}
          placeholder="https://cognix.co.za/r/their-link-name" />

        <label style={labelStyle}>Customer's first name (optional)</label>
        <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Thandi" />

        <label style={labelStyle}>Customer's email</label>
        <input style={fieldStyle} type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />

        <label style={labelStyle}>Customer's cellphone number</label>
        <input style={fieldStyle} type="tel" value={phone}
          onChange={(e) => setPhone(e.target.value)} placeholder="082 123 4567" />

        {ready && (
          <div style={{ marginTop: '1.25rem', background: c.bg, border: '1px solid ' + c.line,
                        borderRadius: '0.6rem', padding: '0.8rem', color: c.muted,
                        fontSize: '0.88rem', lineHeight: 1.55 }}>
            <div style={{ color: c.text, fontWeight: 700, marginBottom: '0.3rem' }}>Message preview</div>
            {message}
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <ActionButton href={waHref} label="Send on WhatsApp" enabled={ready && phoneOk} primary />
          <ActionButton href={smsHref} label="Send as SMS (from a phone)" enabled={ready && phoneOk} />
          <ActionButton href={emailHref} label="Send by email" enabled={ready && emailOk} />
        </div>

        {!ready && (
          <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: '1rem 0 0 0' }}>
            Add the business name and its full link (ending in /r/ and their link name) to continue.
          </p>
        )}
        <p style={{ color: c.muted, fontSize: '0.78rem', lineHeight: 1.5, margin: '1.25rem 0 0 0' }}>
          Only message people who have dealt with the business and shared their details with it,
          and send each person one request.
        </p>
      </div>
    </div>
  );
}
