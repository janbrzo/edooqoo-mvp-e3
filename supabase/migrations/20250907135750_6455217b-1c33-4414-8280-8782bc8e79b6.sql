-- Teraz napraw dane i dodaj brakujące eventy z prawidłowymi datami  
UPDATE public.subscriptions 
SET 
  subscription_status = 'cancelled',
  subscription_type = 'inactive',
  updated_at = NOW()
WHERE email = 'j4n.brz0+44@gmail.com' 
  AND subscription_status = 'active_cancelled';

-- Dodaj brakujące eventy subscription_events z prawidłowymi datami
INSERT INTO public.subscription_events (
  teacher_id,
  email, 
  event_type,
  old_plan_type,
  new_plan_type,
  stripe_event_id,
  event_data,
  tokens_added
) VALUES 
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f',
  'j4n.brz0+44@gmail.com',
  'customer.subscription.created', 
  'Free Demo',
  'Side-Gig',
  'evt_test_initial_subscription',
  jsonb_build_object(
    'subscription_id', 'sub_1S4iptH4Sb5mBNfbiE8HytTm',
    'customer_id', 'cus_T0iNIpSxdPkEIy',
    'status', 'active',
    'cancel_at_period_end', false,
    'current_period_start', 1725710452,
    'current_period_end', 1728388852,
    'amount', 900,
    'plan_name', 'Side-Gig'
  ),
  0
),
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f', 
  'j4n.brz0+44@gmail.com',
  'customer.subscription.updated',
  'Side-Gig', 
  'Side-Gig',
  'evt_test_cancellation',
  jsonb_build_object(
    'subscription_id', 'sub_1S4iptH4Sb5mBNfbiE8HytTm',
    'customer_id', 'cus_T0iNIpSxdPkEIy',
    'status', 'active',
    'cancel_at_period_end', true,
    'current_period_start', 1725710452,
    'current_period_end', 1728388852,
    'amount', 900,
    'plan_name', 'Side-Gig'
  ),
  0
),
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f',
  'j4n.brz0+44@gmail.com', 
  'customer.subscription.deleted',
  'Side-Gig',
  'Inactive',
  'evt_test_deletion', 
  jsonb_build_object(
    'subscription_id', 'sub_1S4iptH4Sb5mBNfbiE8HytTm',
    'customer_id', 'cus_T0iNIpSxdPkEIy',
    'status', 'canceled',
    'cancel_at_period_end', true,
    'current_period_start', 1725710452,
    'current_period_end', 1728388852,
    'amount', 900,
    'plan_name', 'Side-Gig'
  ),
  0
);