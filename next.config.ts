
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Para imágenes de Firebase Storage
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gaestopas.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'artiplan.net', // Nuevo hostname añadido
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
