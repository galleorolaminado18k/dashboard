# 📚 Documentación del CRM Automático - Galle Oro Laminado 18K

## 🎯 Índice de Documentación

Esta carpeta contiene toda la documentación necesaria para implementar, configurar y usar el **Sistema CRM Automático** basado en el flujo de ventas de Karla García.

---

## 📖 GUÍAS DISPONIBLES

### 🚀 **1. INICIO_RAPIDO.md**
**📌 Tiempo:** 5 minutos  
**🎯 Para:** Activar el CRM rápidamente  
**✅ Incluye:**
- Ejecutar migración de base de datos
- Verificar configuración
- Probar sistema automático
- Verificar detección de estados y datos

**👉 EMPIEZA AQUÍ** si es tu primera vez

---

### 📊 **2. RESUMEN_EJECUTIVO_CRM.md**
**📌 Tiempo:** 15 minutos de lectura  
**🎯 Para:** Entender el sistema completo  
**✅ Incluye:**
- Arquitectura del sistema
- Flujo de estados y transiciones
- Reglas críticas del negocio
- Tecnologías utilizadas
- Métricas esperadas
- Próximos pasos

**👉 LEE ESTO** para entender cómo funciona todo

---

### 🗄️ **3. SUPABASE_SETUP_CRM.md**
**📌 Tiempo:** 30 minutos  
**🎯 Para:** Configuración detallada de Supabase  
**✅ Incluye:**
- Paso a paso con verificaciones
- Creación de tablas, índices, triggers
- Configuración de Row Level Security (RLS)
- Troubleshooting completo
- Queries de prueba
- Configuración de Realtime

**👉 USA ESTO** para configuración profunda de base de datos

---

### 🏷️ **4. CHATWOOT_SETUP.md**
**📌 Tiempo:** 20 minutos  
**🎯 Para:** Integración con Chatwoot  
**✅ Incluye:**
- Crear 5 etiquetas personalizadas
- Crear 8 atributos personalizados
- Configurar 5 macros de respuesta rápida
- 3 automatizaciones
- Configuración de webhooks
- Vistas guardadas

**👉 SIGUE ESTO** para integrar con Chatwoot

---

## 🎓 RUTA DE APRENDIZAJE RECOMENDADA

### 👶 **Principiante (Primera Vez)**
```
1. INICIO_RAPIDO.md          (5 min)  ✅ Activar sistema
2. RESUMEN_EJECUTIVO_CRM.md  (15 min) 📖 Entender arquitectura
3. Probar en localhost       (10 min) 🧪 Experimentar
```

### 🧑‍💼 **Intermedio (Implementación)**
```
1. SUPABASE_SETUP_CRM.md     (30 min) 🗄️ Setup profundo BD
2. CHATWOOT_SETUP.md         (20 min) 🏷️ Integrar Chatwoot
3. Probar flujo completo     (15 min) ✅ Validar todo
```

### 🚀 **Avanzado (Producción)**
```
1. Configurar RLS políticas  (15 min) 🔒 Seguridad
2. Habilitar Realtime        (5 min)  📡 Tiempo real
3. Integrar BuilderBot       (30 min) 🤖 Automatización
4. Dashboard de métricas     (60 min) 📊 Analytics
```

---

## 📂 ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
dashboard/
├── docs/                               ← ESTÁS AQUÍ
│   ├── README.md                      ← Este archivo
│   ├── INICIO_RAPIDO.md               ← Guía de 5 minutos
│   ├── RESUMEN_EJECUTIVO_CRM.md       ← Visión completa
│   ├── SUPABASE_SETUP_CRM.md          ← Setup base de datos
│   └── CHATWOOT_SETUP.md              ← Integración Chatwoot
│
├── scripts/
│   └── 030_create_crm_tables.sql      ← Script SQL para Supabase
│
├── lib/
│   ├── crm-estados-karla.ts           ← Motor de detección de estados
│   └── crm-fetchers.ts                ← API client para Supabase
│
├── hooks/
│   └── use-estado-automatico.ts       ← Hook React automático
│
└── app/
    └── crm/
        └── page.tsx                   ← Interfaz principal del CRM
