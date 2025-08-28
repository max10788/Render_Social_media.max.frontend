/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://render-social-media-max-backend.onrender.com/api/:path*',
      },
    ]
  },
}
module.exports = nextConfig
