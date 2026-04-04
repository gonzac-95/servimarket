// supabase/functions/create-payment/index.ts
// Deploy with: supabase functions deploy create-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') ?? '');
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS });

    const { job_id, amount } = await req.json();

    // Verify job belongs to this client
    const { data: job } = await supabase.from('jobs').select('*').eq('id', job_id).eq('client_id', user.id).single();
    if (!job) return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: CORS });

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://servimarket.com';

    // Create MercadoPago preference
    const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          id: job_id,
          title: `ServiMarket - ${job.category}`,
          description: job.description.substring(0, 100),
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        }],
        back_urls: {
          success: `${APP_URL}/jobs/${job_id}?payment=success`,
          failure: `${APP_URL}/jobs/${job_id}?payment=failure`,
          pending: `${APP_URL}/jobs/${job_id}?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
        metadata: { job_id, user_id: user.id },
      }),
    });

    const preference = await preferenceRes.json();

    // Save payment record
    await supabase.from('payments').insert({
      job_id,
      amount,
      provider_share: amount * 0.80,
      platform_fee: amount * 0.20,
      status: 'pending',
      payment_provider: 'mercadopago',
      preference_id: preference.id,
      checkout_url: preference.init_point, // sandbox: preference.sandbox_init_point
    });

    return new Response(JSON.stringify({
      preference_id: preference.id,
      checkout_url: preference.sandbox_init_point, // use init_point in production
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: CORS });
  }
});
