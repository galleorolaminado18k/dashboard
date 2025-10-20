"use client"

import type React from "react"

import { Suspense } from "react"
import ChunkReload from "@/components/ChunkReload"
import { useSearchParams } from "next/navigation"
import DatabaseInitializer from "@/components/DatabaseInitializer"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()

  return (
    <>
      <ChunkReload />
      <DatabaseInitializer />
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </>
  )
}
