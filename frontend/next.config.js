/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @wagmi/connectors' export barrel pulls in a Coinbase "baseAccount"
    // connector we don't use (see lib/wagmi.ts), which has optional peer
    // deps (@x402/*) that aren't installed and otherwise fail the build.
    // These are true dead-code paths for this app, so stub them to empty.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core": false,
      "@x402/evm": false,
      "@x402/svm": false,
      "@x402/extensions": false,
    };
    return config;
  },
};

module.exports = nextConfig;
