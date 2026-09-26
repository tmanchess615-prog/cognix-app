import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';

// ---------------------------------------------------------------------------
// GET /r/[slug]  ->  the page a customer sees after tapping or scanning a
// Cognix Smart Counter Stand.
//
// PATH A (4 or 5 stars): straight to the client's Google review page.
// PATH B (1, 2 or 3 stars): a private feedback box that builds a
// ready-to-send email to the manager, so nothing bad reaches Google
// by default.
// ---------------------------------------------------------------------------
export async function getServerSideProps({ params }) {
  const slug = String(params.slug || '').toLowerCase();
  if (!slug) return { props: { state: 'missing' } };

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, slug, business_name, google_review_url, manager_email')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { props: { state: 'missing' } };

    if (!data.google_review_url || !data.manager_email) {
      return { props: { state: 'incomplete' } };
    }

    return { props: { state: 'ok', client: data } };
  } catch (err) {
    return { props: { state: 'error' } };
  }
}

// Builds a complete, ready-to-send email from the rating and whatever the
// customer typed - so the customer can open their email app and press
// send with nothing left to write themselves.
function buildEmail(businessName, rating, feedback) {
  const subject = 'Feedback on my visit to ' + businessName + ' (' + rating + '/5)';
  const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
  const detail = feedback.trim()
    ? feedback.trim()
    : "I don't have more specific details to add beyond the rating, but wanted to let you know.";
  const body = 'Hi there,\n\n'
    + 'I visited ' + businessName + ' recently and wanted to share some quick feedback. '
    + "I'd rate the visit " + rating + ' out of 5 (' + starLine + ').\n\n'
    + detail + '\n\n'
    + 'I hope this is useful - thanks for taking the time to read it.\n\n'
    + '\u2014 Sent via the Cognix Smart Counter Stand';
  return { subject, body };
}

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9',
  muted: '#a5b3cb', electric: '#1f6fff', electricSoft: '#4d8bff', star: '#fbbf24',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(60rem 30rem at 50% -10%, rgba(31,111,255,0.16), rgba(15,23,42,0) 65%), '
    + c.bg,
  color: c.text, fontFamily: sans, padding: '1.5rem',
};
const cardStyle = {
  width: '100%', maxWidth: '26rem', background: c.surface, border: '1px solid ' + c.line,
  borderRadius: '1.1rem', padding: '2.25rem 1.75rem', boxSizing: 'border-box',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)', position: 'relative', overflow: 'hidden',
};
const accentBarStyle = {
  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
  background: 'linear-gradient(90deg, #1f6fff, #22d3ee)',
};
const kickerStyle = {
  color: c.electricSoft, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', margin: '0 0 0.6rem 0',
};
const headingStyle = { fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.28, margin: '0 0 0.5rem 0' };
const mutedStyle = { color: c.muted, lineHeight: 1.65, margin: '0 0 1.4rem 0', fontSize: '0.98rem' };
const buttonStyle = {
  display: 'block', boxSizing: 'border-box', width: '100%', padding: '1rem 1rem',
  borderRadius: '0.65rem', fontSize: '1rem', fontWeight: 700, textAlign: 'center',
  border: 'none', cursor: 'pointer', color: '#fff', background: c.electric,
  textDecoration: 'none', boxShadow: '0 10px 24px rgba(31, 111, 255, 0.38)',
};
const secondaryButtonStyle = {
  ...buttonStyle, background: '#1c2b4a', boxShadow: 'none', border: '1px solid ' + c.line,
};
const textareaStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.85rem', borderRadius: '0.65rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans, resize: 'vertical', lineHeight: 1.5,
};

