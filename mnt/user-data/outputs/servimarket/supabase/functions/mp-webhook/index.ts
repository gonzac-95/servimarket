// supabase/functions/mp-webhook/index.ts
// Deploy with: supabase functions deploy mp-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    console.log('MP Webhook received:', JSON.stringify(body));

    // MercadoPago sends topic=payment for payment notifications
    if (body.type !== 'payment') {
      return new Response('ok', { status: 200 });
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
    const paymentId = body.data?.id;
    if (!paymentId) return new Response('ok', { status: 200 });

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const mpPayment = await mpRes.json();

    const jobId = mpPayment.metadata?.job_id;
    if (!jobId) return new Response('ok', { status: 200 });

    // Map MP status to our status
    const statusMap: Record<string, string> = {
      approved: 'approved', rejected: 'rejected',
      pending: 'pending', refunded: 'refunded',
    };
    const paymentStatus = statusMap[mpPayment.status] ?? 'pending';

    // Update payment
    await supabase.from('payments')
      .update({ status: paymentStatus, provider_payment_id: String(paymentId) })
      .eq('job_id', jobId);

    // If approved, update job status to in_progress
    if (paymentStatus === 'approved') {
      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', jobId);

      // Create notification for provider
      const { data: job } = await supabase.from('jobs').select('*, providers(user_id)').eq('id', jobId).single();
      if (job?.providers?.user_id) {
        await supabase.from('notifications').insert({
          user_id: job.providers.user_id,
          title: '💰 Pago recibido',
          body: 'El cliente realizó el pago. ¡Ya podés empezar el trabajo!',
          type: 'payment',
          data: { job_id: jobId },
        });
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('error', { status: 500 });
  }
});
