import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// /partners  ->  one page, two views.
//   * A partner (someone who brings businesses to Cognix) sees their link, their businesses,
//     what they have earned and how they are paid.
//   * A Cognix team member sees every partner, assigns businesses to partners, and records
//     payments and payouts.
// Who may see what is decided by the database, not by this page.
// ---------------------------------------------------------------------------

const SITE = 'https://cognix.co.za';

const THEME_DARK = '--bg:#0d0f12;--surface:#15181d;--surface2:#1d222a;--line:#2a303a;--text:#f2f4f7;--muted:#9aa3b0;--faint:#6b7480;--star-off:#3a414c;--danger:#fca5a5;--link:#7dd3c8;--shadow:0 24px 60px rgba(0,0,0,.45);--ok:#34d399;--warn:#fbbf24;--bad:#f87171;--ok-bg:#0f3d2e;--bad-bg:#4a1d1d;';
const THEME_LIGHT = '--bg:#f5f6f8;--surface:#ffffff;--surface2:#eef0f3;--line:#dde1e7;--text:#12151a;--muted:#566070;--faint:#8a93a0;--star-off:#d3d8df;--danger:#b42318;--link:#0f766e;--shadow:0 24px 60px rgba(16,24,40,.12);--ok:#047857;--warn:#b45309;--bad:#b91c1c;--ok-bg:#d1fae5;--bad-bg:#fee2e2;';
const THEME_CSS = ':root{--accent:#0f766e;' + THEME_DARK + '}'
  + '@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){' + THEME_LIGHT + '}}'
  + ':root[data-theme="light"]{' + THEME_LIGHT + '}:root[data-theme="dark"]{' + THEME_DARK + '}'
  + 'html,body{margin:0;background:var(--bg)}';
const c = {
  bg: 'var(--bg)', surface: 'var(--surface)', line: 'var(--line)', text: 'var(--text)', muted: 'var(--muted)',
  electric: 'var(--accent)', link: 'var(--link)', green: 'var(--ok)', amber: 'var(--warn)', red: 'var(--bad)',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid ' + c.line,
  background: c.bg, color: c.text, fontSize: '1rem', fontFamily: sans,
};
const labelStyle = { display: 'block', color: c.muted, fontSize: '0.85rem', margin: '0.9rem 0 0.35rem 0' };
const primaryBtn = {
  display: 'inline-block', boxSizing: 'border-box', padding: '0.75rem 1.2rem', borderRadius: '0.6rem', border: 'none',
  background: c.electric, color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: sans,
  textDecoration: 'none', textAlign: 'center',
};
const ghostBtn = { ...primaryBtn, background: 'transparent', border: '1px solid ' + c.line, color: c.text };
const smallBtn = { ...ghostBtn, padding: '0.4rem 0.8rem', fontSize: '0.85rem' };

function money(cents) {
  const n = Number(cents || 0) / 100;
  const [whole, dec] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-R' : 'R') + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + dec;
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-ZA', { dateStyle: 'medium' }); } catch (e) { return String(iso); }
}
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim());
const monthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const sumOf = (rows, key) => rows.reduce((n, r) => n + (Number(r[key]) || 0), 0);

