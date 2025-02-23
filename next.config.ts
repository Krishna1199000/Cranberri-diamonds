/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['d360.tech', 'kslive.blob.core.windows.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd360.tech',
      },
      {
        protocol: 'https',
        hostname: 'kslive.blob.core.windows.net',
      }
    ],
  }
}

module.exports = nextConfig