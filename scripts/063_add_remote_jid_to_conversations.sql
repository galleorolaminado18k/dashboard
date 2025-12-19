-- Script 063: Agregar remote_jid a crm_conversations y ajustar unicidad
-- Fecha: 2025-12-18

-- 1. Agregar la columna remote_jid si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'crm_conversations' AND COLUMN_NAME = 'remote_jid') THEN
        ALTER TABLE crm_conversations ADD COLUMN remote_jid VARCHAR(255);
    END IF;

    -- Agregar wa_number si no existe (ya debería existir por cambios previos pero aseguramos)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'crm_conversations' AND COLUMN_NAME = 'wa_number') THEN
        ALTER TABLE crm_conversations ADD COLUMN wa_number VARCHAR(20);
    END IF;
END $$;

-- 2. Limpiar duplicados potenciales antes de aplicar la restricción de unicidad
-- Si hay registros con el mismo wa_number y remote_jid, dejamos el más reciente
DELETE FROM crm_conversations a USING crm_conversations b
WHERE a.id < b.id 
AND a.wa_number = b.wa_number 
AND a.remote_jid = b.remote_jid;

-- 3. Eliminar restricción de unicidad anterior si existe
ALTER TABLE crm_conversations DROP CONSTRAINT IF EXISTS unique_phone;

-- 4. Crear el nuevo índice de unicidad compuesto
-- Primero eliminamos si ya existe uno similar para evitar errores
DROP INDEX IF EXISTS idx_crm_conversations_wa_remote_jid;
CREATE UNIQUE INDEX idx_crm_conversations_wa_remote_jid ON crm_conversations (wa_number, remote_jid);

-- 5. Comentarios para documentación
COMMENT ON COLUMN crm_conversations.remote_jid IS 'Identificador único de WhatsApp (JID) para el chat';
COMMENT ON COLUMN crm_conversations.wa_number IS 'Número de la línea de WhatsApp que gestiona esta conversación';
