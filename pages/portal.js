import { useState, useEffect } from 'react';
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
};
const CONSENT_HELP = {
  unknown: 'We have not recorded whether this person agreed to be contacted.',
  follow_up_only: 'They shared their details so you could follow up on their feedback.',
  marketing_ok: 'They agreed to hear from your business.',
  opted_out: 'They asked not to be contacted. Review requests are switched off for them.',
};
const KIND = {
  note: 'Note', review_request: 'Review request', status_change: 'Status',
  complaint: 'Complaint', call: 'Contacted',
};
const CUSTOMER_COLS = 'id, full_name, email, phone, notes, tags, source, status, consent, '
  + 'consent_note, consent_at, follow_up_on, last_contacted_at, created_at, updated_at';

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
      <span style={{ ...base, background: '#1a2744', color: '#5b6b8c', border: 'none', cursor: 'not-allowed' }}>
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

function CustomerDetail({ customer, client, onBack, onChange, onDeleted }) {
  const [f, setF] = useState(formFrom(customer));
  const [acts, setActs] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [msg, setMsg] = useState(null);
  const standLink = client.slug ? SITE + '/r/' + client.slug : '';

  useEffect(() => {
    let alive = true;
    supabase.from('customer_activities')
      .select('id, kind, channel, body, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (alive) setActs(error ? [] : (data || []));
      });
    return () => { alive = false; };
  }, [customer.id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const dirty = JSON.stringify(f) !== JSON.stringify(formFrom(customer));

  async function addActivity(kind, channel, body) {
    const { data, error } = await supabase.from('customer_activities')
      .insert({ customer_id: customer.id, client_id: client.id, kind, channel: channel || null, body: body || null })
      .select('id, kind, channel, body, created_at');
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

  const first = (customer.full_name || '').trim().split(/\s+/)[0];
  const message = (first ? 'Hi ' + first + ',' : 'Hi,') + ' thank you for visiting ' + client.business_name
    + ". We'd love to hear how it went - it only takes a few seconds: " + standLink;
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
            <button type="button" onClick={remove} style={{ ...ghostBtn, color: c.red, borderColor: '#5a2a2a' }}>Delete customer</button>
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
              <span style={{ color: c.muted, fontSize: '0.8rem' }}>{fmtDate(a.created_at)}</span>
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

function CustomersTab({ client, customers, setCustomers, error, focusId, setFocusId, reqCount }) {
  const [mode, setMode] = useState('list'); // list | add | import
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
      <CustomerDetail key={selected.id} customer={selected} client={client}
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

function OverviewTab({ client, stats, statsError, reviews, reviewsError, reqCount, customers, onClientUpdated, openCustomer }) {
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkInput, setLinkInput] = useState(client.google_review_url || '');
  const [linkMsg, setLinkMsg] = useState(null);
  const [localReviews, setLocalReviews] = useState(null);

  const list = localReviews || reviews;
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

function Dashboard({ client, clients, onSelect, onClientUpdated }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [reviews, setReviews] = useState(null);
  const [reviewsError, setReviewsError] = useState('');
  const [customers, setCustomers] = useState(null);
  const [customersError, setCustomersError] = useState('');
  const [reqCount, setReqCount] = useState(null);
  const [focusId, setFocusId] = useState('');

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

    supabase.from('customers').select(CUSTOMER_COLS).eq('client_id', client.id)
      .order('updated_at', { ascending: false }).limit(2000)
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
    return () => { alive = false; };
  }, [client.id]);

  const dueCount = (customers || []).filter(isDue).length;

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
          borderRadius: '9999px', background: client.active === false ? '#4a1d1d' : '#0f3d2e',
          color: client.active === false ? c.red : c.green }}>
          {client.active === false ? 'Paused' : 'Live'}
        </span>
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

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
        {tabBtn('overview', 'Overview')}
        {tabBtn('customers', dueCount > 0 ? 'Customers (' + dueCount + ' to follow up)' : 'Customers')}
      </div>

      {tab === 'overview' ? (
        <OverviewTab client={client} stats={stats} statsError={statsError} reviews={reviews}
          reviewsError={reviewsError} reqCount={reqCount} customers={customers}
          onClientUpdated={onClientUpdated} openCustomer={openCustomer} />
      ) : (
        <CustomersTab client={client} customers={customers} setCustomers={setCustomers}
          error={customersError} focusId={focusId} setFocusId={setFocusId} reqCount={reqCount} />
      )}
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
