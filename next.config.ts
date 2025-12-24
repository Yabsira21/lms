import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "lms-yabsira-senior.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
        // pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
