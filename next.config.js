/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.pexels.com',
      'images.unsplash.com',   // Common image source
      'res.cloudinary.com',    // If you use Cloudinary
      'storage.googleapis.com', // If you use Google Cloud Storage
      'loremflickr.com',       // Added for faker.js generated images
      'cloudflare-ipfs.com',   // Added for faker.js avatar URLs
      'avatar.iran.liara.run', // Added for faker.js avatar URLs
      'picsum.photos'          // Added for faker.js generated images
    ],
    // Optionally add image optimization settings
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig
