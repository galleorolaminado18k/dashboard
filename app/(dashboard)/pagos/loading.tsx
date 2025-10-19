export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#C8A96A]" />
        <p className="text-sm text-gray-600">Cargando pagos...</p>
      </div>
    </div>
  )
}
