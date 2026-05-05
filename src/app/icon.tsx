import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Branded favicon — a "C" mark in our mocha gradient on a cream background.
 * Generated at build/request time; matches the wordmark on the site.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #543820 0%, #835F38 100%)",
          color: "#FBF7F1",
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          borderRadius: 8,
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
