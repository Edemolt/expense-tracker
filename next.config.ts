import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", 
});

const nextConfig: NextConfig = {
  // This tells Next.js 16+ to stop complaining about the PWA's Webpack config
  turbopack: {},
};

export default withPWA(nextConfig);