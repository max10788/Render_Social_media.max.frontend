/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  // Rewrite-Regeln entfernt - nicht kompatibel mit statischem Export
}

module.exports = nextConfig
