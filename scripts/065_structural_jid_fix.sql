-- SCRIPT 065: Solución estructural basada en JID real
-- Agrega campos client_jid (verdad para responder) y client_jid_alt (para UI/lookup)

ALTER TABLE public.crm_conversations
  ADD COLUMN IF NOT EXISTS client_jid TEXT,
  ADD COLUMN IF NOT EXISTS client_jid_alt TEXT;

-- Crear índice para búsquedas rápidas por client_jid
CREATE INDEX IF NOT EXISTS idx_crm_conversations_client_jid
ON public.crm_conversations(client_jid);

-- Nota: El onConflict en el código ahora debe ser (wa_number, client_jid)
-- Si ya existe una restricción de unicidad anterior, se recomienda actualizarla o manejarla en el UPSERT.
-- Para que el UPSERT funcione con onConflict, necesitamos una restricción UNIQUE.

-- Primero eliminamos la anterior si existe (basada en remote_jid que pusimos en el 063)
ALTER TABLE public.crm_conversations DROP CONSTRAINT IF EXISTS unique_wa_remote_jid;

-- Creamos la nueva restricción de unicidad basada en client_jid
ALTER TABLE public.crm_conversations 
ADD CONSTRAINT unique_wa_client_jid UNIQUE (wa_number, client_jid);
