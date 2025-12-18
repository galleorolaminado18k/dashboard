-- Script 060: Limpieza PROFUNDA y verificación de consistencia en CRM
-- Detecta y resuelve duplicados o inconsistencias entre ID y Phone

-- 1. Ver si hay números de teléfono duplicados (ignorando espacios o caracteres ocultos)
SELECT 
    TRIM(phone) as phone_limpio, 
    COUNT(*) as repetidos,
    ARRAY_AGG(id) as ids,
    ARRAY_AGG(client_name) as nombres
FROM crm_conversations
GROUP BY TRIM(phone)
HAVING COUNT(*) > 1;

-- 2. Ver si hay conversaciones con el MISMO nombre pero DIFERENTE número
SELECT 
    client_name, 
    COUNT(DISTINCT phone) as numeros_distintos,
    ARRAY_AGG(phone) as numeros
FROM crm_conversations
GROUP BY client_name
HAVING COUNT(DISTINCT phone) > 1;

-- 3. ELIMINAR duplicados reales de teléfono (dejando el más reciente)
DELETE FROM crm_conversations
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY updated_at DESC) as rn
        FROM crm_conversations
    ) t
    WHERE t.rn > 1
);

-- 4. Asegurar que no hay espacios en blanco en los números
UPDATE crm_conversations
SET phone = TRIM(phone)
WHERE phone != TRIM(phone);

-- 5. Verificar si hay mensajes asociados a conversaciones que no existen
DELETE FROM crm_messages
WHERE conversation_id NOT IN (SELECT id FROM crm_conversations);

-- 6. Asegurar que las columnas necesarias existen en crm_messages
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_messages' AND column_name='wa_number') THEN
        ALTER TABLE crm_messages ADD COLUMN wa_number VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_messages' AND column_name='direction') THEN
        ALTER TABLE crm_messages ADD COLUMN direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound'));
    END IF;
END $$;

-- 7. Asegurar que la columna wa_number existe en crm_conversations
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_conversations' AND column_name='wa_number') THEN
        ALTER TABLE crm_conversations ADD COLUMN wa_number VARCHAR(20);
    END IF;
END $$;

-- 8. Resumen final
SELECT 'Total conversaciones:' as info, COUNT(*) FROM crm_conversations;
SELECT 'Ejemplos de consistencia:' as info, id, phone, client_name FROM crm_conversations LIMIT 5;
