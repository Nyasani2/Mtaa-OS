/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/requisitions/:path*', destination: '/core/api/requisitions/:path*' },
      { source: '/api/tenders/:path*', destination: '/core/api/tenders/:path*' },
      { source: '/api/contracts/:path*', destination: '/core/api/contracts/:path*' },
      { source: '/api/assets/:path*', destination: '/core/api/assets/:path*' }
    ]
  }
}
module.exports = nextConfig
