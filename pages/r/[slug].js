import { useState, useEffect } from 'react';
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
// default. The customer can also leave a phone number if they are happy
// to be called back about it.
// ---------------------------------------------------------------------------
export async function getServerSideProps({ params, query }) {
  // A personal review link ends in ?c=<customer id>: it tells us exactly who tapped it.
  const cid = String((query && query.c) || '');
  const customerId = /^[0-9a-f-]{36}$/i.test(cid) ? cid : null;
  const slug = String(params.slug || '').toLowerCase();
  if (!slug) return { props: { state: 'missing' } };

  try {
    // Look up this one business through a safe database function, so the
    // public side never needs permission to list every client. If the function
    // has not been created yet, fall back to reading the table directly.
    let data = null;
    const viaFunction = await supabase.rpc('get_client_by_slug', { p_slug: slug });
    if (!viaFunction.error) {
      data = Array.isArray(viaFunction.data) ? viaFunction.data[0] || null : viaFunction.data || null;
    } else {
      const direct = await supabase
        .from('clients')
        .select(
          'id, slug, business_name, google_review_url, manager_email, logo_url, accent_color, active, footer_text'
        )
        .eq('slug', slug)
        .maybeSingle();
      if (direct.error) throw direct.error;
      data = direct.data;
    }
    if (!data) return { props: { state: 'missing' } };

    // Switched off from Supabase (Table Editor > clients > active = false),
    // for example when a client has not paid. Customers see a polite
    // message and nothing is sent anywhere.
    if (data.active === false) {
      return { props: { state: 'paused' } };
    }

    if (!data.google_review_url || !data.manager_email) {
      return { props: { state: 'incomplete' } };
    }

    return { props: { state: 'ok', client: data, customerId } };
  } catch (err) {
    return { props: { state: 'error' } };
  }
}

