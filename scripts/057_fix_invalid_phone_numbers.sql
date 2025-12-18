-- ========================================
-- Script 057: Limpiar números de teléfono inválidos de crm_conversations
-- ========================================
-- Fecha: 2025-12-17
-- Descripción: Elimina conversaciones con números inválidos (UUIDs, números < 10 dígitos, etc.)
-- y normaliza números válidos al formato colombiano 57XXXXXXXXXX
-- ========================================

-- 1. Ver conversaciones con números inválidos ANTES de eliminar
SELECT
  id,
  phone,
  client_name,
  status,
  length(phone) as phone_length,
  CASE
    WHEN phone ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN 'UUID'
    WHEN length(phone) < 10 THEN 'Muy corto'
    WHEN length(phone) > 15 THEN 'Muy largo'
    WHEN phone !~ '^\d+$' THEN 'Contiene caracteres inválidos'
    ELSE 'Posiblemente válido'
  END as tipo_problema
FROM crm_conversations
WHERE
  -- UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  phone ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  OR
  -- Números muy cortos (< 10 dígitos)
  length(phone) < 10
  OR
  -- Números muy largos (> 15 dígitos)
  length(phone) > 15
  OR
  -- Contiene caracteres no numéricos
  phone !~ '^\d+$'
ORDER BY created_at DESC;

-- 2. ELIMINAR conversaciones con números inválidos
DELETE FROM crm_conversations
WHERE
  -- UUIDs
  phone ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
  OR
  -- Números muy cortos
  length(phone) < 10
  OR
  -- Números muy largos
  length(phone) > 15
  OR
  -- Contiene caracteres no numéricos
  phone !~ '^\d+$';

-- 3. Ver números que necesitan normalización (Colombia)
SELECT
  id,
  phone,
  client_name,
  CASE
    WHEN length(phone) = 10 AND phone LIKE '3%' THEN '57' || phone
    WHEN length(phone) = 12 AND phone LIKE '57%' THEN phone
    WHEN phone LIKE '5757%' THEN '57' || substring(phone from 5)
    ELSE phone
  END as phone_normalizado
FROM crm_conversations
WHERE
  -- Números válidos pero sin normalizar
  (length(phone) = 10 AND phone LIKE '3%')
  OR
  -- Números duplicados con 5757
  phone LIKE '5757%'
ORDER BY created_at DESC;

-- 4. NORMALIZAR números válidos al formato colombiano
UPDATE crm_conversations
SET phone = CASE
  -- Si tiene 10 dígitos y empieza con 3, anteponer 57
  WHEN length(phone) = 10 AND phone LIKE '3%' THEN '57' || phone

  -- Si empieza con 5757, eliminar duplicación
  WHEN phone LIKE '5757%' THEN '57' || substring(phone from 5)

  -- Si ya tiene 12 dígitos y empieza con 57, dejarlo igual
  ELSE phone
END
WHERE
  (length(phone) = 10 AND phone LIKE '3%')
  OR
  phone LIKE '5757%';

-- 5. Verificar que todos los números son válidos ahora
SELECT
  count(*) as total_conversaciones,
  min(length(phone)) as min_length,
  max(length(phone)) as max_length,
  count(CASE WHEN phone LIKE '57%' THEN 1 END) as numeros_colombianos,
  count(CASE WHEN phone !~ '^\d+$' THEN 1 END) as numeros_con_caracteres_invalidos
FROM crm_conversations;

-- 6. Ver ejemplos de números finales (debe mostrar solo números válidos)
SELECT
  phone,
  client_name,
  status,
  created_at
FROM crm_conversations
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- RESULTADO ESPERADO:
-- - Se eliminan conversaciones con UUIDs, números < 10 o > 15 dígitos
-- - Se normalizan números colombianos a formato 57XXXXXXXXXX
-- - Se eliminan duplicaciones 5757XXXXXXXXXX
-- - Todos los números quedan con 10-15 dígitos y solo números
-- ========================================
