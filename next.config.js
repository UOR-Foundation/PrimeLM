/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/PrimeLM' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/PrimeLM/' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@xenova/transformers'],
  webpack: (config, { isServer }) => {
    // Handle @xenova/transformers for client-side usage
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
