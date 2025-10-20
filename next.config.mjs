/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

// Add rewrites to bypass ad-blockers and keep public URLs stable
nextConfig.rewrites = async () => ([
  { source: '/publicidad', destination: '/marketing' },
  { source: '/anuncios', destination: '/marketing' },
])


// Redirects to avoid ad-blockers on legacy URL
nextConfig.redirects = async () => ([
  { source: '/publicidad', destination: '/marketing', permanent: true },
  { source: '/publicidad/:path*', destination: '/marketing/:path*', permanent: true },
])

