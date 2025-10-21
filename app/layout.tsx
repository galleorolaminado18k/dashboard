import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import Providers from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Dashboard de Ventas",
  description: "Sistema de gestiÃ³n de ventas con integraciÃ³n MiPaquete",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen`}>
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </Providers>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}

