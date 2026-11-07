import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// /portal  ->  where a client logs in to see how their stand is doing, and to
// look after their customers.
//
// Login is passwordless: the client types their email, receives a one-time
// link, clicks it, and is in. Who may see what is decided by the database,
// not by this page: every query below only ever returns rows belonging to the
// business whose manager_email matches the email the person logged in with.
// ---------------------------------------------------------------------------

const SITE = 'https://cognix.co.za';
const SUPPORT_WHATSAPP = '27622393280';
const SUPPORT_EMAIL = 'lekalakalamashilo23@gmail.com';

// Light and dark mode: follows the device's setting, with a small switch to override it.
const THEME_DARK = '--bg:#0d0f12;--surface:#15181d;--surface2:#1d222a;--line:#2a303a;--text:#f2f4f7;--muted:#9aa3b0;--faint:#6b7480;--star-off:#3a414c;--danger:#fca5a5;--link:#7dd3c8;--shadow:0 24px 60px rgba(0,0,0,.45);--ok:#34d399;--warn:#fbbf24;--bad:#f87171;--ok-bg:#0f3d2e;--bad-bg:#4a1d1d;';
const THEME_LIGHT = '--bg:#f5f6f8;--surface:#ffffff;--surface2:#eef0f3;--line:#dde1e7;--text:#12151a;--muted:#566070;--faint:#8a93a0;--star-off:#d3d8df;--danger:#b42318;--link:#0f766e;--shadow:0 24px 60px rgba(16,24,40,.12);--ok:#047857;--warn:#b45309;--bad:#b91c1c;--ok-bg:#d1fae5;--bad-bg:#fee2e2;';
const THEME_CSS = ':root{--accent:#0f766e;' + THEME_DARK + '}'
  + '@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){' + THEME_LIGHT + '}}'
  + ':root[data-theme="light"]{' + THEME_LIGHT + '}:root[data-theme="dark"]{' + THEME_DARK + '}'
  + 'html,body{margin:0;background:var(--bg)}';

const c = {
  bg: 'var(--bg)', surface: 'var(--surface)', line: 'var(--line)', text: 'var(--text)', muted: 'var(--muted)',
  electric: 'var(--accent)', electricText: 'var(--link)', green: 'var(--ok)', amber: 'var(--warn)', red: 'var(--bad)',
};

function ThemeToggle() {
  const [mode, setMode] = useState('dark');
  useEffect(() => {
    let saved = '';
    try { saved = window.localStorage.getItem('cx-theme') || ''; } catch (e) { /* ignore */ }
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setMode(saved || (prefersLight ? 'light' : 'dark'));
  }, []);
  function flip() {
    const next = mode === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { window.localStorage.setItem('cx-theme', next); } catch (e) { /* ignore */ }
    setMode(next);
  }
  return (
    <button type="button" onClick={flip}
      aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)',
               borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}
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
const smallBtn = { ...ghostBtn, padding: '0.45rem 0.85rem', fontSize: '0.85rem' };

const STATUS = {
  new: 'New', contacted: 'Contacted', review_requested: 'Review requested',
  reviewed: 'Left a review', complaint: 'Complaint', resolved: 'Resolved',
  lost: 'No longer a customer',
};
const STATUS_COLOR = {
  new: c.electricText, contacted: c.muted, review_requested: c.amber, reviewed: c.green,
  complaint: c.red, resolved: c.green, lost: c.muted,
};
const CONSENT = {
  unknown: 'Not recorded', follow_up_only: 'Follow-up only',
  marketing_ok: 'Agreed to hear from you', opted_out: "Don't contact",
  notified: 'Told how we use their details',
};
const CONSENT_HELP = {
  unknown: 'We have not recorded whether this person agreed to be contacted.',
  follow_up_only: 'They shared their details so you could follow up on their feedback.',
  marketing_ok: 'They agreed to hear from your business.',
  opted_out: 'They asked not to be contacted. Review requests are switched off for them.',
  notified: 'They were told how their details are used, and how to opt out.',
};
const KIND = {
  note: 'Note', review_request: 'Review request', status_change: 'Status',
  complaint: 'Complaint', call: 'Contacted',
};
const CUSTOMER_COLS = 'id, full_name, email, phone, notes, tags, source, status, consent, '
  + 'consent_note, consent_at, follow_up_on, last_contacted_at, created_at, updated_at';

// The message used to ask a customer for a review. When the Cognix team sends it for
// a business, it says so, so the customer knows who is writing to them.
function requestMessage(client, cu, onBehalf) {
  const first = (cu.full_name || '').trim().split(/\s+/)[0];
  const hello = first ? 'Hi ' + first + ',' : 'Hi,';
  // A personal link: what this customer does with it shows on their own history.
  const link = client.slug ? SITE + '/r/' + client.slug + '?c=' + cu.id : '';
  const lead = onBehalf
    ? ' this is Cognix, sending a quick message on behalf of ' + client.business_name + '. Thank you for visiting! '
    : ' thank you for visiting ' + client.business_name + '. ';
  return hello + lead + "We'd love to hear how it went - it only takes a few seconds: " + link
    + " Reply STOP and we won't message you again.";
}

// Who may be asked for a review right now, on a given channel.
function canAsk(cu, channel, asked, cutoff) {
  if (cu.consent === 'opted_out' || cu.consent === 'follow_up_only') return false;
  if (cu.status === 'complaint' || cu.status === 'lost' || cu.status === 'reviewed') return false;
  const last = asked[cu.id] || (cu.status === 'review_requested' ? cu.last_contacted_at : null);
  if (last && new Date(last).getTime() > cutoff) return false;
  if (channel === 'email') return isEmail(cu.email);
  const n = normPhone(cu.phone);
  return !!n && n.length >= 11 && n.length <= 15;
}

async function recordReviewRequest(client, customer, channel) {
  const label = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'email' }[channel];
  await supabase.from('customer_activities').insert({
    customer_id: customer.id, client_id: client.id, kind: 'review_request', channel,
    body: 'Review request opened via ' + label,
  });
  const patch = { last_contacted_at: new Date().toISOString() };
  if (customer.status === 'new' || customer.status === 'contacted') patch.status = 'review_requested';
  const { data, error } = await supabase.from('customers')
    .update(patch).eq('id', customer.id).select(CUSTOMER_COLS);
  return !error && data && data[0] ? data[0] : null;
}

function normPhone(raw) {
  let d = String(raw || '').replace(/[^0-9]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '27' + d.slice(1); // South African local number
  return d || null;
}
function isEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
}
function todayStr() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the viewer's own time zone
}
function isDue(cu) {
  return !!cu.follow_up_on && cu.follow_up_on <= todayStr();
}
function displayName(cu) {
  return cu.full_name || cu.email || cu.phone || 'Unnamed';
}

// The database hands back at most 1000 rows per request, so a long list is read in pages.
async function fetchAllRows(build, pageSize = 1000, cap = 30000) {
  const rows = [];
  for (let from = 0; from < cap; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}

// Customer-typed text can end up in a spreadsheet. A cell that starts with =, @
// (or a + / - followed by letters) can be run as a formula by Excel, so those
// get a leading apostrophe. Plain phone numbers like +27 82 123 4567 are left alone.
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && /[^0-9+\-\s().]/.test(s))) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Small CSV reader: handles quoted cells, commas or semicolons (South African
// Excel often uses semicolons), a leading byte-order mark, and Windows line breaks.
function parseCsv(input) {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const HEADER_NAMES = {
  name: ['name', 'fullname', 'customername', 'customer', 'clientname'],
  first: ['firstname', 'first', 'givenname'],
  last: ['lastname', 'last', 'surname'],
  email: ['email', 'emailaddress', 'mail'],
  phone: ['phone', 'phonenumber', 'cell', 'cellphone', 'cellnumber', 'mobile', 'mobilenumber',
    'whatsapp', 'tel', 'telephone', 'contactnumber', 'number'],
  notes: ['notes', 'note', 'comments', 'comment'],
  tags: ['tags', 'tag', 'group', 'groups'],
};

function readCustomerRows(rows) {
  if (rows.length < 2) {
    return { items: [], error: 'The file needs a header row and at least one customer.' };
  }
  const head = rows[0].map((h) => String(h).toLowerCase().replace(/[^a-z]/g, ''));
  const idx = {};
  Object.keys(HEADER_NAMES).forEach((k) => {
    idx[k] = head.findIndex((h) => HEADER_NAMES[k].includes(h));
  });
  if (idx.name < 0 && idx.first < 0 && idx.email < 0 && idx.phone < 0) {
    return { items: [], error: 'We could not find name, email or phone columns. Please use our template.' };
  }
  const body = rows.slice(1);
  const items = body.slice(0, 1000).map((r) => {
    const get = (k) => (idx[k] >= 0 && r[idx[k]] != null ? String(r[idx[k]]).trim() : '');
    const name = get('name') || [get('first'), get('last')].filter(Boolean).join(' ');
    return { name, email: get('email'), phone: get('phone'), notes: get('notes'), tags: get('tags') };
  });
  return { items, truncated: body.length > 1000 };
}

function cleanImportItem(it) {
  const email = it.email.trim().toLowerCase();
  const np = normPhone(it.phone);
  const goodEmail = email && isEmail(email) && email.length <= 254 ? email : null;
  const goodPhone = np && np.length >= 11 && np.length <= 15 ? it.phone.trim().slice(0, 40) : null;
  const row = {
    full_name: it.name.slice(0, 120) || null,
    email: goodEmail,
    phone: goodPhone,
    notes: it.notes.slice(0, 2000) || null,
    tags: it.tags.slice(0, 200) || null,
  };
  return { row, ok: !!(row.full_name || row.email || row.phone), np: goodPhone ? np : null };
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return String(iso);
  }
}
function fmtDay(d) {
  if (!d) return '';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { dateStyle: 'medium' });
  } catch (e) {
    return String(d);
  }
}

