import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';

// ---------------------------------------------------------------------------
// GET /r/[slug]  ->  the page a customer sees after tapping or scanning a
// Cognix Smart Counter Stand.
//
// PATH A (4 or 5 stars): straight to the client's Google review page.
// PATH B (1, 2 or 3 stars): a private feedback box that emails the
// manager instead, so nothing bad ever reaches Google by default.
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

    // The row exists, but onboarding for this client is not finished yet.
    if (!data.google_review_url || !data.manager_email) {
      return { props: { state: 'incomplete' } };
    }

    return { props: { state: 'ok', client: data } };
  } catch (err) {
    // Supabase down, wrong keys, network blip, etc. Fail to a friendly
    // branded message instead of Next.js's generic 500 error page.
    return { props: { state: 'error' } };
  }
}

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9',
  muted: '#a5b3cb', electric: '#1f6fff', star: '#fbbf24',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: c.bg, color: c.text, fontFamily: sans, padding: '1.25rem',
};
const cardStyle = {
  width: '100%', maxWidth: '26rem', background: c.surface, border: '1px solid ' + c.line,
  borderRadius: '0.9rem', padding: '2rem 1.5rem', boxSizing: 'border-box',
};
const headingStyle = { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.3, margin: '0 0 0.4rem 0' };
const mutedStyle = { color: c.muted, lineHeight: 1.6, margin: '0 0 1.25rem 0' };
const buttonStyle = {
  display: 'block', boxSizing: 'border-box', width: '100%', padding: '0.95rem 1rem',
  borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, textAlign: 'center',
  border: 'none', cursor: 'pointer', color: '#fff', background: c.electric,
  textDecoration: 'none',
};
const ghostLinkStyle = {
  display: 'inline-block', marginTop: '0.9rem', color: c.muted, fontSize: '0.85rem',
  textDecoration: 'underline',
};
const textareaStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '0.5rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans, resize: 'vertical',
};

function Shell({ title, children }) {
  return (
    <div style={pageStyle}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: 'body{margin:0;background:#0f172a}' }} />
      </Head>
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

function StarRow({ value, onRate }) {
  return (
    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.5rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(n)} aria-label={n + ' out of 5 stars'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem',
                   fontSize: '2.5rem', lineHeight: 1, color: n <= value ? c.star : '#3a4a68' }}>
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

// Split out so hooks are only ever called once we have a real, fully set
// up client - getServerSideProps already ruled out every other case above.
function Rating({ client }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle | redirecting | sent

  function handleRating(n) {
    setRating(n);
    if (n >= 4) {
      // PATH A: happy customer. Straight to Google, no extra tap.
      setStatus('redirecting');
      window.location.href = client.google_review_url;
    }
    // PATH B (n is 1, 2 or 3): fall through - the render below shows the
    // private feedback form instead of a redirect.
  }

  async function handleSendToManager(e) {
    e.preventDefault();

    const subject = rating + '-star feedback for ' + client.business_name;
    const body = 'Rating: ' + rating + ' out of 5 stars.\n\n'
      + (feedback ? feedback : '(No extra comments were entered.)')
      + '\n\nSent from the Cognix Smart Counter Stand at ' + client.business_name + '.';
    const mailHref = 'mailto:' + client.manager_email
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    // Open the customer's email app immediately, inside the click handler.
    window.location.href = mailHref;
    setStatus('sent');

    // Log the review after opening the email app. If this insert fails
    // (bad network, RLS misconfigured), the manager can still receive the
    // email; only your own record of it is missing.
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
      <h1 style={headingStyle}>How was your visit to {client.business_name}?</h1>

      {rating === 0 && (
        <>
          <p style={mutedStyle}>Tap a star to rate it.</p>
          <StarRow value={rating} onRate={handleRating} />
        </>
      )}

      {status === 'redirecting' && (
        <p style={mutedStyle}>Thank you! Opening Google&hellip;</p>
      )}

      {rating >= 1 && rating <= 3 && status === 'idle' && (
        <form onSubmit={handleSendToManager}>
          <p style={{ ...mutedStyle, color: c.text, fontWeight: 600 }}>
            Sorry to hear that. Tell the manager what happened:
          </p>
          <textarea rows={4} maxLength={1000} value={feedback}
            onChange={(e) => setFeedback(e.target.value)} style={textareaStyle}
            placeholder="What went wrong?" />
          <button type="submit" style={{ ...buttonStyle, marginTop: '0.9rem' }}>
            Send to the manager
          </button>
          <a href={client.google_review_url} style={ghostLinkStyle}>
            Prefer to post on Google? Leave a public review
          </a>
        </form>
      )}

      {status === 'sent' && (
        <>
          <p style={mutedStyle}>
            Thank you &mdash; opening your email app so you can send this to the manager.
          </p>
          <p style={{ ...mutedStyle, fontSize: '0.8rem' }}>
            If it did not open, please email {client.manager_email} directly with your
            {' '}{rating} out of 5 star rating and your comments.
          </p>
        </>
      )}
    </Shell>
  );
}