// ---------------------------------------------------------------------------
// Text in five languages. Only the survey itself is translated - the
// "not set up" / "not ready" / "error" screens stay in English, since
// those are seen by you (or nobody) rather than a customer.
//
// IMPORTANT: these are machine-drafted translations, not written or
// checked by a fluent speaker. Confidence is reasonable for Afrikaans,
// lower for isiZulu, and LOWEST for Sepedi and Tshivenda - please have a
// fluent speaker of each language check the wording before relying on it
// with real customers. Wrong wording on a public page reflects on the
// business it belongs to, not just you.
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
    phonePlaceholder: "Your phone number",
    namePlaceholder: "Your name",
    emailPlaceholder: "Your email",
    phoneHelp: "We'll use your details to put things right, and may send you the occasional update. Reply STOP any time to opt out.",
    googleBtn: 'Leave a Google review',
    stayHeading: 'Stay in touch',
    stayBody: (b) => `Want to hear from ${b}? Leave your details - it's optional.`,
    consentLabel: (b) => `I agree that ${b} may contact me. I can ask them to stop at any time.`,
    saveDetailsBtn: 'Save my details',
    savedMsg: 'Thank you - your details were saved.',
    needContact: 'Please add an email address or a phone number.',
    needConsent: 'Please tick the box to agree.',
    saveFailed: 'Sorry, we could not save that. You can still leave your review.',
    thanksReview: 'Thank you for your review!',
    offerIntro: (b, offer) => offer ? `Here's a thank-you from ${b}: ${offer}. Leave your details and we'll send your code.` : `Want to hear from ${b}? Leave your details to stay in the loop.`,
    claimBtn: 'Get my reward',
    codeHeading: 'Your reward',
    codeHelp: 'Show this screen to a team member on your next visit.',
    codeLabel: 'Your code',
    reopenGoogle: "Didn't see Google? Open it again",
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
    phonePlaceholder: "Jou telefoonnommer",
    namePlaceholder: "Jou naam",
    emailPlaceholder: "Jou e-pos",
    phoneHelp: "Ons gebruik jou besonderhede om dinge reg te stel en kan jou af en toe 'n opdatering stuur. Antwoord STOP om enige tyd uit te tree.",
    googleBtn: "Los 'n Google-resensie",
    stayHeading: 'Bly in kontak',
    stayBody: (b) => `Wil jy van ${b} hoor? Los jou besonderhede - dit is opsioneel.`,
    consentLabel: (b) => `Ek stem in dat ${b} my mag kontak. Ek kan hulle enige tyd vra om op te hou.`,
    saveDetailsBtn: 'Stoor my besonderhede',
    savedMsg: 'Dankie - jou besonderhede is gestoor.',
    needContact: "Voeg asseblief 'n e-posadres of foonnommer by.",
    needConsent: 'Merk asseblief die blokkie om in te stem.',
    saveFailed: 'Jammer, ons kon dit nie stoor nie. Jy kan steeds jou resensie los.',
    thanksReview: 'Dankie vir jou resensie!',
    offerIntro: (b, offer) => offer ? `Hier is 'n dankie van ${b}: ${offer}. Los jou besonderhede en ons stuur jou kode.` : `Wil jy van ${b} hoor? Los jou besonderhede om op hoogte te bly.`,
    claimBtn: 'Kry my beloning',
    codeHeading: 'Jou beloning',
    codeHelp: "Wys hierdie skerm aan 'n spanlid met jou volgende besoek.",
    codeLabel: 'Jou kode',
    reopenGoogle: 'Nie Google gesien nie? Maak dit weer oop',
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
    phonePlaceholder: "Inombolo yakho yocingo",
    namePlaceholder: "Igama lakho",
    emailPlaceholder: "I-imeyili yakho",
    phoneHelp: "Sizosebenzisa imininingwane yakho ukulungisa izinto futhi singakuthumelela izibuyekezo ngezikhathi ezithile. Phendula ngo-STOP noma nini ukuze uyeke.",
    googleBtn: 'Shiya ukubuyekezwa ku-Google',
    stayHeading: 'Hlala uxhumene nathi',
    stayBody: (b) => `Ingabe ufuna ukuzwa kwa-${b}? Shiya imininingwane yakho - akuphoqelekile.`,
    consentLabel: (b) => `Ngiyavuma ukuthi i-${b} ingangithinta. Ngingabacela ukuthi bayeke noma nini.`,
    saveDetailsBtn: 'Gcina imininingwane yami',
    savedMsg: 'Siyabonga - imininingwane yakho igciniwe.',
    needContact: 'Sicela wengeze i-imeyili noma inombolo yocingo.',
    needConsent: 'Sicela ushaye uphawu ebhokisini ukuze uvume.',
    saveFailed: 'Uxolo, asikwazanga ukukugcina lokho. Usengakwazi ukushiya ukubuyekezwa kwakho.',
    thanksReview: 'Siyabonga ngokubuyekeza kwakho!',
    offerIntro: (b, offer) => offer ? `Nasi isibonelo sokubonga esivela ku-${b}: ${offer}. Shiya imininingwane yakho sizokuthumelela ikhodi yakho.` : `Ingabe ufuna ukuzwa kwa-${b}? Shiya imininingwane yakho.`,
    claimBtn: 'Thola umvuzo wami',
    codeHeading: 'Umvuzo wakho',
    codeHelp: 'Khombisa lesi sikrini ilungu leqembu uma ubuya ngokuzayo.',
    codeLabel: 'Ikhodi yakho',
    reopenGoogle: 'Awuboni i-Google? Yivule futhi',
    sendBtn: 'Thumela kumphathi',
    sentHeading: 'Umlayezo wakho usulungele ukuthunyelwa',
    sentSub: (b) => `Sivule uhlelo lwakho lwe-imeyili ngomlayezo osubhalelwe i-${b} `
      + 'vele uwuhlole bese uthumela.',
    reopenBtn: 'Ayivulekile? Vula futhi',
    poweredBy: 'Iqhutshwa yi-Cognix',
  },
  nso: {
    langName: 'Sepedi',
    kickerFeedback: 'Maikutlo a potlako',
    visitHeading: (b) => `Boeti bja gago go ${b} bo be bjang?`,
    tapStar: 'Tobetša naledi go e hlahloba - go tšea sekonthe fela.',
    kickerThanks: 'Re a leboga',
    thanksHeading: 'Re a leboga!',
    thanksSub: 'Re thabile gore o thabetše! Re go iša go Google gona bjale\u2026',
    redirectingNote: 'Re go lebiša gona bjale\u2026',
    kickerMore: 'Re botše go feta',
    experienceHeading: 'Maitemogelo a gago e be a bjang?',
    experienceSub: 'Tsebiša molaodi seo se diregilego, gore ba se lokiše.',
    placeholder: 'Ke eng seo se sa fetago gabotse?',
    phonePlaceholder: "Nomoro ya gago ya founu",
    namePlaceholder: "Leina la gago",
    emailPlaceholder: "Emeile ya gago",
    phoneHelp: "Re tla dirišetša dintlha tša gago go lokiša dilo gomme re ka go romela ditsebišo ka nako ye nngwe. Araba ka STOP nako efe goba efe go ema.",
    googleBtn: 'Tlogela tlhahlobo ya Google',
    stayHeading: 'Dula o ikgokaganya le rena',
    stayBody: (b) => `O nyaka go kwa go tšwa go ${b}? Tlogela dintlha tša gago - ga di gapeletšwe.`,
    consentLabel: (b) => `Ke dumela gore ${b} e kgone go ikgokaganya le nna. Nka ba kgopela go ema nako efe goba efe.`,
    saveDetailsBtn: 'Boloka dintlha tša ka',
    savedMsg: 'Re a leboga - dintlha tša gago di bolokilwe.',
    needContact: 'Hle oketše aterese ya emeile goba nomoro ya founu.',
    needConsent: 'Hle tšhaya lepokisana gore o dumele.',
    saveFailed: 'Hle ntshwarele, ga se ra kgona go e boloka. O sa kgona go tlogela tlhahlobo ya gago.',
    thanksReview: 'Re a leboga ka tlhahlobo ya gago!',
    offerIntro: (b, offer) => offer ? `Ke ngwakwana wa go leboga go tšwa go ${b}: ${offer}. Tlogela dintlha tša gago re tla go romela khoutu ya gago.` : `O nyaka go kwa go tšwa go ${b}? Tlogela dintlha tša gago.`,
    claimBtn: 'Hwetša moputso wa ka',
    codeHeading: 'Moputso wa gago',
    codeHelp: 'Bontšha sekirini se go leloko la sehlopha ge o etela gape.',
    codeLabel: 'Khoutu ya gago',
    reopenGoogle: 'Ga o bone Google? E bule gape',
    sendBtn: 'Romela go molaodi',
    sentHeading: 'Molaetša wa gago o loketše go romelwa',
    sentSub: (b) => `Re butše app ya gago ya email ka molaetša o šetšego o ngwadilwe bakeng sa ${b} `
      + '- hlahloba fela gomme o romele.',
    reopenBtn: 'Ga se ya bulega? E bule gape',
    poweredBy: 'E hlohleletšwa ke Cognix',
  },
  ve: {
    langName: 'Tshivenda',
    kickerFeedback: 'Mafhungo a u ṱavhanya',
    visitHeading: (b) => `Vhutsimbi hau kha ${b} ho vha hu tini?`,
    tapStar: 'Kwama naledzi u vhala - zwi dzhia sekonde fhedzi.',
    kickerThanks: 'Ndi a livhuwa',
    thanksHeading: 'Ndi a livhuwa!',
    thanksSub: 'Ri takalela uri wo zwi ḓiphina! Ri khou ni isa kha Google zwino\u2026',
    redirectingNote: 'Ri khou ni livhisa zwino\u2026',
    kickerMore: 'Ri vhudzeni zwinzhi',
    experienceHeading: 'Vhutsimbi hau ho vha hu tini?',
    experienceSub: 'Vhudzani mulanguli zwe zwa itea, uri vha zwi lugise.',
    placeholder: 'Ndi mini tsho khakhelaho?',
    phonePlaceholder: "Nomboro yau ya luṱingo",
    namePlaceholder: "Dzina lau",
    emailPlaceholder: "Imeili yau",
    phoneHelp: "Ri ḓo shumisa mafhungo anu u lugisa zwithu nahone ri nga ni rumela mafhungo nga tshifhinga tshiṅwe. Fhindulani nga STOP tshifhinga tshiṅwe na tshiṅwe u litsha.",
    googleBtn: 'Siala tsedzuluso kha Google',
    stayHeading: 'Dzulani ni tshi vhofha',
    stayBody: (b) => `Ni khou ṱoḓa u pfa u bva kha ${b}? Siani mafhungo anu - a si vhukuma.`,
    consentLabel: (b) => `Ndi a tenda uri ${b} i nga dzhenela u vhofha na nṋe. Ndi nga i humbela u litsha tshifhinga tshiṅwe na tshiṅwe.`,
    saveDetailsBtn: 'Vhulungani mafhungo anga',
    savedMsg: 'Ndi a livhuwa - mafhungo anu o vhulungwa.',
    needContact: 'Ri humbela ni engedze imeili kana nomboro ya luṱingo.',
    needConsent: 'Ri humbela ni ṱhaphudze bogisi u tenda.',
    saveFailed: 'Ri khou humbela pfarelo, a ro ngo kona u i vhulunga. Ni a kona u siala tsedzuluso yanu.',
    thanksReview: 'Ndi a livhuwa nga tsedzuluso yanu!',
    offerIntro: (b, offer) => offer ? `Hu na ngaho ya u livhuwa i bvaho kha ${b}: ${offer}. Siani mafhungo anu ri ni rumele khodi yanu.` : `Ni khou ṱoḓa u pfa u bva kha ${b}? Siani mafhungo anu.`,
    claimBtn: 'Wana tshileme tshanga',
    codeHeading: 'Tshileme tshanu',
    codeHelp: 'Sumbedzani iyi sikirini kha mulwane wa tshigwada musi ni tshi vhuya hafhu.',
    codeLabel: 'Khodi yanu',
    reopenGoogle: 'A ni vhoni Google? Ivuleni hafhu',
    sendBtn: 'Rumela kha mulanguli',
    sentHeading: 'Mulaedza wau wo lugela u rumelwa',
    sentSub: (b) => `Ro vula app yau ya imeili na mulaedza wo no ṅwalwa u itela ${b} `
      + '- sedzani fhedzi na u rumela.',
    reopenBtn: 'A yo ngo vulea? I vule hafhu',
    poweredBy: 'I shumiswa nga Cognix',
  },
};

