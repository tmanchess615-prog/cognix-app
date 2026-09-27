import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';

// ---------------------------------------------------------------------------
// GET /r/[slug]  ->  the page a customer sees after tapping or scanning a
// Cognix Smart Counter Stand.
//
// PATH A (4 or 5 stars): a brief thank-you animation, then straight to the
// client's Google review page.
// PATH B (1, 2 or 3 stars): a private feedback box that builds a
// ready-to-send email to the manager, so nothing bad reaches Google by
// default.
// ---------------------------------------------------------------------------
export async function getServerSideProps({ params }) {
  const slug = String(params.slug || '').toLowerCase();
  if (!slug) return { props: { state: 'missing' } };

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, slug, business_name, google_review_url, manager_email, logo_url, accent_color')
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

// ---------------------------------------------------------------------------
// Text in three languages. Only the survey itself is translated - the
// "not set up" / "not ready" / "error" screens stay in English, since
// those are seen by you (or nobody) rather than a customer.
//
// NOTE: these are machine-drafted translations, the isiZulu ones in
// particular. Have a fluent speaker check them before relying on them
// with real customers - wrong wording on a public page reflects on the
// business it belongs to.
// ---------------------------------------------------------------------------
const STR = {
  en: {
    langName: 'English',
    kickerFeedback: 'Quick feedback',
    visitHeading: (b) => `How was your visit to ${b}?`,
    tapStar: 'Tap a star to rate it - it only takes a second.',
    kickerThanks: 'Thank you',
    thanksHeading: 'Thank you!',
    thanksSub: "We're so glad you enjoyed it. Taking you to Google now\u2026",
    redirectingNote: 'Redirecting you now\u2026',
    kickerMore: 'Tell us more',
    experienceHeading: 'How was your experience?',
    experienceSub: 'Let the manager know what happened, so they can make it right.',
    placeholder: 'What went wrong?',
    sendBtn: 'Send to the manager',
    sentHeading: 'Your message is ready to send',
    sentSub: (b) => `We've opened your email app with a message already written for ${b} `
      + '- just check it over and hit send.',
    reopenBtn: "Didn't open? Open it again",
    poweredBy: 'Powered by Cognix',
  },
  af: {
    langName: 'Afrikaans',
    kickerFeedback: 'Vinnige terugvoer',
    visitHeading: (b) => `Hoe was jou besoek by ${b}?`,
    tapStar: "Tik op 'n ster om dit te gradeer - dit neem net 'n sekonde.",
    kickerThanks: 'Dankie',
    thanksHeading: 'Dankie!',
    thanksSub: 'Ons is so bly jy het dit geniet. Ons neem jou nou na Google\u2026',
    redirectingNote: 'Ons stuur jou nou aan\u2026',
    kickerMore: 'Vertel ons meer',
    experienceHeading: 'Hoe was jou ervaring?',
    experienceSub: 'Laat weet die bestuurder wat gebeur het, sodat hulle dit kan regmaak.',
    placeholder: 'Wat het verkeerd gegaan?',
    sendBtn: 'Stuur aan die bestuurder',
    sentHeading: 'Jou boodskap is gereed om te stuur',
    sentSub: (b) => `Ons het jou e-posprogram oopgemaak met 'n boodskap wat reeds vir ${b} `
      + 'geskryf is - gaan dit net na en druk stuur.',
    reopenBtn: 'Nie oopgemaak nie? Maak dit weer oop',
    poweredBy: 'Aangedryf deur Cognix',
  },
  zu: {
    langName: 'isiZulu',
    kickerFeedback: 'Impendulo esheshayo',
    visitHeading: (b) => `Bekunjani ukuvakasha kwakho e-${b}?`,
    tapStar: 'Thepha inkanyezi ukuze uyihlole - kuthatha isekhondi kuphela.',
    kickerThanks: 'Siyabonga',
    thanksHeading: 'Siyabonga!',
    thanksSub: 'Sijabule kakhulu ukuthi ukuthokozele. Sikuyisa ku-Google manje\u2026',
    redirectingNote: 'Sikuqondisa manje\u2026',
    kickerMore: 'Sitshele kabanzi',
    experienceHeading: 'Kwakunjani ukuhlangenwe nakho kwakho?',
    experienceSub: 'Yazisa umphathi ukuthi kwenzekeni, ukuze bakulungise.',
    placeholder: 'Yini eyonakele?',
    sendBtn: 'Thumela kumphathi',
    sentHeading: 'Umlayezo wakho usulungele ukuthunyelwa',
    sentSub: (b) => `Sivule uhlelo lwakho lwe-imeyili ngomlayezo osubhalelwe i-${b} `
      + 'vele uwuhlole bese uthumela.',
    reopenBtn: 'Ayivulekile? Vula futhi',
    poweredBy: 'Iqhutshwa yi-Cognix',
  },
};

// Fixed template wording for the email, per language. The customer's own
// typed feedback is never translated - only the wording around it is.
const EMAIL = {
  en: (business, rating, feedback) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || "I don't have more specific details to add beyond the rating, but wanted to let you know.";
    return {
      subject: `Feedback on my visit to ${business} (${rating}/5)`,
      body: 'Hi there,\n\n'
        + `I visited ${business} recently and wanted to share some quick feedback. `
        + `I'd rate the visit ${rating} out of 5 (${starLine}).\n\n`
        + `${detail}\n\n`
        + 'I hope this is useful - thanks for taking the time to read it.\n\n'
        + '\u2014 Sent via the Cognix Smart Counter Stand',
    };
  },
  af: (business, rating, feedback) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'Ek het nie meer spesifieke besonderhede om by te voeg nie, buiten die gradering, '
        + 'maar wou jou net laat weet.';
    return {
      subject: `Terugvoer oor my besoek by ${business} (${rating}/5)`,
      body: 'Hallo,\n\n'
        + `Ek het onlangs ${business} besoek en wil graag vinnige terugvoer gee. `
        + `Ek sou die besoek ${rating} uit 5 gradeer (${starLine}).\n\n`
        + `${detail}\n\n`
        + 'Ek hoop dit is nuttig - dankie dat jy die tyd geneem het om dit te lees.\n\n'
        + '\u2014 Gestuur via die Cognix Slim Toonbankstaander',
    };
  },
  zu: (business, rating, feedback) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'Anginayo eminye imininingwane ethile ukuyengeza ngale kokulinganisela, '
        + 'kodwa bengifuna ukukwazisa.';
    return {
      subject: `Impendulo mayelana nokuvakasha kwami e-${business} (${rating}/5)`,
      body: 'Sawubona,\n\n'
        + `Ngivakashele e-${business} muva nje futhi bengifuna ukwabelana ngempendulo esheshayo. `
        + `Ngingayilinganisela le vakasho ngo-${rating} kwangu-5 (${starLine}).\n\n`
        + `${detail}\n\n`
        + 'Ngithemba ukuthi lokhu kuzosiza - ngiyabonga ngesikhathi sakho sokufunda lokhu.\n\n'
        + '\u2014 Kuthunyelwe nge-Cognix Smart Counter Stand',
    };
  },
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_ACCENT = '#1f6fff';