function Shell({ title, children }) {
  return (
    <div style={pageStyle}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          body{margin:0;background:#0f172a}
          @keyframes cxFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          .cx-fade{animation:cxFadeIn .28s ease both}
          .cx-btn{transition:filter .15s ease, transform .15s ease}
          .cx-btn:hover{filter:brightness(1.08)}
          .cx-btn:active{transform:scale(0.98)}
          .cx-star{transition:transform .12s ease, color .12s ease}
          .cx-star:hover{transform:scale(1.12)}
          .cx-textarea:focus{outline:none;border-color:#1f6fff;box-shadow:0 0 0 3px rgba(31,111,255,0.25)}
        ` }} />
      </Head>
      <div style={cardStyle}>
        <div style={accentBarStyle} />
        {children}
      </div>
    </div>
  );
}

function StarRow({ value, onRate }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={n + ' out of 5 stars'}
          className="cx-star"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem',
                   fontSize: '2.75rem', lineHeight: 1, color: n <= value ? c.star : '#3a4a68' }}>
          &#9733;
        </button>
      ))}
    </div>
  );
}

export default function RouterPage(props) {
  if (props.state === 'missing') {
    return (
      <Shell title="Page not found">
        <h1 style={headingStyle}>This link is not set up</h1>
        <p style={mutedStyle}>Please ask a member of staff for help.</p>
      </Shell>
    );
  }

  if (props.state === 'incomplete') {
    return (
      <Shell title="Almost ready">
        <h1 style={headingStyle}>This stand is not quite ready yet</h1>
        <p style={mutedStyle}>
          Its Google review link or manager email has not been added yet. Open Supabase,
          Table Editor, clients, and fill both in for this row, then reload this page.
        </p>
      </Shell>
    );
  }

  if (props.state === 'error') {
    return (
      <Shell title="Please try again">
        <h1 style={headingStyle}>Something went wrong</h1>
        <p style={mutedStyle}>Please tap or scan the stand again in a moment.</p>
      </Shell>
    );
  }

  return <Rating client={props.client} />;
}

function Rating({ client }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle | redirecting | sent
  const [mailHref, setMailHref] = useState('');

  function handleRating(n) {
    setRating(n);
    if (n >= 4) {
      setStatus('redirecting');
      window.location.href = client.google_review_url;
    }
  }

  async function handleSendToManager(e) {
    e.preventDefault();

    const { subject, body } = buildEmail(client.business_name, rating, feedback);
    const href = 'mailto:' + client.manager_email
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    setMailHref(href);

    // Open the email app immediately, inside the click handler.
    window.location.href = href;
    setStatus('sent');

    const { error } = await supabase.from('private_reviews').insert({
      client_id: client.id,
      stars: rating,
      feedback: feedback.slice(0, 1000),
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Could not log private review:', error.message);
    }
  }

  return (
    <Shell title={client.business_name}>
      {rating === 0 && (
        <div className="cx-fade">
          <p style={kickerStyle}>Quick feedback</p>
          <h1 style={headingStyle}>How was your visit to {client.business_name}?</h1>
          <p style={mutedStyle}>Tap a star to rate it - it only takes a second.</p>
          <StarRow value={rating} onRate={handleRating} />
        </div>
      )}

      {status === 'redirecting' && (
        <div className="cx-fade">
          <p style={kickerStyle}>Thank you</p>
          <h1 style={headingStyle}>Taking you to Google&hellip;</h1>
          <p style={mutedStyle}>So you can share the love with other customers.</p>
        </div>
      )}

      {rating >= 1 && rating <= 3 && status === 'idle' && (
        <form onSubmit={handleSendToManager} className="cx-fade">
          <p style={kickerStyle}>Tell us more</p>
          <h1 style={headingStyle}>How was your experience?</h1>
          <p style={mutedStyle}>
            Let the manager know what happened, so they can make it right.
          </p>
          <textarea rows={4} maxLength={1000} value={feedback} className="cx-textarea"
            onChange={(e) => setFeedback(e.target.value)} style={textareaStyle}
            placeholder="What went wrong?" />
          <button type="submit" className="cx-btn" style={{ ...buttonStyle, marginTop: '1rem' }}>
            Send to the manager
          </button>
        </form>
      )}

      {status === 'sent' && (
        <div className="cx-fade">
          <p style={kickerStyle}>Thank you</p>
          <h1 style={headingStyle}>Your message is ready to send</h1>
          <p style={mutedStyle}>
            We've opened your email app with a message already written for {client.business_name}
            {' '}- just check it over and hit send.
          </p>
          <a href={mailHref} className="cx-btn" style={secondaryButtonStyle}>
            Didn't open? Open it again
          </a>
        </div>
      )}
    </Shell>
  );
}
