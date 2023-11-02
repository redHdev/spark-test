const { i18n } = require('./next-i18next.config');

const nextConfig = {
  transpilePackages: ['react-syntax-highlighter'],
  reactStrictMode: false,
  i18n,
  swcMinify: true,
  images: {
    domains: ['pbesrkbqdojnzvfwhvbo.supabase.co'],
  },
  async redirects() {
    return [
      {
        source: '/404',
        destination: process.env.SITE_URL,
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes npm packages that depend on `fs` module
      config.resolve.fallback.fs = false;

      // Add this to the webpack config
      config.module.rules.push({
        test: /\.m?js/,
        resolve: {
          fallback: {
            buffer: false,
            crypto: false,
          },
        },
        loader: 'string-replace-loader',
        options: {
          search: 'self',
          replace: 'global',
          flags: 'g',
        },
      });
    }

    return config;
  },
};

module.exports = nextConfig;
