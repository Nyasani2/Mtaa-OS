/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/dashboard/:path*', destination: '/core/api/dashboard/:path*' },
      { source: '/api/audit/:path*', destination: '/core/api/audit/:path*' },
      { source: '/api/feedback/:path*', destination: '/core/api/feedback/:path*' }
    ]
  }
}
module.exports = nextConfig
