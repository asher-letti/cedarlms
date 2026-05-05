import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — same brand mark, larger, no border-radius
 * (iOS rounds it itself).
 */
export default function AppleIcon() {
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
          fontSize: 130,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