const LANGS = ['en', 'af', 'zu', 'nso', 've'];

// Fixed template wording for the email, per language. The customer's own
// typed feedback - and their phone number - are never translated, only
// the wording around them is.
const LABELS = {
  en: { name: 'Name', email: 'Email', phone: 'Phone number (for a call back)' },
  af: { name: 'Naam', email: 'E-pos', phone: "Telefoonnommer (vir 'n terugbel)" },
  zu: { name: 'Igama', email: 'I-imeyili', phone: 'Inombolo yocingo (ukuze babuye bakushayele)' },
  nso: { name: 'Leina', email: 'Emeile', phone: 'Nomoro ya founu (bakeng sa go go founela)' },
  ve: { name: 'Dzina', email: 'Imeili', phone: 'Nomboro ya luṱingo (u itela u ni fonela)' },
};

function contactBlock(contact, labels) {
  const lines = [];
  if (contact.name.trim()) lines.push(labels.name + ': ' + contact.name.trim());
  if (contact.email.trim()) lines.push(labels.email + ': ' + contact.email.trim());
  if (contact.phone.trim()) lines.push(labels.phone + ': ' + contact.phone.trim());
  return lines.length ? '\n\n' + lines.join('\n') : '';
}

const EMAIL = {
  en: (business, rating, feedback, contact) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || "I don't have more specific details to add beyond the rating, but wanted to let you know.";
    const phoneLine = contactBlock(contact, LABELS.en);
    return {
      subject: `Feedback on my visit to ${business} (${rating}/5)`,
      body: 'Hi there,\n\n'
        + `I visited ${business} recently and wanted to share some quick feedback. `
        + `I'd rate the visit ${rating} out of 5 (${starLine}).\n\n`
        + `${detail}${phoneLine}\n\n`
        + 'I hope this is useful - thanks for taking the time to read it.\n\n'
        + '\u2014 Sent via the Cognix Smart Counter Stand',
    };
  },
  af: (business, rating, feedback, contact) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'Ek het nie meer spesifieke besonderhede om by te voeg nie, buiten die gradering, '
        + 'maar wou jou net laat weet.';
    const phoneLine = contactBlock(contact, LABELS.af);
    return {
      subject: `Terugvoer oor my besoek by ${business} (${rating}/5)`,
      body: 'Hallo,\n\n'
        + `Ek het onlangs ${business} besoek en wil graag vinnige terugvoer gee. `
        + `Ek sou die besoek ${rating} uit 5 gradeer (${starLine}).\n\n`
        + `${detail}${phoneLine}\n\n`
        + 'Ek hoop dit is nuttig - dankie dat jy die tyd geneem het om dit te lees.\n\n'
        + '\u2014 Gestuur via die Cognix Slim Toonbankstaander',
    };
  },
  zu: (business, rating, feedback, contact) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'Anginayo eminye imininingwane ethile ukuyengeza ngale kokulinganisela, '
        + 'kodwa bengifuna ukukwazisa.';
    const phoneLine = contactBlock(contact, LABELS.zu);
    return {
      subject: `Impendulo mayelana nokuvakasha kwami e-${business} (${rating}/5)`,
      body: 'Sawubona,\n\n'
        + `Ngivakashele e-${business} muva nje futhi bengifuna ukwabelana ngempendulo esheshayo. `
        + `Ngingayilinganisela le vakasho ngo-${rating} kwangu-5 (${starLine}).\n\n`
        + `${detail}${phoneLine}\n\n`
        + 'Ngithemba ukuthi lokhu kuzosiza - ngiyabonga ngesikhathi sakho sokufunda lokhu.\n\n'
        + '\u2014 Kuthunyelwe nge-Cognix Smart Counter Stand',
    };
  },
  nso: (business, rating, feedback, contact) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'Ga ke na dintlha tše dingwe tše di kgethegilego go tlaleletša ntle le tekanyo, '
        + 'eupša ke be ke nyaka go go tsebiša.';
    const phoneLine = contactBlock(contact, LABELS.nso);
    return {
      subject: `Maikutlo ka boeti bja ka go ${business} (${rating}/5)`,
      body: 'Dumela,\n\n'
        + `Ke etetše ${business} morago bjale gomme ke nyaka go abelana maikutlo a potlako. `
        + `Nka lekanya boeti bjo ${rating} go tše 5 (${starLine}).\n\n`
        + `${detail}${phoneLine}\n\n`
        + 'Ke tshepa gore se se a thuša - ke leboga nako yeo o e tšeetšego go e bala.\n\n'
        + '\u2014 E rometšwe ka Cognix Smart Counter Stand',
    };
  },
  ve: (business, rating, feedback, contact) => {
    const starLine = '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
    const detail = feedback.trim()
      || 'A thi na mafhungo manzhi a re ṅwalela nnḓa ha mulinganyo, fhedzi ndo vha ndi tshi'
        + ' khou ṱoḓa u ni vhudza.';
    const phoneLine = contactBlock(contact, LABELS.ve);
    return {
      subject: `Mafhungo nga ha vhutsimbi hanga kha ${business} (${rating}/5)`,
      body: 'Ndaa,\n\n'
        + `Ndo dalela ${business} zwenezwino nahone ndo vha ndi tshi khou ṱoḓa u abelana `
        + `mafhungo a u ṱavhanya. Ndi ḓo linganyisa vhutsimbi uhu nga ${rating} kha 5 (${starLine}).\n\n`
        + `${detail}${phoneLine}\n\n`
        + 'Ndi fulufhela uri hezwi zwi ḓo shuma - ndi a livhuwa nga tshifhinga tshau tsha u '
        + 'vhala hezwi.\n\n'
        + '\u2014 Zwo rumelwa nga Cognix Smart Counter Stand',
    };
  },
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_ACCENT = '#0f766e';

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

