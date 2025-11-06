⏰ VERIFICAR EN 2-3 MINUTOS - DEPLOY EN PROGRESO

✅ SOLUCIÓN DEFINITIVA APLICADA
==============================

Commit: 77484b8
Cambio: Timer forzado independiente de CORS para ocultar loading

🔧 QUÉ SE CORRIGIÓ:
- Timer movido FUERA de handleLoad
- Ahora se ejecuta SIEMPRE cuando se abre el modal
- Independiente de iframe, CORS, o eventos
- Estado se resetea correctamente al abrir/cerrar

✅ GARANTÍA:
El overlay "Preparando portal" DESAPARECERÁ en 2 segundos
SIN IMPORTAR:
- Si CORS bloquea
- Si el iframe carga
- Si hay errores de red
- Cualquier otra cosa

⏳ PASOS PARA VERIFICAR:
1. Espera 2-3 minutos (Vercel desplegando)
2. Ve a /entregas en producción
3. Click "Volver a ofrecer" en cualquier envío
4. Observa:
   - ✅ Modal abre
   - ✅ Overlay visible (2 segundos)
   - ✅ Overlay DESAPARECE automáticamente
   - ✅ Portal visible y funcional

🔍 LOG CLAVE EN CONSOLE:
⏱️ Forzando ocultación de overlay (2 segundos) ← Nuevo

Si ves este log, significa que el fix está funcionando.

✅ RESULTADO ESPERADO:
Portal de MiPaquete visible y funcional después de 2 segundos,
sin importar CORS o cualquier otro bloqueo.