// Blends a hex colour toward white by `amount` (0 to 1), for a light end
// of a gradient that always matches whatever colour a client is using.
function lighten(hex, amount) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (v) => Math.round(v + (255 - v) * amount);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return '#' + toHex(mix(r)) + toHex(mix(g)) + toHex(mix(b));
}

const c = {
  bg: '#0f172a', surface: '#131f38', line: '#22335a', text: '#f1f5f9',
  muted: '#a5b3cb', star: '#fbbf24',
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
const headingStyle = { fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.28, margin: '0 0 0.5rem 0' };
const mutedStyle = { color: c.muted, lineHeight: 1.65, margin: '0 0 1.4rem 0', fontSize: '0.98rem' };
const textareaStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.85rem', borderRadius: '0.65rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans, resize: 'vertical', lineHeight: 1.5,
};

function Shell({ title, accentColor, children }) {
  return (
    <div style={pageStyle}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          body{margin:0;background:#0f172a}
          @keyframes cxFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes cxSpin{to{transform:rotate(360deg)}}
          @keyframes cxPop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}
          .cx-fade{animation:cxFadeIn .28s ease both}
          .cx-btn{transition:filter .15s ease, transform .15s ease}
          .cx-btn:hover{filter:brightness(1.08)}
          .cx-btn:active{transform:scale(0.98)}
          .cx-star{transition:transform .12s ease, color .12s ease}
          .cx-star:hover{transform:scale(1.12)}
          .cx-textarea:focus{outline:none;border-color:${accentColor};box-shadow:0 0 0 3px ${accentColor}40}
          .cx-spin{animation:cxSpin .8s linear infinite}
          .cx-pop{animation:cxPop .25s ease both}
          .cx-lang:hover{filter:brightness(1.15)}
        ` }} />
      </Head>
      <div style={cardStyle}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, ${accentColor}, ${lighten(accentColor, 0.4)})` }} />
        {children}
        <p style={{ color: '#5b6b8c', fontSize: '0.72rem', textAlign: 'center',
          letterSpacing: '0.04em', margin: '1.75rem 0 0 0' }}>
          {STR.en.poweredBy}
        </p>
      </div>
    </div>
  );
}