// Light and dark mode: follows the phone's setting, with a small switch to override it.
const THEME_DARK = '--bg:#0d0f12;--surface:#15181d;--surface2:#1d222a;--line:#2a303a;--text:#f2f4f7;--muted:#9aa3b0;--faint:#6b7480;--star-off:#3a414c;--danger:#fca5a5;--link:#7dd3c8;--shadow:0 24px 60px rgba(0,0,0,.45);--ok:#34d399;--warn:#fbbf24;--bad:#f87171;--ok-bg:#0f3d2e;--bad-bg:#4a1d1d;';
const THEME_LIGHT = '--bg:#f5f6f8;--surface:#ffffff;--surface2:#eef0f3;--line:#dde1e7;--text:#12151a;--muted:#566070;--faint:#8a93a0;--star-off:#d3d8df;--danger:#b42318;--link:#0f766e;--shadow:0 24px 60px rgba(16,24,40,.12);--ok:#047857;--warn:#b45309;--bad:#b91c1c;--ok-bg:#d1fae5;--bad-bg:#fee2e2;';
const THEME_CSS = ':root{--accent:#0f766e;' + THEME_DARK + '}'
  + '@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){' + THEME_LIGHT + '}}'
  + ':root[data-theme="light"]{' + THEME_LIGHT + '}:root[data-theme="dark"]{' + THEME_DARK + '}'
  + 'html,body{margin:0;background:var(--bg)}';

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
      style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'transparent',
               border: '1px solid var(--line)', color: 'var(--muted)', borderRadius: '9999px',
               padding: '0.2rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer' }}>
      {mode === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}

