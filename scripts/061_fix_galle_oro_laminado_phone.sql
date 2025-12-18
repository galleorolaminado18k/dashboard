-- Script 061: Corregir número de Galle Oro Laminado
-- Fecha: 2025-12-18
-- Descripción: Actualiza el número de teléfono incorrecto por el correcto.

-- 1. Ver el estado actual antes del cambio
SELECT id, phone, client_name 
FROM crm_conversations 
WHERE client_name ILIKE '%Galle Oro Laminado%' OR phone = '17048449872689';

-- 2. Actualizar al número correcto
-- Nota: Usamos el ID si es posible o el nombre exacto/teléfono anterior.
UPDATE crm_conversations
SET phone = '573005551256',
    updated_at = NOW()
WHERE client_name = 'Galle Oro Laminado' OR phone = '17048449872689';

-- 3. Verificar el cambio
SELECT id, phone, client_name 
FROM crm_conversations 
WHERE phone = '573005551256';
