-- Script 062: Limpieza de conversaciones creadas con IDs erróneos de webhooks
-- Estos IDs suelen ser remanentes de una mala extracción de JID (ej. IDs de grupos truncados)

-- 1. Identificar posibles números inválidos (IDs de grupos que se guardaron como phone)
-- Un ID de grupo de Baileys suele ser muy largo (18+ dígitos) o tener formatos específicos
SELECT id, phone, client_name, created_at
FROM crm_conversations
WHERE 
    length(phone) > 15 -- Números internacionales reales rara vez pasan de 15 (E.164 max es 15)
    OR phone LIKE '120363%' -- Prefijo común de IDs de grupos en Baileys
    OR phone LIKE '5757%'; -- Duplicados

-- 2. Eliminar mensajes asociados a estas conversaciones para evitar huérfanos
DELETE FROM crm_messages
WHERE conversation_id IN (
    SELECT id FROM crm_conversations
    WHERE length(phone) > 16 OR phone LIKE '120363%'
);

-- 3. Eliminar las conversaciones erróneas
DELETE FROM crm_conversations
WHERE length(phone) > 16 OR phone LIKE '120363%';

-- 4. Normalizar posibles duplicados 5757 que hayan quedado
UPDATE crm_conversations
SET phone = '57' || substring(phone from 5)
WHERE phone LIKE '5757%' AND length(phone) >= 12;

-- 5. Ver resumen de lo que quedó
SELECT count(*) as total_conversaciones, 'conversaciones válidas restantes' as status
FROM crm_conversations;
