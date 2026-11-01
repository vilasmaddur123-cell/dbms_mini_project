/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'mongodb', 'mongodb-memory-server'],
  },
};

module.exports = nextConfig;
