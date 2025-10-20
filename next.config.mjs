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
  { source: '/publicidad', destination: '/campanas' },
  { source: '/anuncios', destination: '/campanas' },
])
