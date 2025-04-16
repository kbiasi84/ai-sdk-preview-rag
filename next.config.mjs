/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb' // Aumentando para 100MB
    },
  },
  // Aumentar limites padrão do Next.js para lidar com documentos grandes
  api: {
    responseLimit: '100mb',
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export default nextConfig;
