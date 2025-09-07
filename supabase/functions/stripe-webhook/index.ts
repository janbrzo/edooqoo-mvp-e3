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

// Helper: normalize plan names to ensure consistency
const normalizePlanName = (planType?: string, monthlyLimit?: number, amount?: number) => {
  // Priority 1: Use planType if it's already normalized
  if (planType === 'Side-Gig') return 'Side-Gig';
  if (planType === 'Full-Time 30') return 'Full-Time 30';
  if (planType === 'Full-Time 60') return 'Full-Time 60';
  if (planType === 'Full-Time 90') return 'Full-Time 90';
  if (planType === 'Full-Time 120') return 'Full-Time 120';
  
  // Priority 2: Use amount to determine plan (amount in cents)
  if (amount === 900) return 'Side-Gig';       // $9.00
  if (amount === 1900) return 'Full-Time 30';  // $19.00
  if (amount === 3900) return 'Full-Time 60';  // $39.00
  if (amount === 5900) return 'Full-Time 90';  // $59.00
  if (amount === 7900) return 'Full-Time 120'; // $79.00
  
  // Priority 3: Use monthlyLimit as fallback
  if (monthlyLimit === 15) return 'Side-Gig';
  if (monthlyLimit === 30) return 'Full-Time 30';
  if (monthlyLimit === 60) return 'Full-Time 60';
  if (monthlyLimit === 90) return 'Full-Time 90';
  if (monthlyLimit === 120) return 'Full-Time 120';
  
  // Final fallback
  return planType || 'Unknown';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ENHANCED DEBUG LOGGING
    logStep('=== WEBHOOK RECEIVED ===', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
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

    // FIXED: Improved deduplication - check stripe_event_id + event_type combination
    // This allows the same event ID with different event types to be processed
    const { data: existingEvent, error: eventCheckError } = await supabaseService
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .eq('event_type', event.type)
      .single();

    if (eventCheckError && eventCheckError.code !== 'PGRST116') {
      logStep('ERROR: Failed to check existing event', eventCheckError);
      throw eventCheckError;
    }

    if (existingEvent) {
      logStep('Event already processed, skipping', { eventId: event.id, eventType: event.type });
      return new Response(JSON.stringify({ received: true, skipped: 'already_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // ADDED: Handle upgrade payments through checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.action === 'upgrade') {
        logStep('Processing upgrade payment', { sessionId: session.id, subscriptionId: session.metadata.subscription_id });

        const subscriptionId = session.metadata.subscription_id;
        const targetPlanPrice = parseFloat(session.metadata.target_plan_price || '0');
        const targetPlanName = session.metadata.target_plan_name || '';
        const targetMonthlyLimit = parseInt(session.metadata.target_monthly_limit || '0');
        const upgradeTokens = parseInt(session.metadata.upgrade_tokens || '0');

        if (!subscriptionId) {
          logStep('ERROR: No subscription ID in upgrade metadata');
          throw new Error('No subscription ID found in upgrade metadata');
        }

        try {
          // Update the existing subscription with new price
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
              id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
              price_data: {
                currency: 'usd',
                product_data: {
                  name: targetPlanName,
                  description: `${targetMonthlyLimit} worksheets per month`,
                },
                unit_amount: targetPlanPrice * 100, // Full target plan price
                recurring: {
                  interval: 'month',
                },
              },
            }],
            proration_behavior: 'none', // No additional prorating since we handled it with one-time payment
            billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
          });

          logStep('Subscription upgraded successfully', { 
            subscriptionId: updatedSubscription.id,
            newAmount: targetPlanPrice * 100
          });

          // Find user by email from customer
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
          const email = customer.email;

          if (!email) {
            logStep('ERROR: No email found for upgrade customer');
            throw new Error('No email found for customer');
          }

          // Find user profile by email
          const { data: profile, error: profileError } = await supabaseService
            .from('profiles')
            .select('id, available_tokens, subscription_type, total_tokens_received')
            .eq('email', email)
            .single();

          if (profileError || !profile) {
            logStep('ERROR: User profile not found for upgrade', { email, error: profileError });
            throw new Error(`User profile not found for email: ${email}`);
          }

          // Add upgrade tokens and update subscription info
          const newAvailableTokens = profile.available_tokens + upgradeTokens;
          const newTotalReceived = (profile.total_tokens_received || 0) + upgradeTokens;

          // ENHANCED: Use normalizer for upgrade subscriptions too
          let subscriptionType = normalizePlanName(targetPlanName, targetMonthlyLimit, targetPlanPrice * 100);

          const { error: updateError } = await supabaseService
            .from('profiles')
            .update({
              subscription_type: subscriptionType,
              subscription_status: 'active', // Upgrade makes subscription active
              monthly_worksheet_limit: targetMonthlyLimit,
              available_tokens: newAvailableTokens,
              total_tokens_received: newTotalReceived,
              is_tokens_frozen: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (updateError) {
            logStep('ERROR: Failed to update profile after upgrade', updateError);
            throw updateError;
          }

          // FIXED: Update subscriptions table with full subscription type name
          const subscriptionData = {
            teacher_id: profile.id,
            email: email,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customer.id,
            subscription_status: 'active',
            subscription_type: subscriptionType, // FIXED: Use full name like "Full-Time 30"
            monthly_limit: targetMonthlyLimit,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          };

          // NOW CAN USE PROPER UPSERT: Use teacher_id unique constraint for upgrades too
          const { error: subError } = await supabaseService
            .from('subscriptions')
            .upsert(subscriptionData, { 
              onConflict: 'teacher_id',  // NOW WORKS: unique constraint exists
              ignoreDuplicates: false 
            });

          if (subError) {
            logStep('ERROR: Failed to update subscriptions table', subError);
          } else {
            logStep('Subscriptions table updated after upgrade with full type name');
          }

          // Log upgrade event
          const { error: eventError } = await supabaseService
            .from('subscription_events')
            .insert({
              teacher_id: profile.id,
              email: email,
              event_type: 'checkout.session.completed',
              old_plan_type: profile.subscription_type || 'Unknown',
              new_plan_type: subscriptionType,
              tokens_added: upgradeTokens,
              stripe_event_id: event.id,
              event_data: {
                session_id: session.id,
                subscription_id: subscriptionId,
                target_plan_price: targetPlanPrice,
                upgrade_tokens: upgradeTokens
              }
            });

          if (eventError) {
            logStep('WARNING: Failed to log upgrade event', eventError);
          }

          // Add token transaction record with teacher_email - FIXED
          const { error: transactionError } = await supabaseService
            .from('token_transactions')
            .insert({
              teacher_id: profile.id,
              teacher_email: email,  // FIXED: Add teacher_email
              transaction_type: 'purchase',
              amount: upgradeTokens,
              description: `Upgrade to ${subscriptionType} - tokens added`,
              reference_id: null
            });

          if (transactionError) {
            logStep('WARNING: Failed to log upgrade token transaction', transactionError);
          }

          logStep('Upgrade processed successfully', { 
            newSubscriptionType: subscriptionType,
            tokensAdded: upgradeTokens,
            newAvailableTokens
          });

          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });

        } catch (stripeError: any) {
          logStep('ERROR: Failed to update subscription during upgrade', stripeError);
          throw stripeError;
        }
      }
      
      // Handle other checkout.session.completed events (non-upgrade)
      logStep('Non-upgrade checkout session completed', { sessionId: session.id });
    }

    // Handle subscription creation and updates (existing logic)
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' ||
        event.type === 'invoice.payment_succeeded') {
      
      let subscription;
      
      if (event.type === 'invoice.payment_succeeded') {
        const invoiceSubscriptionId = event.data.object.subscription;
        if (!invoiceSubscriptionId) {
          logStep('WARNING: Invoice has no subscription ID, skipping', { invoiceId: event.data.object.id });
          return new Response(JSON.stringify({ received: true, skipped: 'no_subscription' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId as string);
      } else {
        subscription = event.data.object as Stripe.Subscription;
      }

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
        .select('id, available_tokens, subscription_type, monthly_worksheet_limit, total_tokens_received, subscription_status')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        logStep('ERROR: User profile not found', { email, error: profileError });
        throw new Error(`User profile not found for email: ${email}`);
      }

      logStep('Profile found', { 
        userId: profile.id, 
        currentTokens: profile.available_tokens,
        currentTotalReceived: profile.total_tokens_received || 0,
        currentSubscriptionStatus: profile.subscription_status
      });

      // Determine subscription details from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // FIXED: Use normalizer for consistent plan naming (removed duplicate declaration)
      let subscriptionType = normalizePlanName(undefined, undefined, amount);
      let monthlyLimit = 0;
      let tokensToAdd = 0;

      // Set limits and tokens based on normalized plan
      if (subscriptionType === 'Side-Gig') {
        monthlyLimit = 15;
        tokensToAdd = 15;
      } else if (subscriptionType === 'Full-Time 30') {
        monthlyLimit = 30;
        tokensToAdd = 30;
      } else if (subscriptionType === 'Full-Time 60') {
        monthlyLimit = 60;
        tokensToAdd = 60;
      } else if (subscriptionType === 'Full-Time 90') {
        monthlyLimit = 90;
        tokensToAdd = 90;
      } else if (subscriptionType === 'Full-Time 120') {
        monthlyLimit = 120;
        tokensToAdd = 120;
      }

      logStep('Plan determined', { 
        subscriptionType, 
        monthlyLimit, 
        tokensToAdd, 
        priceAmount: amount 
      });

      // FIXED: Enhanced fallback logic for billing periods to prevent NULL errors
      let subscriptionExpiresAt = null;
      let currentPeriodStart = null;
      let currentPeriodEnd = null;

      if (subscription.current_period_start && typeof subscription.current_period_start === 'number') {
        try {
          currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
          logStep('Current period start calculated', { periodStart: currentPeriodStart });
        } catch (dateError) {
          logStep('WARNING: Could not parse subscription start date', { 
            current_period_start: subscription.current_period_start,
            error: dateError.message 
          });
          currentPeriodStart = new Date().toISOString(); // HARD FALLBACK to now
        }
      } else {
        // HARD FALLBACK: If Stripe doesn't provide start date, use now
        currentPeriodStart = new Date().toISOString();
        logStep('WARNING: No current_period_start from Stripe, using fallback', { fallbackStart: currentPeriodStart });
      }

      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        try {
          subscriptionExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
          currentPeriodEnd = subscriptionExpiresAt;
          logStep('Subscription expiry date calculated', { expiresAt: subscriptionExpiresAt });
        } catch (dateError) {
          logStep('WARNING: Could not parse subscription end date', { 
            current_period_end: subscription.current_period_end,
            error: dateError.message 
          });
          // HARD FALLBACK: 30 days from now
          subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          currentPeriodEnd = subscriptionExpiresAt;
        }
      } else {
        // HARD FALLBACK: If Stripe doesn't provide end date, use 30 days from now
        subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        currentPeriodEnd = subscriptionExpiresAt;
        logStep('WARNING: No current_period_end from Stripe, using fallback', { fallbackEnd: subscriptionExpiresAt });
      }

      // FIXED: Determine subscription status based on cancel_at_period_end
      let newSubscriptionStatus: string;
      let shouldFreezeTokens = false;

      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          newSubscriptionStatus = 'active_cancelled';
          shouldFreezeTokens = false; // Don't freeze until actually cancelled
          logStep('Subscription is active but set to cancel at period end');
        } else {
          newSubscriptionStatus = 'active';
          shouldFreezeTokens = false;
        }
      } else {
        newSubscriptionStatus = subscription.status;
        shouldFreezeTokens = subscription.status === 'cancelled';
      }

    // FIXED: Simplified old plan type determination for reliable event logging
    let oldPlanType = 'Free Demo'; // Default for new subscriptions
    
    // For new subscriptions, always use Free Demo as old plan
    if (event.type === 'customer.subscription.created') {
      oldPlanType = 'Free Demo';
      logStep('NEW SUBSCRIPTION: First subscription purchase detected', { oldPlanType, newPlan: subscriptionType });
    }
    
    // For subscription updates, use current profile subscription type
    if (event.type === 'customer.subscription.updated') {
      oldPlanType = profile.subscription_type || subscriptionType;
      
      // Special handling for cancellation detection
      if (event.data.previous_attributes) {
        const previousAttributes = event.data.previous_attributes as any;
        
        // Check if cancel_at_period_end changed from false to true (means cancellation)
        if ('cancel_at_period_end' in previousAttributes) {
          const wasCancelledBefore = previousAttributes.cancel_at_period_end;
          const isNowCancelled = subscription.cancel_at_period_end;
          
          if (!wasCancelledBefore && isNowCancelled) {
            logStep('CANCELLATION DETECTED: User cancelled subscription', { 
              oldPlanType,
              newStatus: 'active_cancelled',
              subscriptionId: subscription.id 
            });
          }
        }
      }
      
      logStep('SUBSCRIPTION UPDATE: Processing subscription change', { 
        oldPlanType, 
        newPlan: subscriptionType,
        cancelAtPeriodEnd: subscription.cancel_at_period_end 
      });
    }

      // Token deduplication logic - only add tokens for new subscriptions or reactivations
      let shouldAddTokens = false;
      let newAvailableTokens = profile.available_tokens;
      let newTotalReceived = profile.total_tokens_received || 0;

      if (event.type === 'customer.subscription.created') {
        // Always add tokens for new subscriptions
        shouldAddTokens = true;
        logStep('Adding tokens for new subscription');
      } else if (event.type === 'customer.subscription.updated') {
        // Only add tokens if subscription was reactivated (from cancelled to active)
        const wasInactive = !profile.subscription_status || 
                           profile.subscription_status === 'cancelled' || 
                           profile.subscription_status === 'past_due';
        const isNowActive = subscription.status === 'active';
        
        if (wasInactive && isNowActive && !subscription.cancel_at_period_end) {
          shouldAddTokens = true;
          logStep('Adding tokens for reactivated subscription');
        } else {
          logStep('Not adding tokens - subscription update without reactivation', {
            wasInactive,
            isNowActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          });
        }
      }

      if (shouldAddTokens) {
        newAvailableTokens = profile.available_tokens + tokensToAdd;
        newTotalReceived = (profile.total_tokens_received || 0) + tokensToAdd;
        logStep('Tokens will be added', { tokensToAdd, newAvailableTokens, newTotalReceived });
      } else {
        logStep('No tokens will be added');
      }

      // Update profile with subscription details
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_type: subscriptionType,
          subscription_status: newSubscriptionStatus,
          subscription_expires_at: subscriptionExpiresAt,
          monthly_worksheet_limit: monthlyLimit,
          available_tokens: newAvailableTokens,
          total_tokens_received: newTotalReceived,
          is_tokens_frozen: shouldFreezeTokens,
          monthly_worksheets_used: 0, // Reset monthly usage on subscription changes
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep('ERROR: Failed to update profile', updateError);
        throw updateError;
      }

      logStep('Profile updated successfully', { 
        newAvailableTokens,
        newTotalReceived,
        subscriptionType,
        subscriptionStatus: newSubscriptionStatus,
        tokensFrozen: shouldFreezeTokens
      });

      // CRITICAL: SIMPLIFIED event logging - ALWAYS insert for main subscription events
      const eventNewPlanType = newSubscriptionStatus === 'active_cancelled' 
        ? `${subscriptionType}_cancelled` 
        : subscriptionType;

      logStep('CRITICAL: Logging subscription event', {
        eventType: event.type,
        oldPlanType,
        eventNewPlanType,
        tokensAdded: shouldAddTokens ? tokensToAdd : 0,
        subscriptionId: subscription.id,
        customerId: customer.id
      });

      // CRITICAL: RELIABLE EVENT INSERT - This must always work
      logStep('INSERTING SUBSCRIPTION EVENT', {
        eventType: event.type,
        teacherId: profile.id,
        email: email,
        oldPlanType,
        eventNewPlanType,
        tokensAdded: shouldAddTokens ? tokensToAdd : 0,
        stripeEventId: event.id
      });

      const eventInsertData = {
        teacher_id: profile.id,
        email: email,
        event_type: event.type,
        old_plan_type: oldPlanType,
        new_plan_type: eventNewPlanType, 
        tokens_added: shouldAddTokens ? tokensToAdd : 0,
        stripe_event_id: event.id,
        event_data: {
          subscription_id: subscription.id,
          customer_id: customer.id,
          amount: amount,
          currency: price.currency,
          period_start: subscription.current_period_start || null,
          period_end: subscription.current_period_end || null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          status: subscription.status,
          action: event.type === 'customer.subscription.created' ? 'initial_purchase' : 
                  event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end ? 'cancellation' : 'subscription_update'
        }
      };

      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert(eventInsertData);

      if (eventError) {
        logStep('CRITICAL ERROR: Subscription event insert failed', {
          error: eventError,
          eventData: eventInsertData
        });
        // Return error immediately if event logging fails
        return new Response(
          JSON.stringify({ 
            error: 'Failed to log subscription event', 
            details: eventError.message,
            eventType: event.type 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        logStep('✅ SUCCESS: Subscription event logged successfully', {
          eventType: event.type,
          oldPlan: oldPlanType,
          newPlan: eventNewPlanType,
          stripeEventId: event.id,
          teacherId: profile.id
        });
      }

      // Add token transaction record only if tokens were added
      if (shouldAddTokens) {
        const { error: transactionError } = await supabaseService
          .from('token_transactions')
          .insert({
            teacher_id: profile.id,
            teacher_email: email,  // FIXED: Add teacher_email
            transaction_type: 'purchase',
            amount: tokensToAdd,
            description: `Subscription tokens added - ${subscriptionType}`,
            reference_id: null
          });

        if (transactionError) {
          logStep('WARNING: Failed to log token transaction', transactionError);
        } else {
          logStep('Token transaction logged successfully', { tokensAdded: tokensToAdd });
        }
      }

      // FIXED: Ensure subscriptions table is synchronized with profiles table
      const subscriptionData = {
        teacher_id: profile.id,
        email: email,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        subscription_status: newSubscriptionStatus, // Matches profiles.subscription_status
        subscription_type: subscriptionType, // Full plan name like "Side-Gig" or "Full-Time 30"
        monthly_limit: monthlyLimit,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      };

      logStep('UPSERTING SUBSCRIPTIONS TABLE', { 
        teacherId: profile.id,
        subscriptionId: subscription.id,
        status: newSubscriptionStatus,
        type: subscriptionType,
        monthlyLimit: monthlyLimit
      });

      const { error: subError } = await supabaseService
        .from('subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'teacher_id',
          ignoreDuplicates: false 
        });

      if (subError) {
        logStep('WARNING: Failed to update subscriptions table', {
          error: subError,
          subscriptionData
        });
        // Continue processing - subscriptions table sync is not critical for webhook success
      } else {
        logStep('✅ SUCCESS: Subscriptions table synchronized', { 
          teacherId: profile.id, 
          subscriptionId: subscription.id,
          status: newSubscriptionStatus,
          type: subscriptionType
        });
      }
    }

    // Handle subscription deletion/cancellation - only when actually finished
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      logStep('Processing subscription deletion', { 
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        endedAt: subscription.ended_at,
        canceledAt: subscription.canceled_at
      });

      // Get customer details
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const email = customer.email;

      if (!email) {
        logStep('ERROR: No email found for deleted subscription customer');
        throw new Error('No email found for customer');
      }

      // Find user profile by email
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id, subscription_type')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        logStep('ERROR: User profile not found for deletion', { email, error: profileError });
        throw new Error(`User profile not found for email: ${email}`);
      }

      logStep('Processing cancellation for profile', { userId: profile.id, email });

      // Set status to 'cancelled' only when subscription actually ended
      const shouldSetCancelled = subscription.ended_at !== null;
      const finalStatus = shouldSetCancelled ? 'cancelled' : 'active_cancelled';
      const finalType = shouldSetCancelled ? 'Inactive' : profile.subscription_type;

      logStep('Determining final status', { shouldSetCancelled, finalStatus, finalType });

      // Freeze tokens and update subscription status
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_status: finalStatus,
          subscription_type: finalType,
          is_tokens_frozen: shouldSetCancelled, // Freeze only if actually ended
          monthly_worksheet_limit: shouldSetCancelled ? 0 : undefined,
          monthly_worksheets_used: shouldSetCancelled ? 0 : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        logStep('ERROR: Failed to update profile on cancellation', updateError);
        throw updateError;
      }

      // CRITICAL: Log subscription deletion/ending event
      const deletionNewPlanType = shouldSetCancelled ? 'Inactive' : `${profile.subscription_type}_cancelled`;
      
      logStep('LOGGING SUBSCRIPTION DELETION EVENT', {
        oldPlanType: profile.subscription_type || 'Unknown',
        deletionNewPlanType,
        shouldSetCancelled,
        endedAt: subscription.ended_at,
        subscriptionId: subscription.id,
        teacherId: profile.id
      });

      const deletionEventData = {
        teacher_id: profile.id,
        email: email,
        event_type: 'customer.subscription.deleted',
        old_plan_type: profile.subscription_type || 'Unknown',
        new_plan_type: deletionNewPlanType,
        tokens_added: 0,
        stripe_event_id: event.id,
        event_data: {
          subscription_id: subscription.id,
          customer_id: customer.id,
          cancelled_at: subscription.canceled_at,
          ended_at: subscription.ended_at,
          final_status: finalStatus,
          tokens_frozen: shouldSetCancelled,
          action: 'subscription_ended'
        }
      };

      const { error: eventError } = await supabaseService
        .from('subscription_events')
        .insert(deletionEventData);

      if (eventError) {
        logStep('CRITICAL ERROR: Deletion event insert failed', {
          error: eventError,
          eventData: deletionEventData
        });
        // Return error immediately if event logging fails
        return new Response(
          JSON.stringify({ 
            error: 'Failed to log subscription deletion event', 
            details: eventError.message,
            eventType: 'customer.subscription.deleted' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        logStep('✅ SUCCESS: Subscription deletion event logged', {
          oldPlan: profile.subscription_type || 'Unknown',
          newPlan: deletionNewPlanType,
          finalStatus,
          stripeEventId: event.id,
          teacherId: profile.id
        });
      }

      // FIXED: Update subscriptions table for cancellation/deletion
      logStep('UPDATING SUBSCRIPTIONS TABLE FOR CANCELLATION', { 
        subscriptionId: subscription.id, 
        teacherId: profile.id,
        finalStatus, 
        finalType,
        shouldSetCancelled 
      });
      
      const subscriptionUpdateData = {
        subscription_status: finalStatus, // 'cancelled' or 'active_cancelled'
        subscription_type: shouldSetCancelled ? 'inactive' : profile.subscription_type, // 'inactive' when truly ended
        updated_at: new Date().toISOString()
      };

      const { error: subError } = await supabaseService
        .from('subscriptions')
        .update(subscriptionUpdateData)
        .eq('stripe_subscription_id', subscription.id);

      if (subError) {
        logStep('WARNING: Failed to update subscriptions table on cancellation', {
          error: subError,
          updateData: subscriptionUpdateData,
          subscriptionId: subscription.id
        });
      } else {
        logStep('✅ SUCCESS: Subscriptions table updated for cancellation', {
          subscriptionId: subscription.id,
          newStatus: finalStatus,
          newType: shouldSetCancelled ? 'inactive' : profile.subscription_type
        });
      }
    }

    logStep('Webhook processed successfully', { eventType: event.type });
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    logStep('ERROR: Webhook processing failed', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
