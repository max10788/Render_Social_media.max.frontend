/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Add this to handle dynamic routes
  skipTrailingSlashRedirect: true
}

module.exports = nextConfig
