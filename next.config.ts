import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: silence "inferred workspace root" warning and ensure Vercel
  // with Root Directory = "." uses BRAINS-AI as turbopack root.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // The logo mark is fine detail (a web of thin strokes) rendered small, so
    // it is served at full quality rather than the default 75.
    qualities: [75, 100],
    // Clerk-hosted profile images, rendered as our own avatar element so the
    // sidebar controls its geometry rather than Clerk's wrapper.
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      // Empirical UI avatar imagery served from Unsplash (mock respondents).
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
