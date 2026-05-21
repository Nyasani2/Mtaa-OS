/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/debt/:path*', destination: '/core/api/debt/:path*' },
      { source: '/api/payroll/:path*', destination: '/core/api/payroll/:path*' },
      { source: '/api/forecasts/:path*', destination: '/core/api/forecasts/:path*' }
    ]
  }
}
module.exports = nextConfig
