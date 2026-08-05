import { ImageResponse } from "next/og";

/**
 * The default social card for the whole site.
 *
 * Metadata already declared `openGraph` and `twitter: summary_large_image`
 * with no image behind either, so every link to this site - every pSEO page
 * shared into Slack, X or LinkedIn - rendered as a blank grey rectangle. For
 * a strategy built on distribution that is the most widely seen surface the
 * site has, and it was the only one nobody could see from inside the site.
 *
 * Generated rather than a static asset so it cannot drift from the brand
 * tokens, and drawn with system fonts rather than fetching the brand
 * typefaces: a font fetch at image-generation time is one more thing that can
 * fail during a build, and the card degrades to a system sans far more
 * gracefully than it degrades to not existing.
 *
 * Page-level cards live in [slug]/opengraph-image.tsx, which uses the same
 * treatment with the page's own title.
 */
export const runtime = "nodejs";
export const alt = "BRAINS AI - Validate ideas. Find first customers.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1f1e1d",
          padding: 72,
          position: "relative",
        }}
      >
        {/* The same brand bloom the hero uses, so a shared card and the page
            it links to look like the same product. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: 220,
            width: 760,
            height: 620,
            borderRadius: 9999,
            background: "rgba(123, 147, 240, 0.22)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#6f8ef5",
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#f0efec",
            }}
          >
            BRAINS AI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -2.6,
              color: "#f0efec",
              maxWidth: 940,
            }}
          >
            Find out if anyone wants it, before you build it.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#a8a59e",
              maxWidth: 820,
            }}
          >
            Research with real sources, questions worth asking, and a score
            with the reasoning behind it.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "#7d7a74",
          }}
        >
          nexabrains.io
        </div>
      </div>
    ),
    size,
  );
}
