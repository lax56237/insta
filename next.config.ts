// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */

// };

// export default nextConfig;
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {},
  webpack: (config, { isServer }) => {
    // This disables Turbopack completely
    config.infrastructureLogging = { level: "none" };
    return config;
  },
};

export default nextConfig;
