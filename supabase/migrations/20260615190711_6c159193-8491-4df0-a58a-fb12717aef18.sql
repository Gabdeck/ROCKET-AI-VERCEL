
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS mercadopago_payment_id text;

CREATE INDEX IF NOT EXISTS subscriptions_payment_id_idx
  ON public.subscriptions (mercadopago_payment_id);

CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT plan
    FROM public.subscriptions
   WHERE user_id = _user_id
     AND status = 'active'
     AND plan IN ('basic', 'premium')
     AND (current_period_end IS NULL OR current_period_end > now())
   ORDER BY updated_at DESC
   LIMIT 1;
$function$;
