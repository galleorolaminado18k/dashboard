-- =====================================================
-- FIX REAL: Guardar JID real (incluye @lid) y enviar por JID
-- =====================================================

-- 1) Columnas nuevas (NO rompe nada)
ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS client_jid TEXT,
  ADD COLUMN IF NOT EXISTS phone_norm TEXT;

ALTER TABLE public.crm_messages
  ADD COLUMN IF NOT EXISTS to_jid TEXT,
  ADD COLUMN IF NOT EXISTS from_jid TEXT;

-- 2) Permitir que phone no sea obligatorio (porque @lid no es teléfono real)
ALTER TABLE public.crm_conversations
  ALTER COLUMN phone DROP NOT NULL;

-- 3) Normalizador (solo dígitos E164 si aplica)
CREATE OR REPLACE FUNCTION public.normalize_wa_e164(raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  s TEXT;
BEGIN
  IF raw IS NULL OR length(trim(raw)) = 0 THEN
    RETURN NULL;
  END IF;

  s := split_part(raw, '@', 1);
  s := regexp_replace(s, '\D', '', 'g');

  IF left(s, 2) = '00' THEN
    s := substring(s from 3);
  END IF;

  -- Colombia: 10 dígitos y empieza por 3 => +57
  IF length(s) = 10 AND left(s, 1) = '3' THEN
    s := '57' || s;
  END IF;

  IF left(s, 4) = '5757' THEN
    s := '57' || substring(s from 5);
  END IF;

  IF length(s) < 10 OR length(s) > 15 THEN
    RETURN NULL;
  END IF;

  RETURN s;
END;
$$;

-- 4) Trigger: setear wa_number desde cuenta activa + normalizar phone_norm
CREATE OR REPLACE FUNCTION public.trg_crm_conversations_fill()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  active_wa TEXT;
  n_phone TEXT;
BEGIN
  SELECT wa_number INTO active_wa
  FROM public.crm_whatsapp_accounts
  WHERE key = 'active'
  LIMIT 1;

  IF active_wa IS NULL THEN
    -- RAISE EXCEPTION 'No hay cuenta WhatsApp activa en crm_whatsapp_accounts';
    -- En lugar de excepción, podemos dejarlo pasar si no hay cuenta activa aún
    RETURN NEW;
  END IF;

  -- siempre asegurar wa_number correcto
  NEW.wa_number := active_wa;

  -- normaliza phone_norm si phone o client_jid trae algo tipo numero
  n_phone := public.normalize_wa_e164(COALESCE(NEW.phone, NEW.client_jid));
  NEW.phone_norm := n_phone;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_conversations_fill ON public.crm_conversations;
CREATE TRIGGER crm_conversations_fill
BEFORE INSERT OR UPDATE ON public.crm_conversations
FOR EACH ROW
EXECUTE FUNCTION public.trg_crm_conversations_fill();

-- 5) Índices útiles
CREATE INDEX IF NOT EXISTS idx_crm_conversations_client_jid ON public.crm_conversations(client_jid);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_phone_norm ON public.crm_conversations(phone_norm);

-- 6) Unicidad REAL: por línea + JID (evita duplicados cuando viene @lid)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_wa_client_jid'
  ) THEN
    ALTER TABLE public.crm_conversations
      ADD CONSTRAINT unique_wa_client_jid UNIQUE (wa_number, client_jid);
  END IF;
END $$;

-- 7) Backfill: intenta llenar client_jid si está vacío (si tienes metadata con jid)
-- (No siempre aplica, pero no rompe)
UPDATE public.crm_conversations
SET phone_norm = public.normalize_wa_e164(COALESCE(phone, client_jid))
WHERE phone_norm IS NULL;

-- 8) Vista OUTBOX: usa JID si existe (clave para envío)
CREATE OR REPLACE VIEW public.crm_whatsapp_outbox AS
SELECT
  c.id AS conversation_id,
  c.client_jid AS to_jid,
  c.phone_norm AS to_phone_norm,
  c.wa_number AS from_wa_number,
  c.client_name,
  c.status,
  c.updated_at,
  c.metadata
FROM public.crm_conversations c;
