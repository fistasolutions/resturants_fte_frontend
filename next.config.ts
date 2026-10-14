import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images come from the store's Shopify CDN (SPEC-015 Patches).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  // SPEC-088/SPEC-091: sections consolidated — transfer review moved under
  // Inventory Analyst, winback moved under Customers. Permanently redirect the
  // old Morning-Brief routes so existing bookmarks and brief links never 404.
  async redirects() {
    return [
      {
        source: "/brief/transfers",
        destination: "/inventory/transfers/review",
        permanent: true,
      },
      {
        source: "/brief/transfers/:path*",
        destination: "/inventory/transfers/review/:path*",
        permanent: true,
      },
      {
        source: "/brief/winback",
        destination: "/customers/winback",
        permanent: true,
      },
      {
        source: "/brief/winback/:path*",
        destination: "/customers/winback/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
