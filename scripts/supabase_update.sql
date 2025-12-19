-- 1) Agregar columnas nuevas para enviar bien (JID real)
ALTER TABLE public.crm_conversations
ADD COLUMN IF NOT EXISTS client_jid TEXT;

ALTER TABLE public.crm_messages
ADD COLUMN IF NOT EXISTS to_jid TEXT;

-- 2) Índice/único para evitar duplicados por JID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='crm_conversations_client_jid_idx'
  ) THEN
    CREATE INDEX crm_conversations_client_jid_idx ON public.crm_conversations (client_jid);
  END IF;
END $$;

-- 3) Crear vista para salida del JID correcto
DROP VIEW IF EXISTS public.crm_whatsapp_outbox CASCADE;

CREATE VIEW public.crm_whatsapp_outbox AS
SELECT
  c.id AS conversation_id,
  c.client_jid AS to_jid,              -- ✅ AQUÍ VA EL JID REAL (@lid o @s.whatsapp.net)
  c.phone_norm AS to_phone_norm,       -- solo display / fallback
  c.wa_number AS from_wa_number,
  c.client_name,
  c.status,
  c.updated_at,
  c.metadata
FROM public.crm_conversations c
WHERE c.client_jid IS NOT NULL;

-- 4) Limpieza total (opcional)
-- DELETE FROM public.crm_messages;
-- DELETE FROM public.crm_conversations;
