const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/posts",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/posts/:slug*",
        destination: "/blog/:slug*",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
