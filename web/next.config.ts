import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Matches the app's own config — the logo mark is fine detail rendered
    // small, so it's served at full quality rather than the default 75.
    qualities: [75, 100],
  },

  /**
   * Everything the validation content used to live under now lives under
   * /validation, which is the stage name. The next stage gets its own segment
   * rather than any of this moving a second time.
   *
   * Permanent because these are the URLs search engines and any existing link
   * already hold. A temporary redirect here would leave the old paths in the
   * index indefinitely and split the cluster across two trees, which is the
   * exact thing the consolidation was for.
   */
  async redirects() {
    return [
      { source: "/blog", destination: "/validation", permanent: true },
      { source: "/answers", destination: "/validation", permanent: true },
      {
        source: "/answers/:slug",
        destination: "/validation/:slug",
        permanent: true,
      },
      { source: "/validate", destination: "/validation", permanent: true },
      {
        source: "/validate/:slug",
        destination: "/validation/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