function Frame({ children, onLogout, email }) {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: sans }}>
      <Head>
        <title>Cognix client portal</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </Head>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.25rem 1.25rem 4rem 1.25rem' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                         justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0 1rem 0',
                         borderBottom: '1px solid ' + c.line }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Cognix <span style={{ color: c.muted, fontWeight: 600, fontSize: '0.95rem' }}>client portal</span>
          </div>
          <ThemeToggle />
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

function Pill({ text, color }) {
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px',
                   border: '1px solid ' + color, color }}>
      {text}
    </span>
  );
}

function ActionLink({ href, label, enabled, primary, onClick, newTab }) {
  const base = { ...(primary ? primaryBtn : ghostBtn), display: 'block', width: '100%', marginTop: '0.6rem' };
  if (!enabled) {
    return (
      <span style={{ ...base, background: 'var(--surface2)', color: 'var(--faint)', border: 'none', cursor: 'not-allowed' }}>
        {label}
      </span>
    );
  }
  return (
    <a href={href} onClick={onClick} target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined} style={base}>
      {label}
    </a>
  );
}

function LoginView() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!isEmail(clean)) {
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
        <form onSubmit={submit} noValidate>
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

// ---------------------------------------------------------------------------
// Customers (the CRM)
// ---------------------------------------------------------------------------

function formFrom(cu) {
  return {
    name: cu.full_name || '', email: cu.email || '', phone: cu.phone || '', notes: cu.notes || '',
    tags: cu.tags || '', status: cu.status, consent: cu.consent, consentNote: cu.consent_note || '',
    followUp: cu.follow_up_on || '',
  };
}

function CustomerDetail({ customer, client, onBack, onChange, onDeleted, onBehalf }) {
  const [f, setF] = useState(formFrom(customer));
  const [acts, setActs] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [msg, setMsg] = useState(null);
  const standLink = client.slug ? SITE + '/r/' + client.slug : '';

  useEffect(() => {
    let alive = true;
    const load = (cols) => supabase.from('customer_activities').select(cols)
      .eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(100);
    load('id, kind, channel, body, created_at, actor_email').then(async (res) => {
      let out = res;
      if (res.error) out = await load('id, kind, channel, body, created_at');
      if (alive) setActs(out.error ? [] : (out.data || []));
    });
    return () => { alive = false; };
  }, [customer.id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const dirty = JSON.stringify(f) !== JSON.stringify(formFrom(customer));

  async function addActivity(kind, channel, body) {
    const { data, error } = await supabase.from('customer_activities')
      .insert({ customer_id: customer.id, client_id: client.id, kind, channel: channel || null, body: body || null })
      .select('*');
    if (error || !data || !data[0]) return null;
    setActs((list) => [data[0], ...(list || [])]);
    return data[0];
  }

  async function patchCustomer(patch) {
    const { data, error } = await supabase.from('customers')
      .update(patch).eq('id', customer.id).select(CUSTOMER_COLS);
    if (error || !data || !data[0]) return { error: error || { message: 'no row' } };
    onChange(data[0]);
    return { row: data[0] };
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const email = f.email.trim().toLowerCase();
    const np = normPhone(f.phone);
    if (!f.name.trim() && !email && !f.phone.trim()) {
      setMsg({ type: 'error', text: 'Please keep at least a name, an email or a phone number.' });
      return;
    }
    if (email && !isEmail(email)) {
      setMsg({ type: 'error', text: 'That email address does not look right.' });
      return;
    }
    if (f.phone.trim() && (!np || np.length < 11 || np.length > 15)) {
      setMsg({ type: 'error', text: 'That phone number does not look right. Try a South African number like 082 123 4567.' });
      return;
    }
    const patch = {
      full_name: f.name.trim() || null, email: email || null, phone: f.phone.trim() || null,
      notes: f.notes.trim() || null, tags: f.tags.trim() || null, status: f.status,
      consent: f.consent, consent_note: f.consentNote.trim() || null,
      follow_up_on: f.followUp || null,
    };
    if (f.consent !== customer.consent) patch.consent_at = new Date().toISOString();
    const res = await patchCustomer(patch);
    if (res.error) {
      setMsg({ type: 'error', text: res.error.code === '23505'
        ? 'Another customer already has that email or phone number.'
        : 'Could not save. Please try again.' });
      return;
    }
    if (f.status !== customer.status) await addActivity('status_change', null, 'Status changed to ' + STATUS[f.status]);
    setF(formFrom(res.row));
    setMsg({ type: 'ok', text: 'Saved.' });
  }

  async function addNote(e) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    const row = await addActivity('note', null, text.slice(0, 2000));
    if (row) setNoteText('');
    else setMsg({ type: 'error', text: 'Could not save the note. Please try again.' });
  }

  async function logContact() {
    await addActivity('call', null, 'Contacted them');
    const patch = { last_contacted_at: new Date().toISOString() };
    if (customer.status === 'new') patch.status = 'contacted';
    await patchCustomer(patch);
    if (patch.status) setF((x) => ({ ...x, status: 'contacted' }));
  }

  async function requestOpened(channel) {
    const label = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'email' }[channel];
    addActivity('review_request', channel, 'Review request opened via ' + label);
    const patch = { last_contacted_at: new Date().toISOString() };
    if (customer.status === 'new' || customer.status === 'contacted') patch.status = 'review_requested';
    const res = await patchCustomer(patch);
    if (res.row && patch.status) setF((x) => ({ ...x, status: 'review_requested' }));
  }

  async function remove() {
    if (!window.confirm('Delete ' + displayName(customer) + '? This permanently removes them and their notes.')) return;
    const { data, error } = await supabase.from('customers').delete().eq('id', customer.id).select('id');
    if (error || !data || data.length === 0) {
      setMsg({ type: 'error', text: 'Could not delete. Please try again.' });
      return;
    }
    onDeleted(customer.id);
  }

  const message = requestMessage(client, customer, onBehalf);
  const num = normPhone(customer.phone);
  const phoneOk = !!num && num.length >= 11 && num.length <= 15;
  const emailOk = isEmail(customer.email);
  const blocked = customer.consent === 'opted_out' || !standLink;
  const waHref = 'https://wa.me/' + num + '?text=' + encodeURIComponent(message);
  const smsHref = 'sms:+' + num + '?&body=' + encodeURIComponent(message);
  const mailHref = 'mailto:' + (customer.email || '') + '?subject='
    + encodeURIComponent('How was your visit to ' + client.business_name + '?')
    + '&body=' + encodeURIComponent(message);

  return (
    <div>
      <div style={{ marginTop: '1.25rem' }}>
        <button onClick={onBack} style={smallBtn}>&larr; Back to customers</button>
      </div>

      <Card title={displayName(customer)}
        right={<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Pill text={STATUS[customer.status]} color={STATUS_COLOR[customer.status]} />
          <Pill text={CONSENT[customer.consent]} color={customer.consent === 'opted_out' ? c.red : c.muted} />
        </div>}
        subtitle={'Added ' + fmtDate(customer.created_at)
          + (customer.source === 'stand_feedback' ? ' from your stand feedback form'
            : customer.source === 'stand_signup' ? ' when they left their details on your stand'
            : customer.source === 'import' ? ' by importing your list' : '')
          + (customer.last_contacted_at ? '. Last contacted ' + fmtDate(customer.last_contacted_at) : '') + '.'}>
        <form onSubmit={save} noValidate>
          <label style={{ ...labelStyle, marginTop: 0 }}>Name</label>
          <input style={inputStyle} value={f.name} onChange={set('name')} maxLength={120} aria-label="Name" />
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={f.email} onChange={set('email')} maxLength={254} aria-label="Email" />
          <label style={labelStyle}>Cellphone number</label>
          <input style={inputStyle} type="tel" value={f.phone} onChange={set('phone')} maxLength={40} aria-label="Cellphone number" />
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={f.status} onChange={set('status')} aria-label="Status">
            {Object.keys(STATUS).map((k) => <option key={k} value={k}>{STATUS[k]}</option>)}
          </select>
          <label style={labelStyle}>Follow up on</label>
          <input style={inputStyle} type="date" value={f.followUp} onChange={set('followUp')} aria-label="Follow up on" />
          <label style={labelStyle}>Tags (separate with commas)</label>
          <input style={inputStyle} value={f.tags} onChange={set('tags')} maxLength={200} aria-label="Tags"
            placeholder="e.g. regular, birthday in May" />
          <label style={labelStyle}>About this customer</label>
          <textarea style={{ ...inputStyle, minHeight: '5rem' }} value={f.notes} onChange={set('notes')}
            maxLength={2000} aria-label="About this customer" />
          <label style={labelStyle}>Did they agree to be contacted?</label>
          <select style={inputStyle} value={f.consent} onChange={set('consent')} aria-label="Consent">
            {Object.keys(CONSENT).map((k) => <option key={k} value={k}>{CONSENT[k]}</option>)}
          </select>
          <p style={{ color: c.muted, fontSize: '0.8rem', margin: '0.35rem 0 0 0' }}>{CONSENT_HELP[f.consent]}</p>
          <input style={{ ...inputStyle, marginTop: '0.5rem' }} value={f.consentNote} onChange={set('consentNote')}
            maxLength={300} aria-label="How they agreed" placeholder="How or when they agreed (optional)" />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button type="submit" disabled={!dirty} style={{ ...primaryBtn, opacity: dirty ? 1 : 0.5 }}>Save changes</button>
            <button type="button" onClick={logContact} style={ghostBtn}>I contacted them</button>
            <button type="button" onClick={remove} style={{ ...ghostBtn, color: c.red, borderColor: 'var(--bad)' }}>Delete customer</button>
          </div>
          {msg && (
            <p role="status" style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem',
              color: msg.type === 'ok' ? c.green : c.red }}>{msg.text}</p>
          )}
        </form>
      </Card>

      <Card title="Ask for a review"
        subtitle="Your own app opens with the message ready - you press send. We log that you opened it, but cannot see whether you sent it.">
        {customer.consent === 'opted_out' && (
          <p style={{ color: c.red, margin: '0 0 0.5rem 0' }}>This person asked not to be contacted.</p>
        )}
        {customer.consent === 'follow_up_only' && (
          <p style={{ color: c.amber, fontSize: '0.88rem', margin: '0 0 0.5rem 0' }}>
            They only shared their details so you could follow up on their feedback. Make sure they
            are happy to be asked for a review first.
          </p>
        )}
        {customer.consent === 'unknown' && (
          <p style={{ color: c.amber, fontSize: '0.88rem', margin: '0 0 0.5rem 0' }}>
            Only send this to someone who has dealt with your business.
          </p>
        )}
        <div style={{ background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem', padding: '0.8rem',
                      color: c.muted, fontSize: '0.88rem', lineHeight: 1.55 }}>
          <div style={{ color: c.text, fontWeight: 700, marginBottom: '0.3rem' }}>Message preview</div>
          {standLink ? message : 'Your link needs to be set up first.'}
        </div>
        <ActionLink href={waHref} label="Send on WhatsApp" enabled={!blocked && phoneOk} primary newTab
          onClick={() => requestOpened('whatsapp')} />
        <ActionLink href={smsHref} label="Send as SMS (from a phone)" enabled={!blocked && phoneOk}
          onClick={() => requestOpened('sms')} />
        <ActionLink href={mailHref} label="Send by email" enabled={!blocked && emailOk}
          onClick={() => requestOpened('email')} />
      </Card>

      <Card title="Notes and history">
        <form onSubmit={addNote} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: '1 1 14rem', width: 'auto' }} value={noteText}
            onChange={(e) => setNoteText(e.target.value)} maxLength={2000} aria-label="New note"
            placeholder="Add a note, e.g. called, left a message" />
          <button type="submit" style={primaryBtn}>Add note</button>
        </form>
        {acts === null && <p style={{ color: c.muted }}>Loading...</p>}
        {acts && acts.length === 0 && <p style={{ color: c.muted, margin: '1rem 0 0 0' }}>Nothing yet.</p>}
        {(acts || []).map((a) => (
          <div key={a.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.8rem 0', marginTop: '0.8rem' }}>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Pill text={KIND[a.kind] || a.kind} color={a.kind === 'complaint' ? c.red : c.muted} />
              <span style={{ color: c.muted, fontSize: '0.8rem' }}>{fmtDate(a.created_at)}{a.actor_email ? ' - by ' + a.actor_email : ''}</span>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AddCustomer({ client, customers, onAdded, onCancel }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', notes: '', tags: '', consent: 'unknown', consentNote: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const name = f.name.trim();
    const email = f.email.trim().toLowerCase();
    const phone = f.phone.trim();
    const np = normPhone(phone);
    if (!name && !email && !phone) { setErr('Please add a name, an email or a phone number.'); return; }
    if (email && !isEmail(email)) { setErr('That email address does not look right.'); return; }
    if (phone && (!np || np.length < 11 || np.length > 15)) {
      setErr('That phone number does not look right. Try a South African number like 082 123 4567.');
      return;
    }
    const dup = customers.find((cu) => (email && cu.email === email) || (np && normPhone(cu.phone) === np));
    if (dup) { setErr('This person is already in your list as ' + displayName(dup) + '.'); return; }
    setSaving(true);
    const row = {
      client_id: client.id, full_name: name || null, email: email || null, phone: phone || null,
      notes: f.notes.trim() || null, tags: f.tags.trim() || null, source: 'manual', status: 'new',
      consent: f.consent, consent_note: f.consentNote.trim() || null,
      consent_at: f.consent === 'unknown' ? null : new Date().toISOString(),
    };
    const { data, error } = await supabase.from('customers').insert(row).select(CUSTOMER_COLS);
    setSaving(false);
    if (error || !data || !data[0]) {
      setErr(error && error.code === '23505' ? 'This person is already in your list.' : 'Could not save. Please try again.');
      return;
    }
    onAdded(data[0]);
  }

  return (
    <Card title="Add a customer" subtitle="Only add people who have dealt with your business.">
      <form onSubmit={submit} noValidate>
        <label style={{ ...labelStyle, marginTop: 0 }}>Name</label>
        <input style={inputStyle} value={f.name} onChange={set('name')} maxLength={120} aria-label="Name" />
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={f.email} onChange={set('email')} maxLength={254} aria-label="Email" />
        <label style={labelStyle}>Cellphone number</label>
        <input style={inputStyle} type="tel" value={f.phone} onChange={set('phone')} maxLength={40} aria-label="Cellphone number" />
        <label style={labelStyle}>Tags (separate with commas)</label>
        <input style={inputStyle} value={f.tags} onChange={set('tags')} maxLength={200} aria-label="Tags" />
        <label style={labelStyle}>About this customer</label>
        <textarea style={{ ...inputStyle, minHeight: '4rem' }} value={f.notes} onChange={set('notes')}
          maxLength={2000} aria-label="About this customer" />
        <label style={labelStyle}>Did they agree to be contacted?</label>
        <select style={inputStyle} value={f.consent} onChange={set('consent')} aria-label="Consent">
          {Object.keys(CONSENT).map((k) => <option key={k} value={k}>{CONSENT[k]}</option>)}
        </select>
        <p style={{ color: c.muted, fontSize: '0.8rem', margin: '0.35rem 0 0 0' }}>{CONSENT_HELP[f.consent]}</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving} style={primaryBtn}>{saving ? 'Saving...' : 'Save customer'}</button>
          <button type="button" onClick={onCancel} style={ghostBtn}>Cancel</button>
        </div>
        {err && <p role="alert" style={{ color: c.red, margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}>{err}</p>}
      </form>
    </Card>
  );
}

function ImportCustomers({ client, customers, onImported, onCancel }) {
  const [parsed, setParsed] = useState(null); // { items, error, truncated, fileName }
  const [consent, setConsent] = useState('unknown');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    setResult('');
    if (!file) { setParsed(null); return; }
    if (file.size > 2 * 1024 * 1024) { setParsed({ items: [], error: 'That file is too big. Please keep it under 2 MB.' }); return; }
    const text = await file.text();
    const read = readCustomerRows(parseCsv(text));
    setParsed({ ...read, fileName: file.name });
  }

  // Work out what would happen to each row before anything is saved.
  let plan = null;
  if (parsed && !parsed.error) {
    const seenEmail = new Set(customers.map((x) => x.email).filter(Boolean));
    const seenPhone = new Set(customers.map((x) => normPhone(x.phone)).filter(Boolean));
    plan = { fresh: [], duplicates: 0, invalid: 0, droppedEmail: 0, droppedPhone: 0 };
    parsed.items.forEach((it) => {
      const cl = cleanImportItem(it);
      if (it.email.trim() && !cl.row.email) plan.droppedEmail += 1;
      if (it.phone.trim() && !cl.row.phone) plan.droppedPhone += 1;
      if (!cl.ok) { plan.invalid += 1; return; }
      if ((cl.row.email && seenEmail.has(cl.row.email)) || (cl.np && seenPhone.has(cl.np))) {
        plan.duplicates += 1;
        return;
      }
      if (cl.row.email) seenEmail.add(cl.row.email);
      if (cl.np) seenPhone.add(cl.np);
      plan.fresh.push(cl.row);
    });
  }

  async function run() {
    if (!plan || plan.fresh.length === 0 || !confirmed) return;
    setBusy(true);
    setResult('');
    const stamp = consent === 'unknown' ? null : new Date().toISOString();
    const rows = plan.fresh.map((r) => ({
      ...r, client_id: client.id, source: 'import', status: 'new', consent, consent_at: stamp,
      consent_note: 'Imported by the business from its own customer list',
    }));
    const saved = [];
    let failed = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const res = await supabase.from('customers').insert(chunk).select(CUSTOMER_COLS);
      if (!res.error && res.data) { saved.push(...res.data); continue; }
      // One bad row should not sink the rest: retry this chunk one row at a time.
      for (const row of chunk) {
        const one = await supabase.from('customers').insert(row).select(CUSTOMER_COLS);
        if (!one.error && one.data && one.data[0]) saved.push(one.data[0]); else failed += 1;
      }
    }
    setBusy(false);
    if (saved.length) onImported(saved);
    setResult('Imported ' + saved.length + ' customer' + (saved.length === 1 ? '' : 's')
      + (failed ? '. ' + failed + ' could not be saved.' : '.'));
    setParsed(null);
    setConfirmed(false);
  }

  function template() {
    downloadCsv('cognix-customer-template.csv', [
      ['Name', 'Email', 'Phone', 'Notes', 'Tags'],
      ['Thandi Nkosi', 'thandi@example.com', '082 123 4567', 'Regular on Fridays', 'regular'],
    ]);
  }

  return (
    <Card title="Import your customer list"
      subtitle="Upload a spreadsheet saved as CSV with columns for name, email and phone. Not sure how? Start from our template.">
      <button type="button" onClick={template} style={smallBtn}>Download the template</button>
      <label style={labelStyle}>Choose your CSV file</label>
      <input type="file" accept=".csv,text/csv" onChange={onFile} aria-label="CSV file" style={{ color: c.muted }} />
      {parsed && parsed.error && <p role="alert" style={{ color: c.red }}>{parsed.error}</p>}
      {plan && (
        <div style={{ marginTop: '1rem', background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem',
                      padding: '0.9rem', lineHeight: 1.7 }}>
          <div><b>{plan.fresh.length}</b> customer{plan.fresh.length === 1 ? '' : 's'} will be added.</div>
          {plan.duplicates > 0 && <div style={{ color: c.muted }}>{plan.duplicates} skipped: already in your list or repeated in the file.</div>}
          {plan.invalid > 0 && <div style={{ color: c.muted }}>{plan.invalid} skipped: no usable name, email or phone.</div>}
          {plan.droppedEmail > 0 && <div style={{ color: c.muted }}>{plan.droppedEmail} email address{plan.droppedEmail === 1 ? '' : 'es'} ignored because they do not look right.</div>}
          {plan.droppedPhone > 0 && <div style={{ color: c.muted }}>{plan.droppedPhone} phone number{plan.droppedPhone === 1 ? '' : 's'} ignored because they do not look right.</div>}
          {parsed.truncated && <div style={{ color: c.amber }}>Only the first 1000 rows were read. Import the rest in a second file.</div>}
        </div>
      )}
      {plan && plan.fresh.length > 0 && (
        <div>
          <label style={labelStyle}>Did these customers agree to be contacted?</label>
          <select style={inputStyle} value={consent} onChange={(e) => setConsent(e.target.value)} aria-label="Consent for import">
            <option value="unknown">Not recorded</option>
            <option value="marketing_ok">Yes, they agreed to hear from us</option>
          </select>
          <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '1rem', color: c.muted, fontSize: '0.88rem', lineHeight: 1.5 }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} aria-label="Confirm the list is yours" style={{ marginTop: '0.25rem' }} />
            <span>These people have dealt with my business, and I am allowed to keep their details.</span>
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={run} disabled={busy || !plan || plan.fresh.length === 0 || !confirmed}
          style={{ ...primaryBtn, opacity: busy || !plan || plan.fresh.length === 0 || !confirmed ? 0.5 : 1 }}>
          {busy ? 'Importing...' : 'Import customers'}
        </button>
        <button type="button" onClick={onCancel} style={ghostBtn}>Close</button>
      </div>
      {result && <p role="status" style={{ color: c.green, marginTop: '0.75rem' }}>{result}</p>}
    </Card>
  );
}

// Pulls a name, a phone number and an email out of one line of pasted text.
function parsePasted(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach((line) => {
    const raw = line.trim();
    if (!raw) return;
    const em = raw.match(/[^\s,;<>()]+@[^\s,;<>()]+\.[^\s,;<>()]+/);
    let rest = em ? raw.replace(em[0], ' ') : raw;
    const ph = rest.match(/(\+?\d[\d\s\-().]{7,}\d)/);
    if (ph) rest = rest.replace(ph[0], ' ');
    out.push({
      name: rest.replace(/[,;|\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      email: em ? em[0].toLowerCase() : '',
      phone: ph ? ph[0].trim() : '',
    });
  });
  return out.slice(0, 200);
}

function QuickAdd({ client, customers, setCustomers, onOpen }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pasted, setPasted] = useState('');
  const [pasteMsg, setPasteMsg] = useState('');
  const nameRef = useRef(null);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const addedToday = customers.filter((x) => x.created_at >= startOfDay.toISOString()).length;

  async function saveRows(rows) {
    const saved = [];
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const res = await supabase.from('customers').insert(chunk).select(CUSTOMER_COLS);
      if (!res.error && res.data) { saved.push(...res.data); continue; }
      for (const row of chunk) {
        const one = await supabase.from('customers').insert(row).select(CUSTOMER_COLS);
        if (!one.error && one.data && one.data[0]) saved.push(one.data[0]);
      }
    }
    if (saved.length) setCustomers((list) => [...saved, ...list]);
    return saved;
  }
  const baseRow = (r) => ({ ...r, client_id: client.id, source: 'manual', status: 'new', consent: 'unknown' });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const em = email.trim().toLowerCase();
    const np = normPhone(phone);
    if (!phone.trim() && !em) { setErr('Please add a cellphone number (or an email) so we can reach them.'); return; }
    if (phone.trim() && (!np || np.length < 11 || np.length > 15)) {
      setErr('That cellphone number does not look right. Try something like 082 123 4567.');
      return;
    }
    if (em && !isEmail(em)) { setErr('That email address does not look right.'); return; }
    const dup = customers.find((x) => (em && x.email === em) || (np && normPhone(x.phone) === np));
    if (dup) { setErr(displayName(dup) + ' is already in your list.'); return; }
    setSaving(true);
    const saved = await saveRows([baseRow({
      full_name: name.trim().slice(0, 120) || null, phone: phone.trim().slice(0, 40) || null, email: em || null,
    })]);
    setSaving(false);
    if (!saved.length) { setErr('Could not save that. Please try again.'); return; }
    setRecent((r) => [displayName(saved[0]), ...r].slice(0, 5));
    setName(''); setPhone(''); setEmail('');
    if (nameRef.current) nameRef.current.focus();
  }

  // Preview what a pasted list would do.
  let plan = null;
  if (pasted.trim()) {
    const seenE = new Set(customers.map((x) => x.email).filter(Boolean));
    const seenP = new Set(customers.map((x) => normPhone(x.phone)).filter(Boolean));
    plan = { fresh: [], skipped: 0 };
    parsePasted(pasted).forEach((it) => {
      const cl = cleanImportItem({ ...it, notes: '', tags: '' });
      if (!cl.ok || (!cl.row.phone && !cl.row.email)) { plan.skipped += 1; return; }
      if ((cl.row.email && seenE.has(cl.row.email)) || (cl.np && seenP.has(cl.np))) { plan.skipped += 1; return; }
      if (cl.row.email) seenE.add(cl.row.email);
      if (cl.np) seenP.add(cl.np);
      plan.fresh.push(cl.row);
    });
  }

  async function addPasted() {
    if (!plan || plan.fresh.length === 0) return;
    setSaving(true);
    const saved = await saveRows(plan.fresh.map(baseRow));
    setSaving(false);
    setPasteMsg('Added ' + saved.length + ' customer' + (saved.length === 1 ? '' : 's') + '.');
    setPasted('');
  }

  return (
    <div>
      <Card title="Add a customer"
        subtitle="Type a name and a cellphone number, then press Add. That is all - Cognix takes it from here and asks your customers for a review."
        right={<span style={{ color: c.muted, fontSize: '0.85rem' }}>Added today: <b style={{ color: c.text }}>{addedToday}</b></span>}>
        <form onSubmit={submit} noValidate>
          <label style={{ ...labelStyle, marginTop: 0 }}>Name</label>
          <input ref={nameRef} style={{ ...inputStyle, fontSize: '1.1rem', padding: '1rem' }} value={name}
            onChange={(e) => setName(e.target.value)} maxLength={120} aria-label="Name" autoFocus
            placeholder="e.g. Thandi Nkosi" />
          <label style={labelStyle}>Cellphone number</label>
          <input style={{ ...inputStyle, fontSize: '1.1rem', padding: '1rem' }} type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)} maxLength={40} aria-label="Cellphone number"
            placeholder="082 123 4567" />
          {showEmail ? (
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                maxLength={254} aria-label="Email" />
            </div>
          ) : (
            <button type="button" onClick={() => setShowEmail(true)}
              style={{ ...smallBtn, marginTop: '0.8rem', border: 'none', padding: '0.3rem 0', color: c.electricText }}>
              + Add an email too
            </button>
          )}
          <button type="submit" disabled={saving}
            style={{ ...primaryBtn, width: '100%', marginTop: '1.1rem', fontSize: '1.1rem', padding: '1rem' }}>
            {saving ? 'Saving...' : 'Add customer'}
          </button>
          {err && <p role="alert" style={{ color: c.red, margin: '0.75rem 0 0 0', fontSize: '0.92rem' }}>{err}</p>}
        </form>
        {recent.length > 0 && (
          <p style={{ color: c.green, fontSize: '0.88rem', lineHeight: 1.6, margin: '1rem 0 0 0' }}>
            Added just now: {recent.join(', ')}
          </p>
        )}
      </Card>

      <Card title="Add several at once"
        subtitle="Paste a list - one person per line, like the names and numbers from today's appointments. We pick out the name and number for you.">
        <textarea style={{ ...inputStyle, minHeight: '7rem' }} value={pasted} aria-label="Paste a list"
          onChange={(e) => { setPasted(e.target.value); setPasteMsg(''); }}
          placeholder={'Thandi Nkosi 082 123 4567\nSipho Dlamini, 071 555 0000'} />
        {plan && (
          <p style={{ margin: '0.75rem 0 0 0', lineHeight: 1.6 }}>
            <b>{plan.fresh.length}</b> {plan.fresh.length === 1 ? 'person' : 'people'} will be added
            {plan.skipped > 0 ? ' (' + plan.skipped + ' skipped: already in your list, or no usable number)' : ''}.
          </p>
        )}
        <button type="button" onClick={addPasted} disabled={saving || !plan || plan.fresh.length === 0}
          style={{ ...primaryBtn, marginTop: '0.75rem', opacity: !plan || plan.fresh.length === 0 ? 0.5 : 1 }}>
          Add them all
        </button>
        {pasteMsg && <p role="status" style={{ color: c.green, margin: '0.75rem 0 0 0' }}>{pasteMsg}</p>}
      </Card>

      <Card title="Everyone you have added">
        <button onClick={() => onOpen('')} style={smallBtn}>See the full list</button>
      </Card>
    </div>
  );
}

