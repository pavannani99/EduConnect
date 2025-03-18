/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  }
}

module.exports = nextConfig 