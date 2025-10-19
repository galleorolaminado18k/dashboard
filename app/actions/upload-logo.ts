"use server"

import { put } from "@vercel/blob"

export async function uploadLogo(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No se proporcionó ningún archivo")
    }

    // Validar tipo de archivo
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      throw new Error("Tipo de archivo no válido. Solo se permiten PNG, JPG y SVG")
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error("El archivo es demasiado grande. Máximo 5MB")
    }

    // Subir a Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("[v0] Error al subir logo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al subir el logo",
    }
  }
}
