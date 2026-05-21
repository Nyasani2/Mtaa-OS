/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/budget/:path*', destination: '/core/api/budget/:path*' },
      { source: '/api/allocations/:path*', destination: '/core/api/allocations/:path*' },
      { source: '/api/warrants/:path*', destination: '/core/api/warrants/:path*' },
      { source: '/api/commitments/:path*', destination: '/core/api/commitments/:path*' }
    ]
  }
}
module.exports = nextConfig
