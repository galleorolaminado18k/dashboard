export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

import dynamic from "next/dynamic"

// Carga el componente de la versión dentro del route group para no tocar tu lógica.
const PublicidadClient = dynamic(() => import("../(dashboard)/publicidad/page"), {
  ssr: false,
})

export default function PublicidadPage() {
  return <PublicidadClient />
}

