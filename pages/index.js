import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Replace with your live Paystack payment link
const PAYSTACK_LIVE_LINK = 'https://paystack.com/pay/your-cognix-link';

const COLORS = {
  base: '#0b0f19',
  surface: '#0f172a',
  text: '#f8fafc',
  soft: '#e2e8f0',
  muted: '#94a3b8',
  faint: '#8593a8',
  line: 'rgba(148, 163, 184, 0.22)',
  red: '#ff4d5a',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function Home() {
  const router = useRouter();
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Remove default body margin and paint the page background edge to edge
  useEffect(() => {
    const prevMargin = document.body.style.margin;
    const prevBg = document.body.style.background;
    document.body.style.margin = '0';
    document.body.style.background = COLORS.base;
    return () => {
      document.body.style.margin = prevMargin;
      document.body.style.background = prevBg;
    };
  }, []);

  // Respect users who prefer reduced motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const isCtaHover = hovered === 'cta';
  const isLoginHover = hovered === 'login';

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      fontFamily: FONT_STACK,
      color: COLORS.text,
      background: `radial-gradient(ellipse 90% 55% at 50% -8%, rgba(37, 99, 235, 0.30), transparent 62%), ${COLORS.base}`,
      WebkitFontSmoothing: 'antialiased',
    },

    header: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      boxSizing: 'border-box',
      padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 40px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    },
    logo: {
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
      fontWeight: 800,
      letterSpacing: '-0.03em',
      color: COLORS.text,
      margin: 0,
    },
    loginButton: {
      cursor: 'pointer',
      fontFamily: FONT_STACK,
      fontSize: '0.9375rem',
      fontWeight: 600,
      color: COLORS.text,
      padding: '10px 18px',
      borderRadius: '10px',
      border: `1px solid ${isLoginHover ? 'rgba(248, 250, 252, 0.55)' : COLORS.line}`,
      background: isLoginHover ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.6)',
      outline: 'none',
      boxShadow: focused === 'login' ? '0 0 0 3px rgba(96, 165, 250, 0.75)' : 'none',
      transform: isLoginHover && !reduceMotion ? 'translateY(-1px)' : 'translateY(0)',
      transition: reduceMotion
        ? 'none'
        : 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
      whiteSpace: 'nowrap',
    },

    main: {
      flex: 1,
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto',
      boxSizing: 'border-box',
      padding: 'clamp(28px, 7vw, 88px) clamp(20px, 5vw, 40px) clamp(48px, 8vw, 96px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    },

    badge: {
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '999px',
      border: `1px solid ${COLORS.line}`,
      background: 'rgba(30, 41, 59, 0.65)',
      color: COLORS.soft,
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: 'clamp(20px, 4vw, 32px)',
    },

    heading: {
      margin: 0,
      fontSize: 'clamp(2.25rem, 7.2vw + 0.25rem, 5rem)',
      lineHeight: 1.06,
      fontWeight: 800,
      letterSpacing: '-0.035em',
      color: COLORS.text,
      textWrap: 'balance',
    },
    headingRed: {
      display: 'block',
      color: COLORS.red,
      textShadow: '0 0 44px rgba(255, 77, 90, 0.40)',
    },

    subheading: {
      margin: 'clamp(20px, 3.5vw, 30px) 0 0',
      maxWidth: '640px',
      fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
      lineHeight: 1.65,
      color: COLORS.muted,
    },

    ctaWrap: {
      marginTop: 'clamp(28px, 5vw, 44px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    cta: {
      display: 'inline-block',
      boxSizing: 'border-box',
      maxWidth: '100%',
      textAlign: 'center',
      textDecoration: 'none',
      cursor: 'pointer',
      fontFamily: FONT_STACK,
      fontSize: 'clamp(1rem, 2.6vw, 1.1875rem)',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#ffffff',
      padding: 'clamp(16px, 2.6vw, 20px) clamp(28px, 6vw, 44px)',
      borderRadius: '14px',
      border: '1px solid rgba(147, 197, 253, 0.35)',
      background: isCtaHover ? COLORS.blueDark : COLORS.blue,
      outline: 'none',
      boxShadow:
        focused === 'cta'
          ? '0 0 0 4px rgba(147, 197, 253, 0.75), 0 12px 36px rgba(37, 99, 235, 0.45)'
          : isCtaHover
          ? '0 16px 48px rgba(37, 99, 235, 0.62)'
          : '0 8px 28px rgba(37, 99, 235, 0.38)',
      transform: isCtaHover && !reduceMotion ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
      transition: reduceMotion
        ? 'none'
        : 'transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease',
    },
    subtext: {
      margin: '18px 0 0',
      maxWidth: '520px',
      fontSize: '0.875rem',
      lineHeight: 1.65,
      color: COLORS.muted,
    },

    stars: {
      marginTop: 'clamp(36px, 6vw, 56px)',
      display: 'inline-flex',
      gap: '8px',
      padding: '12px 22px',
      borderRadius: '999px',
      border: `1px solid ${COLORS.line}`,
      background: 'rgba(15, 23, 42, 0.75)',
      fontSize: 'clamp(1.125rem, 3.5vw, 1.5rem)',
      lineHeight: 1,
    },

    footer: {
      width: '100%',
      boxSizing: 'border-box',
      borderTop: `1px solid ${COLORS.line}`,
      padding: '24px 20px',
      textAlign: 'center',
      fontSize: '0.8125rem',
      color: COLORS.faint,
    },
  };

  return (
    <>
      <Head>
        <title>Cognix | Get 5-Star Google Reviews. Intercept the 1-Stars.</title>
        <meta
          name="description"
          content="Protect your reputation and boost your local search rankings automatically with the Cognix Smart Stand."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <p style={styles.logo}>Cognix</p>
          <button
            type="button"
            style={styles.loginButton}
            onClick={handleLogin}
            onMouseEnter={() => setHovered('login')}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setFocused('login')}
            onBlur={() => setFocused(null)}
          >
            Client Portal Login
          </button>
        </header>

        <main style={styles.main}>
          <span style={styles.badge}>⚡ Cognix Smart Routing</span>

          <h1 style={styles.heading}>
            Get 5-Star Google Reviews. <span style={styles.headingRed}>Intercept the 1-Stars.</span>
          </h1>

          <p style={styles.subheading}>
            Protect your reputation and boost your local search rankings automatically. Place a Cognix Smart Stand on
            your counter and manage your customer feedback on autopilot.
          </p>

          <div style={styles.ctaWrap}>
            <a
              href={PAYSTACK_LIVE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.cta}
              onMouseEnter={() => setHovered('cta')}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocused('cta')}
              onBlur={() => setFocused(null)}
            >
              Get Started (R1,499/mo)
            </a>
            <p style={styles.subtext}>Cancel anytime • R0 setup fee • Includes 1x Smart Counter Stand</p>
          </div>

          <div style={styles.stars} aria-hidden="true">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        </main>

        <footer style={styles.footer}>© 2026 Cognix South Africa. All Rights Reserved.</footer>
      </div>
    </>
  );
}