const c = {
  bg: 'var(--bg)', surface: 'var(--surface)', line: 'var(--line)', text: 'var(--text)',
  muted: 'var(--muted)', star: '#f5b301',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(60rem 30rem at 50% -10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 65%), '
    + c.bg,
  color: c.text, fontFamily: sans, padding: '1.5rem',
};
const cardStyle = {
  width: '100%', maxWidth: '26rem', background: c.surface, border: '1px solid ' + c.line,
  borderRadius: '1.1rem', padding: '2.25rem 1.75rem', boxSizing: 'border-box',
  boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden',
};
const headingStyle = { fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.28, margin: '0 0 0.5rem 0' };
const mutedStyle = { color: c.muted, lineHeight: 1.65, margin: '0 0 1.4rem 0', fontSize: '0.98rem' };
const textareaStyle = {
  width: '100%', boxSizing: 'border-box', padding: '0.85rem', borderRadius: '0.65rem',
  border: '1px solid ' + c.line, background: c.bg, color: c.text, fontSize: '1rem',
  fontFamily: sans, resize: 'vertical', lineHeight: 1.5,
};
const inputStyle = { ...textareaStyle, resize: 'none' };

function Shell({ title, accentColor, footerText, children }) {
  return (
    <div style={{ ...pageStyle, '--accent': accentColor }}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          ${THEME_CSS}
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
        <ThemeToggle />
        {children}
        <p style={{ color: 'var(--faint)', fontSize: '0.72rem', textAlign: 'center',
          letterSpacing: '0.04em', margin: '1.75rem 0 0 0' }}>
          {footerText || STR.en.poweredBy}
        </p>
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
                   fontSize: '2.75rem', lineHeight: 1, color: n <= value ? c.star : 'var(--star-off)' }}>
          &#9733;
        </button>
      ))}
    </div>
  );
}

