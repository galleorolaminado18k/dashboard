-- Script 054: Tabla para gestión de novedades en envíos
-- Fecha: 2025-11-05
-- Descripción: Tabla para registrar acciones tomadas sobre novedades de envíos

-- Crear tabla shipment_novedades
CREATE TABLE IF NOT EXISTS public.shipment_novedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'contactar_cliente',
    'reprogramar',
    'solicitar_devolucion',
    'cambiar_direccion',
    'actualizar_telefono',
    'otro'
  )),
  notes TEXT,
  contact_method TEXT CHECK (contact_method IN ('phone', 'whatsapp', 'email', NULL)),
  new_address TEXT,
  new_phone TEXT,
  reschedule_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shipment_novedades_shipment_id
  ON public.shipment_novedades(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_novedades_action_type
  ON public.shipment_novedades(action_type);

CREATE INDEX IF NOT EXISTS idx_shipment_novedades_created_at
  ON public.shipment_novedades(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_novedades_status
  ON public.shipment_novedades(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_shipment_novedades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shipment_novedades_updated_at
  BEFORE UPDATE ON public.shipment_novedades
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_novedades_updated_at();

-- Crear tabla activity_log si no existe
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Índices para activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_entity
  ON public.activity_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON public.activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action
  ON public.activity_log(action);

-- Agregar columnas a tabla shipments si no existen
DO $$
BEGIN
  -- Columna para último contacto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'last_contact'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN last_contact TIMESTAMPTZ;
  END IF;

  -- Columna para intentos de contacto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'contact_attempts'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN contact_attempts INTEGER DEFAULT 0;
  END IF;

  -- Columna para fecha de reprogramación
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'rescheduled_at'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN rescheduled_at TIMESTAMPTZ;
  END IF;

  -- Columna para fecha de solicitud de devolución
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'return_requested_at'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN return_requested_at TIMESTAMPTZ;
  END IF;

  -- Columna para fecha de actualización de dirección
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'address_updated_at'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN address_updated_at TIMESTAMPTZ;
  END IF;

  -- Columna para fecha de actualización de teléfono
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'phone_updated_at'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN phone_updated_at TIMESTAMPTZ;
  END IF;

  -- Columna para dirección de entrega
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN delivery_address TEXT;
  END IF;

  -- Columna para teléfono del cliente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.shipments ADD COLUMN customer_phone TEXT;
  END IF;
END $$;

-- RLS (Row Level Security) para shipment_novedades
ALTER TABLE public.shipment_novedades ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de novedades"
  ON public.shipment_novedades
  FOR SELECT
  USING (true);

-- Política: Permitir inserción a todos los usuarios autenticados
CREATE POLICY "Permitir creación de novedades"
  ON public.shipment_novedades
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir actualización a todos los usuarios autenticados
CREATE POLICY "Permitir actualización de novedades"
  ON public.shipment_novedades
  FOR UPDATE
  USING (true);

-- RLS para activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de actividad"
  ON public.activity_log
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir registro de actividad"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE public.shipment_novedades IS 'Registro de acciones tomadas para resolver novedades en envíos';
COMMENT ON COLUMN public.shipment_novedades.action_type IS 'Tipo de acción realizada sobre la novedad';
COMMENT ON COLUMN public.shipment_novedades.contact_method IS 'Método usado para contactar al cliente';
COMMENT ON COLUMN public.shipment_novedades.status IS 'Estado de la acción: pending, completed, cancelled';

COMMENT ON TABLE public.activity_log IS 'Log de actividades del sistema para auditoría';

-- Insertar registro de ejemplo (opcional)
-- INSERT INTO public.shipment_novedades (
--   shipment_id,
--   action_type,
--   notes,
--   contact_method,
--   status
-- ) VALUES (
--   'ENV-2025-10-001',
--   'contactar_cliente',
--   'Cliente confirmó disponibilidad para mañana',
--   'whatsapp',
--   'completed'
-- );

-- Fin del script
SELECT 'Script 054: Tabla shipment_novedades creada exitosamente' AS resultado;

