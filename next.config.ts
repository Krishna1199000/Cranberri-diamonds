/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'd360.tech',
      'kslive.blob.core.windows.net',
      'www.gcalusa.com',
      'www.igi.org',
      'www.gia.edu',
      'images.unsplash.com',
      'video.gem360.in',
       // Add this domain
      '*'
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
        hostname: '*',
      },
    ],
  }
}

module.exports = nextConfig;