function ThemeToggle() {
  const [mode, setMode] = useState('dark');
  useEffect(() => {
    let saved = '';
    try { saved = window.localStorage.getItem('cx-theme') || ''; } catch (e) { /* ignore */ }
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    const light = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setMode(saved || (light ? 'light' : 'dark'));
  }, []);
  function flip() {
    const next = mode === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { window.localStorage.setItem('cx-theme', next); } catch (e) { /* ignore */ }
    setMode(next);
  }
  return (
    <button type="button" onClick={flip} aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', borderRadius: '9999px',
               padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}

function Frame({ children, onLogout, email }) {
  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: sans }}>
      <Head>
        <title>Cognix partners</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </Head>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.25rem 1.25rem 4rem 1.25rem' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                         gap: '0.75rem', padding: '0.5rem 0 1rem 0', borderBottom: '1px solid ' + c.line }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Cognix <span style={{ color: c.muted, fontWeight: 600, fontSize: '0.95rem' }}>partners</span>
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
    <section style={{ background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.5rem', marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{title}</h2>
        {right}
      </div>
      {subtitle && <p style={{ color: c.muted, fontSize: '0.9rem', lineHeight: 1.55, margin: '0.5rem 0 0 0' }}>{subtitle}</p>}
      <div style={{ marginTop: '1rem' }}>{children}</div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{ flex: '1 1 9rem', background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.8rem', padding: '1rem' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.3rem' }}>{label}</div>
      {hint && <div style={{ color: c.muted, fontSize: '0.78rem', marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
}

function Pill({ text, color }) {
  return <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', border: '1px solid ' + color, color }}>{text}</span>;
}

function LoginView() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!isEmail(clean)) { setState('error'); setMessage('Please enter a valid email address.'); return; }
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { emailRedirectTo: window.location.origin + '/partners' } });
    if (error) { setState('error'); setMessage('We could not send the login link right now. Please try again in a moment.'); } else setState('sent');
  }
  return (
    <div style={{ maxWidth: '26rem', margin: '3rem auto 0 auto', background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.75rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Partner log in</h1>
      {state === 'sent' ? (
        <p style={{ color: c.muted, lineHeight: 1.6 }}>
          <b style={{ color: c.green }}>Check your email.</b> We sent a login link to <b style={{ color: c.text }}>{email.trim().toLowerCase()}</b>.
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <p style={{ color: c.muted, lineHeight: 1.6, margin: 0 }}>Enter the email address Cognix has for you. We will email you a one-time login link - no password needed.</p>
          <label style={labelStyle}>Your email address</label>
          <input style={inputStyle} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" disabled={state === 'sending'} style={{ ...primaryBtn, width: '100%', marginTop: '1rem' }}>
            {state === 'sending' ? 'Sending...' : 'Email me a login link'}
          </button>
          {state === 'error' && <p role="alert" style={{ color: c.red, fontSize: '0.88rem', margin: '0.8rem 0 0 0' }}>{message}</p>}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The partner's own view
// ---------------------------------------------------------------------------
function PartnerView({ partner }) {
  const [clients, setClients] = useState(null);
  const [payments, setPayments] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [lead, setLead] = useState({ business: '', contact: '', phone: '', notes: '' });
  const [leadMsg, setLeadMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.rpc('partner_clients'),
      supabase.from('client_payments').select('id, client_id, amount_cents, partner_share_cents, paid_at, source').order('paid_at', { ascending: false }).limit(200),
      supabase.from('partner_payouts').select('id, amount_cents, paid_at, reference').order('paid_at', { ascending: false }).limit(200),
      supabase.from('partner_leads').select('id, business_name, status, created_at').order('created_at', { ascending: false }).limit(100),
    ]).then(([cl, pay, out, ld]) => {
      if (!alive) return;
      setClients(cl.error ? [] : cl.data || []);
      setPayments(pay.error ? [] : pay.data || []);
      setPayouts(out.error ? [] : out.data || []);
      setLeads(ld.error ? [] : ld.data || []);
    });
    return () => { alive = false; };
  }, []);

  const link = SITE + '/?ref=' + partner.referral_code;
  const shareText = 'Hi! I use Cognix to get more Google reviews for my business, and it is simple to set up. Have a look: ' + link;
  const earned = sumOf(payments || [], 'partner_share_cents');
  const month = sumOf((payments || []).filter((p) => p.paid_at >= monthStart()), 'partner_share_cents');
  const paidOut = sumOf(payouts, 'amount_cents');
  const nameOf = (id) => ((clients || []).find((x) => x.id === id) || {}).business_name || 'A business';

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch (e) { /* ignore */ }
  }
  async function sendLead(e) {
    e.preventDefault();
    setLeadMsg(null);
    if (!lead.business.trim() || !lead.phone.trim()) { setLeadMsg({ type: 'error', text: 'Please add the business name and a phone number.' }); return; }
    const { data, error } = await supabase.from('partner_leads').insert({
      partner_id: partner.id, business_name: lead.business.trim().slice(0, 120), contact_name: lead.contact.trim().slice(0, 120) || null,
      phone: lead.phone.trim().slice(0, 40), notes: lead.notes.trim().slice(0, 1000) || null,
    }).select('id, business_name, status, created_at');
    if (error || !data || !data[0]) { setLeadMsg({ type: 'error', text: 'Could not send that. Please try again.' }); return; }
    setLeads((l) => [data[0], ...l]);
    setLead({ business: '', contact: '', phone: '', notes: '' });
    setLeadMsg({ type: 'ok', text: 'Sent. The Cognix team will follow up.' });
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', margin: '1.5rem 0 0 0' }}>Hi {partner.full_name.split(' ')[0]}</h1>
      <p style={{ color: c.muted, lineHeight: 1.6 }}>
        You earn <b style={{ color: c.text }}>{Number(partner.commission_percent)}%</b> of every payment from the businesses you bring to Cognix.
        {partner.payout_method === 'paystack_split'
          ? ' Your share is paid automatically into your bank account by Paystack when the business pays.'
          : ' Cognix pays your share to your bank account by EFT.'}
      </p>
      {partner.status === 'paused' && <p style={{ color: c.amber }}>Your partner link is paused at the moment. Please contact Cognix.</p>}

      <Card title="Your share">
        {payments === null ? <p style={{ color: c.muted, margin: 0 }}>Loading...</p> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Stat label="Earned this month" value={money(month)} />
            <Stat label="Earned in total" value={money(earned)} />
            {partner.payout_method === 'manual'
              ? <Stat label="Still to be paid to you" value={money(earned - paidOut)} hint={'Paid so far: ' + money(paidOut)} />
              : <Stat label="Paid by" value="Paystack" hint="Straight to your bank account" />}
          </div>
        )}
        <p style={{ color: c.muted, fontSize: '0.78rem', lineHeight: 1.5, margin: '0.9rem 0 0 0' }}>
          These figures are worked out from each payment. The amount that reaches your bank can differ slightly
          because of payment fees. Your bank statement is the final word.
        </p>
      </Card>

      <Card title="Your link" subtitle="Share this with a business owner. When they subscribe through it, they are counted as yours.">
        <div style={{ background: c.bg, border: '1px solid ' + c.line, borderRadius: '0.6rem', padding: '0.8rem', wordBreak: 'break-all', color: c.link }}>{link}</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <button onClick={copyLink} style={ghostBtn}>{copied ? 'Copied' : 'Copy link'}</button>
          <a href={'https://wa.me/?text=' + encodeURIComponent(shareText)} target="_blank" rel="noreferrer" style={primaryBtn}>Share on WhatsApp</a>
        </div>
      </Card>

      <Card title="Your businesses" subtitle={clients ? clients.length + ' business' + (clients.length === 1 ? '' : 'es') + ' so far.' : ''}>
        {clients && clients.length === 0 && <p style={{ color: c.muted, margin: 0 }}>None yet. Share your link, or tell us about a business below.</p>}
        {(clients || []).map((x) => (
          <div key={x.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.7rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', alignItems: 'center' }}>
            <b>{x.business_name}</b>
            <Pill text={x.business_type === 'service' ? 'Service' : 'Restaurant'} color={c.muted} />
            <Pill text={x.active === false ? 'Paused' : 'Live'} color={x.active === false ? c.red : c.green} />
            <span style={{ color: c.muted, fontSize: '0.82rem' }}>Since {fmtDate(x.created_at)}</span>
          </div>
        ))}
      </Card>

      <Card title="Payments">
        {payments && payments.length === 0 && <p style={{ color: c.muted, margin: 0 }}>No payments yet.</p>}
        {(payments || []).map((p) => (
          <div key={p.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.7rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', justifyContent: 'space-between' }}>
            <span>{fmtDate(p.paid_at)} - {nameOf(p.client_id)}</span>
            <span><span style={{ color: c.muted }}>{money(p.amount_cents)} paid</span> &nbsp; <b style={{ color: c.green }}>{money(p.partner_share_cents)} yours</b></span>
          </div>
        ))}
        {payouts.length > 0 && <h3 style={{ fontSize: '1rem', margin: '1.2rem 0 0.2rem 0' }}>Paid to you by EFT</h3>}
        {payouts.map((p) => (
          <div key={p.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{fmtDate(p.paid_at)}{p.reference ? ' - ' + p.reference : ''}</span><b>{money(p.amount_cents)}</b>
          </div>
        ))}
      </Card>

      <Card title="Tell us about a business" subtitle="Know a business that would like more Google reviews? Give us their details and the Cognix team will get in touch.">
        <form onSubmit={sendLead} noValidate>
          <label style={{ ...labelStyle, marginTop: 0 }}>Business name</label>
          <input style={inputStyle} aria-label="Business name" value={lead.business} onChange={(e) => setLead({ ...lead, business: e.target.value })} maxLength={120} />
          <label style={labelStyle}>Contact person</label>
          <input style={inputStyle} aria-label="Contact person" value={lead.contact} onChange={(e) => setLead({ ...lead, contact: e.target.value })} maxLength={120} />
          <label style={labelStyle}>Their phone number</label>
          <input style={inputStyle} type="tel" aria-label="Their phone number" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} maxLength={40} />
          <label style={labelStyle}>Anything we should know</label>
          <textarea style={{ ...inputStyle, minHeight: '4rem' }} aria-label="Anything we should know" value={lead.notes} onChange={(e) => setLead({ ...lead, notes: e.target.value })} maxLength={1000} />
          <button type="submit" style={{ ...primaryBtn, marginTop: '1rem' }}>Send to Cognix</button>
          {leadMsg && <p role="status" style={{ margin: '0.75rem 0 0 0', color: leadMsg.type === 'ok' ? c.green : c.red }}>{leadMsg.text}</p>}
        </form>
        {leads.map((l) => (
          <div key={l.id} style={{ borderTop: '1px solid ' + c.line, marginTop: '0.9rem', paddingTop: '0.7rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <b>{l.business_name}</b><Pill text={l.status} color={l.status === 'signed' ? c.green : c.muted} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The Cognix team's view
// ---------------------------------------------------------------------------
const blankPartner = { full_name: '', email: '', phone: '', commission_percent: '40', payout_method: 'paystack_split', paystack_subaccount_code: '', starter_link: '', premium_link: '', status: 'active' };

function PartnerForm({ initial, onSave, onCancel, saveLabel }) {
  // Blank values arrive from the database as null; the form works with empty text.
  const [f, setF] = useState(() => {
    const merged = { ...blankPartner, ...initial };
    Object.keys(merged).forEach((k) => { if (merged[k] == null) merged[k] = ''; });
    return merged;
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function submit(e) {
    e.preventDefault();
    const pct = Number(f.commission_percent);
    if (!f.full_name.trim()) { setErr('Please add a name.'); return; }
    if (!isEmail(f.email)) { setErr('Please add a valid email address.'); return; }
    if (!(pct >= 0 && pct <= 100)) { setErr('The percentage must be between 0 and 100.'); return; }
    for (const k of ['starter_link', 'premium_link']) {
      if (f[k].trim() && !/^https:\/\/\S+$/i.test(f[k].trim())) { setErr('Payment links must start with https://'); return; }
    }
    setErr('');
    onSave({
      full_name: f.full_name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim() || null,
      commission_percent: pct, payout_method: f.payout_method, status: f.status,
      paystack_subaccount_code: f.paystack_subaccount_code.trim() || null,
      starter_link: f.starter_link.trim() || null, premium_link: f.premium_link.trim() || null,
    });
  }
  return (
    <form onSubmit={submit} noValidate>
      <label style={{ ...labelStyle, marginTop: 0 }}>Name</label>
      <input style={inputStyle} aria-label="Partner name" value={f.full_name} onChange={set('full_name')} maxLength={120} />
      <label style={labelStyle}>Email (they log in with this)</label>
      <input style={inputStyle} aria-label="Partner email" type="email" value={f.email} onChange={set('email')} />
      <label style={labelStyle}>Phone</label>
      <input style={inputStyle} aria-label="Partner phone" type="tel" value={f.phone || ''} onChange={set('phone')} maxLength={40} />
      <label style={labelStyle}>Their share of each payment (%)</label>
      <input style={inputStyle} aria-label="Partner percent" inputMode="decimal" value={f.commission_percent} onChange={set('commission_percent')} />
      <label style={labelStyle}>How they are paid</label>
      <select style={inputStyle} aria-label="Payout method" value={f.payout_method} onChange={set('payout_method')}>
        <option value="paystack_split">Automatically by Paystack (split payment)</option>
        <option value="manual">By EFT from Cognix (I record each payout)</option>
      </select>
      <label style={labelStyle}>Paystack subaccount code (for automatic payment, like ACCT_xxxx)</label>
      <input style={inputStyle} aria-label="Subaccount code" value={f.paystack_subaccount_code || ''} onChange={set('paystack_subaccount_code')} maxLength={60} />
      <label style={labelStyle}>Starter payment page link (R499, split with this partner)</label>
      <input style={inputStyle} aria-label="Starter link" value={f.starter_link || ''} onChange={set('starter_link')} maxLength={300} />
      <label style={labelStyle}>Premium payment page link (R1,499, split with this partner)</label>
      <input style={inputStyle} aria-label="Premium link" value={f.premium_link || ''} onChange={set('premium_link')} maxLength={300} />
      <label style={labelStyle}>Status</label>
      <select style={inputStyle} aria-label="Partner status" value={f.status} onChange={set('status')}>
        <option value="active">Active</option><option value="paused">Paused</option>
      </select>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button type="submit" style={primaryBtn}>{saveLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={ghostBtn}>Cancel</button>}
      </div>
      {err && <p role="alert" style={{ color: c.red, margin: '0.75rem 0 0 0' }}>{err}</p>}
    </form>
  );
}

function AdminView() {
  const [tab, setTab] = useState('partners');
  const [partners, setPartners] = useState(null);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState('');
  const [notice, setNotice] = useState('');
  const [pay, setPay] = useState({ client: '', amount: '', reference: '' });
  const [out, setOut] = useState({ partner: '', amount: '', reference: '' });

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from('partners').select('*').order('full_name'),
      supabase.from('clients').select('id, business_name, partner_id').order('business_name'),
      supabase.from('client_payments').select('*').order('paid_at', { ascending: false }).limit(300),
      supabase.from('partner_payouts').select('*').order('paid_at', { ascending: false }).limit(300),
      supabase.from('partner_leads').select('*').order('created_at', { ascending: false }).limit(200),
    ]).then(([p, cl, pay1, po, ld]) => {
      if (!alive) return;
      setPartners(p.error ? [] : p.data || []);
      setClients(cl.error ? [] : cl.data || []);
      setPayments(pay1.error ? [] : pay1.data || []);
      setPayouts(po.error ? [] : po.data || []);
      setLeads(ld.error ? [] : ld.data || []);
    });
    return () => { alive = false; };
  }, []);

  if (partners === null) return <p style={{ color: c.muted, marginTop: '2rem' }}>Loading...</p>;

  const partnerName = (id) => (partners.find((x) => x.id === id) || {}).full_name || '-';
  const clientName = (id) => (clients.find((x) => x.id === id) || {}).business_name || 'Unmatched payment';
  const stat = (p) => {
    const mine = payments.filter((x) => x.partner_id === p.id);
    const earned = sumOf(mine, 'partner_share_cents');
    const paid = sumOf(payouts.filter((x) => x.partner_id === p.id), 'amount_cents');
    return { clients: clients.filter((x) => x.partner_id === p.id).length, earned, owed: p.payout_method === 'manual' ? earned - paid : 0 };
  };

  async function addPartner(row) {
    setNotice('');
    const { data, error } = await supabase.from('partners').insert(row).select('*');
    if (error || !data || !data[0]) {
      setNotice(error && error.code === '23505' ? 'A partner with that email or code already exists.' : 'Could not add the partner. Please try again.');
      return;
    }
    setPartners((l) => [...l, data[0]].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setAdding(false);
  }
  async function savePartner(id, row) {
    setNotice('');
    const { data, error } = await supabase.from('partners').update(row).eq('id', id).select('*');
    if (error || !data || !data[0]) { setNotice('Could not save the changes. Please try again.'); return; }
    setPartners((l) => l.map((x) => (x.id === id ? data[0] : x)));
    setEditId('');
  }
  async function assign(clientId, partnerId) {
    setNotice('');
    const { error } = await supabase.rpc('assign_client_partner', { p_client: clientId, p_partner: partnerId || null });
    if (error) { setNotice('Could not change that. Please try again.'); return; }
    setClients((l) => l.map((x) => (x.id === clientId ? { ...x, partner_id: partnerId || null } : x)));
  }
  async function recordPayment(e) {
    e.preventDefault();
    setNotice('');
    const cents = Math.round(Number(String(pay.amount).replace(/[^0-9.]/g, '')) * 100);
    const cl = clients.find((x) => x.id === pay.client);
    if (!cl || !(cents > 0)) { setNotice('Choose a business and type the amount in rand.'); return; }
    const partner = partners.find((x) => x.id === cl.partner_id) || null;
    const pct = partner ? Number(partner.commission_percent) : null;
    const share = partner ? Math.round((cents * pct) / 100) : 0;
    const { data, error } = await supabase.from('client_payments').insert({
      reference: pay.reference.trim().slice(0, 100) || 'MANUAL-' + Date.now(), client_id: cl.id, partner_id: partner ? partner.id : null,
      amount_cents: cents, commission_percent: pct, partner_share_cents: share, cognix_share_cents: cents - share, source: 'manual',
    }).select('*');
    if (error || !data || !data[0]) { setNotice('Could not record that payment. Is the reference already used?'); return; }
    setPayments((l) => [data[0], ...l]);
    setPay({ client: '', amount: '', reference: '' });
  }
  async function recordPayout(e) {
    e.preventDefault();
    setNotice('');
    const cents = Math.round(Number(String(out.amount).replace(/[^0-9.]/g, '')) * 100);
    if (!out.partner || !(cents > 0)) { setNotice('Choose a partner and type the amount in rand.'); return; }
    const { data, error } = await supabase.from('partner_payouts').insert({ partner_id: out.partner, amount_cents: cents, reference: out.reference.trim().slice(0, 100) || null }).select('*');
    if (error || !data || !data[0]) { setNotice('Could not record that payout. Please try again.'); return; }
    setPayouts((l) => [data[0], ...l]);
    setOut({ partner: '', amount: '', reference: '' });
  }
  async function setLeadStatus(id, status) {
    const { data, error } = await supabase.from('partner_leads').update({ status }).eq('id', id).select('id');
    if (error || !data || data.length === 0) { setNotice('Could not update that lead.'); return; }
    setLeads((l) => l.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  const gross = sumOf(payments, 'amount_cents');
  const partnersShare = sumOf(payments, 'partner_share_cents');
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
      style={{ ...ghostBtn, padding: '0.6rem 1.1rem', background: tab === id ? c.electric : 'transparent', borderColor: tab === id ? c.electric : c.line, color: tab === id ? '#fff' : c.text }}>
      {label}
    </button>
  );

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', margin: '1.5rem 0 0 0' }}>Partners</h1>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        {tabBtn('partners', 'Partners')}{tabBtn('money', 'Money')}{tabBtn('leads', 'New leads' + (leads.filter((l) => l.status === 'new').length ? ' (' + leads.filter((l) => l.status === 'new').length + ')' : ''))}
      </div>
      {notice && <p role="alert" style={{ color: c.amber, margin: '0.9rem 0 0 0' }}>{notice}</p>}

      {tab === 'partners' && (
        <div>
          <Card title="Your partners" right={<button onClick={() => setAdding(!adding)} style={primaryBtn}>Add a partner</button>}>
            {adding && <div style={{ marginBottom: '1.2rem' }}><PartnerForm saveLabel="Add partner" onSave={addPartner} onCancel={() => setAdding(false)} /></div>}
            {partners.length === 0 && !adding && <p style={{ color: c.muted, margin: 0 }}>No partners yet.</p>}
            {partners.map((p) => {
              const s = stat(p);
              return (
                <div key={p.id} style={{ borderTop: '1px solid ' + c.line, padding: '1rem 0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', alignItems: 'center' }}>
                    <b style={{ fontSize: '1.05rem' }}>{p.full_name}</b>
                    <Pill text={Number(p.commission_percent) + '%'} color={c.green} />
                    <Pill text={p.payout_method === 'manual' ? 'EFT' : 'Paystack split'} color={c.muted} />
                    {p.status === 'paused' && <Pill text="Paused" color={c.red} />}
                  </div>
                  <div style={{ color: c.muted, fontSize: '0.86rem', margin: '0.4rem 0' }}>
                    {p.email} | {s.clients} business{s.clients === 1 ? '' : 'es'} | earned {money(s.earned)}
                    {p.payout_method === 'manual' ? ' | still owed ' + money(s.owed) : ''} | link code <b style={{ color: c.text }}>{p.referral_code}</b>
                  </div>
                  <button onClick={() => setEditId(editId === p.id ? '' : p.id)} style={smallBtn} aria-label={'Edit ' + p.full_name}>Edit</button>
                  {editId === p.id && (
                    <div style={{ marginTop: '1rem' }}>
                      <PartnerForm saveLabel="Save changes" initial={{ ...p, commission_percent: String(p.commission_percent) }} onSave={(row) => savePartner(p.id, row)} onCancel={() => setEditId('')} />
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
          <Card title="Which partner brought each business?" subtitle="A business brought by a partner pays that partner their share. Payments from a business with no partner are all Cognix's.">
            {clients.map((cl) => (
              <div key={cl.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.7rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{cl.business_name}</span>
                <select style={{ ...inputStyle, width: 'auto', padding: '0.45rem 0.7rem' }} aria-label={'Partner for ' + cl.business_name}
                  value={cl.partner_id || ''} onChange={(e) => assign(cl.id, e.target.value)}>
                  <option value="">No partner</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'money' && (
        <div>
          <Card title="All payments" subtitle="Payments recorded automatically from Paystack, plus any you add by hand.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Stat label="Paid in total" value={money(gross)} />
              <Stat label="Cognix's share" value={money(gross - partnersShare)} />
              <Stat label="Partners' share" value={money(partnersShare)} />
            </div>
            {payments.map((p) => (
              <div key={p.id} style={{ borderTop: '1px solid ' + c.line, marginTop: '0.8rem', paddingTop: '0.7rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1rem', justifyContent: 'space-between' }}>
                <span>{fmtDate(p.paid_at)} - {clientName(p.client_id)}{p.partner_id ? ' (' + partnerName(p.partner_id) + ')' : ''}{p.source === 'manual' ? ' - by hand' : ''}</span>
                <span>{money(p.amount_cents)} <span style={{ color: c.muted }}>| partner {money(p.partner_share_cents)} | Cognix {money(p.cognix_share_cents)}</span></span>
              </div>
            ))}
          </Card>
          <Card title="Record a payment by hand" subtitle="For a business that paid by EFT or cash. The split is worked out from its partner.">
            <form onSubmit={recordPayment} noValidate>
              <select style={inputStyle} aria-label="Business that paid" value={pay.client} onChange={(e) => setPay({ ...pay, client: e.target.value })}>
                <option value="">Choose a business</option>
                {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.business_name}</option>)}
              </select>
              <input style={{ ...inputStyle, marginTop: '0.6rem' }} aria-label="Amount paid (rand)" placeholder="Amount in rand, e.g. 1499" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
              <input style={{ ...inputStyle, marginTop: '0.6rem' }} aria-label="Payment reference" placeholder="Reference (optional)" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
              <button type="submit" style={{ ...primaryBtn, marginTop: '0.8rem' }}>Record payment</button>
            </form>
          </Card>
          <Card title="Paid out to partners by EFT" subtitle="Only for partners paid by EFT. Partners on Paystack split are paid automatically.">
            <form onSubmit={recordPayout} noValidate>
              <select style={inputStyle} aria-label="Partner paid" value={out.partner} onChange={(e) => setOut({ ...out, partner: e.target.value })}>
                <option value="">Choose a partner</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <input style={{ ...inputStyle, marginTop: '0.6rem' }} aria-label="Amount paid out (rand)" placeholder="Amount in rand" value={out.amount} onChange={(e) => setOut({ ...out, amount: e.target.value })} />
              <input style={{ ...inputStyle, marginTop: '0.6rem' }} aria-label="Payout reference" placeholder="EFT reference (optional)" value={out.reference} onChange={(e) => setOut({ ...out, reference: e.target.value })} />
              <button type="submit" style={{ ...primaryBtn, marginTop: '0.8rem' }}>Record payout</button>
            </form>
            {payouts.map((p) => (
              <div key={p.id} style={{ borderTop: '1px solid ' + c.line, marginTop: '0.8rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{fmtDate(p.paid_at)} - {partnerName(p.partner_id)}{p.reference ? ' - ' + p.reference : ''}</span><b>{money(p.amount_cents)}</b>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'leads' && (
        <Card title="Businesses partners told you about">
          {leads.length === 0 && <p style={{ color: c.muted, margin: 0 }}>Nothing yet.</p>}
          {leads.map((l) => (
            <div key={l.id} style={{ borderTop: '1px solid ' + c.line, padding: '0.9rem 0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', alignItems: 'center' }}>
                <b>{l.business_name}</b><span style={{ color: c.muted, fontSize: '0.85rem' }}>from {partnerName(l.partner_id)} - {fmtDate(l.created_at)}</span>
              </div>
              <div style={{ color: c.muted, fontSize: '0.88rem', margin: '0.3rem 0' }}>
                {[l.contact_name, l.phone].filter(Boolean).join(' - ')}{l.notes ? ' | ' + l.notes : ''}
              </div>
              <select style={{ ...inputStyle, width: 'auto', padding: '0.4rem 0.7rem' }} aria-label={'Status of ' + l.business_name}
                value={l.status} onChange={(e) => setLeadStatus(l.id, e.target.value)}>
                <option value="new">New</option><option value="contacted">Contacted</option><option value="signed">Signed up</option><option value="lost">Not going ahead</option>
              </select>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function Partners() {
  const [session, setSession] = useState(undefined);
  const [role, setRole] = useState(null); // null = checking, 'staff', 'partner', 'none'
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data && data.session ? data.session : null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, next) => { if (alive) setSession(next || null); });
    return () => { alive = false; if (listener && listener.subscription) listener.subscription.unsubscribe(); };
  }, []);

  const userId = session && session.user ? session.user.id : null;
  const email = session && session.user ? session.user.email : '';

  useEffect(() => {
    if (!userId) { setRole(null); setPartner(null); return undefined; }
    let alive = true;
    (async () => {
      const staff = await supabase.rpc('is_cognix_staff');
      if (!alive) return;
      if (!staff.error && staff.data === true) { setRole('staff'); return; }
      const me = await supabase.from('partners').select('*').eq('email', String(email).toLowerCase());
      if (!alive) return;
      if (!me.error && me.data && me.data[0]) { setPartner(me.data[0]); setRole('partner'); } else setRole('none');
    })();
    return () => { alive = false; };
  }, [userId, email]);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null); setRole(null); setPartner(null);
  }

  if (session === undefined) return <Frame><p style={{ color: c.muted, marginTop: '2rem' }}>Loading...</p></Frame>;
  if (!session) return <Frame><LoginView /></Frame>;
  if (role === null) return <Frame onLogout={logout} email={email}><p style={{ color: c.muted, marginTop: '2rem' }}>Loading...</p></Frame>;
  if (role === 'none') {
    return (
      <Frame onLogout={logout} email={email}>
        <div style={{ maxWidth: '30rem', margin: '3rem auto 0 auto', background: c.surface, border: '1px solid ' + c.line, borderRadius: '1rem', padding: '1.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>No partner account found</h1>
          <p style={{ color: c.muted, lineHeight: 1.6, margin: 0 }}>You are logged in as <b style={{ color: c.text }}>{email}</b>, but there is no partner account for that email. Please log out and try the email address Cognix has for you.</p>
        </div>
      </Frame>
    );
  }
  return <Frame onLogout={logout} email={email}>{role === 'staff' ? <AdminView /> : <PartnerView partner={partner} />}</Frame>;
}
