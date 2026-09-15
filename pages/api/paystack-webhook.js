import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  
  const event = req.body;

  if (event.event === 'subscription.disable' || event.event === 'invoice.payment_failed') {
    const customerCode = event.data.customer.customer_code;
    await supabase.from('clients').update({ subscription_status: 'suspended' }).eq('paystack_customer_code', customerCode);
    return res.status(200).json({ status: 'success', message: 'Client suspended.' });
  }

  if (event.event === 'subscription.create' || event.event === 'invoice.create') {
    const customerCode = event.data.customer.customer_code;
    await supabase.from('clients').update({ subscription_status: 'active' }).eq('paystack_customer_code', customerCode);
  }

  return res.status(200).json({ status: 'ignored' });
}
