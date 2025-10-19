export default function ConfiguracionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#C8A96A]" />
        <p className="mt-4 text-sm text-gray-600">Cargando configuración...</p>
      </div>
    </div>
  )
}
