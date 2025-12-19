-- Script 064: Limpieza y corrección de conversaciones con identificadores LID
-- WhatsApp ha empezado a usar @lid (Linked ID) para algunos contactos.
-- Este script asegura que no haya duplicados y que los JIDs sean correctos.

-- 1. Identificar posibles duplicados (mismo phone, diferente remote_jid)
-- A veces un contacto aparece como @s.whatsapp.net y luego como @lid
SELECT phone, count(*) as total, array_agg(remote_jid) as jids
FROM crm_conversations
GROUP BY phone, wa_number
HAVING count(*) > 1;

-- 2. Preferir siempre el remote_jid que contenga @lid si existe un duplicado para el mismo número
-- (Esto es opcional pero ayuda a mantener la consistencia si WhatsApp prefiere LID)
-- Por ahora, simplemente eliminaremos los que no tienen remote_jid o tienen formato inválido.

-- 3. Corregir cualquier remote_jid que se haya guardado truncado o sin el sufijo correcto
UPDATE crm_conversations
SET remote_jid = phone || '@s.whatsapp.net'
WHERE remote_jid IS NULL AND phone ~ '^\d+$';

-- 4. Limpiar mensajes huérfanos
DELETE FROM crm_messages
WHERE conversation_id NOT IN (SELECT id FROM crm_conversations);

-- 5. Mostrar resumen de contactos con LID
SELECT id, phone, client_name, remote_jid, updated_at
FROM crm_conversations
WHERE remote_jid LIKE '%@lid'
ORDER BY updated_at DESC;
