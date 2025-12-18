-- Script para eliminar TODAS las conversaciones y mensajes del CRM
-- Esto nos permite probar desde cero con números limpios

-- Primero eliminar todos los mensajes (tienen foreign key a conversaciones)
DELETE FROM crm_messages;

-- Luego eliminar todas las conversaciones
DELETE FROM crm_conversations;

-- Verificar que todo está vacío
SELECT 'Mensajes restantes:' as info, COUNT(*) as count FROM crm_messages
UNION ALL
SELECT 'Conversaciones restantes:' as info, COUNT(*) as count FROM crm_conversations;
