-- ============================================
-- HISTORIAL DE COMPRAS - IQ 145 DESIGN
-- Versión: 1.0
-- Fecha: Octubre 2025
-- ============================================
-- 
-- PROPÓSITO: Registrar automáticamente las compras cuando una conversación
--            llega al estado 'pedido-completo'
--
-- DISEÑO IQ 145:
-- - Productos almacenados como JSONB para flexibilidad
-- - Relación bidireccional con conversations y clients
-- - Índices optimizados para queries por cliente y fecha
-- - Trigger automático para calcular totales
-- ============================================

-- Crear enum para métodos de pago (reutilizable)
CREATE TYPE payment_method AS ENUM (
  'transferencia',
  'nequi',
  'daviplata',
  'bancolombia',
  'contraentrega',
  'efectivo',
  'anticipado'
);

-- Tabla de compras (historial)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Información de productos (JSONB para flexibilidad)
  -- Estructura: [{"nombre": "Vestido Midi Floral", "precio": 320000, "cantidad": 1}, ...]
  productos JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Totales
  subtotal NUMERIC(12, 2) DEFAULT 0,
  envio NUMERIC(12, 2) DEFAULT 0,
  descuento NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  
  -- Método de pago
  metodo_pago payment_method,
  
  -- Información de envío
  direccion_envio TEXT,
  ciudad TEXT,
  codigo_guia TEXT, -- Código de rastreo MiPaquete
  
  -- Estado de entrega (opcional para tracking futuro)
  entregado BOOLEAN DEFAULT false,
  fecha_entrega TIMESTAMPTZ,
  
  -- Notas adicionales
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para calcular total automáticamente
CREATE OR REPLACE FUNCTION calculate_purchase_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona subtotal, calcularlo desde productos
  IF NEW.subtotal = 0 THEN
    SELECT COALESCE(SUM((item->>'precio')::numeric * (item->>'cantidad')::numeric), 0)
    INTO NEW.subtotal
    FROM jsonb_array_elements(NEW.productos) AS item;
  END IF;
  
  -- Calcular total = subtotal + envio - descuento
  NEW.total := NEW.subtotal + COALESCE(NEW.envio, 0) - COALESCE(NEW.descuento, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular total automáticamente
CREATE TRIGGER calculate_purchase_total_trigger
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purchase_total();

-- Trigger para actualizar updated_at
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para optimizar queries
CREATE INDEX idx_purchases_client_id ON purchases(client_id);
CREATE INDEX idx_purchases_conversation_id ON purchases(conversation_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX idx_purchases_metodo_pago ON purchases(metodo_pago);
CREATE INDEX idx_purchases_entregado ON purchases(entregado);

-- Índice GIN para búsquedas en JSONB de productos
CREATE INDEX idx_purchases_productos ON purchases USING GIN (productos);

-- Políticas RLS (Row Level Security) - PERMISIVAS PARA DESARROLLO
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Política permisiva para purchases (permitir todo en desarrollo)
CREATE POLICY "Enable read access for all users" ON purchases FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON purchases FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON purchases FOR DELETE USING (true);

-- ============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ============================================

-- Insertar compra de ejemplo para María González
INSERT INTO purchases (
  client_id,
  conversation_id,
  productos,
  subtotal,
  envio,
  total,
  metodo_pago,
  direccion_envio,
  ciudad,
  codigo_guia,
  entregado
)
SELECT 
  c.id,
  conv.id,
  '[
    {"nombre": "Vestido Midi Floral", "precio": 320000, "cantidad": 1},
    {"nombre": "Aretes Dorados", "precio": 50000, "cantidad": 1}
  ]'::jsonb,
  370000,
  19000,
  389000,
  'transferencia'::payment_method,
  'Calle 123 #45-67 Barrio Suba',
  'Bogotá',
  'MP123456789',
  true
FROM clients c
LEFT JOIN conversations conv ON conv.client_id = c.id
WHERE c.name = 'María González'
LIMIT 1;

-- Insertar compra de ejemplo para Carlos Ramírez
INSERT INTO purchases (
  client_id,
  conversation_id,
  productos,
  subtotal,
  envio,
  total,
  metodo_pago,
  direccion_envio,
  ciudad,
  codigo_guia
)
SELECT 
  c.id,
  conv.id,
  '[
    {"nombre": "Shorts de Mezclilla", "precio": 560000, "cantidad": 1}
  ]'::jsonb,
  560000,
  12000,
  572000,
  'nequi'::payment_method,
  'Carrera 80 #45B-23 Barrio Belén',
  'Medellín',
  'MP987654321'
FROM clients c
LEFT JOIN conversations conv ON conv.client_id = c.id
WHERE c.name = 'Carlos Ramírez'
LIMIT 1;

-- Insertar compra de ejemplo para Ana Martínez
INSERT INTO purchases (
  client_id,
  productos,
  subtotal,
  envio,
  total,
  metodo_pago,
  direccion_envio,
  ciudad
)
SELECT 
  c.id,
  '[
    {"nombre": "Bolso de Hombro", "precio": 200000, "cantidad": 1}
  ]'::jsonb,
  200000,
  15000,
  215000,
  'contraentrega'::payment_method,
  'Calle 5 #10-20 Barrio El Peñón',
  'Cali'
FROM clients c
WHERE c.name = 'Ana Martínez'
LIMIT 1;

-- ============================================
-- VISTA ÚTIL: Resumen de compras por cliente
-- ============================================

CREATE OR REPLACE VIEW purchase_summary AS
SELECT 
  c.id AS client_id,
  c.name AS client_name,
  c.email,
  COUNT(p.id) AS total_compras,
  SUM(p.total) AS monto_total,
  MAX(p.created_at) AS ultima_compra,
  jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'productos', p.productos,
      'total', p.total,
      'metodo_pago', p.metodo_pago,
      'fecha', p.created_at,
      'entregado', p.entregado
    ) ORDER BY p.created_at DESC
  ) AS historial
FROM clients c
LEFT JOIN purchases p ON p.client_id = c.id
GROUP BY c.id, c.name, c.email;

-- ============================================
-- COMENTARIOS PARA EL EQUIPO
-- ============================================
-- 
-- CÓMO USAR:
-- 1. Cuando una conversación llega a 'pedido-completo', crear registro en purchases
-- 2. Extraer productos del chat usando regex/NLP básico
-- 3. Calcular total automáticamente (trigger se encarga)
-- 4. Mostrar en UI con componente PurchaseHistory
-- 
-- QUERIES ÚTILES:
-- - Compras de un cliente: SELECT * FROM purchases WHERE client_id = ?
-- - Resumen por cliente: SELECT * FROM purchase_summary WHERE client_id = ?
-- - Compras pendientes de entrega: SELECT * FROM purchases WHERE entregado = false
-- 
-- ============================================