```

---

## 🎯 CASOS DE USO

### 📋 **Caso 1: Quiero activar el CRM ahora mismo**
```
→ Ve a: INICIO_RAPIDO.md
→ Sigue los 5 pasos
→ Tiempo total: 5 minutos
```

### 📋 **Caso 2: Necesito entender cómo funciona el sistema**
```
→ Lee: RESUMEN_EJECUTIVO_CRM.md
→ Revisa la arquitectura y flujos
→ Tiempo: 15 minutos
```

### 📋 **Caso 3: Tengo problemas con la base de datos**
```
→ Ve a: SUPABASE_SETUP_CRM.md
→ Sección "Troubleshooting"
→ Encuentra tu error y solución
```

### 📋 **Caso 4: Quiero integrar con Chatwoot**
```
→ Sigue: CHATWOOT_SETUP.md
→ Configura etiquetas y automatizaciones
→ Tiempo: 20 minutos
```

### 📋 **Caso 5: El sistema no detecta estados correctamente**
```
→ Revisa: lib/crm-estados-karla.ts
→ Lee los comentarios en el código
→ Ajusta los regex si es necesario
```

### 📋 **Caso 6: Necesito añadir más validaciones**
```
→ Edita: hooks/use-estado-automatico.ts
→ Añade tus reglas personalizadas
→ Actualiza alertas[]
```

---

## 🔑 CONCEPTOS CLAVE

### 🎨 **Estados del Sistema**

El CRM usa 5 estados que siguen el flujo de Karla García:

| Estado | Color | Significado | Siguiente |
|--------|-------|-------------|-----------|
| 🔵 Por Contestar | Azul | Cliente escribió | pendiente-datos |
| 🟡 Pendiente Datos | Amarillo | Faltan datos | por-confirmar |
| 🟣 Por Confirmar | Morado | Esperando confirmación | pendiente-guia |
| 🟠 Pendiente Guía | Naranja | Generar guía envío | pedido-completo |
| 🟢 Pedido Completo | Verde | Pedido en tránsito | ✅ |

### ⚙️ **Componentes del Sistema**

1. **Motor de Detección** (`lib/crm-estados-karla.ts`)
   - Analiza mensajes con regex
   - Detecta intenciones del cliente
   - Calcula siguiente estado
   - Extrae datos automáticamente

2. **React Hook** (`hooks/use-estado-automatico.ts`)
   - Monitorea cambios en mensajes
   - Llama al motor de detección
   - Actualiza Supabase automáticamente
   - Genera alertas y sugerencias

3. **Interfaz** (`app/crm/page.tsx`)
   - Lista de conversaciones con filtros
   - Chat en tiempo real
   - Panel de sistema automático
   - Indicadores visuales

4. **Base de Datos** (Supabase)
   - Tabla `clients` - Información de clientes
   - Tabla `conversations` - Gestión de chats
   - Tabla `messages` - Mensajes individuales
   - Triggers para auto-actualización

---

## 🔧 CONFIGURACIÓN INICIAL REQUERIDA

### ✅ **Checklist Previo:**

Antes de empezar, asegúrate de tener:

- [ ] Cuenta de Supabase creada
- [ ] Proyecto en Supabase activo
- [ ] Node.js 18+ instalado
- [ ] pnpm instalado
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas (`.env.local`)

### 📝 **Variables de Entorno Necesarias:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# (Opcional para Chatwoot)
CHATWOOT_API_KEY=tu_api_key
CHATWOOT_ACCOUNT_ID=tu_account_id
```

---

## 🚀 CARACTERÍSTICAS PRINCIPALES

### ✨ **1. Detección Automática de Estados**
El sistema analiza mensajes y detecta automáticamente en qué parte del flujo está el cliente.

