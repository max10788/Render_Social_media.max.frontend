/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://render-social-media-max-n89a.onrender.com/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