function StarRow({ value, onRate, accentColor }) {
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

function LangToggle({ lang, onChange, accentColor }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.1rem' }}>
      {['en', 'af', 'zu'].map((code) => (
        <button key={code} onClick={() => onChange(code)} className="cx-lang"
          aria-label={STR[code].langName}
          style={{
            border: '1px solid ' + (lang === code ? accentColor : c.line),
            background: lang === code ? accentColor + '26' : 'transparent',
            color: lang === code ? '#fff' : c.muted,
            borderRadius: '9999px', padding: '0.3rem 0.75rem', fontSize: '0.78rem',
            fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em',
          }}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function RouterPage(props) {
  if (props.state === 'missing') {
    return (
      <Shell title="Page not found" accentColor={DEFAULT_ACCENT}>
        <h1 style={headingStyle}>This link is not set up</h1>
        <p style={mutedStyle}>Please ask a member of staff for help.</p>
      </Shell>
    );
  }

  if (props.state === 'incomplete') {
    return (
      <Shell title="Almost ready" accentColor={DEFAULT_ACCENT}>
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
      <Shell title="Please try again" accentColor={DEFAULT_ACCENT}>
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
  const [status, setStatus] = useState('idle'); // idle | spinning | redirecting | sent
  const [mailHref, setMailHref] = useState('');
  const [lang, setLang] = useState('en');

  const t = STR[lang];
  const accentColor = client.accent_color && HEX_RE.test(client.accent_color)
    ? client.accent_color
    : DEFAULT_ACCENT;

  const buttonStyle = {
    display: 'block', boxSizing: 'border-box', width: '100%', padding: '1rem 1rem',
    borderRadius: '0.65rem', fontSize: '1rem', fontWeight: 700, textAlign: 'center',
    border: 'none', cursor: 'pointer', color: '#fff', background: accentColor,
    textDecoration: 'none', boxShadow: `0 10px 24px ${accentColor}61`,
  };
  const secondaryButtonStyle = {
    ...buttonStyle, background: '#1c2b4a', boxShadow: 'none', border: '1px solid ' + c.line,
  };
  const kickerStyle = {
    color: lighten(accentColor, 0.25), fontSize: '0.78rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.6rem 0',
  };

  function handleRating(n) {
    setRating(n);
    if (n >= 4) {
      // A short, deliberate pause with a spinner then a checkmark, instead
      // of navigating away instantly - so the "thank you" actually gets
      // seen. Roughly three quarters of a second in total.
      setStatus('spinning');
      window.setTimeout(() => {
        setStatus('redirecting');
        window.setTimeout(() => {
          window.location.href = client.google_review_url;
        }, 260);
      }, 480);
    }
  }

  async function handleSendToManager(e) {
    e.preventDefault();

    const { subject, body } = EMAIL[lang](client.business_name, rating, feedback);
    const href = 'mailto:' + client.manager_email
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    setMailHref(href);

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
    <Shell title={client.business_name} accentColor={accentColor}>
      {client.logo_url && (
        <img src={client.logo_url} alt={client.business_name}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{ height: '2.4rem', marginBottom: '1.1rem', display: 'block' }} />
      )}

      {rating === 0 && (
        <div className="cx-fade">
          <LangToggle lang={lang} onChange={setLang} accentColor={accentColor} />
          <p style={kickerStyle}>{t.kickerFeedback}</p>
          <h1 style={headingStyle}>{t.visitHeading(client.business_name)}</h1>
          <p style={mutedStyle}>{t.tapStar}</p>
          <StarRow value={rating} onRate={handleRating} accentColor={accentColor} />
        </div>
      )}

      {status === 'spinning' && (
        <div className="cx-fade">
          <p style={kickerStyle}>{t.kickerThanks}</p>
          <h1 style={headingStyle}>{t.thanksHeading}</h1>
          <p style={mutedStyle}>{t.thanksSub}</p>
          <div className="cx-spin" style={{ width: '2rem', height: '2rem', borderRadius: '9999px',
            border: '3px solid ' + c.line, borderTopColor: accentColor }} />
        </div>
      )}

      {status === 'redirecting' && (
        <div className="cx-fade">
          <p style={kickerStyle}>{t.kickerThanks}</p>
          <h1 style={headingStyle}>{t.thanksHeading}</h1>
          <div className="cx-pop" style={{ width: '2.75rem', height: '2.75rem', borderRadius: '9999px',
            background: accentColor, color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.4rem', margin: '0.5rem 0 0.9rem 0' }}>
            &#10003;
          </div>
          <p style={mutedStyle}>{t.redirectingNote}</p>
        </div>
      )}

      {rating >= 1 && rating <= 3 && status === 'idle' && (
        <form onSubmit={handleSendToManager} className="cx-fade">
          <p style={kickerStyle}>{t.kickerMore}</p>
          <h1 style={headingStyle}>{t.experienceHeading}</h1>
          <p style={mutedStyle}>{t.experienceSub}</p>
          <textarea rows={4} maxLength={1000} value={feedback} className="cx-textarea"
            onChange={(e) => setFeedback(e.target.value)} style={textareaStyle}
            placeholder={t.placeholder} />
          <button type="submit" className="cx-btn" style={{ ...buttonStyle, marginTop: '1rem' }}>
            {t.sendBtn}
          </button>
        </form>
      )}

      {status === 'sent' && (
        <div className="cx-fade">
          <p style={kickerStyle}>{t.kickerThanks}</p>
          <h1 style={headingStyle}>{t.sentHeading}</h1>
          <p style={mutedStyle}>{t.sentSub(client.business_name)}</p>
          <a href={mailHref} className="cx-btn" style={secondaryButtonStyle}>
            {t.reopenBtn}
          </a>
        </div>
      )}
    </Shell>
  );
}
