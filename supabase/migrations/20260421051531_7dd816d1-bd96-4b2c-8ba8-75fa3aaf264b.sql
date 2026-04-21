
-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten notifikasi insert
DROP POLICY IF EXISTS "system insert notif" ON public.notifikasi;
CREATE POLICY "admin/approver insert notif" ON public.notifikasi FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'approver')
    OR user_id = auth.uid()
  );

-- Tighten storage SELECT (still allow public via direct URL, but block listing)
DROP POLICY IF EXISTS "public read bukti" ON storage.objects;
CREATE POLICY "owner list bukti" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'bukti' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'approver')
    )
  );
