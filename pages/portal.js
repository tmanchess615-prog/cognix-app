import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// /portal  ->  where a client logs in to see how their stand is doing.
//
// Login is passwordless: the client types their email, receives a one-time
// link, clicks it, and is in. There is no password to forget or reset.
// Who may see what is decided by the database, not by this page: every query
// below only ever returns rows belonging to the business whose manager_email
// matches the email the person logged in with.
// ---------------------------------------------------------------------------

const SITE = 'https://cognix.co.za';
const SUPPORT_WHATSAPP = '27622393280';
const SUPPORT_EMAIL = 'lekalakalamashilo23@gmail.com';

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9', muted: '#a5b3cb',
  electric: '#1f6fff', electricText: '#4db2ff', green: '#34d399', amber: '#fbbf24', red: '#f87171',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.8rem', borderRadius: '0.6rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans,
};
const labelStyle = { display: 'block', color: c.muted, fontSize: '0.85rem', margin: '0.9rem 0 0.35rem 0' };
const primaryBtn = {
  display: 'inline-block', boxSizing: 'border-box', padding: '0.8rem 1.2rem', borderRadius: '0.6rem',
  border: 'none', background: c.electric, color: '#fff', fontWeight: 700, fontSize: '0.95rem',
  cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontFamily: sans,
};
const ghostBtn = {
  ...primaryBtn, background: 'transparent', border: '1px solid ' + c.line, color: c.text,
};

function toWhatsAppNumber(raw) {
  let d = String(raw || '').replace(/[^0-9]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '27' + d.slice(1); // South African local number
  return d;
}

// Customer-typed text can end up in a spreadsheet. A cell that starts with =, @
// (or a + / - followed by letters) can be run as a formula by Excel, so those
// get a leading apostrophe. Plain phone numbers like +27 82 123 4567 are left alone.
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && /[^0-9+\-\s().]/.test(s))) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return String(iso);
  }
}

