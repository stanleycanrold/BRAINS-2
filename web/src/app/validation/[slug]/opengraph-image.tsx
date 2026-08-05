import { ImageResponse } from "next/og";
import { getAllPages, getPage } from "@/content";

/**
 * Per-page social cards, generated from the same records that render the
 * pages.
 *
 * A pSEO page shared into Slack or X is competing with every other link in
 * that channel, and a card carrying the actual question plus the actual
 * headline number is doing work the generic site card cannot. Because it
 * comes from the content record, a new page gets a correct card for free.
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPages().map((page) => ({ slug: page.slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  return [
    {
      id: "card",
      size,
      contentType,
      alt: page ? page.title : "BRAINS AI",
    },
  ];
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);

  const title = page?.title ?? "BRAINS AI";
  const stat = page?.answer.stat;

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
        <div
          style={{
            position: "absolute",
            top: -280,
            left: 260,
            width: 720,
            height: 600,
            borderRadius: 9999,
            background: "rgba(123, 147, 240, 0.2)",
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
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#f0efec",
            }}
          >
            BRAINS AI
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
          {stat ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 116,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: -4,
                  color: "#7b93f0",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 24,
                  color: "#a8a59e",
                  maxWidth: 260,
                }}
              >
                {stat.label}
              </div>
            </div>
          ) : null}

          <div
            style={{
              fontSize: stat ? 56 : 68,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#f0efec",
              maxWidth: stat ? 700 : 980,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#7d7a74" }}>
          nexabrains.io/validation
        </div>
      </div>
    ),
    size,
  );
}