function LangToggle({ lang, onChange, accentColor }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.1rem' }}>
      {LANGS.map((code) => (
        <button key={code} onClick={() => onChange(code)} className="cx-lang"
          aria-label={STR[code].langName}
          style={{
            border: '1px solid ' + (lang === code ? accentColor : c.line),
            background: lang === code ? accentColor + '26' : 'transparent',
            color: lang === code ? c.text : c.muted,
            borderRadius: '9999px', padding: '0.3rem 0.7rem', fontSize: '0.76rem',
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

  if (props.state === 'paused') {
    return (
      <Shell title="Feedback page paused" accentColor={DEFAULT_ACCENT}>
        <h1 style={headingStyle}>Thank you for stopping by</h1>
        <p style={mutedStyle}>
          This feedback page is not taking responses right now. Please ask a member of
          staff if you would like to share your experience.
        </p>
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

  return <Rating client={props.client} customerId={props.customerId || null} />;
}

// A short code a customer can show a team member to claim their reward. It avoids
// letters and digits that are easy to mix up (0/O, 1/I/L).
function makeCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(6);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 4294967295);
  }
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function Rating({ client, customerId }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [claim, setClaim] = useState('');
  const [detailsState, setDetailsState] = useState('idle'); // idle | saving | saved
  const [detailsMsg, setDetailsMsg] = useState('');
  const [status, setStatus] = useState('idle'); // idle | spinning | redirecting | sent
  const [mailHref, setMailHref] = useState('');
  const [lang, setLang] = useState('en');

  const t = STR[lang];
  const accentColor = client.accent_color && HEX_RE.test(client.accent_color)
    ? client.accent_color
    : DEFAULT_ACCENT;
  const footerText = (client.footer_text && client.footer_text.trim()) || t.poweredBy;
  const offer = (client.lead_offer || '').trim();
  const isService = client.business_type === 'service';

  // Counts for the client portal. Fire-and-forget: a failure here never
  // affects the customer.
  function logEvent(type) {
    const base = { client_id: client.id, interaction_type: type };
    supabase.from('scans_log').insert(customerId ? { ...base, customer_id: customerId } : base)
      .then(({ error }) => {
        if (error && customerId) {
          // older database: still count the event, just without the customer
          supabase.from('scans_log').insert(base).then(() => {});
        }
      });
  }

  useEffect(() => {
    logEvent('tap_or_scan');
  }, []);

  const buttonStyle = {
    display: 'block', boxSizing: 'border-box', width: '100%', padding: '1rem 1rem',
    borderRadius: '0.65rem', fontSize: '1rem', fontWeight: 700, textAlign: 'center',
    border: 'none', cursor: 'pointer', color: '#fff', background: accentColor,
    textDecoration: 'none', boxShadow: `0 10px 24px ${accentColor}61`,
  };
  const secondaryButtonStyle = {
    ...buttonStyle, background: 'var(--surface2)', boxShadow: 'none', border: '1px solid ' + c.line,
  };
  const kickerStyle = {
    color: `color-mix(in srgb, ${accentColor} 62%, var(--text))`, fontSize: '0.78rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.6rem 0',
  };

  // A short, deliberate pause with a spinner then a checkmark, instead of
  // navigating away instantly - so the "thank you" actually gets seen.
  function goToGoogle(skipLog) {
    if (!skipLog) logEvent('google_redirect');
    setStatus('spinning');
    window.setTimeout(() => {
      setStatus('redirecting');
      window.setTimeout(() => {
        window.location.href = client.google_review_url;
      }, 260);
    }, 480);
  }

  function handleRating(n) {
    setRating(n);
    if (n >= 4) {
      // Happy customers go straight to Google - unless this business has chosen
      // to offer them an optional "stay in touch" form first.
      if (!isService && client.collect_happy_details) {
        // A review matters more than a lead: open Google straight away, in a new tab.
        // This page stays open behind it with a thank-you offer for when they come back.
        logEvent('google_redirect');
        const win = window.open(client.google_review_url, '_blank');
        if (win) {
          try { win.opener = null; } catch (e) { /* ignore */ }
          setStatus('reward');
        } else {
          goToGoogle(true); // the browser blocked the new tab: go to Google in this one
        }
      } else {
        goToGoogle();
      }
    } else {
      logEvent('private_intercept');
    }
  }

  async function saveDetails(e) {
    e.preventDefault();
    setDetailsMsg('');
    const em = customerEmail.trim().toLowerCase();
    const ph = phone.trim();
    if (!em && !ph) { setDetailsMsg(t.needContact); return; }
    setDetailsState('saving');
    const row = {
      client_id: client.id,
      stars: rating,
      contact_name: name.trim().slice(0, 120) || null,
      contact_email: em.slice(0, 254) || null,
      contact_phone: ph.slice(0, 40) || null,
      consent_given: true,
    };
    let code = offer ? makeCode() : null;
    let res = await supabase.from('contact_submissions').insert({ ...row, claim_code: code });
    if (res.error && code) {
      code = makeCode(); // a clash with another code is very unlikely, but try once more
      res = await supabase.from('contact_submissions').insert({ ...row, claim_code: code });
    }
    if (res.error) {
      // older database without the code column: save the details without a code
      code = null;
      res = await supabase.from('contact_submissions').insert(row);
    }
    if (res.error) {
      setDetailsState('idle');
      setDetailsMsg(t.saveFailed);
      return;
    }
    setClaim(code || '');
    setDetailsState('saved');
  }

  async function handleSendToManager(e) {
    e.preventDefault();

    const { subject, body } = EMAIL[lang](client.business_name, rating, feedback, { name, email: customerEmail.trim().toLowerCase(), phone });
    const href = 'mailto:' + client.manager_email
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    setMailHref(href);

    window.location.href = href;
    setStatus('sent');

    const base = {
      client_id: client.id,
      stars: rating,
      feedback: feedback.slice(0, 1000),
      contact_phone: phone.trim().slice(0, 40) || null,
    };
    let { error } = await supabase.from('private_reviews').insert({
      ...base,
      contact_name: name.trim().slice(0, 120) || null,
      contact_email: customerEmail.trim().toLowerCase().slice(0, 254) || null,
      ...(customerId ? { customer_id: customerId } : {}),
    });
    if (error) {
      // If the database has not been updated for the new fields yet, still
      // save the feedback itself rather than losing it.
      error = (await supabase.from('private_reviews').insert(base)).error;
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Could not log private review:', error.message);
    }
  }

  return (
    <Shell title={client.business_name} accentColor={accentColor} footerText={footerText}>
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
          <StarRow value={rating} onRate={handleRating} />
        </div>
      )}

      {status === 'reward' && (
        <div className="cx-fade">
          <p style={kickerStyle}>{t.kickerThanks}</p>
          <h1 style={headingStyle}>{t.thanksReview}</h1>
          {detailsState === 'saved' ? (
            claim ? (
              <div>
                <p style={{ ...mutedStyle, marginBottom: '0.7rem' }}>{t.codeHeading}: {offer}</p>
                <div style={{ border: '2px dashed ' + c.line, borderRadius: '0.8rem', padding: '1.1rem',
                              textAlign: 'center', marginBottom: '0.9rem' }}>
                  <div style={{ color: c.muted, fontSize: '0.8rem' }}>{t.codeLabel}</div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '0.2em' }}>{claim}</div>
                </div>
                <p style={mutedStyle}>{t.codeHelp}</p>
              </div>
            ) : (
              <p style={{ ...mutedStyle, color: c.text }}>{t.savedMsg}</p>
            )
          ) : (
            <form onSubmit={saveDetails}>
              <p style={{ ...mutedStyle, marginBottom: '0.9rem' }}>{t.offerIntro(client.business_name, offer)}</p>
              <input type="text" maxLength={120} value={name} className="cx-textarea" autoComplete="name"
                onChange={(e) => setName(e.target.value)} style={inputStyle}
                placeholder={t.namePlaceholder} />
              <input type="email" maxLength={254} value={customerEmail} className="cx-textarea" autoComplete="email"
                onChange={(e) => setCustomerEmail(e.target.value)} style={{ ...inputStyle, marginTop: '0.7rem' }}
                placeholder={t.emailPlaceholder} />
              <input type="tel" maxLength={40} value={phone} className="cx-textarea" autoComplete="tel"
                onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginTop: '0.7rem' }}
                placeholder={t.phonePlaceholder} />
              <button type="submit" className="cx-btn" disabled={detailsState === 'saving'}
                style={{ ...buttonStyle, marginTop: '1rem' }}>
                {offer ? t.claimBtn : t.saveDetailsBtn}
              </button>
              <p style={{ color: c.muted, fontSize: '0.78rem', lineHeight: 1.5, margin: '0.6rem 0 0 0' }}>{t.phoneHelp}</p>
              {detailsMsg && (
                <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0.7rem 0 0 0' }}>
                  {detailsMsg}
                </p>
              )}
            </form>
          )}
          <a href={client.google_review_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', marginTop: '1.25rem', color: c.muted, fontSize: '0.85rem' }}>
            {t.reopenGoogle}
          </a>
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
          {!isService && (
            <>
              <input type="text" maxLength={120} value={name} className="cx-textarea" autoComplete="name"
                onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: '0.7rem' }}
                placeholder={t.namePlaceholder} />
              <input type="email" maxLength={254} value={customerEmail} className="cx-textarea" autoComplete="email"
                onChange={(e) => setCustomerEmail(e.target.value)} style={{ ...inputStyle, marginTop: '0.7rem' }}
                placeholder={t.emailPlaceholder} />
            </>
          )}
          <input type="tel" maxLength={40} value={phone} className="cx-textarea" autoComplete="tel"
            onChange={(e) => setPhone(e.target.value)} style={{ ...inputStyle, marginTop: '0.7rem' }}
            placeholder={t.phonePlaceholder} />
          <p style={{ color: c.muted, fontSize: '0.78rem', margin: '0.4rem 0 0 0' }}>
            {t.phoneHelp}
          </p>
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