function Frame({ children, onLogout, email }) {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: sans }}>
      <Head>
        <title>Cognix client portal</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: 'body{margin:0;background:#0f172a}' }} />
      </Head>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.25rem 1.25rem 4rem 1.25rem' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                         justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0 1rem 0',
                         borderBottom: '1px solid ' + c.line }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Cognix <span style={{ color: c.muted, fontWeight: 600, fontSize: '0.95rem' }}>client portal</span>
          </div>
          {onLogout && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: c.muted, fontSize: '0.85rem' }}>{email}</span>
              <button onClick={onLogout} style={{ ...ghostBtn, padding: '0.5rem 0.9rem' }}>Log out</button>
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <section style={{ background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem',
                      padding: '1.5rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                    alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{title}</h2>
        {right}
      </div>
      {subtitle && (
        <p style={{ color: c.muted, fontSize: '0.9rem', lineHeight: 1.55, margin: '0.5rem 0 0 0' }}>
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: '1rem' }}>{children}</div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{ flex: '1 1 9rem', background: c.bg, border: '1px solid ' + c.line,
                  borderRadius: '0.8rem', padding: '1rem' }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.3rem' }}>{label}</div>
      {hint && <div style={{ color: c.muted, fontSize: '0.78rem', marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
}

function LoginView() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setState('sending');
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: window.location.origin + '/portal' },
    });
    if (error) {
      setState('error');
      const lower = String(error.message || '').toLowerCase();
      setMessage(
        lower.includes('rate') || error.status === 429
          ? 'Too many login emails were requested. Please wait a few minutes and try again.'
          : 'We could not send the login link right now. Please try again in a moment. ('
            + error.message + ')'
      );
    } else {
      setState('sent');
    }
  }

  return (
    <div style={{ maxWidth: '26rem', margin: '3rem auto 0 auto', background: c.surface,
                  border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.75rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Log in</h1>
      {state === 'sent' ? (
        <div>
          <p style={{ color: c.green, fontWeight: 700, margin: '0.5rem 0' }}>Check your email</p>
          <p style={{ color: c.muted, lineHeight: 1.6, margin: 0 }}>
            We sent a login link to <b style={{ color: c.text }}>{email.trim().toLowerCase()}</b>.
            Open it on this phone or computer to come straight in. It can take a minute to arrive,
            so check your spam folder too. If it opens inside your email app, choose &quot;open in
            browser&quot;.
          </p>
          <button onClick={() => setState('idle')} style={{ ...ghostBtn, marginTop: '1.25rem' }}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p style={{ color: c.muted, lineHeight: 1.6, margin: 0 }}>
            Enter the email address Cognix has on file for your business. We will email you a
            one-time login link - no password needed.
          </p>
          <label style={labelStyle}>Your email address</label>
          <input style={inputStyle} type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="name@yourbusiness.co.za" />
          <button type="submit" disabled={state === 'sending'}
            style={{ ...primaryBtn, width: '100%', marginTop: '1rem' }}>
            {state === 'sending' ? 'Sending...' : 'Email me a login link'}
          </button>
          {state === 'error' && (
            <p role="alert" style={{ color: c.red, fontSize: '0.88rem', margin: '0.8rem 0 0 0' }}>
              {message}
            </p>
          )}
        </form>
      )}
      <p style={{ color: c.muted, fontSize: '0.8rem', lineHeight: 1.5, margin: '1.25rem 0 0 0' }}>
        Not a client yet, or not sure which email we have? Message us on{' '}
        <a href={'https://wa.me/' + SUPPORT_WHATSAPP} style={{ color: c.electricText }}>WhatsApp</a>.
      </p>
    </div>
  );
}

function Dashboard({ client, clients, onSelect, onClientUpdated }) {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [reviews, setReviews] = useState(null);
  const [reviewsError, setReviewsError] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [linkInput, setLinkInput] = useState(client.google_review_url || '');
  const [linkMsg, setLinkMsg] = useState(null);

  const standLink = client.slug ? SITE + '/r/' + client.slug : '';

  useEffect(() => {
    let alive = true;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const count = (type) => supabase.from('scans_log')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).eq('interaction_type', type).gte('created_at', since);

    Promise.all([count('tap_or_scan'), count('google_redirect'), count('private_intercept')])
      .then(([opens, google, priv]) => {
        if (!alive) return;
        const err = opens.error || google.error || priv.error;
        if (err) { setStatsError(err.message); return; }
        setStats({ opens: opens.count || 0, google: google.count || 0, priv: priv.count || 0 });
      });

    supabase.from('private_reviews')
      .select('id, stars, feedback, contact_phone, handled, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setReviewsError(error.message); setReviews([]); return; }
        setReviews(data || []);
      });
    return () => { alive = false; };
  }, [client.id]);

  const unhandled = (reviews || []).filter((r) => !r.handled).length;
  const shown = (reviews || []).filter((r) => {
    if (filter === 'open') return !r.handled;
    if (filter === 'low') return r.stars <= 2;
    if (filter === 'three') return r.stars === 3;
    return true;
  });
  const rated = stats ? stats.google + stats.priv : 0;
  const happyPct = rated > 0 ? Math.round((stats.google * 100) / rated) : null;

  async function toggleHandled(r) {
    const next = !r.handled;
    setNotice('');
    setReviews((list) => list.map((x) => (x.id === r.id ? { ...x, handled: next } : x)));
    const { data, error } = await supabase.from('private_reviews')
      .update({ handled: next }).eq('id', r.id).select('id');
    if (error || !data || data.length === 0) {
      setReviews((list) => list.map((x) => (x.id === r.id ? { ...x, handled: !next } : x)));
      setNotice('Could not update that message. Please try again.');
    }
  }

  function downloadCsv() {
    const rows = [['Date', 'Stars', 'Message', 'Call-back number', 'Handled']].concat(
      (reviews || []).map((r) => [fmtDate(r.created_at), r.stars, r.feedback || '',
        r.contact_phone || '', r.handled ? 'Yes' : 'No'])
    );
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cognix-feedback-' + (client.slug || 'stand') + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(standLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setNotice('Could not copy automatically. Please select the link and copy it.');
    }
  }

  async function saveLink(e) {
    e.preventDefault();
    const v = linkInput.trim();
    if (!/^https?:\/\/\S+$/i.test(v) || v.length > 500) {
      setLinkMsg({ type: 'error', text: 'Please paste the full link, starting with https://' });
      return;
    }
    setLinkMsg({ type: 'info', text: 'Saving...' });
    const { data, error } = await supabase.from('clients')
      .update({ google_review_url: v }).eq('id', client.id).select('id');
    if (error || !data || data.length === 0) {
      setLinkMsg({ type: 'error', text: 'Could not save that. Please try again, or message us.' });
      return;
    }
    onClientUpdated({ id: client.id, google_review_url: v });
    setLinkMsg({ type: 'ok', text: 'Saved. Happy customers are now sent to this link. Please test your stand once.' });
  }

  // Review request tool: message a past customer, or anyone who cannot tap or scan.
  const reqMessage = (reqName.trim() ? 'Hi ' + reqName.trim() + ',' : 'Hi,')
    + ' thank you for visiting ' + client.business_name
    + ". We'd love to hear how it went - it only takes a few seconds: " + standLink;
  const reqNumber = toWhatsAppNumber(reqPhone);
  const phoneOk = reqNumber.length >= 11 && reqNumber.length <= 15;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reqEmail.trim());
  const waHref = 'https://wa.me/' + reqNumber + '?text=' + encodeURIComponent(reqMessage);
  const smsHref = 'sms:+' + reqNumber + '?&body=' + encodeURIComponent(reqMessage);
  const mailHref = 'mailto:' + reqEmail.trim() + '?subject='
    + encodeURIComponent('How was your visit to ' + client.business_name + '?')
    + '&body=' + encodeURIComponent(reqMessage);

  function ReqButton({ href, label, enabled, primary }) {
    const base = { ...(primary ? primaryBtn : ghostBtn), display: 'block', width: '100%', marginTop: '0.6rem' };
    return enabled
      ? <a href={href} style={base}>{label}</a>
      : <span style={{ ...base, background: '#1a2744', color: '#5b6b8c', border: 'none',
                       cursor: 'not-allowed' }}>{label}</span>;
  }

  const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&ecc=H&data='
    + encodeURIComponent(standLink);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem',
                    marginTop: '1.5rem' }}>
        <h1 style={{ fontSize: '1.7rem', margin: 0 }}>{client.business_name}</h1>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.7rem',
          borderRadius: '9999px', background: client.active === false ? '#4a1d1d' : '#0f3d2e',
          color: client.active === false ? c.red : c.green }}>
          {client.active === false ? 'Paused' : 'Live'}
        </span>
        {clients.length > 1 && (
          <select value={client.id} onChange={(e) => onSelect(e.target.value)}
            style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.7rem' }}>
            {clients.map((x) => <option key={x.id} value={x.id}>{x.business_name}</option>)}
          </select>
        )}
      </div>
      {client.active === false && (
        <p style={{ color: c.amber, lineHeight: 1.55 }}>
          Your stand is switched off at the moment, so customers see a polite &quot;not taking
          responses&quot; message. Please contact Cognix to switch it back on.
        </p>
      )}
      {notice && <p role="alert" style={{ color: c.amber, margin: '0.75rem 0 0 0' }}>{notice}</p>}

      <Card title="How your stand is doing" subtitle="The last 30 days.">
        {statsError ? (
          <p style={{ color: c.muted, margin: 0 }}>
            Results are not available yet. Please check back later or message us.
          </p>
        ) : !stats ? (
          <p style={{ color: c.muted, margin: 0 }}>Loading...</p>
        ) : (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Stat label="Times the stand was opened" value={stats.opens} hint="Taps and scans" />
              <Stat label="Sent to Google" value={stats.google} hint="Rated 4 or 5 stars" />
              <Stat label="Private feedback" value={stats.priv} hint="Rated 3 stars or below" />
              <Stat label="Happy customers" value={happyPct === null ? '-' : happyPct + '%'}
                hint="Of those who rated" />
            </div>
            <p style={{ color: c.muted, fontSize: '0.78rem', lineHeight: 1.5, margin: '0.9rem 0 0 0' }}>
              &quot;Opened&quot; counts every time the page is opened, including repeat visits.
              &quot;Sent to Google&quot; is the number of people we sent to your Google page - we
              cannot see whether each one finished posting a review.
            </p>
          </div>
        )}
      </Card>

      <Card
        title="Private feedback"
        subtitle={reviews && reviews.length > 0
          ? (unhandled > 0
            ? unhandled + ' message' + (unhandled === 1 ? '' : 's') + ' still need a reply.'
            : 'Everything has been handled. Well done.')
          : 'Messages from customers who rated 3 stars or below appear here.'}
        right={reviews && reviews.length > 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select aria-label="Filter feedback" value={filter} onChange={(e) => setFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.7rem', fontSize: '0.9rem' }}>
              <option value="all">All messages</option>
              <option value="open">Still to handle</option>
              <option value="low">1-2 stars</option>
              <option value="three">3 stars</option>
            </select>
            <button onClick={downloadCsv} style={{ ...ghostBtn, padding: '0.5rem 0.9rem' }}>
              Download spreadsheet
            </button>
          </div>
        ) : null}
      >
        {reviewsError && (
          <p style={{ color: c.muted, margin: 0 }}>Feedback is not available yet. Please check back later.</p>
        )}
        {reviews === null && !reviewsError && <p style={{ color: c.muted, margin: 0 }}>Loading...</p>}
        {reviews && reviews.length === 0 && !reviewsError && (
          <p style={{ color: c.muted, margin: 0 }}>Nothing yet.</p>
        )}
        {shown.map((r) => (
          <div key={r.id} style={{ borderTop: '1px solid ' + c.line, padding: '1rem 0',
                                   opacity: r.handled ? 0.6 : 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.9rem', alignItems: 'center' }}>
              <span style={{ color: r.stars <= 2 ? c.red : c.amber, letterSpacing: '0.1em' }}
                aria-label={r.stars + ' out of 5 stars'}>
                {'\u2605'.repeat(r.stars) + '\u2606'.repeat(5 - r.stars)}
              </span>
              <span style={{ color: c.muted, fontSize: '0.82rem' }}>{fmtDate(r.created_at)}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: r.handled ? c.green : c.amber }}>
                {r.handled ? 'HANDLED' : 'NEW'}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {r.feedback || '(No message written)'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}>
              {r.contact_phone && (
                <span style={{ fontSize: '0.9rem' }}>
                  Call back: <a href={'tel:' + r.contact_phone.replace(/[^0-9+]/g, '')}
                    style={{ color: c.electricText }}>{r.contact_phone}</a>
                  {' '}<a href={'https://wa.me/' + toWhatsAppNumber(r.contact_phone)}
                    style={{ color: c.electricText }}>WhatsApp</a>
                </span>
              )}
              <button onClick={() => toggleHandled(r)}
                style={{ ...ghostBtn, padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                {r.handled ? 'Mark as not handled' : 'Mark as handled'}
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Card title="Your stand" subtitle="This is the link on your stand's NFC tag and QR code.">
        {standLink ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 14rem' }}>
              <div style={{ background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem',
                            padding: '0.8rem', wordBreak: 'break-all', color: c.electricText }}>
                {standLink}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <button onClick={copyLink} style={ghostBtn}>{copied ? 'Copied' : 'Copy link'}</button>
                <a href={standLink} target="_blank" rel="noreferrer" style={ghostBtn}>Test it</a>
              </div>
            </div>
            <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
              <img src={qrSrc} alt={'QR code for ' + client.business_name} width={150} height={150}
                style={{ background: '#fff', borderRadius: '0.5rem', display: 'block' }} />
              <a href={qrSrc} target="_blank" rel="noreferrer"
                style={{ color: c.electricText, fontSize: '0.85rem', display: 'inline-block', marginTop: '0.5rem' }}>
                Open large QR code
              </a>
            </div>
          </div>
        ) : (
          <p style={{ color: c.muted, margin: 0 }}>
            Your link has not been set up yet. Please message us and we will sort it out.
          </p>
        )}
      </Card>

      <Card title="Ask a past customer for a review"
        subtitle="For someone who is not at your stand, or whose phone cannot tap or scan. Choose how to send it - your own app opens with the message ready, and you press send.">
        <label style={{ ...labelStyle, marginTop: 0 }}>Customer&apos;s first name (optional)</label>
        <input style={inputStyle} value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="e.g. Thandi" />
        <label style={labelStyle}>Cellphone number</label>
        <input style={inputStyle} type="tel" value={reqPhone} onChange={(e) => setReqPhone(e.target.value)}
          placeholder="082 123 4567" />
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)}
          placeholder="name@example.com" />
        <div style={{ background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem',
                      padding: '0.8rem', color: c.muted, fontSize: '0.88rem', lineHeight: 1.55,
                      marginTop: '1rem' }}>
          <div style={{ color: c.text, fontWeight: 700, marginBottom: '0.3rem' }}>Message preview</div>
          {standLink ? reqMessage : 'Your link needs to be set up first.'}
        </div>
        <ReqButton href={waHref} label="Send on WhatsApp" enabled={!!standLink && phoneOk} primary />
        <ReqButton href={smsHref} label="Send as SMS (from a phone)" enabled={!!standLink && phoneOk} />
        <ReqButton href={mailHref} label="Send by email" enabled={!!standLink && emailOk} />
        <p style={{ color: c.muted, fontSize: '0.78rem', lineHeight: 1.5, margin: '1rem 0 0 0' }}>
          Only message people who have dealt with your business and shared their details with you,
          and send each person one request.
        </p>
      </Card>

      <Card title="Your Google review link"
        subtitle="Happy customers (4 or 5 stars) are sent here. If your Google link ever changes, update it below.">
        <form onSubmit={saveLink}>
          <input style={inputStyle} value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://g.page/r/..." aria-label="Google review link" />
          <button type="submit" style={{ ...primaryBtn, marginTop: '0.75rem' }}>Save link</button>
          {linkMsg && (
            <p role="status" style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem',
              color: linkMsg.type === 'ok' ? c.green : linkMsg.type === 'error' ? c.red : c.muted }}>
              {linkMsg.text}
            </p>
          )}
        </form>
      </Card>

      <Card title="Need help?">
        <p style={{ color: c.muted, margin: 0, lineHeight: 1.6 }}>
          Message us on <a href={'https://wa.me/' + SUPPORT_WHATSAPP} style={{ color: c.electricText }}>WhatsApp</a>{' '}
          or email <a href={'mailto:' + SUPPORT_EMAIL} style={{ color: c.electricText }}>{SUPPORT_EMAIL}</a>.
        </p>
      </Card>
    </div>
  );
}

