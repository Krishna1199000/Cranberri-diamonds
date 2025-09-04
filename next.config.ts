/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for all pages to avoid cookie-related static generation errors
  serverExternalPackages: ['puppeteer-core'],
  images: {
    domains: [
      'd360.tech',
      'kslive.blob.core.windows.net',
      'www.gcalusa.com',
      'www.igi.org',
      'www.gia.edu',
      'images.unsplash.com',
      'images.pexels.com',
      'video.diamonds360.in',
      'video.gem360.in',
       // Remove wildcard domain for security
      // '*'
    ],
    remotePatterns: [
      // {
      //   protocol: 'https',
      //   hostname: '*',
      // },
      {
        protocol: 'https',
        hostname: 'd360.tech',
      },
      {
        protocol: 'https',
        hostname: 'kslive.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'www.gcalusa.com',
      },
      {
        protocol: 'https',
        hostname: 'www.igi.org',
      },
      {
        protocol: 'https',
        hostname: 'www.gia.edu',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', 
      },
      {
        protocol: 'https',
        hostname: 'video.gem360.in', // Add this explicitly
      },
      {
        protocol: 'https',
        hostname: 'video.diamonds360.in',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // Remove wildcard hostname for security
      // {
      //   protocol: 'https',
      //   hostname: '*',
      // },
    ],
  }
}

module.exports = nextConfig;
