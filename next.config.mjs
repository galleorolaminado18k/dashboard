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

// Add rewrites to bypass ad-blockers for legacy paths
nextConfig.rewrites = async () => ([
  { source: '/publicidad', destination: '/anuncios' },
])
