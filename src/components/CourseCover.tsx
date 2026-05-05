"use client";
import { useState } from "react";

type Props = {
  id: string;
  title: string;
  url?: string | null;
  className?: string;
};

// Warm earthy palette: mocha, terracotta, sage, ochre — never cool blues.
const PALETTES: Array<[string, string]> = [
  ["#6B4A29", "#C9A47A"], // mocha
  ["#543820", "#BE9A6B"], // mocha deep
  ["#835F38", "#EADBC4"], // mocha light
  ["#A07A4C", "#F5EEE2"], // mocha cream
  ["#B45838", "#E8A088"], // terracotta
  ["#8C3F25", "#D6856A"], // terracotta deep
  ["#6B7C5C", "#A4B58F"], // sage
  ["#54684A", "#8FA67A"], // sage deep
  ["#C28E2A", "#E5C77B"], // ochre
  ["#9A6C1F", "#D8A856"], // ochre deep
  ["#5D4E37", "#8E795A"], // cedar
  ["#3D2917", "#A07A4C"], // bark
];

function hashIndex(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function Placeholder({ id, title, className }: Props) {
  const [a, b] = PALETTES[hashIndex(id, PALETTES.length)];
  const initials =
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "C";

  return (
    <div
      className={`relative h-full w-full overflow-hidden transition-transform duration-700 group-hover:scale-[1.04] ${className ?? ""}`}
      style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0%, transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.25) 0%, transparent 50%)",
        }}
      />
      <div className="relative grid h-full place-items-center">
        <span className="font-display text-5xl font-medium tracking-wide text-white/95 drop-shadow-sm">
          {initials}
        </span>
      </div>
      <div className="absolute right-3 top-3 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/85 backdrop-blur-sm">
        Course
      </div>
    </div>
  );
}

/**
 * Heuristic: avoid trying to render obvious non-image URLs (e.g. someone
 * accidentally pasted a PDF storage path into the cover_url field). We still
 * keep the runtime onError fallback as a safety net.
 */
const NON_IMAGE_EXT = /\.(pdf|docx?|pptx?|xlsx?|txt|mp4|mov|webm|m4a|mp3|zip|tar|gz)(\?|#|$)/i;

export default function CourseCover(props: Props) {
  const { id, title, url, className = "" } = props;
  const [failed, setFailed] = useState(false);

  const looksLikeImage = !!url && !NON_IMAGE_EXT.test(url);

  if (!url || failed || !looksLikeImage) {
    return <Placeholder id={id} title={title} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${className}`}
    />
  );
}
