import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-ignore
  typescript: {
    ignoreBuildErrors: true,
  },

  // Externalize face-api.js to prevent SSR bundling issues
  serverExternalPackages: [
    "face-api.js",
    "@tensorflow/tfjs",
    "@tensorflow/tfjs-backend-webgl",
  ],
  images: {
    remotePatterns: [
      {
        hostname: "lms-yabsira-senior.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