export default function Portal() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [clients, setClients] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data && data.session ? data.session : null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setSession(next || null);
    });
    return () => {
      alive = false;
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session && session.user ? session.user.id : null;
  const email = session && session.user ? session.user.email : '';

  useEffect(() => {
    if (!userId) { setClients(null); setLoadError(''); return undefined; }
    let alive = true;
    supabase.from('clients')
      .select('id, slug, business_name, google_review_url, manager_email, active')
      .order('business_name')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setLoadError(error.message); setClients([]); return; }
        const list = data || [];
        setClients(list);
        setSelectedId((cur) => cur || (list[0] ? list[0].id : ''));
      });
    return () => { alive = false; };
  }, [userId]);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setClients(null);
    setSelectedId('');
  }

  function clientUpdated(patch) {
    setClients((list) => (list || []).map((x) => (x.id === patch.id ? { ...x, ...patch } : x)));
  }

  if (session === undefined) {
    return <Frame><p style={{ color: c.muted, marginTop: '2rem' }}>Loading...</p></Frame>;
  }
  if (!session) {
    return <Frame><LoginView /></Frame>;
  }
  if (clients === null) {
    return <Frame onLogout={logout} email={email}><p style={{ color: c.muted, marginTop: '2rem' }}>Loading...</p></Frame>;
  }
  if (clients.length === 0) {
    return (
      <Frame onLogout={logout} email={email}>
        <div style={{ maxWidth: '30rem', margin: '3rem auto 0 auto', background: c.surface,
                      border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>No business found</h1>
          <p style={{ color: c.muted, lineHeight: 1.6, margin: 0 }}>
            You are logged in as <b style={{ color: c.text }}>{email}</b>, but we do not have a
            business linked to that email. Please log out and try the email address you gave us
            when you signed up, or message us on{' '}
            <a href={'https://wa.me/' + SUPPORT_WHATSAPP} style={{ color: c.electricText }}>WhatsApp</a>.
          </p>
          {loadError && <p style={{ color: c.muted, fontSize: '0.8rem' }}>({loadError})</p>}
        </div>
      </Frame>
    );
  }

  const current = clients.find((x) => x.id === selectedId) || clients[0];
  return (
    <Frame onLogout={logout} email={email}>
      <Dashboard key={current.id} client={current} clients={clients}
        onSelect={setSelectedId} onClientUpdated={clientUpdated} />
    </Frame>
  );
}
