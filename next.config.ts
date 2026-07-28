import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The logo mark is fine detail (a web of thin strokes) rendered small, so
    // it is served at full quality rather than the default 75.
    qualities: [75, 100],
    // Clerk-hosted profile images, rendered as our own avatar element so the
    // sidebar controls its geometry rather than Clerk's wrapper.
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
};

export default nextConfig;
