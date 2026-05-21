/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/expenditures/:path*', destination: '/core/api/expenditures/:path*' },
      { source: '/api/tsa/:path*', destination: '/core/api/tsa/:path*' },
      { source: '/api/revenue/:path*', destination: '/core/api/revenue/:path*' },
      { source: '/api/reconciliation/:path*', destination: '/core/api/reconciliation/:path*' }
    ]
  }
}
module.exports = nextConfig
