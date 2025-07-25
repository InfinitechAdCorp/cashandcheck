/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/signatures/**',
      },
      {
        protocol: 'https',
        hostname: 'infinitech-api1.site',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'infinitech-api1.site',
        pathname: '/signatures/**',
      },
      {
        protocol: 'https',
        hostname: 'infinitech-api1.site',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'infinitech-api1.site',
        pathname: '/api/signatures/**',
      },
    ],
  },
};

module.exports = nextConfig;