### ✨ **2. Extracción de Datos con IA**
Usa regex avanzados para extraer:
- Nombre completo
- Ciudad y departamento
- Dirección y **barrio** (crítico)
- Teléfono (normalizado a 10 dígitos)
- Correo electrónico
- Documento de identidad
- Método de pago

### ✨ **3. Validación Estricta**
No permite avanzar sin datos críticos, especialmente **barrio**.

### ✨ **4. Sugerencias Contextuales**
Sugiere qué responder según el estado actual de la conversación.

### ✨ **5. Alertas Inteligentes**
Muestra alertas rojas cuando falta información crítica.

### ✨ **6. Actualización en Tiempo Real**
Con SWR, las conversaciones se actualizan cada 2-5 segundos automáticamente.

---

## 📊 MÉTRICAS Y OBJETIVOS

### 🎯 **Objetivos del Sistema:**
- **Tasa de conversión:** 97% (cerrar 97 de cada 100 conversaciones)
- **Tiempo de respuesta:** < 2 minutos
- **Velocidad de flujo:** Completar en < 10 minutos
- **Calidad de datos:** 100% con barrio validado

### 📈 **KPIs a Medir:**
- Conversaciones activas por estado
- Tiempo promedio en cada estado
- % de conversaciones con datos completos
- % de conversaciones bloqueadas (sin barrio)
- Tasa de conversión por estado

---

## 🆘 SOPORTE Y AYUDA

### 🔍 **Si tienes un problema:**

1. **Revisa el documento correspondiente:**
   - Problemas de BD → `SUPABASE_SETUP_CRM.md` → Troubleshooting
   - No entiende cómo funciona → `RESUMEN_EJECUTIVO_CRM.md`
   - Quieres empezar rápido → `INICIO_RAPIDO.md`

2. **Revisa los logs:**
   - Consola del navegador (F12) → Tab "Console"
   - Consola del terminal donde corre `pnpm run dev`
   - Dashboard de Supabase → Logs

3. **Verifica la configuración:**
   - `.env.local` existe y tiene las variables correctas
   - Servidor está corriendo (`pnpm run dev`)
   - Las tablas existen en Supabase (Table Editor)

---

## 🎓 RECURSOS ADICIONALES

### 📚 **Documentación Oficial:**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Chatwoot Docs](https://www.chatwoot.com/docs)
- [SWR Docs](https://swr.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 🛠️ **Herramientas:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Regex Tester](https://regex101.com/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

## 📝 ACTUALIZACIONES Y VERSIONES

### 📌 **Versión Actual:** 1.0.0
**Fecha:** Octubre 2025

### 🆕 **Incluye:**
- ✅ Sistema completo de detección automática
- ✅ Extracción de datos con regex
- ✅ Validación estricta de barrio
- ✅ Interfaz moderna con 3 paneles
- ✅ Integración con Supabase
- ✅ Documentación completa

### 🔮 **Próximas Versiones:**
- **v1.1** - Integración con BuilderBot
- **v1.2** - Dashboard de métricas y analytics
- **v1.3** - Exportación de reportes
- **v2.0** - IA generativa para respuestas automáticas

---

## 🎉 ¡LISTO PARA EMPEZAR!

### 👉 **Tu Siguiente Paso:**

```
1. Abre: docs/INICIO_RAPIDO.md
2. Sigue los 5 pasos (5 minutos)
3. Tendrás el CRM funcionando
4. ¡A cerrar ventas con 97% de éxito! 🚀
```

---

## 📞 INFORMACIÓN DEL PROYECTO

**Proyecto:** Dashboard CRM - Galle Oro Laminado 18K  
**Tecnología:** Next.js 15 + TypeScript + Supabase + Tailwind CSS  
**Basado en:** Prompt de ventas de Karla García v6.1.5  
**Objetivo:** Lograr 97% de tasa de conversión en ventas  
**Mercado:** Colombia - Joyería y Balinería  

---

**🌟 ¡Éxitos con tu CRM automático! 🌟**
