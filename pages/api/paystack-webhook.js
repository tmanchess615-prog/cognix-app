import { createClient } from '@supabase/supabase-js';
import { verifySignature, processEvent } from '../../lib/paystackWebhook';

// Paystack needs the exact bytes it sent to check the signature, so the body is not pre-parsed.
export const config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const raw = await readRaw(req);
  if (!verifySignature(raw, req.headers['x-paystack-signature'], process.env.PAYSTACK_SECRET_KEY)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Server is not set up yet' });
  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const out = await processEvent(event, db);
    return res.status(200).json(out);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Paystack webhook failed:', e && e.message);
    return res.status(500).json({ error: 'Could not record the payment' }); // Paystack will try again
  }
}
