import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Matches the app's own config — the logo mark is fine detail rendered
    // small, so it's served at full quality rather than the default 75.
    qualities: [75, 100],
  },
};

export default nextConfig;
