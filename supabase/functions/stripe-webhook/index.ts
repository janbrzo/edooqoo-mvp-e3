import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${timestamp} ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== WEBHOOK RECEIVED ===', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    const stripeKey = Deno.env.get('Stripe_Secret_Key');
    if (!stripeKey) {
      logStep('ERROR: Missing Stripe secret key');
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      logStep('ERROR: Missing Stripe signature');
      throw new Error('Missing stripe signature');
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      logStep('ERROR: Missing webhook secret');
      throw new Error('Missing webhook secret');
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep('Event verified successfully', { type: event.type, id: event.id });
    } catch (err) {
      logStep('ERROR: Webhook signature verification failed', { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // SIMPLIFIED: Only process subscription events
    if (!event.type.startsWith('customer.subscription.')) {
      logStep('Ignoring non-subscription event', { eventType: event.type });
      return new Response(JSON.stringify({ received: true, skipped: 'non_subscription_event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get subscription object
    let subscription = event.data.object as Stripe.Subscription;
    
    logStep('Processing subscription event', { 
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      eventType: event.type,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    const email = customer.email;

    if (!email) {
      logStep('ERROR: No email found for customer');
      throw new Error('No email found for customer');
    }

    logStep('Customer found', { email, customerId: customer.id });

    // Find user profile by email
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, subscription_type')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      logStep('ERROR: User profile not found', { email, error: profileError });
      throw new Error(`User profile not found for email: ${email}`);
    }

    logStep('Profile found', { userId: profile.id, currentType: profile.subscription_type });

    // SIMPLIFIED: Determine plan type from amount
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    let subscriptionType = 'Unknown';
    let monthlyLimit = 0;
    
    if (amount === 900) {
      subscriptionType = 'Side-Gig';
      monthlyLimit = 15;
    } else if (amount === 1900) {
      subscriptionType = 'Full-Time 30';
      monthlyLimit = 30;
    } else if (amount === 3900) {
      subscriptionType = 'Full-Time 60';
      monthlyLimit = 60;
    } else if (amount === 5900) {
      subscriptionType = 'Full-Time 90';
      monthlyLimit = 90;
    } else if (amount === 7900) {
      subscriptionType = 'Full-Time 120';
      monthlyLimit = 120;
    }

    logStep('Plan determined', { subscriptionType, monthlyLimit, priceAmount: amount });

    // SIMPLIFIED: Determine old and new plan types
    let oldPlanType = profile.subscription_type || 'Free Demo';
    let newPlanType = subscriptionType;
    
    if (event.type === 'customer.subscription.deleted') {
      newPlanType = 'Inactive';
    }

    // CRITICAL: Always insert into subscription_events FIRST
    const eventInsertResult = await supabaseService
      .from('subscription_events')
      .insert({
        teacher_id: profile.id,
        email: email,
        event_type: event.type,
        old_plan_type: oldPlanType,
        new_plan_type: newPlanType,
        tokens_added: 0,
        stripe_event_id: event.id,
        event_data: {
          subscription_id: subscription.id,
          customer_id: customer.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          amount: amount,
          plan_name: subscriptionType
        }
      });

    if (eventInsertResult.error) {
      logStep('CRITICAL ERROR: Failed to insert subscription_events', eventInsertResult.error);
      return new Response(JSON.stringify({ 
        error: 'Failed to log subscription event', 
        details: eventInsertResult.error 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Make Stripe retry
      });
    }

    logStep('✓ Subscription event logged successfully', { 
      eventType: event.type, 
      oldPlan: oldPlanType, 
      newPlan: newPlanType 
    });

    // CRITICAL: Update BOTH profiles AND subscriptions tables directly
    let subscriptionStatus = 'active';
    let finalSubscriptionType = subscriptionType;
    
    if (event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end) {
      subscriptionStatus = 'active_cancelled';
    } else if (event.type === 'customer.subscription.deleted') {
      subscriptionStatus = 'cancelled';
      finalSubscriptionType = 'Inactive';
    }

    // Update profiles table
    const { error: profileUpdateError } = await supabaseService
      .from('profiles')
      .update({
        subscription_type: finalSubscriptionType,
        subscription_status: subscriptionStatus,
        monthly_worksheet_limit: event.type === 'customer.subscription.deleted' ? 0 : monthlyLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (profileUpdateError) {
      logStep('WARNING: Failed to update profiles table', profileUpdateError);
    } else {
      logStep('✓ Profiles table updated', { 
        subscriptionType: finalSubscriptionType, 
        subscriptionStatus 
      });
    }

    // CRITICAL FIX: Also update subscriptions table directly
    const subscriptionUpsertData = {
      teacher_id: profile.id,
      email: email,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      subscription_type: finalSubscriptionType,
      subscription_status: subscriptionStatus,
      monthly_limit: event.type === 'customer.subscription.deleted' ? 0 : monthlyLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: subscriptionUpdateError } = await supabaseService
      .from('subscriptions')
      .upsert(subscriptionUpsertData, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      });

    if (subscriptionUpdateError) {
      logStep('WARNING: Failed to update subscriptions table', subscriptionUpdateError);
    } else {
      logStep('✓ Subscriptions table updated', { 
        subscriptionType: finalSubscriptionType, 
        subscriptionStatus,
        subscriptionId: subscription.id
      });
    }

    logStep('Webhook processing completed successfully', {
      eventType: event.type,
      subscriptionId: subscription.id,
      email: email
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('WEBHOOK ERROR', { 
      message: error.message, 
      stack: error.stack?.split('\n').slice(0, 3) 
    });
    
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed', 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});