import crypto from 'crypto';

// Paystack signs every webhook with your secret key. Anything without a valid signature is ignored.
export function verifySignature(raw, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Records one successful payment, works out the partner's share, and links the business to the
// partner. Safe to call twice for the same payment: the second time does nothing.
export async function processEvent(event, db) {
  if (!event || event.event !== 'charge.success' || !event.data) return { ok: true, ignored: true };
  const d = event.data;
  if (d.status && d.status !== 'success') return { ok: true, ignored: true };
  const reference = String(d.reference || '').slice(0, 100);
  const amount = Math.round(Number(d.amount));
  if (!reference || !Number.isFinite(amount) || amount < 0) return { ok: true, ignored: true };

  const dup = await db.from('client_payments').select('id').eq('reference', reference).maybeSingle();
  if (dup.data) return { ok: true, duplicate: true };

  const email = String((d.customer && d.customer.email) || '').trim().toLowerCase();
  const sub = d.subaccount && d.subaccount.subaccount_code ? String(d.subaccount.subaccount_code) : null;

  let client = null;
  if (email) {
    const r = await db.from('clients').select('id, partner_id').eq('manager_email', email).limit(1);
    client = r.data && r.data[0] ? r.data[0] : null;
  }
  let partner = null;
  if (sub) {
    const r = await db.from('partners').select('id, commission_percent').eq('paystack_subaccount_code', sub).maybeSingle();
    partner = r.data || null;
  }
  if (!partner && client && client.partner_id) {
    const r = await db.from('partners').select('id, commission_percent').eq('id', client.partner_id).maybeSingle();
    partner = r.data || null;
  }
  const pct = partner ? Number(partner.commission_percent) : null;
  const share = partner ? Math.round((amount * pct) / 100) : 0;

  const ins = await db.from('client_payments').insert({
    reference,
    client_id: client ? client.id : null,
    partner_id: partner ? partner.id : null,
    payer_email: email || null,
    amount_cents: amount,
    currency: String(d.currency || 'ZAR').slice(0, 8),
    commission_percent: pct,
    partner_share_cents: share,
    cognix_share_cents: amount - share,
    paid_at: d.paid_at || new Date().toISOString(),
    source: 'paystack',
  });
  if (ins.error) {
    if (ins.error.code === '23505') return { ok: true, duplicate: true };
    throw ins.error;
  }
  if (client && partner && !client.partner_id) {
    await db.from('clients').update({ partner_id: partner.id }).eq('id', client.id);
  }
  return { ok: true, recorded: true, partnerShareCents: share };
}
