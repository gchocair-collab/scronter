import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Las imágenes son todas locales (/public/images), así que no hace falta
  // configurar dominios remotos todavía.
  //
  // TODO: cuando subas las fotos reales a un CDN o a un CMS (Cloudinary,
  // Sanity, Shopify…), agregá su host acá o next/image las va a rechazar:
  //
  // images: {
  //   remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  // },
}

export default nextConfig
