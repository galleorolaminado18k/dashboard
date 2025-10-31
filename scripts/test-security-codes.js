// Script de prueba para verificar el sistema de códigos de seguridad
// Ejecutar en la consola del navegador

console.log("🔐 Sistema de Códigos de Seguridad - Prueba")
console.log("=".repeat(50))

// 1. Verificar que la utilidad existe
try {
  const { getSecurityCodes, saveSecurityCodes, validateSecurityCode } = require("@/lib/security-codes")
  console.log("✅ Utilidad security-codes cargada correctamente")
} catch (error) {
  console.error("❌ Error al cargar utilidad:", error)
}

// 2. Verificar códigos actuales
console.log("\n📋 Códigos actuales:")
const savedCodes = localStorage.getItem("securityCodes")
if (savedCodes) {
  console.log(JSON.parse(savedCodes))
} else {
  console.log("⚠️ No hay códigos guardados (se usarán los predeterminados: 1430)")
}

// 3. Verificar localStorage
console.log("\n💾 Estado de localStorage:")
console.log(`- securityCodes: ${savedCodes ? "✅ Existe" : "❌ No existe"}`)
console.log(`- sidebarTheme: ${localStorage.getItem("sidebarTheme") || "No configurado"}`)

// 4. Guía de pruebas manuales
console.log("\n📝 Guía de Pruebas Manuales:")
console.log("1. Ir a Configuración > Seguridad")
console.log("2. Cambiar códigos de seguridad")
console.log("3. Guardar cambios")
console.log("4. Ir a Ventas")
console.log("5. Intentar reemplazar evidencia")
console.log("6. Verificar que solicita código")
console.log("7. Probar con código correcto e incorrecto")
console.log("\n8. Ir a Facturación")
console.log("9. Crear nueva factura")
console.log("10. Ingresar SKU inexistente")
console.log("11. Intentar crear producto")
console.log("12. Verificar que solicita código de autorización")

console.log("\n" + "=".repeat(50))
console.log("🎉 Sistema listo para probar")

