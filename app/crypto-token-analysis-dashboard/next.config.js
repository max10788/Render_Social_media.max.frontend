// app/crypto-token-analysis-dashboard/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  skipTrailingSlashRedirect: true
}

module.exports = nextConfig
