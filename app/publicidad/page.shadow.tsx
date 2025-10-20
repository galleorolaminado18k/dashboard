export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

import dynamic from "next/dynamic"

const PublicidadClient = dynamic(() => import("../(dashboard)/publicidad/page"), {
  ssr: false,
})

export default function PublicidadPage() {
  return <PublicidadClient />
}

