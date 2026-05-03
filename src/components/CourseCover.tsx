"use client";
import { useState } from "react";

type Props = {
  id: string;
  title: string;
  url?: string | null;
  className?: string;
};

const PALETTES: Array<[string, string]> = [
  ["#6B4A29", "#C9A47A"],
  ["#543820", "#BE9A6B"],
  ["#835F38", "#EADBC4"],
  ["#3D2917", "#A07A4C"],
  ["#A07A4C", "#F5EEE2"],
  ["#5A3A1D", "#D7BC97"],
  ["#7B4F2C", "#E8C8A0"],
  ["#412816", "#B89576"],
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

export default function CourseCover(props: Props) {
  const { id, title, url, className = "" } = props;
  const [failed, setFailed] = useState(false);

  if (!url || failed) return <Placeholder id={id} title={title} className={className} />;

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
