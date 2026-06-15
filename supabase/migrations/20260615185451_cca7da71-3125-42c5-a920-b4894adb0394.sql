CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan
    FROM public.subscriptions
   WHERE user_id = _user_id
     AND status = 'active'
     AND plan IN ('basic', 'premium')
   ORDER BY updated_at DESC
   LIMIT 1;
$$;