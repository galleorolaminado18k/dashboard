import { Sidebar } from "@/components/sidebar"

export default function Loading() {
  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-zinc-600">Cargando CRM...</p>
        </div>
      </div>
    </div>
  )
}
