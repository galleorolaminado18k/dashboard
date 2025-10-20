import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-10 bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900">Página no encontrada</h1>
        <p className="opacity-70 mb-6 text-gray-600">La ruta que buscaste no existe.</p>
        <Link href="/" className="underline text-[#C8A96A] hover:text-[#8B6914]">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
