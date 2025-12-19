-- Script para eliminar SOLO conversaciones con números inválidos
-- Mantiene las conversaciones con números colombianos válidos (57XXXXXXXXXX)

-- Ver conversaciones con números inválidos ANTES de eliminar
SELECT 'Conversaciones con números inválidos:' as info, phone, client_name, updated_at
FROM crm_conversations
WHERE
  -- Números que NO empiezan con 57 y tienen más de 12 dígitos
  (phone NOT LIKE '57%' AND LENGTH(phone) > 12)
  OR
  -- Números muy largos (más de 15 dígitos)
  LENGTH(phone) > 15
  OR
  -- Números muy cortos (menos de 10 dígitos)
  LENGTH(phone) < 10
ORDER BY updated_at DESC;

-- Eliminar conversaciones con números inválidos (no E.164)
DELETE FROM crm_conversations
WHERE phone !~ '^\d{10,15}$';

-- Eliminar mensajes asociados a esas conversaciones
DELETE FROM crm_messages
WHERE conversation_id NOT IN (
  SELECT id FROM crm_conversations
);

-- Ver conversaciones válidas que quedaron
SELECT 'Conversaciones válidas restantes:' as info, phone, client_name, updated_at
FROM crm_conversations
ORDER BY updated_at DESC;
