-- Napraw niezgodności w tabeli subscriptions dla konta testowego
UPDATE public.subscriptions 
SET 
  subscription_status = 'cancelled',
  subscription_type = 'inactive',
  updated_at = NOW()
WHERE email = 'j4n.brz0+44@gmail.com' 
  AND subscription_status = 'active_cancelled'
  AND subscription_type = 'Side-Gig';

-- Dodaj brakujące eventy do subscription_events dla testowego konta
INSERT INTO public.subscription_events (
  teacher_id,
  email, 
  event_type,
  old_plan_type,
  new_plan_type,
  stripe_event_id,
  event_data
) VALUES 
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f',
  'j4n.brz0+44@gmail.com',
  'customer.subscription.created', 
  'Free Demo',
  'Side-Gig',
  'evt_test_initial_subscription',
  '{"subscription_id": "sub_1S4iptH4Sb5mBNfbiE8HytTm", "customer_id": "cus_T0iNIpSxdPkEIy"}'::jsonb
),
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f', 
  'j4n.brz0+44@gmail.com',
  'customer.subscription.updated',
  'Side-Gig', 
  'Side-Gig',
  'evt_test_cancellation',
  '{"subscription_id": "sub_1S4iptH4Sb5mBNfbiE8HytTm", "cancel_at_period_end": true}'::jsonb
),
(
  '4ee84131-4ac8-4931-86ee-e116234e7e1f',
  'j4n.brz0+44@gmail.com', 
  'customer.subscription.deleted',
  'Side-Gig',
  'Inactive',
  'evt_test_deletion', 
  '{"subscription_id": "sub_1S4iptH4Sb5mBNfbiE8HytTm", "status": "canceled"}'::jsonb
);