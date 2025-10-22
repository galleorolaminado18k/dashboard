# Producción: Flujo de Devoluciones (Checklist)

Este documento describe los pasos mínimos para poner en producción el soporte de estado `devolucion`.

1) Variables de entorno (Vercel / entorno de producción)
   - NEXT_PUBLIC_SUPABASE_URL (no obligatorio para server)
   - SUPABASE_SERVICE_ROLE_KEY (OBLIGATORIO para llamadas RPC/administrativas)
   - CHATWOOT_API_TOKEN (si usas Chatwoot automation)
   - CHATWOOT_ACCOUNT_ID
   - CHATWOOT_BASE_URL (opcional, por defecto https://app.chatwoot.com)

2) Migración SQL
   - Ejecutar `scripts/032_add_devolucion_state.sql` desde el editor SQL de Supabase en staging y luego en producción.
   - El script es idempotente y agrega el enum, columnas, trigger, función RPC y la vista `devoluciones`.

3) Pruebas en staging
   - Ejecutar `scripts/test_devolucion_temp.sql` en el SQL Editor de Supabase (staging) y verificar NOTICES/RESULTS.
   - Alternativamente, ejecutar `scripts/run_test_devolucion.ps1` apuntando a la DB de staging (requiere psql y PG_CONN env var).

4) API server
   - Endpoint `/api/crm/devolucion` ya implementado para marcar conversaciones como `devolucion`.
   - El endpoint usa `SUPABASE_SERVICE_ROLE_KEY` para: (a) PATCH a conversation, (b) invocar RPC `mark_product_as_returned`, (c) etiquetar en Chatwoot si se provee `chatwootConversationId`.
   - En producción, verifica que `SUPABASE_SERVICE_ROLE_KEY` esté guardada en Vercel (Environment Variables) y no expuesta en el frontend.

5) Chatwoot
   - Ejecutar `scripts/setup-chatwoot.mjs` si quieres crear etiquetas/atributos/macros automáticamente.
   - Alternativamente, crea manualmente la etiqueta `devolucion` en Chatwoot y usa `chatwootConversationId` cuando llames al endpoint.

6) Observabilidad
   - Revisa logs del servidor tras la primera ejecución; errores de RPC/Chatwoot son no bloqueantes pero deben monitorizarse.
   - Considera capturar fallos en una tabla `audit.failed_automations` si quieres reintentos automáticos.

7) Rollback
   - El script es aditivo; si necesitas revertir, elimina la trigger/function y el enum con cuidado. Idealmente prueba antes en staging.

8) Checklist final
   - [ ] Migración aplicada en staging
   - [ ] Test de integración pasado en staging
   - [ ] Vars de entorno seteadas en producción
   - [ ] Deploy en producción y verificación (conversation status + purchase marcado + chatwoot tag)