function ReviewQueue({ client, customers, onUpdated, onClose, onBehalf }) {
  const [asked, setAsked] = useState(null); // customer id -> when they were last asked
  const [channel, setChannel] = useState('whatsapp');
  const [cooldown, setCooldown] = useState(60);
  const [batch, setBatch] = useState(20);
  const [confirmed, setConfirmed] = useState(false);
  const [queue, setQueue] = useState(null); // null = not started, otherwise a list of customer ids
  const [pos, setPos] = useState(0);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchAllRows(() => supabase.from('customer_activities').select('customer_id, created_at')
      .eq('client_id', client.id).eq('kind', 'review_request')
      .order('created_at', { ascending: false }).order('id'))
      .then(({ data, error }) => {
        if (!alive) return;
        const map = {};
        (error ? [] : data || []).forEach((r) => { if (!map[r.customer_id]) map[r.customer_id] = r.created_at; });
        setAsked(map);
      });
    return () => { alive = false; };
  }, [client.id]);

  const cutoff = Date.now() - cooldown * 24 * 60 * 60 * 1000;
  const eligible = asked === null ? [] : customers
    .filter((cu) => canAsk(cu, channel, asked, cutoff))
    .sort((x, y) => (asked[x.id] || '').localeCompare(asked[y.id] || '') || x.created_at.localeCompare(y.created_at));

  const channelName = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'email' }[channel];
  const current = queue && pos < queue.length ? customers.find((x) => x.id === queue[pos]) : null;

  function start() {
    setQueue(eligible.slice(0, batch).map((x) => x.id));
    setPos(0);
    setDone(0);
  }

  async function sent(cu) {
    setDone((d) => d + 1);
    setPos((p) => p + 1);
    setAsked((m) => ({ ...(m || {}), [cu.id]: new Date().toISOString() }));
    const updated = await recordReviewRequest(client, cu, channel);
    if (updated) onUpdated(updated);
  }

  if (queue !== null && pos < queue.length && !current) {
    // that customer was removed while the queue was running: move on
    window.setTimeout(() => setPos((p) => p + 1), 0);
  }

  if (queue !== null && pos >= queue.length) {
    return (
      <Card title="All done for now">
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          You opened <b>{done}</b> review request{done === 1 ? '' : 's'} on {channelName}.
          {eligible.length > 0 ? ' ' + eligible.length + ' more can still be asked - come back tomorrow.' : ''}
        </p>
        <p style={{ color: c.muted, fontSize: '0.85rem', lineHeight: 1.55 }}>
          If anyone replies STOP, open them under Customers and set &quot;Did they agree to be contacted?&quot;
          to &quot;Don&apos;t contact&quot;.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => setQueue(null)} style={primaryBtn}>Start another batch</button>
          <button onClick={onClose} style={ghostBtn}>Close</button>
        </div>
      </Card>
    );
  }

  if (queue !== null && current) {
    const num = normPhone(current.phone);
    const message = requestMessage(client, current, onBehalf);
    const href = channel === 'whatsapp' ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(message)
      : channel === 'sms' ? 'sms:+' + num + '?&body=' + encodeURIComponent(message)
      : 'mailto:' + current.email + '?subject='
        + encodeURIComponent('How was your visit to ' + client.business_name + '?')
        + '&body=' + encodeURIComponent(message);
    return (
      <Card title={'Customer ' + (pos + 1) + ' of ' + queue.length}
        subtitle={done + ' opened so far. Tap the green button, press send in the app that opens, then come back for the next one.'}
        right={<button onClick={() => setQueue(null)} style={smallBtn}>Stop for now</button>}>
        <div style={{ height: '0.5rem', background: c.bg, borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: Math.round((pos * 100) / queue.length) + '%', height: '100%', background: c.electric }} />
        </div>
        <h3 style={{ margin: '1.1rem 0 0.2rem 0', fontSize: '1.3rem' }}>{displayName(current)}</h3>
        <div style={{ color: c.muted, fontSize: '0.9rem' }}>
          {channel === 'email' ? current.email : current.phone}
        </div>
        <div style={{ background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem', padding: '0.8rem',
                      color: c.muted, fontSize: '0.88rem', lineHeight: 1.55, marginTop: '0.9rem' }}>
          {message}
        </div>
        <a href={href} onClick={() => sent(current)} target={channel === 'whatsapp' ? '_blank' : undefined}
          rel={channel === 'whatsapp' ? 'noreferrer' : undefined}
          style={{ ...primaryBtn, display: 'block', width: '100%', marginTop: '1rem', background: '#16a34a' }}>
          {'Open ' + channelName + ' and send'}
        </a>
        <button onClick={() => setPos((p) => p + 1)} style={{ ...ghostBtn, width: '100%', marginTop: '0.6rem' }}>
          Skip this person
        </button>
      </Card>
    );
  }

  return (
    <Card title="Review request queue"
      subtitle="Work through a long list quickly. We line up the right people, one at a time, with the message ready - you press send. It leaves out anyone who has asked not to be contacted, anyone with an open complaint, anyone who already left a review, and anyone asked recently.">
      {onBehalf && (
        <p style={{ color: c.amber, fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 0.8rem 0' }}>
          You are working as the Cognix team. Messages will say they come from Cognix on behalf of {client.business_name}.
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 10rem' }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Send by</label>
          <select style={inputStyle} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Send by">
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS (from a phone)</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div style={{ flex: '1 1 10rem' }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Skip anyone asked in the last</label>
          <select style={inputStyle} value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} aria-label="Skip anyone asked in the last">
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </div>
        <div style={{ flex: '1 1 10rem' }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>People in this batch</label>
          <select style={inputStyle} value={batch} onChange={(e) => setBatch(Number(e.target.value))} aria-label="People in this batch">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      <p style={{ margin: '1rem 0 0 0', lineHeight: 1.6 }}>
        {asked === null ? 'Checking your list...'
          : <span><b>{eligible.length}</b> customer{eligible.length === 1 ? '' : 's'} can be asked right now by {channelName}.</span>}
      </p>
      {channel !== 'email' && (
        <p style={{ color: c.muted, fontSize: '0.82rem', lineHeight: 1.55, margin: '0.4rem 0 0 0' }}>
          Keep to about 20 a day and spread them out. WhatsApp can block a number that messages many
          people who have not messaged it first.
        </p>
      )}
      <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '1rem', color: c.muted, fontSize: '0.88rem', lineHeight: 1.5 }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
          aria-label="Confirm these customers have dealt with the business" style={{ marginTop: '0.25rem' }} />
        <span>These customers have dealt with {client.business_name}, and each person will get one message.</span>
      </label>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button onClick={start} disabled={!confirmed || eligible.length === 0}
          style={{ ...primaryBtn, opacity: !confirmed || eligible.length === 0 ? 0.5 : 1 }}>
          Start the queue
        </button>
        <button onClick={onClose} style={ghostBtn}>Close</button>
      </div>
    </Card>
  );
}

function CustomersTab({ client, customers, setCustomers, error, focusId, setFocusId, reqCount, onBehalf, startInQueue }) {
  const [mode, setMode] = useState(startInQueue ? 'queue' : 'list'); // list | add | import | queue
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  if (error) {
    return (
      <Card title="Customers">
        <p style={{ color: c.muted, margin: 0 }}>
          Customers are not available yet. Please message us and we will switch them on.
        </p>
      </Card>
    );
  }
  if (customers === null) {
    return <Card title="Customers"><p style={{ color: c.muted, margin: 0 }}>Loading...</p></Card>;
  }

  const selected = focusId ? customers.find((x) => x.id === focusId) : null;
  if (selected) {
    return (
      <CustomerDetail key={selected.id} customer={selected} client={client} onBehalf={onBehalf}
        onBack={() => setFocusId('')}
        onChange={(u) => setCustomers((list) => list.map((x) => (x.id === u.id ? { ...x, ...u } : x)))}
        onDeleted={(id) => { setCustomers((list) => list.filter((x) => x.id !== id)); setFocusId(''); }} />
    );
  }

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const dueCount = customers.filter(isDue).length;
  const newCount = customers.filter((x) => x.created_at >= monthAgo).length;
  const q = search.trim().toLowerCase();
  const qPhone = normPhone(q);
  const shown = customers.filter((cu) => {
    if (filter === 'due') { if (!isDue(cu)) return false; }
    else if (filter !== 'all' && cu.status !== filter) return false;
    if (!q) return true;
    const hay = [cu.full_name, cu.email, cu.phone, cu.tags, cu.notes].join(' ').toLowerCase();
    if (hay.includes(q)) return true;
    return !!(qPhone && qPhone.length >= 4 && normPhone(cu.phone) && normPhone(cu.phone).includes(qPhone));
  }).sort((a, b) => Number(isDue(b)) - Number(isDue(a)));

  function exportCsv() {
    downloadCsv('cognix-customers-' + (client.slug || 'stand') + '.csv',
      [['Name', 'Email', 'Phone', 'Status', 'Agreed to be contacted', 'Follow up on', 'Tags', 'Notes', 'Added']]
        .concat(customers.map((cu) => [cu.full_name || '', cu.email || '', cu.phone || '', STATUS[cu.status],
          CONSENT[cu.consent], cu.follow_up_on || '', cu.tags || '', cu.notes || '', fmtDate(cu.created_at)])));
  }

  return (
    <div>
      <Card title="Your customers"
        subtitle="Everyone who has left you their details, plus anyone you add or import. Customers who leave their details on your feedback form appear here automatically, marked to follow up the next day."
        right={<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setMode(mode === 'add' ? 'list' : 'add')} style={primaryBtn}>Add a customer</button>
          <button onClick={() => setMode(mode === 'import' ? 'list' : 'import')} style={ghostBtn}>Import a list</button>
          <button onClick={() => setMode(mode === 'queue' ? 'list' : 'queue')} style={ghostBtn}>Review request queue</button>
        </div>}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Stat label="Customers" value={customers.length} />
          <Stat label="Follow-ups due" value={dueCount} hint="Due today or earlier" />
          <Stat label="Added, last 30 days" value={newCount} />
          <Stat label="Review requests opened" value={reqCount === null ? '-' : reqCount} hint="Last 30 days" />
        </div>
      </Card>

      {mode === 'add' && (
        <AddCustomer client={client} customers={customers} onCancel={() => setMode('list')}
          onAdded={(row) => { setCustomers((list) => [row, ...list]); setMode('list'); setFocusId(row.id); }} />
      )}
      {mode === 'queue' && (
        <ReviewQueue client={client} customers={customers} onBehalf={onBehalf} onClose={() => setMode('list')}
          onUpdated={(u) => setCustomers((list) => list.map((x) => (x.id === u.id ? { ...x, ...u } : x)))} />
      )}
      {mode === 'import' && (
        <ImportCustomers client={client} customers={customers} onCancel={() => setMode('list')}
          onImported={(rows) => setCustomers((list) => [...rows, ...list])} />
      )}

      <Card title="Customer list"
        right={customers.length > 0 ? <button onClick={exportCsv} style={smallBtn}>Download spreadsheet</button> : null}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: '1 1 12rem', width: 'auto' }} value={search} aria-label="Search customers"
            onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone or tag" />
          <select style={{ ...inputStyle, flex: '0 0 auto', width: 'auto' }} value={filter} aria-label="Filter customers"
            onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Everyone</option>
            <option value="due">Follow-up due</option>
            {Object.keys(STATUS).map((k) => <option key={k} value={k}>{STATUS[k]}</option>)}
          </select>
        </div>
        {customers.length === 0 && (
          <p style={{ color: c.muted, margin: '1rem 0 0 0', lineHeight: 1.6 }}>
            No customers yet. Add your first one, import a list, or wait for someone to leave their
            details on your feedback form.
          </p>
        )}
        {customers.length > 0 && shown.length === 0 && (
          <p style={{ color: c.muted, margin: '1rem 0 0 0' }}>No customers match that.</p>
        )}
        {shown.map((cu) => (
          <button key={cu.id} onClick={() => setFocusId(cu.id)} aria-label={'Open ' + displayName(cu)}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', color: c.text,
                     border: 'none', borderTop: '1px solid ' + c.line, padding: '0.9rem 0', marginTop: '0.4rem',
                     cursor: 'pointer', fontFamily: sans }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{displayName(cu)}</span>
              <Pill text={STATUS[cu.status]} color={STATUS_COLOR[cu.status]} />
              {cu.consent === 'opted_out' && <Pill text="Don't contact" color={c.red} />}
              {isDue(cu) && <Pill text={'Follow up ' + fmtDay(cu.follow_up_on)} color={c.red} />}
            </div>
            <div style={{ color: c.muted, fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {[cu.email, cu.phone].filter(Boolean).join('  |  ') || 'No contact details'}
              {cu.tags ? '   #' + cu.tags.split(',').map((t) => t.trim()).filter(Boolean).join(' #') : ''}
            </div>
          </button>
        ))}
      </Card>

      <Card title="Looking after your customers' details">
        <p style={{ color: c.muted, fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
          Under South Africa&apos;s privacy law (POPIA), your business is responsible for the details
          you keep about your customers, and Cognix stores them for you. Only keep people who have
          dealt with your business, record whether they agreed to be contacted, respect anyone who
          asks you to stop, and delete a person when they ask. This is general guidance, not legal
          advice.
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview + dashboard shell
// ---------------------------------------------------------------------------

function OverviewTab({ client, stats, statsError, reviews, reviewsError, reqCount, customers, onClientUpdated, openCustomer, userEmail, access, setAccess }) {
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkInput, setLinkInput] = useState(client.google_review_url || '');
  const [linkMsg, setLinkMsg] = useState(null);
  const [localReviews, setLocalReviews] = useState(null);
  const [collectMsg, setCollectMsg] = useState('');
  const [offerInput, setOfferInput] = useState(client.lead_offer || '');
  const [offerMsg, setOfferMsg] = useState(null);

  const list = localReviews || reviews;
  const isService = client.business_type === 'service';
  const standLink = client.slug ? SITE + '/r/' + client.slug : '';
  const unhandled = (list || []).filter((r) => !r.handled).length;
  const shown = (list || []).filter((r) => {
    if (filter === 'open') return !r.handled;
    if (filter === 'low') return r.stars <= 2;
    if (filter === 'three') return r.stars === 3;
    return true;
  });
  const rated = stats ? stats.google + stats.priv : 0;
  const happyPct = rated > 0 ? Math.round((stats.google * 100) / rated) : null;
  const knownCustomer = (id) => !!id && !!customers && customers.some((x) => x.id === id);

  async function toggleHandled(r) {
    const next = !r.handled;
    setNotice('');
    setLocalReviews((list || []).map((x) => (x.id === r.id ? { ...x, handled: next } : x)));
    const { data, error } = await supabase.from('private_reviews')
      .update({ handled: next }).eq('id', r.id).select('id');
    if (error || !data || data.length === 0) {
      setLocalReviews((list || []).map((x) => (x.id === r.id ? { ...x, handled: !next } : x)));
      setNotice('Could not update that message. Please try again.');
    }
  }

  function exportFeedback() {
    downloadCsv('cognix-feedback-' + (client.slug || 'stand') + '.csv',
      [['Date', 'Stars', 'Message', 'Name', 'Email', 'Call-back number', 'Handled']].concat(
        (list || []).map((r) => [fmtDate(r.created_at), r.stars, r.feedback || '', r.contact_name || '',
          r.contact_email || '', r.contact_phone || '', r.handled ? 'Yes' : 'No'])));
  }

  const isOwner = !!userEmail && !!client.manager_email
    && userEmail.toLowerCase() === client.manager_email.toLowerCase();

  async function toggleCollect() {
    const next = !client.collect_happy_details;
    setCollectMsg('');
    const { data, error } = await supabase.from('clients')
      .update({ collect_happy_details: next }).eq('id', client.id).select('id');
    if (error || !data || data.length === 0) {
      setCollectMsg('Could not change that. Please try again.');
      return;
    }
    onClientUpdated({ id: client.id, collect_happy_details: next });
  }

  async function saveOffer(e) {
    e.preventDefault();
    const v = offerInput.trim().slice(0, 120);
    setOfferMsg(null);
    const { data, error } = await supabase.from('clients')
      .update({ lead_offer: v || null }).eq('id', client.id).select('id');
    if (error || !data || data.length === 0) {
      setOfferMsg({ type: 'error', text: 'Could not save that. Please try again.' });
      return;
    }
    onClientUpdated({ id: client.id, lead_offer: v || null });
    setOfferMsg({ type: 'ok', text: v ? 'Saved. Customers will be offered: ' + v : 'Saved. No reward will be offered.' });
  }

  async function removeAccess(row) {
    if (!window.confirm('Remove ' + row.email + ' from your portal?')) return;
    const { data, error } = await supabase.from('client_access').delete().eq('id', row.id).select('id');
    if (error || !data || data.length === 0) {
      setNotice('Could not remove that access. Please try again.');
      return;
    }
    setAccess((list) => (list || []).filter((x) => x.id !== row.id));
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

  const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&ecc=H&data='
    + encodeURIComponent(standLink);

  return (
    <div>
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
              <Stat label={isService ? 'Times your review link was opened' : 'Times the stand was opened'} value={stats.opens}
                hint={isService ? 'Taps on the link' : 'Taps and scans'} />
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
        subtitle={list && list.length > 0
          ? (unhandled > 0
            ? unhandled + ' message' + (unhandled === 1 ? '' : 's') + ' still need a reply.'
            : 'Everything has been handled. Well done.')
          : 'Messages from customers who rated 3 stars or below appear here. If they leave their details, they are added to your customers.'}
        right={list && list.length > 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select aria-label="Filter feedback" value={filter} onChange={(e) => setFilter(e.target.value)}
              style={{ ...inputStyle, width: 'auto', padding: '0.5rem 0.7rem', fontSize: '0.9rem' }}>
              <option value="all">All messages</option>
              <option value="open">Still to handle</option>
              <option value="low">1-2 stars</option>
              <option value="three">3 stars</option>
            </select>
            <button onClick={exportFeedback} style={{ ...ghostBtn, padding: '0.5rem 0.9rem' }}>
              Download spreadsheet
            </button>
          </div>
        ) : null}
      >
        {reviewsError && (
          <p style={{ color: c.muted, margin: 0 }}>Feedback is not available yet. Please check back later.</p>
        )}
        {list === null && !reviewsError && <p style={{ color: c.muted, margin: 0 }}>Loading...</p>}
        {list && list.length === 0 && !reviewsError && <p style={{ color: c.muted, margin: 0 }}>Nothing yet.</p>}
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
            {(r.contact_name || r.contact_email) && (
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: c.muted }}>
                From: {[r.contact_name, r.contact_email].filter(Boolean).join(' - ')}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}>
              {r.contact_phone && (
                <span style={{ fontSize: '0.9rem' }}>
                  Call back: <a href={'tel:' + r.contact_phone.replace(/[^0-9+]/g, '')}
                    style={{ color: c.electricText }}>{r.contact_phone}</a>
                  {' '}<a href={'https://wa.me/' + normPhone(r.contact_phone)}
                    style={{ color: c.electricText }}>WhatsApp</a>
                </span>
              )}
              <button onClick={() => toggleHandled(r)} style={smallBtn}>
                {r.handled ? 'Mark as not handled' : 'Mark as handled'}
              </button>
              {knownCustomer(r.customer_id) && (
                <button onClick={() => openCustomer(r.customer_id)} style={smallBtn}>Open customer</button>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card title={isService ? 'Your review link' : 'Your stand'}
        subtitle={isService ? 'The link in the review requests sent to your customers.' : "This is the link on your stand's NFC tag and QR code."}>
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
            {!isService && (
            <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
              <img src={qrSrc} alt={'QR code for ' + client.business_name} width={150} height={150}
                style={{ background: '#fff', borderRadius: '0.5rem', display: 'block' }} />
              <a href={qrSrc} target="_blank" rel="noreferrer"
                style={{ color: c.electricText, fontSize: '0.85rem', display: 'inline-block', marginTop: '0.5rem' }}>
                Open large QR code
              </a>
            </div>
            )}
          </div>
        ) : (
          <p style={{ color: c.muted, margin: 0 }}>
            Your link has not been set up yet. Please message us and we will sort it out.
          </p>
        )}
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

      {!isService && client.collect_happy_details !== undefined && (
        <Card title="Turn happy customers into leads"
          subtitle="Keep the details of customers who rate you 4 or 5 stars, without losing the review.">
          <label style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!client.collect_happy_details} onChange={toggleCollect}
              aria-label="Ask happy customers to stay in touch" style={{ marginTop: '0.25rem' }} />
            <span>Ask happy customers if they would like to stay in touch</span>
          </label>
          <p style={{ color: c.muted, fontSize: '0.85rem', lineHeight: 1.55, margin: '0.75rem 0 0 0' }}>
            When this is on, customers who rate 4 or 5 stars are sent straight to your Google page,
            which opens in a new tab. This page stays open behind it with a thank-you: they leave their
            details and get their reward code. A review always comes first. Anyone who does not come
            back to the page simply gives you the review.
          </p>
          <form onSubmit={saveOffer} style={{ marginTop: '0.9rem' }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>Your thank-you reward (for example: 10% off your next visit)</label>
            <input style={inputStyle} value={offerInput} onChange={(e) => setOfferInput(e.target.value)}
              maxLength={120} aria-label="Thank-you reward" placeholder="10% off your next visit" />
            <button type="submit" style={{ ...smallBtn, marginTop: '0.6rem' }}>Save reward</button>
            {offerMsg && (
              <p role="status" style={{ margin: '0.6rem 0 0 0', fontSize: '0.88rem',
                color: offerMsg.type === 'ok' ? c.green : c.red }}>{offerMsg.text}</p>
            )}
          </form>
          <p style={{ color: c.muted, fontSize: '0.82rem', lineHeight: 1.55, margin: '0.6rem 0 0 0' }}>
            Customers get a short code to show your team. Find them by searching for the code under Customers.
          </p>
          {collectMsg && <p role="alert" style={{ color: c.red, margin: '0.6rem 0 0 0' }}>{collectMsg}</p>}
        </Card>
      )}

      {access && (
        <Card title="Who can see this portal"
          subtitle="The people below can see and work in this portal. The Cognix team can help send review requests on your behalf. You can remove their access at any time.">
          <div style={{ padding: '0.5rem 0' }}>
            <b>{client.manager_email}</b> <span style={{ color: c.muted }}>- owner</span>
          </div>
          {access.map((a) => (
            <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center',
                                     borderTop: '1px solid ' + c.line, padding: '0.6rem 0' }}>
              <span><b>{a.email}</b> <span style={{ color: c.muted }}>- Cognix team</span></span>
              {isOwner && <button onClick={() => removeAccess(a)} style={smallBtn}>Remove access</button>}
            </div>
          ))}
        </Card>
      )}

      <Card title="Need help?">
        <p style={{ color: c.muted, margin: 0, lineHeight: 1.6 }}>
          Message us on <a href={'https://wa.me/' + SUPPORT_WHATSAPP} style={{ color: c.electricText }}>WhatsApp</a>{' '}
          or email <a href={'mailto:' + SUPPORT_EMAIL} style={{ color: c.electricText }}>{SUPPORT_EMAIL}</a>.
        </p>
      </Card>
    </div>
  );
}

const DAILY_TARGET = 20; // review requests per business per day, a sensible pace for WhatsApp

// Everything the Cognix team needs at a glance: which businesses have people waiting to be
// asked, who has been asked today, and what needs a reply - with one tap into each queue.
function TeamHome({ clients, userEmail, onOpen }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      fetchAllRows(() => supabase.from('customers')
        .select('id, client_id, status, consent, phone, email, follow_up_on, last_contacted_at, created_at').order('id')),
      fetchAllRows(() => supabase.from('customer_activities').select('customer_id, client_id, created_at')
        .eq('kind', 'review_request').gte('created_at', since).order('id')),
      fetchAllRows(() => supabase.from('private_reviews').select('id, client_id').eq('handled', false).order('id')),
    ]).then(([cu, ac, fb]) => {
      if (!alive) return;
      const err = cu.error || ac.error || fb.error;
      if (err) { setError(err.message); return; }
      setData({ customers: cu.data, asks: ac.data, feedback: fb.data });
    });
    return () => { alive = false; };
  }, []);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const rows = !data ? [] : clients.map((cl) => {
    const mine = data.customers.filter((x) => x.client_id === cl.id);
    const asked = {};
    let today = 0;
    data.asks.forEach((a) => {
      if (a.client_id !== cl.id) return;
      if (!asked[a.customer_id] || a.created_at > asked[a.customer_id]) asked[a.customer_id] = a.created_at;
      if (a.created_at >= startOfDay.toISOString()) today += 1;
    });
    return {
      client: cl, total: mine.length, today,
      ready: mine.filter((x) => canAsk(x, 'whatsapp', asked, cutoff)).length,
      due: mine.filter(isDue).length,
      feedback: data.feedback.filter((f) => f.client_id === cl.id).length,
    };
  }).sort((a, b) => b.ready - a.ready || a.client.business_name.localeCompare(b.client.business_name));

  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  const q = search.trim().toLowerCase();
  const shown = rows.filter((r) => !q || r.client.business_name.toLowerCase().includes(q));
  const teamOf = clients.filter((cl) => cl.manager_email && userEmail
    && cl.manager_email.toLowerCase() !== userEmail.toLowerCase()).length;

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', margin: '1.5rem 0 0 0' }}>All businesses</h1>
      {teamOf > 0 && (
        <p style={{ color: c.amber, lineHeight: 1.55, margin: '0.6rem 0 0 0', fontSize: '0.9rem' }}>
          You are working as the Cognix team in {teamOf} business{teamOf === 1 ? '' : 'es'}. Each business
          can see this, and can remove your access at any time.
        </p>
      )}
      <Card title="Today" subtitle={'A sensible pace is about ' + DAILY_TARGET + ' review requests per business per day.'}>
        {error ? (
          <p style={{ color: c.muted, margin: 0 }}>Could not load the overview. Please try again.</p>
        ) : !data ? (
          <p style={{ color: c.muted, margin: 0 }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Stat label="Businesses" value={clients.length} />
            <Stat label="Ready to be asked" value={sum('ready')} hint="By WhatsApp, right now" />
            <Stat label="Asked today" value={sum('today')} />
            <Stat label="Follow-ups due" value={sum('due')} />
            <Stat label="Feedback to handle" value={sum('feedback')} />
          </div>
        )}
      </Card>
      <Card title="Your businesses"
        right={<input style={{ ...inputStyle, width: '14rem', padding: '0.5rem 0.7rem' }} value={search}
          onChange={(e) => setSearch(e.target.value)} placeholder="Find a business" aria-label="Find a business" />}>
        {data && shown.length === 0 && <p style={{ color: c.muted, margin: 0 }}>No business matches that.</p>}
        {shown.map((r) => (
          <div key={r.client.id} style={{ borderTop: '1px solid ' + c.line, padding: '1rem 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.client.business_name}</span>
              <Pill text={r.client.business_type === 'service' ? 'Service' : 'Restaurant'} color={c.muted} />
              {r.client.active === false && <Pill text="Paused" color={c.red} />}
              {r.feedback > 0 && <Pill text={r.feedback + ' feedback to handle'} color={c.red} />}
              {r.due > 0 && <Pill text={r.due + ' follow-up' + (r.due === 1 ? '' : 's') + ' due'} color={c.amber} />}
            </div>
            <div style={{ color: c.muted, fontSize: '0.88rem', margin: '0.4rem 0' }}>
              {r.total} customer{r.total === 1 ? '' : 's'} | <b style={{ color: c.text }}>{r.ready}</b> ready to be asked
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 8rem', maxWidth: '14rem', height: '0.45rem', background: c.bg, borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: Math.min(100, Math.round((r.today * 100) / DAILY_TARGET)) + '%', height: '100%', background: c.green }} />
              </div>
              <span style={{ color: c.muted, fontSize: '0.82rem' }}>Asked today: {r.today} of {DAILY_TARGET}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
              <button disabled={r.ready === 0} aria-label={'Start review requests for ' + r.client.business_name}
                onClick={() => onOpen(r.client.id, { tab: 'customers', queue: true })}
                style={{ ...primaryBtn, padding: '0.55rem 1rem', opacity: r.ready === 0 ? 0.45 : 1 }}>
                Start review requests
              </button>
              <button aria-label={'Open ' + r.client.business_name} onClick={() => onOpen(r.client.id, null)}
                style={{ ...ghostBtn, padding: '0.55rem 1rem' }}>
                Open
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Dashboard({ client, clients, onSelect, onClientUpdated, userEmail, jump }) {
  const [tab, setTab] = useState(jump && jump.tab ? jump.tab : (client.business_type === 'service' ? 'add' : 'overview'));
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [reviews, setReviews] = useState(null);
  const [reviewsError, setReviewsError] = useState('');
  const [customers, setCustomers] = useState(null);
  const [customersError, setCustomersError] = useState('');
  const [reqCount, setReqCount] = useState(null);
  const [focusId, setFocusId] = useState('');
  const [access, setAccess] = useState(null);

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

    const reviewCols = 'id, stars, feedback, contact_name, contact_email, contact_phone, customer_id, handled, created_at';
    const oldCols = 'id, stars, feedback, contact_phone, handled, created_at';
    const loadReviews = (cols) => supabase.from('private_reviews').select(cols)
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(200);
    loadReviews(reviewCols).then(async (res) => {
      let out = res;
      // If the customer fields are not set up yet, still show the feedback itself.
      if (res.error) out = await loadReviews(oldCols);
      if (!alive) return;
      if (out.error) { setReviewsError(out.error.message); setReviews([]); return; }
      setReviews(out.data || []);
    });

    fetchAllRows(() => supabase.from('customers').select(CUSTOMER_COLS).eq('client_id', client.id)
      .order('updated_at', { ascending: false }).order('id'))
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setCustomersError(error.message); setCustomers([]); return; }
        setCustomers(data || []);
      });

    supabase.from('customer_activities').select('id', { count: 'exact', head: true })
      .eq('client_id', client.id).eq('kind', 'review_request').gte('created_at', since)
      .then(({ count: n, error }) => {
        if (alive) setReqCount(error ? null : n || 0);
      });

    supabase.from('client_access').select('id, email, role').eq('client_id', client.id)
      .order('email')
      .then(({ data, error }) => {
        if (alive) setAccess(error ? null : data || []);
      });
    return () => { alive = false; };
  }, [client.id]);

  const dueCount = (customers || []).filter(isDue).length;
  const onBehalf = !!userEmail && !!client.manager_email
    && userEmail.toLowerCase() !== client.manager_email.toLowerCase();
  const isService = client.business_type === 'service';

  function openCustomer(id) {
    setFocusId(id);
    setTab('customers');
  }

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
      style={{ ...ghostBtn, padding: '0.6rem 1.1rem',
               background: tab === id ? c.electric : 'transparent',
               borderColor: tab === id ? c.electric : c.line }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem',
                    marginTop: '1.5rem' }}>
        <h1 style={{ fontSize: '1.7rem', margin: 0 }}>{client.business_name}</h1>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.7rem',
          borderRadius: '9999px', background: client.active === false ? 'var(--bad-bg)' : 'var(--ok-bg)',
          color: client.active === false ? c.red : c.green }}>
          {client.active === false ? 'Paused' : 'Live'}
        </span>
        {clients.length > 1 && (
          <button onClick={() => onSelect('')} style={smallBtn}>&larr; All businesses</button>
        )}
        {clients.length > 1 && (
          <select value={client.id} onChange={(e) => onSelect(e.target.value)} aria-label="Choose business"
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

      {onBehalf && (
        <p style={{ color: c.amber, lineHeight: 1.55, margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}>
          You are working in this portal as the Cognix team, on behalf of {client.business_name}.
          They can see this, and can remove our access at any time.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
        {isService && tabBtn('add', 'Add customers')}
        {!isService && tabBtn('overview', 'Overview')}
        {tabBtn('customers', dueCount > 0 ? 'Customers (' + dueCount + ' to follow up)' : 'Customers')}
        {isService && tabBtn('overview', 'Overview')}
      </div>

      {tab === 'add' ? (
        <QuickAdd client={client} customers={customers || []} setCustomers={setCustomers}
          onOpen={(id) => { setFocusId(id); setTab('customers'); }} />
      ) : tab === 'overview' ? (
        <OverviewTab client={client} stats={stats} statsError={statsError} reviews={reviews}
          reviewsError={reviewsError} reqCount={reqCount} customers={customers}
          onClientUpdated={onClientUpdated} openCustomer={openCustomer}
          userEmail={userEmail} access={access} setAccess={setAccess} />
      ) : (
        <CustomersTab client={client} customers={customers} setCustomers={setCustomers}
          error={customersError} focusId={focusId} setFocusId={setFocusId} reqCount={reqCount}
          onBehalf={onBehalf} startInQueue={!!(jump && jump.queue)} />
      )}
    </div>
  );
}

export default function Portal() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [clients, setClients] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [jump, setJump] = useState(null);

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
    const load = (cols) => supabase.from('clients').select(cols).order('business_name');
    load('id, slug, business_name, google_review_url, manager_email, active, collect_happy_details, business_type, lead_offer')
      .then(async (res) => {
        let out = res;
        // If the newest database update has not been run yet, load without it.
        if (res.error) out = await load('id, slug, business_name, google_review_url, manager_email, active, collect_happy_details');
        if (out.error) out = await load('id, slug, business_name, google_review_url, manager_email, active');
        if (!alive) return;
        if (out.error) { setLoadError(out.error.message); setClients([]); return; }
        const list = out.data || [];
        setClients(list);
        setSelectedId((cur) => cur || (list.length === 1 ? list[0].id : ''));
      });
    return () => { alive = false; };
  }, [userId]);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setClients(null);
    setSelectedId('');
    setJump(null);
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

  const current = clients.find((x) => x.id === selectedId) || (clients.length === 1 ? clients[0] : null);
  if (!current) {
    return (
      <Frame onLogout={logout} email={email}>
        <TeamHome clients={clients} userEmail={email}
          onOpen={(id, target) => { setJump(target || null); setSelectedId(id); }} />
      </Frame>
    );
  }
  return (
    <Frame onLogout={logout} email={email}>
      <Dashboard key={current.id} client={current} clients={clients}
        onSelect={(id) => { setJump(null); setSelectedId(id); }} onClientUpdated={clientUpdated}
        userEmail={email} jump={jump} />
    </Frame>
  );
}
